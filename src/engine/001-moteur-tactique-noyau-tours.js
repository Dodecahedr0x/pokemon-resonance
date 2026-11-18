/* Section d'origine : moteur tactique (noyau, tours) */

export let MT;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {
MT = (() => {

/* ==== moteur-tactique/noyau.js ==== */
/* =====================================================================
   NOYAU : les trois briques qui font communiquer tous les systèmes
   ---------------------------------------------------------------------
   1. BusEvenements : un système annonce ce qui se passe (« une case prend
      feu », « Pikachu est K.O. ») sans savoir qui écoute. L'interface s'en
      sert pour animer, les talents et objets pour réagir.
   2. Modificateurs : un système qui veut influencer un calcul (la pluie sur
      les dégâts Eau, la nuit sur les critiques, la boue sur la vitesse)
      fournit un modificateur. Le calcul ne connaît pas la météo : il
      demande « qu'est-ce qui modifie ce canal ? » et applique la liste.
   3. Hasard : un générateur pseudo-aléatoire à graine, rangé dans l'état
      du combat. Même graine + mêmes actions = même combat (tests,
      rediffusion, annulation, IA qui simule des coups à l'avance).
   ===================================================================== */

/* ---------- 1. Bus d'événements ---------- */
class BusEvenements {
  constructor() {
    this.ecouteurs = new Map(); // nom → [{ fn, priorite }]
    this.journal = []; // tout ce qui s'est passé, dans l'ordre (l'interface le rejoue)
    this.limiteJournal = 500;
  }
  /** S'abonner. Priorité haute = appelé en premier. Renvoie de quoi se désabonner. */
  on(nom, fn, priorite = 0) {
    const l = this.ecouteurs.get(nom) || [];
    l.push({ fn, priorite });
    l.sort((a, b) => b.priorite - a.priorite);
    this.ecouteurs.set(nom, l);
    return () => this.off(nom, fn);
  }
  off(nom, fn) {
    const l = this.ecouteurs.get(nom);
    if (l)
      this.ecouteurs.set(
        nom,
        l.filter(e => e.fn !== fn)
      );
  }
  /** Annoncer un événement. Les écouteurs de « * » reçoivent tout (journal, débogage).
      Le nom de l'événement est rangé dans « e », comme dans le moteur actuel de Résonance
      ({ e: 'dmg', u, v }) : l'interface existante pourra rejouer ce journal. */
  emit(nom, donnees = {}) {
    const ev = { ...donnees, e: nom };
    this.journal.push(ev);
    if (this.journal.length > this.limiteJournal) this.journal.shift();
    for (const e of this.ecouteurs.get(nom) || []) e.fn(ev);
    for (const e of this.ecouteurs.get('*') || []) e.fn(ev);
    return ev;
  }
  /** Vide le journal et renvoie son contenu (l'interface l'appelle après chaque action). */
  vider() {
    const j = this.journal;
    this.journal = [];
    return j;
  }
}

/* ---------- 2. Modificateurs ----------
   Un modificateur : { source, libelle, mul?, add?, crans?, fixe? }
   - mul   : multiplie la valeur (la pluie : ×1,5 sur l'Eau)
   - add   : s'ajoute avant les multiplications (un rôle : +1 Mobilité)
   - crans : paliers façon Pokémon (critique, précision)
   - fixe  : impose une valeur (Fatal-Foudre sous la pluie : précision 100 %)
   Les « fournisseurs » sont des objets { id, fournir(canal, ctx, qui) } qui renvoient
   un modificateur, une liste de modificateurs ou rien.                          */
function combinerModificateurs(base, modifs) {
  let add = 0,
    mul = 1,
    crans = 0,
    fixe = null;
  for (const m of modifs) {
    if (m.add) add += m.add;
    if (m.mul != null) mul *= m.mul;
    if (m.crans) crans += m.crans;
    if (m.fixe != null) fixe = m.fixe;
  }
  // les multiplications s'appliquent une à une, dans l'ordre des fournisseurs : le résultat est
  // identique, au dernier chiffre près, à un calcul écrit à la main (x *= a; x *= b; …)
  let valeur = base + add;
  for (const m of modifs) if (m.mul != null) valeur *= m.mul;
  if (fixe != null) valeur = fixe;
  return { valeur, mul, add, crans, detail: modifs };
}

/** Appelle chaque fournisseur et aplatit le résultat (ignore les vides). */
function collecter(fournisseurs, canal, ctx, qui) {
  const out = [];
  for (const f of fournisseurs) {
    if (!f || !f.fournir) continue;
    const r = f.fournir(canal, ctx, qui);
    if (!r) continue;
    for (const m of Array.isArray(r) ? r : [r]) if (m) out.push({ source: f.id, ...m });
  }
  return out;
}

/* ---------- 3. Hasard à graine (mulberry32) ----------
   L'état du générateur est un simple nombre rangé dans l'état du combat :
   sauvegarder le combat sauvegarde aussi « la suite du hasard ».          */
class Hasard {
  constructor(etat) {
    this.etat = etat; // { graine }
  }
  suivant() {
    let t = (this.etat.graine = (this.etat.graine + 0x6d2b79f5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  /** true avec la probabilité p (0..1) */
  chance(p) {
    return p >= 1 || (p > 0 && this.suivant() < p);
  }
  entre(min, max) {
    return min + (max - min) * this.suivant();
  }
}

/* ---------- petits outils partagés ---------- */
const borner = (v, min, max) => Math.max(min, Math.min(max, v));
const cloneProfond = o => JSON.parse(JSON.stringify(o));

/* ==== moteur-tactique/tours.js ==== */
/* =====================================================================
   GESTION DES TOURS : qui joue, quand, et ce qui se passe en fin de tour
   ---------------------------------------------------------------------
   Deux stratégies interchangeables (même interface) :

   ▸ OrdreChronologique — « initiative à la Tactics Ogre / Final Fantasy Tactics »
     Chaque Pokémon remplit une jauge (ct) à la vitesse de sa Vitesse
     EFFECTIVE (boue, glace, paralysie, Chlorophylle, Glissade… comprises).
     Il joue quand sa jauge atteint 100. Pas de boucle tick par tick : on
     calcule directement l'instant où chaque jauge sera pleine, et l'on
     saute au plus proche (« simulation à événements discrets »).
     Après avoir joué, la jauge baisse selon ce qu'il a fait :
        se déplacer ET agir 100 · agir seulement 80 · se déplacer seulement 60 · attendre 50
     Priorité : chaque cran de priorité de la capacité (Vive-Attaque +1)
     réduit ce coût de 15 % : on rejoue plus tôt.
     Charge : une capacité qui charge (Lance-Soleil, Vol) est annoncée sur
     la frise et part plus tard ; si le lanceur est K.O., endormi ou gelé
     d'ici là, elle échoue. Les cibles ont le temps de s'écarter.
     Un « tour » (pour les durées, la météo, les poisons) dure le temps
     qu'il faut au Pokémon de vitesse médiane pour jouer une fois.

   ▸ OrdreParPhases — le système classique de Résonance
     Tous les alliés jouent dans l'ordre choisi par le joueur, puis les
     adversaires dans l'ordre (priorité de leur attaque annoncée, puis Vitesse).

   ▸ OrdreParVitesse — l'ordre des jeux Pokémon, appliqué au plateau
     À chaque manche, TOUS les Pokémon (alliés et adversaires mêlés) jouent
     une fois, du plus rapide au plus lent. Une attaque prioritaire annoncée
     (Vive-Attaque) passe devant ; une attaque à priorité négative passe après.
     Égalité de Vitesse : départagée par combat.rang(u) (tirage de la manche).

   Ces stratégies ne connaissent pas les données : elles demandent au
   combat stat(u, 'vit'), priorite(u) et rang(u). C'est ce qui permet de les
   brancher telles quelles sur le moteur du jeu (voir src/js/v4.5-01-moteur-tactique.js).

   Fin de tour : une liste d'étapes, dans un ordre fixe (ETAPES_FIN_DE_TOUR).
   On peut en insérer (règle d'arène, marée montante…) sans toucher au reste.
   ===================================================================== */
const SEUIL = 100;
const COUTS = { complet: 1, action: 0.8, deplacement: 0.6, attente: 0.5 };

/** Coût de récupération après une activation (fraction du seuil), selon la priorité de la capacité utilisée. */
function coutActivation(u, priorite = 0) {
  const base =
    u.aBouge && u.aAgi ? COUTS.complet : u.aAgi ? COUTS.action : u.aBouge ? COUTS.deplacement : COUTS.attente;
  return base * Math.max(0.4, 1 - 0.15 * (u.aAgi ? priorite : 0));
}

/** Initiative : priorité de l'attaque annoncée, puis Vitesse effective, puis rang (départage). */
function trierParInitiative(c, unites) {
  const cle = new Map(unites.map(u => [u, [c.priorite(u), c.stat(u, 'vit'), c.rang(u)]]));
  return [...unites].sort((a, b) => {
    const A = cle.get(a),
      B = cle.get(b);
    return B[0] - A[0] || B[1] - A[1] || A[2] - B[2];
  });
}

class OrdreChronologique {
  constructor(combat) {
    this.c = combat;
    this.mode = 'chrono';
  }
  get etat() {
    return this.c.etat.tours;
  }
  static creerEtat() {
    return { mode: 'chrono', temps: 0, tour: 1, dureeTour: 1, prochaineFin: 1, charges: [], actif: null };
  }
  demarrer() {
    const vs = this.c
      .unitesVivantes()
      .map(u => this.c.stat(u, 'vit'))
      .sort((a, b) => a - b);
    const mediane = vs[Math.floor(vs.length / 2)] || 50;
    Object.assign(this.etat, { dureeTour: SEUIL / mediane, prochaineFin: SEUIL / mediane });
    this.debutTour();
  }
  debutTour() {
    for (const u of this.c.unitesVivantes()) {
      const bonus = this.c.modif('initiative', { unite: u }, 0).valeur; // Vive Griffe…
      if (bonus) {
        u.ct += bonus;
        this.c.bus.emit('initiative', { unite: u.id, bonus });
      }
    }
    this.c.bus.emit('tour:debut', { tour: this.etat.tour });
  }

  /** Les prochains événements, triés : { t, type: 'charge'|'unite'|'finDeTour', ... } */
  candidats(ct = null) {
    const e = this.etat,
      out = [];
    for (const ch of e.charges) out.push({ t: ch.temps, type: 'charge', ordre: 0, charge: ch });
    for (const u of this.c.unitesVivantes()) {
      if (this.charge(u)) continue; // occupé à charger : il rejouera après
      const v = Math.max(1, this.c.stat(u, 'vit')),
        jauge = ct ? ct.get(u.id) : u.ct;
      out.push({ t: e.temps + Math.max(0, (SEUIL - jauge) / v), type: 'unite', ordre: 1, unite: u, v });
    }
    out.push({ t: e.prochaineFin, type: 'finDeTour', ordre: 2 });
    // départage : charges annoncées d'abord, puis le plus rapide, puis le rang
    return out.sort(
      (a, b) =>
        a.t - b.t ||
        a.ordre - b.ordre ||
        (b.v || 0) - (a.v || 0) ||
        (a.unite && b.unite ? this.c.rang(a.unite) - this.c.rang(b.unite) : 0)
    );
  }

  avancerA(t) {
    const e = this.etat,
      dt = t - e.temps;
    if (dt > 0) for (const u of this.c.unitesVivantes()) if (!this.charge(u)) u.ct += this.c.stat(u, 'vit') * dt;
    e.temps = t;
  }

  /** Le prochain événement, appliqué : renvoie { type, unite?, charge? } */
  prochain() {
    const [ev] = this.candidats(),
      e = this.etat;
    this.avancerA(ev.t);
    if (ev.type === 'finDeTour') {
      this.c.finDeTour();
      e.tour += 1;
      e.prochaineFin += e.dureeTour;
      if (!this.c.etat.fin) this.debutTour();
      return { type: 'finDeTour', tour: e.tour - 1 };
    }
    if (ev.type === 'charge') {
      e.charges = e.charges.filter(x => x !== ev.charge);
      return { type: 'charge', charge: ev.charge };
    }
    ev.unite.ct = Math.max(ev.unite.ct, SEUIL);
    e.actif = ev.unite.id;
    return { type: 'unite', unite: ev.unite };
  }

  apresActivation(u) {
    u.ct -= SEUIL * coutActivation(u, this.c.prioriteCapacite(u.derniere));
    this.etat.actif = null;
  }

  /** La charge en cours d'une unité (les charges sont rangées par identifiant : l'état reste sérialisable). */
  charge(u) {
    return this.etat.charges.find(ch => ch.unite === u.id) || null;
  }
  programmerCharge(u, capId, cible, fraction) {
    const ch = { unite: u.id, capacite: capId, cible, temps: this.etat.temps + fraction * this.etat.dureeTour };
    this.etat.charges.push(ch);
    u.charge = capId;
    return ch;
  }

  /** Prévision de la frise : les n prochains tours de jeu, sans rien modifier (hypothèse : coût complet). */
  prevoir(n = 8) {
    const ct = new Map(this.c.unitesVivantes().map(u => [u.id, u.ct])),
      e = this.etat,
      t0 = e.temps,
      fin0 = e.prochaineFin,
      out = [];
    let temps = t0,
      fin = fin0;
    const charges = [...e.charges];
    while (out.length < n) {
      const cands = [];
      for (const ch of charges) cands.push({ t: ch.temps, type: 'charge', ordre: 0, ch });
      const enCharge = u => charges.some(ch => ch.unite === u.id);
      for (const u of this.c.unitesVivantes()) {
        if (enCharge(u)) continue;
        const v = Math.max(1, this.c.stat(u, 'vit'));
        cands.push({ t: temps + Math.max(0, (SEUIL - ct.get(u.id)) / v), type: 'unite', ordre: 1, u, v });
      }
      cands.push({ t: fin, type: 'finDeTour', ordre: 2 });
      cands.sort((a, b) => a.t - b.t || a.ordre - b.ordre || (b.v || 0) - (a.v || 0));
      const ev = cands[0],
        dt = ev.t - temps;
      for (const u of this.c.unitesVivantes())
        if (!enCharge(u)) ct.set(u.id, ct.get(u.id) + Math.max(1, this.c.stat(u, 'vit')) * dt);
      temps = ev.t;
      if (ev.type === 'finDeTour') {
        fin += e.dureeTour;
        out.push({ type: 'finDeTour' });
      } else if (ev.type === 'charge') {
        charges.splice(charges.indexOf(ev.ch), 1);
        out.push({ type: 'charge', unite: ev.ch.unite, capacite: ev.ch.capacite });
      } else {
        ct.set(ev.u.id, Math.max(ct.get(ev.u.id), SEUIL) - SEUIL);
        out.push({ type: 'unite', unite: ev.u.id });
      }
    }
    return out;
  }
}

class OrdreParPhases {
  constructor(combat) {
    this.c = combat;
    this.mode = 'phases';
  }
  get etat() {
    return this.c.etat.tours;
  }
  static creerEtat() {
    return { mode: 'phases', tour: 1, phase: 'a', joues: [], charges: [], actif: null };
  }
  demarrer() {
    this.c.bus.emit('tour:debut', { tour: 1 });
  }
  ordrePhase(camp) {
    return trierParInitiative(
      this.c,
      this.c.unitesVivantes().filter(u => u.camp === camp && !this.etat.joues.includes(u.id))
    );
  }
  prochain() {
    const e = this.etat;
    // les capacités chargées partent au début de la phase de leur camp
    const ch = e.charges.find(x => this.c.unite(x.unite).camp === e.phase);
    if (ch) {
      e.charges = e.charges.filter(x => x !== ch);
      return { type: 'charge', charge: ch };
    }
    const reste = this.ordrePhase(e.phase);
    if (reste.length) {
      e.actif = reste[0].id;
      return { type: 'unite', unite: reste[0], choix: reste.map(u => u.id) }; // le joueur peut en choisir un autre : combat.activer(id)
    }
    if (e.phase === 'a') {
      e.phase = 'e';
      e.joues = [];
      return this.prochain();
    }
    this.c.finDeTour();
    Object.assign(e, { phase: 'a', joues: [], tour: e.tour + 1 });
    if (!this.c.etat.fin) this.c.bus.emit('tour:debut', { tour: e.tour });
    return { type: 'finDeTour', tour: e.tour - 1 };
  }
  apresActivation(u) {
    this.etat.joues.push(u.id);
    this.etat.actif = null;
  }
  charge(u) {
    return this.etat.charges.find(ch => ch.unite === u.id) || null;
  }
  programmerCharge(u, capId, cible) {
    const ch = { unite: u.id, capacite: capId, cible };
    this.etat.charges.push(ch);
    u.charge = capId;
    return ch;
  }
  prevoir() {
    return [...this.ordrePhase('a'), ...this.ordrePhase('e')].map(u => ({ type: 'unite', unite: u.id }));
  }
}

class OrdreParVitesse {
  constructor(combat) {
    this.c = combat;
    this.mode = 'vitesse';
  }
  get etat() {
    return this.c.etat.tours;
  }
  static creerEtat() {
    return { mode: 'vitesse', tour: 1, joues: [], charges: [], actif: null };
  }
  demarrer() {
    this.c.bus.emit('tour:debut', { tour: 1 });
  }
  /** Ceux qui n'ont pas encore joué cette manche, dans l'ordre où ils joueront. */
  ordreDuTour() {
    return trierParInitiative(
      this.c,
      this.c.unitesVivantes().filter(u => !this.etat.joues.includes(u.id))
    );
  }
  prochain() {
    const e = this.etat,
      [u] = this.ordreDuTour();
    if (!u) {
      this.c.finDeTour();
      Object.assign(e, { joues: [], tour: e.tour + 1 });
      if (!this.c.etat.fin) this.c.bus.emit('tour:debut', { tour: e.tour });
      return { type: 'finDeTour', tour: e.tour - 1 };
    }
    // une capacité chargée part au tour suivant de son lanceur, à la place de son action
    const ch = this.charge(u);
    if (ch) {
      e.charges = e.charges.filter(x => x !== ch);
      e.joues.push(u.id);
      return { type: 'charge', charge: ch };
    }
    e.actif = u.id;
    return { type: 'unite', unite: u };
  }
  apresActivation(u) {
    if (!this.etat.joues.includes(u.id)) this.etat.joues.push(u.id);
    this.etat.actif = null;
  }
  charge(u) {
    return this.etat.charges.find(ch => ch.unite === u.id) || null;
  }
  programmerCharge(u, capId, cible) {
    const ch = { unite: u.id, capacite: capId, cible };
    this.etat.charges.push(ch);
    u.charge = capId;
    return ch;
  }
  prevoir() {
    return this.ordreDuTour().map(u => ({ type: 'unite', unite: u.id }));
  }
}

/* ---------- fin de tour : le pipeline ---------- */
const ETAPES_FIN_DE_TOUR = [
  { id: 'statuts', nom: 'Brûlure et poison', executer: c => c.etapeStatuts() },
  { id: 'surfaces', nom: 'États des cases sur leurs occupants', executer: c => c.elements.etapeOccupants() },
  { id: 'meteo', nom: 'Sable et grêle', executer: c => c.meteo.etapeResiduelle() },
  { id: 'objets', nom: 'Objets tenus (Restes…)', executer: c => c.etapeObjets() },
  { id: 'meteo_cases', nom: 'La météo agit sur le plateau', executer: c => c.meteo.etapeCases() },
  { id: 'propagation', nom: 'Le feu se propage, les nuages dérivent', executer: c => c.elements.etapePropagation() },
  { id: 'durees', nom: 'Les états s’usent', executer: c => c.elements.etapeDurees() },
  { id: 'climat', nom: 'Météo et heure avancent', executer: c => (c.meteo.avancer(), c.horloge.avancer()) }
];

return { BusEvenements, COUTS, ETAPES_FIN_DE_TOUR, Hasard, OrdreChronologique, OrdreParPhases, OrdreParVitesse, SEUIL, borner, cloneProfond, collecter, combinerModificateurs, coutActivation, trierParInitiative };
})();
}
