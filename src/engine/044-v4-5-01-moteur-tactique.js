/* Section d'origine : v4.5-01-moteur-tactique.js */

import { MT } from './001-moteur-tactique-noyau-tours.js';
import { MV, TAL } from './005-02-capacites.js';
import { SCEN } from './009-03-pokemon.js';
import { toast } from './014-08-outils.js';
import { byUid, execFoe, flies, hdist, markAt, uk } from './021-14-moteur-combat.js';
import { ACT, STATUSED, coverOf, ignObst, noteAdd, roleOf } from './023-16-roles-synergies-obstacles.js';
import { B, autoSel, clearAim, finDeManche, finish, log, placerEnnemi, renderAll, scSel, ui } from './024-17-interface-combat.js';
import { PREF } from './026-20-campagne-tutoriel-son.js';
import { playEv } from './028-22-effets-attaque.js';
import { joueur418 } from './058-v4-18-01-peche-safari-coop.js';
import { dl428 } from './063-v4-28-01-captures-combat-accueil.js';

export let FOURNISSEURS_VITESSE, JIT_PBM, JIT_PB, JIT_DMG, JIT_BOSS, JIT_BOSS_HB, pvOrdre, FOURNISSEURS_DEGATS, FOURNISSEURS_ROLES;
let solide, PV_ORDRE_VITESSE, JIT_HB, lowHp;


/* =====================================================================
   v4.5 : le moteur tactique branché sur le combat de Résonance
   ---------------------------------------------------------------------
   Le cœur de src/moteur-tactique (bus, modificateurs, stratégies d'ordre
   des tours) est embarqué dans le jeu sous le nom MT par build.mjs.
   Ce fichier est l'ADAPTATEUR : il présente un combat du jeu (S) au moteur
   sous la forme que celui-ci attend (unités vivantes, Vitesse, priorité,
   rang), sans rien changer aux règles du jeu.

   1. Ordre des tours
      - « Par équipe » (classique, par défaut) : la stratégie OrdreParPhases
        du moteur ordonne les adversaires. Résultat identique à avant
        (vérifié par les 594 combats du test moteur).
      - « Par Vitesse » (nouveau, réglage dans Paramètres) : la stratégie
        OrdreParVitesse mêle alliés et adversaires. À chaque manche, chacun
        joue une fois, du plus rapide au plus lent ; une attaque prioritaire
        annoncée par l'adversaire (Vive-Attaque, Vitesse Extrême) passe devant.
        Les attaques restent annoncées : on voit venir le coup, mais un
        adversaire plus rapide frappe avant que vous ne puissiez l'esquiver.
   2. Vitesse effective : le pipeline de modificateurs du moteur (boue,
      givre, paralysie, Glissade, Chlorophylle, Éclaireur).
   3. Dégâts : les multiplicateurs de la formule (météo, talents, état) et
      ceux des rôles, synergies et du terrain passent par le même pipeline
      (fournisseurs ci-dessous, appelés par dmgBase et dmgRolesTerrain).
   ===================================================================== */

/* ---------- 1. L'adaptateur ---------- */
/** La vue « moteur » d'un combat du jeu. mode : 'equipe' (classique) ou 'vitesse'. */
function adaptateurTours(S, mode) {
  const vues = new Map(),
    vit = mode === 'vitesse';
  const vue = u => {
    if (!vues.has(u)) vues.set(u, { id: u.uid, camp: u.side, ref: u });
    return vues.get(u);
  };
  return {
    etat: { tours: { joues: [], charges: [] } },
    bus: { emit() {} },
    unitesVivantes: () => S.units.filter(u => !u.ko).map(vue),
    unite: id => vue(byUid(S, id)),
    // classique : la Vitesse brute, comme avant ; par Vitesse : la Vitesse effective
    stat: (v, nom) => (nom !== 'vit' ? 0 : vit ? (S.distorsion > 0 ? 20 - vitesseEff(S, v.ref).valeur : vitesseEff(S, v.ref).valeur) : v.ref.s[3]), // Distorsion : les plus lents d’abord (v4.12)
    priorite: v => (vit && v.ref.side === 'e' && v.ref.intent ? MV[v.ref.intent.mv].prio || 0 : 0),
    // à Vitesse égale : l'ordre d'arrivée (classique) ; par Vitesse, vos Pokémon d'abord, puis le tirage de la manche
    rang: v => (vit && S.tirage ? (v.camp === 'a' ? 0 : 1) + (S.tirage[v.id] || 0) : S.units.indexOf(v.ref))
  };
}


