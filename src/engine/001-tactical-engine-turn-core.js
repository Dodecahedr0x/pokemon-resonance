/* Section d'origine : moteur tactique (noyau, tours) */

export let MT;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {
MT = (() => {

/* ==== moteur-tactique/noyau.js ==== */
/* =====================================================================
   NOYAU : les modificateurs. Un système qui veut influencer un calcul (la
   pluie sur les dégâts Eau, la nuit sur les critiques, la boue sur la
   vitesse) fournit un modificateur. Le calcul ne connaît pas la météo : il
   demande « qu'est-ce qui modifie ce canal ? » et applique la liste.
   ===================================================================== */

/* ---------- Modificateurs ----------
   Un modificateur : { source, libelle, mul?, add?, crans?, fixe? }
   - mul   : multiplie la valeur (la pluie : ×1,5 sur l'Eau)
   - add   : s'ajoute avant les multiplications (un rôle : +1 Mobilité)
   - crans : paliers façon Pokémon (critique, précision)
   - fixe  : impose une valeur (Fatal-Foudre sous la pluie : précision 100 %)
   Les « fournisseurs » sont des objets { id, fournir(canal, ctx, qui) } qui renvoient
   un modificateur, une liste de modificateurs ou rien.                          */
function combineModifiers(base, changes) {
  let add = 0,
    mul = 1,
    notches = 0,
    isFixed = null;
  for (const m of changes) {
    if (m.add) add += m.add;
    if (m.mul != null) mul *= m.mul;
    if (m.crans) notches += m.crans;
    if (m.fixe != null) isFixed = m.fixe;
  }
  // les multiplications s'appliquent une à une, dans l'ordre des fournisseurs : le résultat est
  // identique, au dernier chiffre près, à un calcul écrit à la main (x *= a; x *= b; …)
  let amount = base + add;
  for (const m of changes) if (m.mul != null) amount *= m.mul;
  if (isFixed != null) amount = isFixed;
  return { valeur: amount, mul, add, crans: notches, detail: changes };
}

/** Appelle chaque fournisseur et aplatit le résultat (ignore les vides). */
function collect(providers, channel, ctx, subject) {
  const out = [];
  for (const f of providers) {
    if (!f || !f.fournir) continue;
    const r = f.fournir(channel, ctx, subject);
    if (!r) continue;
    for (const m of Array.isArray(r) ? r : [r]) if (m) out.push({ source: f.id, ...m });
  }
  return out;
}

/* ==== moteur-tactique/tours.js ==== */
/* =====================================================================
   GESTION DES TOURS : qui joue, et dans quel ordre
   ---------------------------------------------------------------------
   Deux stratégies interchangeables (même interface) :

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
   brancher telles quelles sur le moteur du jeu (voir 044-v4-5-01-moteur-tactique.js).
   ===================================================================== */

/** Initiative : priorité de l'attaque annoncée, puis Vitesse effective, puis rang (départage). */
function sortByInitiative(c, units) {
  const key = new Map(units.map(u => [u, [c.priorite(u), c.stat(u, 'vit'), c.rang(u)]]));
  return [...units].sort((a, b) => {
    const A = key.get(a),
      B = key.get(b);
    return B[0] - A[0] || B[1] - A[1] || A[2] - B[2];
  });
}

class OrderByPhases {
  constructor(battle) {
    this.c = battle;
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
    return sortByInitiative(
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
    const remainder = this.ordrePhase(e.phase);
    if (remainder.length) {
      e.actif = remainder[0].id;
      return { type: 'unite', unite: remainder[0], choix: remainder.map(u => u.id) }; // le joueur peut en choisir un autre : combat.activer(id)
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
  programmerCharge(u, moveId, target) {
    const ch = { unite: u.id, capacite: moveId, cible: target };
    this.etat.charges.push(ch);
    u.charge = moveId;
    return ch;
  }
  prevoir() {
    return [...this.ordrePhase('a'), ...this.ordrePhase('e')].map(u => ({ type: 'unite', unite: u.id }));
  }
}

class OrderBySpeed {
  constructor(battle) {
    this.c = battle;
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
    return sortByInitiative(
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
  programmerCharge(u, moveId, target) {
    const ch = { unite: u.id, capacite: moveId, cible: target };
    this.etat.charges.push(ch);
    u.charge = moveId;
    return ch;
  }
  prevoir() {
    return this.ordreDuTour().map(u => ({ type: 'unite', unite: u.id }));
  }
}

return { OrdreParPhases: OrderByPhases, OrdreParVitesse: OrderBySpeed, collecter: collect, combinerModificateurs: combineModifiers, trierParInitiative: sortByInitiative };
})();
}
