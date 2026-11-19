/* Section d'origine : v4.10-01-identite.js */

import { BY, MON, SCEN } from './009-03-pokemon.js';
import { PROFILE, inBox, isCamp } from './011-05-etat-de-partie.js';
import { BADGES } from './013-07-arenes.js';
import { $, medal, tc, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { __set_squad, renderSquad, save, squad } from './020-13-equipe-cartes.js';
import { damage, fin, flies, hasNx, hdist, heal, mDur, markAt, mvType, nbrK, say, setMark, stun, uAt, uk } from './021-14-moteur-combat.js';
import { scSel } from './024-17-interface-combat.js';
import { queueSave } from './025-19-sauvegardes.js';
import { PREF, sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { SHOP, bagN, fmt } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { FOURNISSEURS_ROLES } from './044-v4-5-01-moteur-tactique.js';
import { estTombe } from './048-v4-9-01-rejouabilite.js';
import { remise414 } from './053-v4-14-01-resonance.js';
import { enPension416, pension416 } from './055-v4-16-01-johto-vivant.js';
import { campOk430 } from './065-v4-30-01-camp-et-tactique.js';
import { indivDe432, indivHtml432 } from './067-v4-32-01-individus-et-confort.js';
import { ctJour456 } from './089-4-58-objets-tenus-en-plus-ct-a-gagner.js';
import { lock461, recit461 } from './092-4-61-compagnon-ufs-d-elevage-expeditions.js';
import { refreshCampBase } from '../screens/camp/campStore.js';
import { paintOverlay } from '../screens/overlays/dialogsStore.js';

let BATIMENTS, EXP_DEST;
export { BATIMENTS, placesExp, batimentBloque }; // lus par le Camp de base (src/screens/camp)


/* =====================================================================
   v4.10 : identité et progression
   ---------------------------------------------------------------------
   1. Accords de Résonance (Tactique avancée) : dans une même manche, trois
      attaques de vos Pokémon dont les types forment un accord déclenchent un
      effet d'équipe (Orage = Eau + Électrik + Vol, Forge = Feu + Roche +
      Acier…). Un accord par manche. Une pastille suit les types joués.
   2. Camp de base (Accueil, en Campagne) : 5 bâtiments à 3 niveaux, payés
      en Pokédollars et en Éclats, débloqués par les badges.
   3. Expéditions : un Pokémon du Box part quelques combats et revient avec
      des Pokédollars, des Éclats et des objets (double si ses types
      correspondent au lieu). Pendant ce temps, il ne combat pas.
   4. Caractère : chaque famille a un caractère (Brave, Prudent, Vif,
      Fougueux, Docile, Têtu) qui modifie un peu ses combats. En option, la
      désobéissance : un Pokémon fatigué ou têtu peut ignorer un ordre.
   ===================================================================== */

/* ---------- profil (fonctions déclarées : appelées dès le chargement) ---------- */
export function IDP0() {
  return { camp: { inf: 0, ate: 0, dojo: 0, guet: 0, pens: 0, oeuf: 0 }, exp: [] };
}


export function idpClean(p) {
  const o = IDP0();
  if (!p || typeof p !== 'object') return o;
  const c = p.camp;
  if (c && typeof c === 'object')
    for (const k in o.camp) if (Number.isFinite(c[k])) o.camp[k] = Math.max(0, Math.min(k === 'oeuf' ? 99 : 3, Math.floor(c[k])));
  if (Array.isArray(p.exp))
    o.exp = p.exp
      .filter(x => x && BY[x.id] && typeof x.dest === 'string' && Number.isFinite(x.fin) && x.gain && typeof x.gain === 'object')
      .slice(0, 3);
  return o;
}


/** Après une action d'un allié : le type compte pour l'accord de la manche. */
export function accordApres(S, u, m, ev) {
  if (!S.tac || u.side !== 'a' || S.over || !m || !(m.p || m.fix || m.mk)) return;
  if (!S.acc || S.acc.r !== S.round) S.acc = { r: S.round, t: [], fait: null };
  const typ = mvType(S, u, m);
  if (!S.acc.t.includes(typ)) S.acc.t.push(typ);
  if (S.acc.fait) return;
  const A = ACCORDS.find(a => a.t.every(t => S.acc.t.includes(t)));
  if (!A) return;
  S.acc.fait = A.id;
  S.stats.accords = (S.stats.accords || 0) + 1;
  ev.push({ e: 'arena' });
  say(ev, `Accord de Résonance · ${A.n} ! ${A.d}`);
  jouerAccord(S, A.id, u, ev);
  ev.push({ e: 'terrain' });
  fin(S, ev);
}


function jouerAccord(S, id, u, ev) {
  const foes = S.units.filter(o => o.side === 'e' && !o.ko),
    mates = S.units.filter(o => o.side === 'a' && !o.ko),
    sol = o => !flies(o);
  if (id === 'orage')
    foes.forEach(o => {
      if (markAt(S, uk(o)) !== 'trempe') return;
      damage(S, o, 6, ev, { ind: true });
      if (!o.ko) stun(S, o, 'PAR', ev, true);
    });
  else if (id === 'forge') {
    mates.forEach(o => (o.guard = 2));
    foes.forEach(o => {
      if ([uk(o), ...nbrK(uk(o))].some(k => S.tiles[k].mark && S.tiles[k].mark.k === 'brulant')) damage(S, o, 5, ev, { ind: true });
    });
  } else if (id === 'seisme')
    foes.filter(sol).forEach(o => {
      damage(S, o, 6, ev, { ind: true });
      setMark(S, uk(o), 'fissure', u.uid);
    });
  else if (id === 'floraison')
    mates.forEach(o => {
      heal(S, o, Math.round(o.mhp * 0.25), ev);
      o.bru = 0;
      o.web = 0;
      o.root = 0;
    });
  else if (id === 'banquise')
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (!(t.mark && t.mark.k === 'trempe') && !t.w) continue;
      if (t.mark && t.mark.k === 'trempe') t.mark = { k: 'givre', d: mDur(S, 'givre'), lv: 1, by: u.uid };
      const o = uAt(S, k);
      if (o && o.side === 'e' && !o.t.includes('Glace')) stun(S, o, 'GEL', ev, true);
    }
  else if (id === 'eclipse')
    foes
      .filter(o => (S.jit ? !o.perdu && !o.badge : o.intent) && !o.done)
      .sort((a, b) => hdist(a.pos, u.pos) - hdist(b.pos, u.pos))
      .slice(0, 2)
      .forEach(o => {
        o.intent = null;
        if (S.jit) o.perdu = 1;
        say(ev, S.jit ? `${o.n} se perd dans l’ombre : il ne jouera pas cette manche.` : `L’attaque de ${o.n} se perd dans l’ombre.`);
      });
  else if (id === 'incendie')
    for (const k in S.tiles) {
      const t = S.tiles[k];
      if (!t.grass || t.rock) continue;
      t.grass = false;
      t.mark = { k: 'brulant', d: mDur(S, 'brulant'), lv: 1, by: u.uid };
      const o = uAt(S, k);
      if (o && o.side === 'e' && sol(o) && !o.t.includes('Feu')) o.bru = Math.max(o.bru, 2);
    }
  else if (id === 'voltige') S.voix = Math.min(S.vmax + 2, S.voix + 2);
  else if (id === 'draco') foes.forEach(o => damage(S, o, 8, ev, { ind: true }));
  else if (id === 'venin')
    foes
      .filter(o => mates.some(a => hdist(a.pos, o.pos) <= 2))
      .forEach(o => {
        damage(S, o, 4, ev, { ind: true });
        if (!o.ko && o.tal !== 'regardvif') o.web = Math.max(o.web, 2);
      });
}


/** La pastille des accords : les types joués cette manche, et l'accord le plus proche. */
export function chipAccord(S) {
  if (!S || !S.tac || S.over) return '';
  const t = S.acc && S.acc.r === S.round ? S.acc.t : [];
  if (S.acc && S.acc.r === S.round && S.acc.fait) {
    const A = ACCORDS.find(a => a.id === S.acc.fait);
    return `<span class="chip chip-acc fait" title="${A.d}">Accord joué · ${A.n}</span>`;
  }
  let best = null,
    bn = 0;
  ACCORDS.forEach(a => {
    const n = a.t.filter(x => t.includes(x)).length;
    if (n > bn) {
      bn = n;
      best = a;
    }
  });
  const dots = t.map(x => `<i style="background:${tc(x)}" title="${x}"></i>`).join('');
  const hint = best ? `${best.n} : il manque ${best.t.filter(x => !t.includes(x)).join(' et ')}` : 'enchaînez 3 types';
  return `<span class="chip chip-acc" title="${ACCORDS.map(a => `${a.n} = ${a.t.join(' + ')}`).join(' · ')}">${dots}Accord · ${hint}</span>`;
}


/** Le caractère d'une famille : toujours le même pour une même famille. */
function caractereDe(id) {
  const I432 = indivDe432(id); // nature individuelle de votre Pokémon (v4.32)
  if (I432 && CARACTERES[I432.car]) return I432.car;
  const b = BY[id] ? BY[id].base : id,
    ks = Object.keys(CARACTERES);
  let h = 7;
  for (const c of String(b)) h = (h * 31 + c.charCodeAt(0)) % 9973;
  return ks[h % ks.length];
}


/** Avant un ordre : le Pokémon obéit-il ? (null : oui ; sinon les événements) */
export function desobeit(S, u) {
  if (!S.desob || u.side !== 'a' || u.car === 'docile') return null;
  const p = (u.car === 'tetu' ? 0.12 : 0.04) + (u.fat ? 0.12 : 0);
  if (Math.random() >= p) return null;
  const ev = [];
  say(ev, `${u.n} fait la sourde oreille${u.fat ? ' : il est épuisé' : u.car === 'tetu' ? ' : il est têtu' : ''}.`);
  ev.push({ e: 'desob', u: u.uid });
  return ev;
}


export function caractereHtml(id) {
  const k = caractereDe(id);
  return `<div class="mvc car-mvc"><div class="t"><b>${CARACTERES[k][0]}</b><span class="chip">Nature</span></div><p>${CARACTERES[k][1]}</p></div>` + indivHtml432(id); // talent (v4.32)
}


function batimentBloque(k) {
  const B2 = BATIMENTS[k],
    n = niveau(k);
  if (n >= 3) return 'Niveau maximal';
  const b = B2.badges[n];
  return BADGES.length < b ? `${b} badge${b > 1 ? 's' : ''} requis` : null;
}


function construire(k) {
  if (!campOk430() || batimentBloque(k)) return;
  const [m, g] = BATIMENTS[k].cout[niveau(k)];
  if (PROFILE.money < m || PROFILE.gems < g) {
    toast('Pas assez de Pokédollars ou d’Éclats.');
    return;
  }
  PROFILE.money -= m;
  PROFILE.gems -= g;
  PROFILE.camp = PROFILE.camp || IDP0().camp;
  PROFILE.camp[k] = niveau(k) + 1;
  sfx('ui');
  vibe(20);
  toast(`${BATIMENTS[k].n} niveau ${niveau(k)} : ${BATIMENTS[k].d(niveau(k))}`);
  queueSave();
  renderWallet();
  renderCampBase();
}


/** Atelier : le prix d'un objet en Boutique (Pokédollars). */
export function prixDe(k) {
  const p = remise414(k, prixDe0(k)); // offres du jour (v4.14)
  return ctJour456().o.includes(k) ? Math.max(50, Math.round((p * 0.8) / 50) * 50) : p; // CT du jour : −20 % (v4.58)
}


export function prixDe0(k) {
  const it = SHOP[k];
  if (!it || it.g) return it ? it.p : 0;
  return it.mv && !it.cs && campOk430() ? Math.round((it.p * (1 - 0.1 * niveau('ate'))) / 50) * 50 : it.p;
}

 // ou à la Pension (v4.16)
export function expRefus(id) {
  if (enPension416(id)) return `${BY[BY[id].base].n} est à la Pension : reprenez le couple au Camp pour le faire combattre.`; // v4.16
  return enExpedition(id) ? `${BY[BY[id].base].n} est en expédition : il reviendra bientôt.` : null;
}


export function envoyer(id, dest) {
  const D = DESTINATIONS[dest];
  if (D && lock461(D)) return toast(`${D.n} : accessible après ${D.min} badges.`);
  if (!campOk430() || !D || !inBox(id) || enExpedition(id) || PROFILE.exp.length >= placesExp()) return;
  const r = () => Math.random(),
    entre = ([a, b]) => Math.round((a + r() * (b - a)) / 10) * 10,
    bon = BY[id].t.some(t => D.types.includes(t)),
    x = bon ? 2 : 1,
    obj = D.obj.filter(o => SHOP[o]);
  const gain = {
    m: entre(D.m) * x,
    g: Math.round(D.g[0] + r() * (D.g[1] - D.g[0])) * x,
    o: obj.length ? obj[Math.floor(r() * obj.length)] : null,
    q: x
  };
  PROFILE.exp.push({ id, dest, fin: PROFILE.battles + D.duree, gain, bon });
  __set_squad(squad.filter(s => BY[s].base !== BY[id].base));
  toast(`${BY[id].n} part pour ${D.n}${bon ? ' : un terrain qui lui convient' : ''}. Retour dans ${D.duree} combats.`);
  save();
  queueSave();
  renderCampBase();
  try {
    renderSquad();
  } catch (e) {}
}


export function recuperer(i) {
  const x = PROFILE.exp[i];
  if (!x || PROFILE.battles < x.fin) return;
  PROFILE.money = Math.min(999999, PROFILE.money + x.gain.m);
  PROFILE.gems = Math.min(99999, PROFILE.gems + x.gain.g);
  if (x.gain.o) PROFILE.bag[x.gain.o] = Math.min(99, bagN(x.gain.o) + x.gain.q);
  PROFILE.exp.splice(i, 1);
  sfx('ui');
  toast(
    `${BY[x.id].n} revient de ${DESTINATIONS[x.dest].n} : ${fmt(x.gain.m)} ₽${x.gain.g ? `, ${x.gain.g} Éclats` : ''}${x.gain.o ? `, ${x.gain.q} × ${SHOP[x.gain.o].n}` : ''}.`
  );
  queueSave();
  renderWallet();
  renderCampBase();
  try {
    recit461(x); // récit et trouvaille rare (v4.61)
  } catch (e) {}
}


// Le panneau « Camp de base » (#v4Camp, page Camp) est rendu par React : src/screens/camp/CampBase.jsx.
export function renderCampBase() {
  refreshCampBase();
}


/* fenêtre d’expédition : rendu par React (src/screens/overlays/ExpBox.jsx) */
export function renderExpBox() {
  const dispo = PROFILE.box.filter(id => BY[id] && !squad.some(s => BY[s].base === id) && !enExpedition(id) && !estTombe(id));
  paintOverlay('exp', { dest: EXP_DEST, dispo });
}

/* =====================================================================
   1. Accords de Résonance
   ===================================================================== */
export const ACCORDS = [
  { id: 'orage', n: 'Orage', t: ['Eau', 'Électrik', 'Vol'], d: 'Tout adversaire sur une case Trempée ou dans l’eau est paralysé et subit 6 dégâts.' },
  { id: 'forge', n: 'Forge', t: ['Feu', 'Roche', 'Acier'], d: 'Vos Pokémon gagnent +2 Garde ; tout adversaire au contact d’une case Brûlante subit 5 dégâts.' },
  { id: 'seisme', n: 'Grand Séisme', t: ['Sol', 'Roche', 'Combat'], d: 'Tout adversaire au sol subit 6 dégâts et sa case devient Fissurée.' },
  { id: 'floraison', n: 'Grande Floraison', t: ['Plante', 'Eau', 'Fée'], d: 'Vos Pokémon récupèrent 25 % de leurs PV et sont libérés des brûlures et entraves.' },
  { id: 'banquise', n: 'Banquise', t: ['Glace', 'Eau', 'Vol'], d: 'Les cases Trempées gèlent ; les adversaires dessus sont gelés.' },
  { id: 'eclipse', n: 'Éclipse', t: ['Spectre', 'Ténèbres', 'Psy'], d: 'Les 2 adversaires les plus proches perdent leur prochaine action.' },
  { id: 'incendie', n: 'Incendie', t: ['Feu', 'Plante', 'Vol'], d: 'Toutes les hautes herbes s’embrasent ; les adversaires dedans sont brûlés.' },
  { id: 'voltige', n: 'Voltige', t: ['Normal', 'Vol', 'Combat'], d: '+2 Voix tout de suite.' },
  { id: 'draco', n: 'Rugissement draconique', t: ['Dragon', 'Feu', 'Électrik'], d: 'Tous les adversaires subissent 8 dégâts.' },
  { id: 'venin', n: 'Venin', t: ['Poison', 'Insecte', 'Plante'], d: 'Les adversaires à 2 cases ou moins de vos Pokémon sont englués et subissent 4 dégâts.' }
];


/* =====================================================================
   2. Caractère et désobéissance
   ===================================================================== */
export const CARACTERES = {
  brave: ['Brave', '+2 dégâts infligés, +1 dégât subi.'],
  prudent: ['Prudent', '−2 dégâts subis, −1 dégât infligé.'],
  vif: ['Vif', '+1 Mouvement, −1 dégât infligé.'],
  fougueux: ['Fougueux', 'Commence chaque combat avec 1 point d’Éveil, +1 dégât subi.'],
  docile: ['Docile', 'Aucun effet. N’est jamais désobéissant.'],
  tetu: ['Têtu', '+3 dégâts infligés, mais désobéit plus souvent (si la désobéissance est activée).']
};


export const caracteresChoisis = () => PREF.caracteres !== false && !(SCEN[scSel] && SCEN[scSel].tuto);


export const desobeissanceChoisie = () => !!PREF.desob && isCamp() && !(SCEN[scSel] && SCEN[scSel].tuto);


export const niveau = k => (PROFILE.camp && PROFILE.camp[k]) || 0;


/* =====================================================================
   4. Expéditions
   ===================================================================== */
export const DESTINATIONS = {
  foret: { n: 'Forêt de Jade', types: ['Plante', 'Insecte', 'Vol'], duree: 3, m: [150, 300], g: [0, 1], obj: ['potion', 'poke'] },
  lac: { n: 'Lac Colère', types: ['Eau', 'Glace', 'Normal'], duree: 4, m: [200, 400], g: [1, 2], obj: ['superpotion', 'super'] },
  grotte: { n: 'Grotte Sombre', types: ['Roche', 'Sol', 'Acier', 'Combat'], duree: 5, m: [300, 600], g: [2, 4], obj: ['hyper', 'superpotion'] },
  tour: { n: 'Tour Cendrée', types: ['Feu', 'Spectre', 'Psy', 'Ténèbres', 'Dragon', 'Électrik', 'Poison', 'Fée'], duree: 6, m: [400, 800], g: [3, 6], obj: ['hyper'] }
};


export const enExpedition = id => !!(campOk430() && PROFILE.exp && BY[id] && PROFILE.exp.some(x => BY[x.id].base === BY[id].base)) || enPension416(id);


const placesExp = () => niveau('guet');

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

FOURNISSEURS_ROLES.push({
  id: 'caractere',
  fournir: (c, { u, t }) => {
    const o = [],
      a = { brave: 2, prudent: -1, vif: -1, tetu: 3 }[u.car],
      d = { brave: 1, prudent: -2, fougueux: 1 }[t.car];
    if (a) o.push({ add: a, libelle: CARACTERES[u.car][0] });
    if (d) o.push({ add: d, libelle: CARACTERES[t.car][0] });
    return o;
  }
});


/* =====================================================================
   3. Camp de base
   ===================================================================== */
BATIMENTS = {
  guet: {
    n: 'Tour de guet',
    d: n => `${n} expédition${n > 1 ? 's' : ''} à la fois.`,
    cout: [[500, 0], [1500, 5], [3500, 10]],
    badges: [0, 2, 4]
  },
  inf: {
    n: 'Infirmerie',
    d: n => `Les Pokémon au repos récupèrent ${n * 10} points de fatigue de plus après chaque combat.`,
    cout: [[800, 0], [2000, 5], [4000, 12]],
    badges: [1, 3, 5]
  },
  ate: {
    n: 'Atelier',
    d: n => `CT et DT ${n * 10} % moins chères en Boutique.`,
    cout: [[600, 0], [1500, 4], [3000, 10]],
    badges: [1, 3, 5]
  },
  dojo: {
    n: 'Dojo',
    d: n => `${n === 1 ? 'Le premier Pokémon' : `Les ${n} premiers Pokémon`} de l’équipe commence${n > 1 ? 'nt' : ''} chaque combat avec 1 point d’Éveil.`,
    cout: [[1000, 0], [2500, 6], [5000, 14]],
    badges: [2, 4, 6]
  },
  pens: {
    n: 'Pension',
    d: n => `Un œuf tous les ${[8, 6, 4][n - 1]} combats : une famille que vous n’avez pas encore, ou celle du couple que vous y déposez.`, // couple (v4.16)
    cout: [[1200, 0], [3000, 8], [6000, 16]],
    badges: [2, 4, 6]
  }
};


/* ---------- camp et expéditions : le panneau #v4Camp est rendu par React (page Camp) ---------- */
// #expBox : rendu par React (src/screens/overlays/ExpBox.jsx)


EXP_DEST = null;


document.addEventListener('click', e => {
  const b = e.target.closest('[data-camp-b]');
  if (b) return construire(b.dataset.campB);
  const r = e.target.closest('[data-exp-r]');
  if (r) return recuperer(+r.dataset.expR);
  if (e.target.closest('[data-exp-new]')) {
    EXP_DEST = null;
    renderExpBox();
    $('#expBox').hidden = false;
    return;
  }
  const d = e.target.closest('[data-exp-d]');
  if (d) {
    EXP_DEST = d.dataset.expD || null;
    renderExpBox();
    return;
  }
  const p = e.target.closest('[data-exp-p]');
  if (p && EXP_DEST) {
    envoyer(p.dataset.expP, EXP_DEST);
    $('#expBox').hidden = true;
    return;
  }
  if (e.target.closest('[data-exp-x]') || e.target.id === 'expBox') $('#expBox').hidden = true;
});


/* =====================================================================
   Branchements
   ===================================================================== */
CROCHETS.creation.push((S, opt) => {
  if (!opt) return;
  const al = S.units.filter(u => u.side === 'a');
  if (opt.caracteres) {
    S.car = true;
    al.forEach(u => {
      u.car = caractereDe(u.sp);
      if (u.car === 'fougueux' && hasNx(u)) u.en = Math.max(u.en, 1);
    });
  }
  if (opt.desob) S.desob = true;
  if (opt.dojo) al.slice(0, opt.dojo).forEach(u => hasNx(u) && (u.en = Math.max(u.en, 1)));
});


CROCHETS.progres.push((S, rew) => {
  const D = SCEN[S.sc] || {};
  if (!campOk430() || D.tuto || D.tower) return null;
  // Infirmerie : les Pokémon au repos récupèrent plus vite
  const inf = niveau('inf');
  if (inf) {
    const used = S.units.filter(u => u.side === 'a').map(u => u.sp);
    for (const id in PROFILE.fatigue) {
      if (used.includes(id)) continue;
      PROFILE.fatigue[id] = Math.max(0, PROFILE.fatigue[id] - inf * 10);
      if (!PROFILE.fatigue[id]) delete PROFILE.fatigue[id];
    }
  }
  // Pension : un œuf
  const pe = niveau('pens');
  if (pe) {
    PROFILE.camp.oeuf = (PROFILE.camp.oeuf || 0) + 1;
    if (PROFILE.camp.oeuf >= [8, 6, 4][pe - 1] && !pension416(rew)) {
      // sans couple : une famille inconnue (v4.10) ; avec un couple : leur œuf (v4.16)
      const pool = MON.filter(m => m.st === 1 && !m.leg && !m.ennemi && m.base === m.id && !PROFILE.box.includes(m.id));
      if (pool.length) {
        const m = pool[Math.floor(Math.random() * pool.length)];
        PROFILE.box.push(m.id);
        if (!PROFILE.dex.includes(m.id)) PROFILE.dex.push(m.id);
        PROFILE.camp.oeuf = 0;
        rew.oeuf = m.id;
      }
    }
  }
  // expéditions revenues
  const rev = (PROFILE.exp || []).filter(x => PROFILE.battles >= x.fin).length;
  if (rev) rew.exp = rev;
  return null;
});


CROCHETS.resultat.push(r => {
  const o = [];
  if (r.oeuf)
    o.push(`<div class="res-l"><h4>Pension</h4><div class="rl">${medal(BY[r.oeuf].t)}<span>Un œuf a éclos : ${BY[r.oeuf].n} rejoint votre Box !</span><b>🥚</b></div></div>`);
  if (r.exp)
    o.push(`<div class="res-l"><h4>Expéditions</h4><div class="rl"><span>${r.exp} Pokémon ${r.exp > 1 ? 'sont revenus' : 'est revenu'} d’expédition : récupérez leurs trouvailles au Camp (Accueil).</span><b>${r.exp}</b></div></div>`);
  return o.join('');
});


/* ---------- le Guide : la liste des accords, rendue par React (Tactique.jsx) ---------- */
}