/** Ordre dans lequel les adversaires exécutent leurs attaques (mode classique). */
export function ordreEnnemis(S) {
  return new MT.OrdreParPhases(adaptateurTours(S, 'equipe')).ordrePhase('e').map(v => v.id);
}


function vitesseEff(S, u) {
  return MT.combinerModificateurs(u.s[3], MT.collecter(FOURNISSEURS_VITESSE, 'vit', { S, u }, 'unite'));
}


/** La file est calculée une fois par manche, après les annonces adverses (comme les jeux calculent l'ordre en début de tour). */
function preparerManche(S) {
  S.tirage = {};
  S.units.forEach(u => (S.tirage[u.uid] = Math.random()));
  S.file = new MT.OrdreParVitesse(adaptateurTours(S, 'vitesse')).ordreDuTour().map(v => v.id);
  S.vfile = S.file.map(id => Math.round(vitesseEff(S, byUid(S, id)).valeur * 10) / 10);
  S.fileManche = S.round;
  S.ifile = -1;
  avancerFile(S);
}


/** Passe au suivant : on saute les K.O. et les alliés qui ne peuvent plus agir (endormis, ou déjà engagés dans un Duo). */
function avancerFile(S) {
  S.ifile += 1;
  while (S.ifile < S.file.length) {
    const u = byUid(S, S.file[S.ifile]);
    if (u && !u.ko && !(u.side === 'a' && (u.sn || u.acted))) return;
    S.ifile += 1;
  }
}


/** Le Pokémon dont c'est le tour (null : la manche est finie, ou on n'est pas en mode Vitesse). */
export function acteurCourant(S) {
  if (!S || S.ordre !== 'vitesse' || S.over || S.phase !== 'player') return null;
  if (S.fileManche !== S.round || !S.file) preparerManche(S);
  let u = byUid(S, S.file[S.ifile]);
  while (u && u.ko) {
    avancerFile(S);
    u = byUid(S, S.file[S.ifile]);
  }
  return u || null;
}


function jouerEnnemiCourant(S) {
  const u = acteurCourant(S);
  if (!u || u.side !== 'e') return [];
  const ev = execFoe(S, u.uid);
  avancerFile(S);
  return ev;
}


function finirTourAllie(S) {
  const u = acteurCourant(S);
  if (!u || u.side !== 'a') return;
  u.acted = true;
  u.moved = true;
  avancerFile(S);
}


/* ---------- 5. Interface du mode Vitesse ---------- */
/** Le réglage du joueur (Paramètres). Le combat guidé du prologue reste toujours classique. */
export function ordreChoisi() {
  return PREF.vitesse && !(SCEN[scSel] && SCEN[scSel].tuto) ? 'vitesse' : 'equipe';
}


// La frise (#bOrdre) : qui joue, dans quel ordre, cette manche. Rendue par React
// (src/screens/combat/battle/TopBar.jsx).


/** Fait jouer les adversaires jusqu'au tour du prochain allié (ou jusqu'à la fin de la manche). */
export function deroulerVitesse() {
  if (!B || B.ordre !== 'vitesse' || B.over) return;
  const S0 = B;
  ui.busy = true;
  ui.turbo428 = false;
  renderAll();
  const step = async () => {
    if (!B || B !== S0) return;
    if (B.over) {
      ui.busy = false;
      finish();
      return;
    }
    const u = acteurCourant(B);
    if (!u) {
      // fin de la manche, puis on enchaîne : un adversaire plus rapide peut ouvrir la manche suivante
      if (await finDeManche(S0)) deroulerVitesse();
      return;
    }
    if (u.side === 'a') {
      ui.busy = false;
      ui.act = null;
      autoSel();
      renderAll();
      log(`À ${u.n} de jouer.`, 'sys');
      return;
    }
    ui.act = u.uid;
    if (await placerEnnemi(S0, u.uid)) return; // v4.12 : il se place d'abord, sous vos yeux
    const ev = jouerEnnemiCourant(B);
    renderAll();
    playEv(ev);
    setTimeout(step, dl428(200, 380, 900));
  };
  setTimeout(step, dl428(60, 160, 420));
}


/** Ordre par Vitesse : seul l'allié dont c'est le tour se commande. */
export function peutSelectionner(u) {
  if (B && B.coop && u.side === 'a' && joueur418(u) !== B.coop) {
    toast(`C’est au Joueur ${B.coop} de jouer.`); // coop (v4.18)
    return false;
  }
  const cur = B && acteurCourant(B);
  if (!cur || u === cur || B.ordre !== 'vitesse') return true;
  toast(cur.side === 'a' ? `C’est au tour de ${cur.n}.` : 'Les adversaires jouent.');
  return false;
}


/** « Au suivant » : l'allié courant a fini, la file avance. */
export function finTourVitesse() {
  if (!B || ui.busy || B.over || B.phase !== 'player' || B.ordre !== 'vitesse') return;
  ui.undo = null;
  ui.tile = null;
  clearAim();
  ui.selE = null;
  finirTourAllie(B);
  deroulerVitesse();
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ---------- 2. Vitesse effective ---------- */
solide = u => !flies(u);


FOURNISSEURS_VITESSE = [
  { id: 'paralysie', fournir: (c, { u }) => u.badge === 'PAR' && { mul: 0.5, libelle: 'Paralysie' } },
  {
    id: 'boue',
    fournir: (c, { S, u }) =>
      S.tiles[uk(u)].mud > 0 && solide(u) && !u.t.some(t => t === 'Sol' || t === 'Eau') && { mul: 0.5, libelle: 'Boue' }
  },
  {
    id: 'givre',
    fournir: (c, { S, u }) =>
      markAt(S, uk(u)) === 'givre' && solide(u) && { mul: u.t.includes('Glace') ? 1.25 : 0.75, libelle: 'Givre' }
  },
  {
    id: 'glissade',
    fournir: (c, { S, u }) =>
      u.tal === 'glissade' &&
      ((S.wx && S.wx.k === 'pluie') || markAt(S, uk(u)) === 'trempe') && { mul: 2, libelle: 'Glissade' }
  },
  {
    id: 'chlorophylle',
    fournir: (c, { S, u }) =>
      u.tal === 'chlorophylle' && S.wx && S.wx.k === 'soleil' && { mul: 2, libelle: 'Chlorophylle' }
  },
  { id: 'eclaireur', fournir: (c, { u }) => roleOf(u) === 'Éclaireur' && { add: 1, libelle: 'Éclaireur' } }
];


/* ---------- 3. Mode « Ordre par Vitesse » : la file de la manche ---------- */
/* Équilibrage : par Vitesse, vous perdez l'avantage de toujours jouer en premier.
   En échange, les PV bonus des adversaires sont réduits (réglé au robot de test). */
PV_ORDRE_VITESSE = 0.7;


/* v4.12 : sans intentions annoncées, l'adversaire frappe toujours la meilleure cible à sa portée.
   En échange, ses PV bonus et sa puissance bonus baissent (réglés au robot de test : mêmes taux de
   victoire qu'en v4.11 pour un joueur qui se place bien). */
JIT_HB = 0.8,
  JIT_PBM = 0.7,
  JIT_PB = 0,
  JIT_DMG = 0.75,
  JIT_BOSS = 0.8, // boss (légendaires, colosses, Tour) : dégâts
  JIT_BOSS_HB = 0.6;

 // boss : PV bonus (combats plus courts : chaque coup adverse porte)
pvOrdre = opt => (opt && opt.ordre === 'vitesse' ? PV_ORDRE_VITESSE : 1) * JIT_HB;


/* ---------- 4. Dégâts : les fournisseurs de modificateurs ----------
   Même ordre et mêmes valeurs que l'ancienne formule (résultat identique au dernier
   chiffre, vérifié par le test moteur). Pour ajouter un effet : une ligne ici.        */
lowHp = (u, s) => u.hp / u.mhp <= s;


FOURNISSEURS_DEGATS = [
  // météo
  {
    id: 'meteo',
    fournir: (c, { S, m, typ }) => {
      const W = S.wx && S.wx.k,
        out = [];
      if (W === 'pluie') {
        if (typ === 'Eau') out.push({ mul: 1.5, libelle: 'Pluie' });
        if (typ === 'Feu') out.push({ mul: 0.5, libelle: 'Pluie' });
      }
      if (W === 'soleil') {
        if (typ === 'Feu') out.push({ mul: 1.5, libelle: 'Soleil' });
        if (typ === 'Eau') out.push({ mul: 0.5, libelle: 'Soleil' });
        if (m.sun) out.push({ mul: 1.5, libelle: 'Soleil' });
      }
      return out;
    }
  },
  // talents du lanceur
  {
    id: 'talent',
    fournir: (c, { u, typ }) => {
      if (
        (u.tal === 'brasier' && typ === 'Feu' && lowHp(u, 0.34)) ||
        (u.tal === 'torrent' && typ === 'Eau' && lowHp(u, 0.34)) ||
        (u.tal === 'essaim' && typ === 'Insecte' && lowHp(u, 0.34)) ||
        (u.tal === 'engrais' && typ === 'Plante' && lowHp(u, 0.5))
      )
        return { mul: 1.5, libelle: TAL[u.tal].n };
    }
  },
  { id: 'cran', fournir: (c, { u }) => u.tal === 'cran' && (u.bru > 0 || u.badge) && { mul: 1.5, libelle: 'Cran' } },
  { id: 'boost', fournir: (c, { u }) => u.boost > 0 && { mul: 1.5, libelle: 'Renforcé' } },
  // talent de la cible
  {
    id: 'isograisse',
    fournir: (c, { t, typ }) =>
      t.tal === 'isograisse' && (typ === 'Feu' || typ === 'Glace') && { mul: 0.5, libelle: 'Isograisse' }
  },
  // même type que le lanceur
  { id: 'stab', fournir: (c, { u, typ }) => u.t.includes(typ) && { mul: 1.2, libelle: 'Même type' } }
];


/* rôles, synergies et terrain : appliqués après la formule de base (multiplicateurs puis bonus fixes) */
FOURNISSEURS_ROLES = [
  {
    id: 'frappeur',
    fournir: (c, { S, u }) =>
      roleOf(u) === 'Frappeur' &&
      S.units.some(
        o => !o.ko && o.side === u.side && o.uid !== u.uid && roleOf(o) === 'Rempart' && hdist(o.pos, u.pos) === 1
      ) && {
        mul: 1.25,
        libelle: 'Frappeur couvert par un Rempart'
      }
  },
  {
    id: 'verrou',
    fournir: (c, { S, u, t }) =>
      t.side !== u.side &&
      STATUSED(t) &&
      S.units.some(o => !o.ko && o.side === u.side && roleOf(o) === 'Verrou') && { mul: 1.25, libelle: 'Verrou' }
  },
  {
    id: 'synergies',
    fournir: (c, { S, u, t, typ }) => {
      if (u.side !== 'a' || !S.syn) return null;
      const s = S.syn,
        out = [];
      if (s.includes('forge') && (typ === 'Feu' || typ === 'Roche')) out.push({ add: 2, libelle: 'Forge' });
      if (s.includes('tempete') && typ === 'Électrik' && markAt(S, uk(t)) === 'trempe')
        out.push({ mul: 1.25, libelle: 'Tempête' });
      if (s.includes('dojo') && hdist(u.pos, t.pos) === 1) out.push({ add: 2, libelle: 'Dojo' });
      if (s.includes('banquise') && typ === 'Glace') out.push({ add: 3, libelle: 'Banquise' });
      if (s.includes('draco') && (typ === 'Dragon' || typ === 'Vol')) out.push({ add: 2, libelle: 'Draco' });
      return out;
    }
  },
  {
    id: 'acier',
    fournir: (c, { S, t }) =>
      t.side === 'a' &&
      S.syn &&
      S.syn.includes('acier') &&
      t.t.some(z => z === 'Ténèbres' || z === 'Acier') && { add: -2, libelle: 'Acier' }
  },
  {
    id: 'sable',
    fournir: (c, { S, t }) => {
      const tt = S.tiles[uk(t)];
      return (
        tt &&
        tt.sand &&
        !tt.w &&
        t.t.some(z => z === 'Sol' || z === 'Roche' || z === 'Acier') && { add: -2, libelle: 'Sable' }
      );
    }
  },
  {
    id: 'garde',
    fournir: (c, { u }) => ACT && ACT.guard && ACT.u.uid === u.uid && { mul: 0.75, libelle: 'Interception' }
  },
  {
    id: 'couvert',
    fournir: (c, { S, u, m, t, typ }) => {
      if (ACT && ACT.rico && ACT.u.uid === u.uid) {
        noteAdd(`Ricochet sur ${t.n} : −25 %`);
        return { mul: 0.75, libelle: 'Ricochet' };
      }
      if (
        !(ACT && ACT.guard) &&
        (m.sh === 'one' || m.sh === 'line') &&
        !ignObst(S, u, typ) &&
        coverOf(S, u.pos, t.pos)
      ) {
        noteAdd(`${t.n} est à couvert : −40 %`);
        return { mul: 0.6, libelle: 'À couvert' };
      }
    }
  }
];


// #bOrdre, après la règle d'arène : rendu par React (TopBar.jsx)
}
