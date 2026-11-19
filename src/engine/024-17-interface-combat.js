/* Section d'origine : 17-interface-combat.js */

import { RX } from './004-01-donnees.js';
import { MV } from './005-02-capacites.js';
import { BY, SCEN, WXN } from './009-03-pokemon.js';
import { ITEMS2, PROFILE, isCamp, ownedItems } from './011-05-etat-de-partie.js';
import { arenaSetup, arenaTick } from './013-07-arenes.js';
import { $, RM, attendre, el, gp, hc, hp, tc, toast, zig } from './014-08-outils.js';
import { CROCHETS, crochet } from './015-v4-8-00-crochets.js';
import { go } from './016-09-navigation.js';
import { renderLigue } from './019-12-ligue.js';
import { squad, vBonus } from './020-13-equipe-cartes.js';
import { EMAX, P, affected, byUid, canEveil, endRound, evoOpts, execFoe, foeEvo, hasNx, newBattle, pAct, pDodge, pEveil, pMove, pRelance, preparerEnnemi, preview, reach, startEnemy, targets, uAt, uk } from './021-14-moteur-combat.js';
import { champBuild, duoParts, duoTargets, pCapture, pDuo, previewRun, scenLock } from './022-15-systemes-objets-liens-ia.js';
import { SV, autoSave, queueSave, renderResume } from './025-19-sauvegardes.js';
import { PREF, __set_PREPG, __set_tutoI, applyProgress, renderCoach, renderPrep, sfx, sfxEv, vibe } from './026-20-campagne-tutoriel-son.js';
import { drawObstacles } from './027-21-arene-a-lecran.js';
import { fxReset, playEv } from './028-22-effets-attaque.js';
import { panelRoleInfo } from './029-23-guide-epure.js';
import { AUTO, HPM, RK, rankOf, turnBanner, turnBanners, vsIntro } from './030-24-prestige-mise-en-scene.js';
import { renderWallet } from './035-v4-03-interface.js';
import { tagUnits, tokenArt } from './041-v4-1-01-illustrations.js';
import { rivalBuild, rivalIdx, shinyHue, tdrDraft, tdrRun, tdrTeam } from './043-v4-4-01-aventure-plus.js';
import { acteurCourant, deroulerVitesse, finTourVitesse, ordreChoisi, peutSelectionner } from './044-v4-5-01-moteur-tactique.js';
import { VIV_DESC, VIV_ETAT, teinteHeure, vivantChoisi } from './046-v4-7-01-plateau-vivant.js';
import { tactiqueChoisie } from './047-v4-8-01-tactique.js';
import { defiLancement, defisActifs, mutEntrainement, mutInfo, tailleEquipe } from './048-v4-9-01-rejouabilite.js';
import { caracteresChoisis, desobeissanceChoisie, niveau } from './049-v4-10-01-identite.js';
import { REDIFF } from './050-v4-11-01-monde.js';
import { refreshBattle, evoState } from '../screens/combat/battle/battleStore.js';
import { boardBuild, boardRender, evoSet, tokCl, unitsBatch, unitsDirty } from '../screens/combat/board/boardStore.js';
import { bdClass, bdRejouer, bdReset, hostSet } from '../screens/combat/board/boardStore.js';
import { aXP, bossScen, notesDe } from './053-v4-14-01-resonance.js';
import { resoCand417, scene417, tournoiTeam417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { coopPasse418, joueur418 } from './058-v4-18-01-peche-safari-coop.js';
import { encercle420 } from './060-v4-20-01-combat-intense.js';
import { dl428, rapide428 } from './063-v4-28-01-captures-combat-accueil.js';
import { RIV429, aie429, apres429, hebdoBuild429, hebdoTeam429, lockLeg429, vivRender429, vivTok429 } from './064-v4-29-01-qualite.js';
import { apresRendu430, campOk430, docChoisie430 } from './065-v4-30-01-camp-et-tactique.js';
import { apresRendu431, brouillardChoisi431, progresFixe431, teamFixe431 } from './066-v4-31-01-defis-tactiques.js';
import { apresRendu433, duelPasse433 } from './068-v4-33-01-duel-et-tutoriel.js';
import { calibre434 } from './069-v4-34-01-calibrage-et-evoli.js';
import { annonceGim467 } from './098-4-67-journal-des-exploits-et-plateaux-a-gimmick.js';

export let VERT, MQV, B, LOG, scSel;
export function __set_VERT(v) { return (VERT = v); }
export function __set_B(v) { return (B = v); }
export function __set_LOG(v) { return (LOG = v); }
export function __set_scSel(v) { return (scSel = v); }


export function tiltP(x, y) {
  const T = TILT,
    d = T.Hb - y,
    s = T.f / (T.f + d * T.sn);
  return [T.ox + (T.cx + (x - T.cx) * s) * T.k, T.oy + (T.Hb - d * T.cs * s) * T.k];
}


function tiltU(X, Y) {
  const T = TILT,
    q = T.Hb - (Y - T.oy) / T.k,
    d = (q * T.f) / (T.f * T.cs - q * T.sn),
    s = T.f / (T.f + d * T.sn);
  return [T.cx + ((X - T.ox) / T.k - T.cx) / s, T.Hb - d];
}


/** taille apparente (1 = case à plat) au point écran X,Y */
export function tiltS(X, Y) {
  const g = tiltU(X, Y);
  return (TILT.f / (TILT.f + (TILT.Hb - g[1]) * TILT.sn)) * TILT.k;
}


function tiltHP(X, Y, s) {
  const [x, y] = tiltU(X, Y),
    o = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - (VERT ? 0 : 30)),
      q = tiltP(x + s * Math.cos(a), y + s * Math.sin(a));
    o.push(q[0].toFixed(1) + ',' + q[1].toFixed(1));
  }
  return o.join(' ');
}


function hpf(x, y, s) {
  const o = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i;
    o.push((x + s * Math.cos(a)).toFixed(1) + ',' + (y + s * Math.sin(a)).toFixed(1));
  }
  return o.join(' ');
}


/** Choisit le scénario k (à son propre onglet) et passe à l’écran Combats, pour un launch() qui suit.
 *  Si un combat est encore en cours, la liste des combats n’est pas redessinée (ouvrirCombat le fait).
 *  Les rencontres sauvages, le duel et l’objectif de l’Accueil gardent l’onglet choisi à la main :
 *  ils posent scSel eux-mêmes. */
export function choisirCombat(k) {
  scSel = k;
  __set_PREPG(null);
  go('combat');
}


/** Le joueur demande le combat k : écran Combats sur ce scénario, à l’onglet du scénario. Ne lance pas le combat. */
export function ouvrirCombat(k) {
  choisirCombat(k);
  renderPrep();
}


/** Comme ouvrirCombat, pour une clé venue de l’interface : sans effet si le scénario n’existe pas (encore). */
export function goFight(k) {
  if (SCEN[k]) ouvrirCombat(k);
}


export function challenge(k) {
  ouvrirCombat(k);
  if (!squad.length) {
    toast('Recrutez au moins un Pokémon avant de défier une arène.');
    return;
  }
  launch();
}


export function battleOpts() {
  const items = {};
  squad.slice(0, 4).forEach(id => {
    const b = BY[id].base, // les objets sont tenus par la famille, quel que soit le stade
      it = PROFILE.equip[b];
    if (it && ownedItems().includes(it)) items[b] = it;
  });
  return {
    diff: PROFILE.diff,
    items,
    fatigue: isCamp() ? PROFILE.fatigue : {},
    links: PROFILE.links,
    ordre: ordreChoisi(),
    vivant: vivantChoisi(), // plateau vivant (v4.7-01)
    tactique: tactiqueChoisie(), // Tactique avancée (v4.8-01)
    mut: mutEntrainement(), // mutateur en Entraînement (v4.9-01)
    doc430: docChoisie430(), // doctrine (v4.30)
    fog431: brouillardChoisi431(), // brouillard de guerre (v4.31)
    defis: defisActifs(), // défis de campagne (v4.9-01)
    caracteres: caracteresChoisis(), // caractères (v4.10-01)
    desob: desobeissanceChoisie(),
    dojo: campOk430() ? niveau('dojo') : 0,
    apprises: PROFILE.apprises // CT et CS (v4.6-01)
  };
}


export function launch() {
  for (const f of CROCHETS.refusLancement) {
    const refus = f();
    if (refus) return toast(refus);
  }
  crochet('avantLancement');
  const avant = B;
  // scènes d’histoire (v4.17) : la scène remplace le combat
  if (!scene417(scSel)) {
    __set_tutoI(SCEN[scSel] && SCEN[scSel].tuto ? 0 : -1);
    launchCore();
    if (B && !AUTO)
      vsIntro(); // présentation des adversaires
    else if (B) turnBanner();
    // ordre par Vitesse : si un adversaire est plus rapide, il ouvre la manche (après la présentation)
    if (B && B.ordre === 'vitesse') setTimeout(deroulerVitesse, AUTO || RM ? 950 : PREF.fast ? 1500 : 2400);
  }
  crochet('lancement', !!B && B !== avant);
}


function launchCore() {
  if (!squad.length && !teamFixe431()) return;
  if (scSel === 'hebdo429') hebdoBuild429(); // la semaine a pu changer (v4.29)
  const lk = scenLock(scSel) || lockLeg429(scSel) || (scSel === 'hebdo429' || (SCEN[scSel] || {}).sansProgres431 ? null : defiLancement()); // défis de campagne (v4.9-01), quêtes légendaires (v4.29)
  if (lk) {
    toast(lk);
    renderPrep();
    return;
  }
  if (scSel === 'champ') champBuild();
  if (rivalIdx(scSel) >= 0 || RIV429[scSel]) rivalBuild();
  if (scSel === 'tdr' && !tdrRun()) {
    tdrDraft(); // pas encore d’ascension : on choisit d’abord son équipe
    return;
  }
  const T = scSel === 'tdr' ? tdrTeam() : hebdoTeam429() || teamFixe431() || tournoiTeam417(); // défi de la semaine (v4.29), énigme et Écho profond (v4.31) // Tour de Résonance, tournoi entre amis (v4.17) : l’équipe figée
  B = T
    ? newBattle(scSel, T.team, T.voix, T.opts) // la Tour ignore le budget : seules comptent les Voix gagnées
    : newBattle(scSel, squad.slice(0, tailleEquipe()), vBonus(), battleOpts()); // Équipe de 3 (v4.9-01)
  REDIFF.set(B, { best: null }); // rediffusion du meilleur coup (v4.11-01)
  LOG = [];
  Object.assign(ui, {
    sel: null,
    selE: null,
    mode: null,
    mi: null,
    pk: null,
    pv: null,
    busy: false,
    act: null,
    undo: null,
    tile: null,
    duo: null
  });
  $('#cbPrep').hidden = true;
  $('#cbBattle').hidden = false;
  $('#cbResult').hidden = true;
  $('#evoPick').hidden = true;
  const aev = [...arenaSetup(B), ...annonceGim467(B)];
  buildBoard();
  log(`${SCEN[scSel].n} : à vous de jouer. Touchez un adversaire pour voir sa portée.`, 'sys');
  aev.forEach(x => {
    if (x.e === 'msg') log(x.s, 'arn');
  });
  B.units.forEach(u => {
    if (u.side === 'a' && u.fat) log(`${u.n} est fatigué : −1 Mouvement (un Éveil efface la fatigue).`, 'sys');
    if (u.side === 'a' && u.item) log(`${u.n} tient ${ITEMS2[u.item].n}.`, 'sys');
  });
  if (B.harmonie) log('Harmonie : trois rangs différents dans l’équipe, chaque Pokémon commence avec 1 losange.', 'sys'); // v4.14
  if (bossScen(B)) log('Combat de prestige : vos adversaires accumulent eux aussi la Résonance (notes, attaques Expertes).', 'arn');
  if (B.wx) log(`Météo ${WXN[B.wx.k]} dès le début du combat.`, 'sys');
  if (B.desob) log('Désobéissance : un Pokémon épuisé ou têtu peut ignorer un ordre.', 'sys');
  if (B.mut) log(`Mutateur · ${mutInfo(B.mut)[0]} : ${mutInfo(B.mut)[1]}`, 'arn');
  if (B.sansEveil) log('Défi Sans Éveil : vos Pokémon ne s’éveilleront pas.', 'sys');
  if (B.tac)
    log(
      'Tactique avancée : entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre, Éclaireurs). Lance-Soleil et Vol partent en fin de manche.',
      'sys'
    );
  if (B.units.some(u => u.colosse)) log('Colosse : brisez ses parties pour faire tomber sa carapace. Chacune le fait vaciller.', 'sys');
  if (B.vivant)
    log(`Plateau vivant : ${VIV_ETAT[B.cyc.ph]} (${VIV_DESC[B.cyc.ph]}) Le feu court dans les hautes herbes ; la pluie l’éteint.`, 'sys');
  autoSel();
  renderAll();
  window.scrollTo({ top: 0 });
}


export function backToPrep() {
  if (scSel === 'sauvage') scSel = 'gue'; // une rencontre sauvage ne se relance pas depuis la liste
  B = null;
  $('#cbBattle').hidden = true;
  $('#cbResult').hidden = true;
  $('#evoPick').hidden = true;
  $('#cbPrep').hidden = false;
  renderPrep();
  window.scrollTo({ top: 0 });
  queueSave();
  renderResume();
  renderCoach();
  renderWallet();
}


/* plateau */
// Le SVG est rendu par React (src/screens/combat/board/) : buildBoard remonte tous les calques ;
// L.tiles, L.t[k], L.tx[k], L.units, L.fx, L.fl… sont des références posées par le rendu.
export function buildBoard() {
  crochet('avantPlateau');
  VERT = !!(MQV && MQV.matches);
  const D = SCEN[B.sc],
    bio = D.bio,
    st = ['arene', 'ligue', 'roche'].includes(D.bio) || D.gym != null || !!D.elite || !!D.champ; // terrain des stades (v1.1)
  // classes du conteneur : remises à zéro ici, puis basculées par les versions suivantes
  // (#bBoard est rendu par React : classes et variables dans l'état « host » de boardStore.js)
  bdReset(['board', 'bio-' + bio, ...(VERT ? ['vert'] : [])]);
  hostSet({ ac: D.at ? tc(D.at) : '' });
  L.t = {};
  L.tx = {};
  L.u = {};
  L.uo = []; // ordre des jetons dans le calque (trier() du plateau incliné le change)
  L.txId = { gue: 'tx-grass', roche: 'tx-stone', tour: 'tx-ash', ligue: 'tx-marble', arene: 'tx-rune' }[bio]; // motif des cases
  B.units.forEach(u => {
    L.u[u.uid] = mkTok(u);
    L.uo.push(u.uid);
  });
  boardBuild({ vb: VB(), bio, stadium: st, tilt: TILT.on }); // les jetons (Units.jsx) sont montés avec le plateau
  bdClass('stadium', st);
  fxReset();
  crochet('plateau');
}


/** Modèle d'un jeton (rendu par Units.jsx) : ce que l'ancien DOM portait, dans le même ordre. */
function mkTok(u) {
  const c = ['tok', u.side === 'e' ? 'enemy' : 'ally'];
  if (u.shiny) c.push('shiny');
  if (u.boss) c.push('boss');
  if (u.dom) c.push('dom');
  if (u.seg) c.push('seg');
  if (u.colosse) c.push('colosse');
  return vivTok429({
    uid: u.uid,
    c, // classes du jeton (ordre de classList)
    sh: u.shiny ? shinyHue(u.sp) + 'deg' : null, // --sh
    tr: null, // transform (glissement : transition CSS)
    pc: [null, null, null], // losanges : classe de chaque losange (null : pas d'attribut)
    nc: [null, null, null], // notes de Résonance (v4.14)
    bdc: 'bdg-s',
    bt: '',
    n: ''
  }); // groupe animé (v4.29)
}

// classe « on » seule d'un élément (classList.toggle('on', v)) : null → pas d'attribut, '' → classe vidée
const on1 = (cur, v) => (v ? 'on' : cur === 'on' ? '' : cur);


export function updTok(u) {
  crochet('avantJeton', u);
  updTokCore(u);
  crochet('jeton', u);
  tokenArt(u);
  crochet('illustration', u);
  crochet('apresJeton', u);
}


function updTokCore(u) {
  const T = L.u[u.uid];
  if (!T) return;
  const [x, y] = HC(uk(u));
  T.tr = `translate(${x}px,${y}px)`;
  const c = tc(u.t[0]);
  T.rs = c;
  T.rf = `color-mix(in srgb,${c} 26%,#0F131A)`;
  T.gd = gp(u.t[0]);
  T.gf = c;
  const C = 2 * Math.PI * 16,
    r = u.hp / u.mhp;
  T.ad = `${(C * r).toFixed(1)} ${C.toFixed(1)}`;
  T.as = r > 0.5 ? 'var(--ok)' : r > 0.2 ? 'var(--warn)' : 'var(--bad)';
  T.n = u.n;
  const nx = hasNx(u);
  T.pc = T.pc.map((p, i) => on1(p, i < u.en));
  const cl = (k, v) => tokCl(T, k, v);
  cl('ko', u.ko);
  cl('sel', ui.sel === u.uid || ui.selE === u.uid);
  cl('done', u.side === 'a' && u.acted && !u.ko && B.phase === 'player');
  cl('act', ui.act === u.uid);
  cl('has-en', !u.ko && (u.side === 'a' || B.duel433 ? nx || aXP(u) || resoCand417(B, u) : bossScen(B) && aXP(u))); // v4.14 : losanges des attaques Expertes
  cl('ready', u.side === 'a' && (nx || resoCand417(B, u)) && u.en >= EMAX && !u.ko);
  cl('fres', u.reso > 0 && !u.ko); // Forme Résonante (v4.17)
  cl('cj1', !!B.coop && u.side === 'a' && joueur418(u) === 1); // coop (v4.18)
  cl('cj2', !!B.coop && u.side === 'a' && joueur418(u) === 2);
  cl('cjoff', !!B.coop && u.side === 'a' && joueur418(u) !== B.coop && B.phase === 'player');
  cl('vigil420', !!u.vigil && !u.ko); // v4.20
  cl('enc420', encercle420(B, u));
  cl('ph2', u.phase420 === 2 && !u.ko);
  cl('ph3', u.phase420 === 3 && !u.ko);
  cl('dg420', !u.ko && !!(B.danger420 && B.danger420.k.includes(uk(u)))); // dans une zone annoncée
  cl('evw', foeEvo(B, u));
  cl('evolved', !!u.evo);
  const nN = notesDe(B, u); // notes de Résonance (v4.14)
  T.nc = T.nc.map((p, i) => on1(p, i < nN));
  cl('has-nt', nN > 0 && !u.ko);
  cl('reso', nN >= 3 && !u.ko);
  const b =
    u.badge ||
    (u.vole ? 'VOL' : u.chg ? 'CHARGE' : null) || // attaques chargées (v4.8)
    (u.bru > 0 ? 'BRÛ' : u.psn > 0 ? 'PSN' : u.maudit > 0 ? 'MAUD' : u.requiem > 0 ? 'REQ' : u.root > 0 ? 'RAC' : u.web > 0 ? 'TOILE' : u.aide ? 'AIDE' : u.riposte ? 'RIPO' : u.miroir ? 'MIR' : u.cogno > 0 ? 'x2' : null);
  T.bdc = 'bdg-s' + (b && !u.ko ? ' on st-' + (STC[b] || 'x') : '');
  T.bt = b || '';
  unitsDirty();
}


export function renderBoard() {
  boardRender(); // cases, marques, surbrillances, intentions, obstacles (calques React)
  unitsBatch(() => {
    B.units.forEach(updTok); // jetons (Units.jsx) : redessinés une fois à la fin du lot
    drawObstacles();
  });
  crochet('plateauRendu');
}


/* bandeaux */
export function segHp(u) {
  return CROCHETS.barrePv.reduce((h, f) => f(h, u), segHpBase(u));
}


function segHpBase(u) {
  const h =`<span class="hp hseg"><i class="${hpc(u)}" style="width:${((u.hp / u.mhp) * 100).toFixed(0)}%"></i></span>`;
  // traînée des dégâts récents
  if (!B) return h;
  const r = Math.max(0, (u.hp / u.mhp) * 100),
    now = performance.now(),
    key = u.uid;
  let m = HPM[key];
  if (!m || m.s !== B) {
    HPM[key] = { r, s: B, t0: 0, a: r, b: r };
    return h;
  }
  if (r < m.r - 0.01) {
    const top = now - m.t0 < 800 ? m.a : m.r;
    m.a = Math.max(top, m.r);
    m.b = r;
    m.t0 = now;
  }
  m.r = r;
  const dt = now - m.t0;
  if (dt >= 800) return h;
  return h.replace(
    '<i ',
    `<b class="lag" style="--a:${m.a.toFixed(1)}%;--b:${m.b.toFixed(1)}%;animation-delay:-${dt | 0}ms"></b><i `
  );
}


// Bandeau, synergies, règle d'arène, frise, plaques, barre du bas : rendus par React
// (src/screens/combat/battle). Ici, les effets de bord du rendu, puis la mise à jour.
function renderTop() {
  teinteHeure(B);
  rapide428(); // « Passer » pendant le tour adverse (v4.28) : l'accélération retombe hors du tour adverse
  vivRender429(); // animations, astuces (v4.29)
  refreshBattle('top', 'foot');
  turnBanners();
}


/* panneau */
// Panneau de commande (#bPanel) : rendu par React (src/screens/combat/battle/Panel.jsx).
// Le moteur garde la classe « info-off » du conteneur (panelRoleInfo).
export function renderPanel() {
  panelRoleInfo();
  refreshBattle('panel');
}


/* choix d’évolution : rendu par React (EvoPick.jsx) */
function openEvoPick(u) {
  if (!evoOpts(B, u).length) return;
  evoState.u = u;
  refreshBattle('evo');
  $('#evoPick').hidden = false;
  const f = $('#evoPick .eo');
  if (f) f.focus();
}


/* cinématique d’évolution */
export function cine(fromN, fromT, toN, toT, side, uid) {
  const o = {}; // #evoFx (React) : l'effet part du Pokémon qui évolue
  if (uid && L.u[uid]) {
    const [x, y] = HC(uk(byUid(B, uid)));
    o.ox = ((x / VB()[0]) * 100).toFixed(1) + '%';
    o.oy = ((y / VB()[1]) * 100).toFixed(1) + '%';
  }
  evoSet({ ...o, on: true, fx: { fromN, fromT, toN, toT, side }, fast: !!(PREF.fast || ui.turbo428) });
  ui.cine = true;
  if (B) renderAll();
  sfx('evo');
  vibe([15, 25, 15, 25, 70]);
  return attendre(dl428(650, 1300, 2500)).then(() => {
    evoSet({ on: false, fx: null });
    ui.cine = false;
  });
}


/* journal */
export function log(s, c) {
  LOG.unshift({ s, c: c || '', r: B ? B.round : 1 });
  if (LOG.length > 70) LOG.length = 70;
  renderLog();
}


// Journal (#bLog, #bLogLast) : rendu par React (Log.jsx)
function renderLog() {
  refreshBattle('log');
}


export function renderAll() {
  crochet('avantRendu');
  tagUnits(B); // types → espèce, pour les illustrations
  renderAllCore();
  queueSave();
  renderCoach();
  apresRendu430(); // ciel, déploiement, doctrine (v4.30)
  apresRendu431(); // brouillard, énigme (v4.31)
  apresRendu433(); // duel local (v4.33)
  calibre434(); // combat sur téléphone (v4.34)
  crochet('rendu');
}


function renderAllCore() {
  if (!B) return;
  renderTop(); // avec la frise de l'ordre par Vitesse (v4.5-01)
  renderBoard();
  renderPanel();
}


/* effets */
export function floatAt(k, txt, cls) {
  const [x, y] = HC(k);
  const t = el('text', { class: 'fl ' + cls, x: x.toFixed(1), y: (y - 16).toFixed(1) }, L.fl);
  t.textContent = txt;
  setTimeout(() => t.remove(), 1500);
}


function drawChain(e) {
  const g = el('g', {}, L.fx);
  e.edges.forEach(([a, b, d]) => {
    const A = HC(a),
      C = HC(b),
      pts = zig(A[0], A[1], C[0], C[1], 4, 3.5),
      dl = 0.05 + d * 0.12 + 's';
    el('polyline', { class: 'chainglow ' + e.c, points: pts, style: `--d:${dl}` }, g);
    el('polyline', { class: 'chainseg ' + e.c, points: pts, style: `--d:${dl}` }, g);
  });
  setTimeout(() => g.remove(), 1800);
}


function beam(a, b, typ) {
  if (a === b) return;
  const A = HC(a),
    C = HC(b);
  const l = el(
    'polyline',
    { class: 'beam', points: zig(A[0], A[1], C[0], C[1], 5, 2.5), style: `stroke:${tc(typ)}` },
    L.fx
  );
  setTimeout(() => l.remove(), 700);
}


function burst(uid) {
  const u = byUid(B, uid);
  if (!u) return;
  const [x, y] = HC(uk(u));
  const c = el('circle', { class: 'burst', cx: x, cy: y, r: 10 }, L.fx);
  setTimeout(() => c.remove(), 1100);
}


function arrFx(uid) {
  const u = byUid(B, uid);
  if (!u) return;
  const [x, y] = HC(uk(u)),
    g = el('g', { class: 'arrfx', style: `--c:${tc(u.t[0])}` }, L.fx);
  [0, 1].forEach(i =>
    el(
      'polygon',
      { points: HP(x, y, BG.S * 1.9), style: `animation-delay:${i * 0.22}s`, transform: `rotate(30 ${x} ${y})` },
      g
    )
  );
  setTimeout(() => g.remove(), 1600);
}


function hit(uid) {
  const T = L.u[uid];
  if (T) {
    T.hit = true; // anneau qui clignote (classe « hit » de .tok-ring, Units.jsx)
    unitsDirty();
    setTimeout(() => {
      T.hit = false;
      unitsDirty();
    }, 450);
    aie429(uid); // le Pokémon recule sous le coup (v4.29)
  }
  crochet('touche', uid);
}


export function playLog(ev) {
  ev.forEach(e => {
    if (e.e === 'msg')
      log(e.s, /^Arène /.test(e.s) ? 'arn' : /^(Arrivée|.* évolue en|.* puise)/.test(e.s) ? 'evo' : '');
    else if (e.e === 'dmg') {
      const u = byUid(B, e.u);
      if (u) {
        floatAt(uk(u), '−' + e.v, 'f-dmg');
        hit(e.u);
      }
    } else if (e.e === 'heal') {
      const u = byUid(B, e.u);
      if (u) floatAt(uk(u), '+' + e.v, 'f-heal');
    } else if (e.e === 'rx') {
      floatAt(e.k, RX[e.rx].n, 'f-rx');
    } else if (e.e === 'chain') drawChain(e);
    else if (e.e === 'evo') burst(e.u);
    else if (e.e === 'arena') {
      bdRejouer('shock'); // reste posée jusqu'à la prochaine construction
      bdClass('shock', true);
    } else if (e.e === 'arr') arrFx(e.u);
    else if (e.e === 'ready') {
      const u = byUid(B, e.u);
      if (u && !u.ko) setTimeout(() => floatAt(uk(u), 'Éveil prêt', 'f-ready'), 380);
    } else if (e.e === 'use') {
      const u = byUid(B, e.u);
      if (u && e.k) beam(uk(u), e.k, u.t[0]);
    } else if (e.e === 'catch') {
      const u = byUid(B, e.u);
      if (u) {
        floatAt(uk(u), 'Capturé !', 'f-ready');
        burst(e.u);
      }
    } else if (e.e === 'duo') {
      [e.a, e.b].forEach(arrFx);
    } else if (e.e === 'note') {
      const u = byUid(B, e.u); // notes de Résonance (v4.14)
      if (u && !u.ko) floatAt(uk(u), '♪'.repeat(e.n), 'f-note');
    } else if (e.e === 'reso') {
      const u = byUid(B, e.u);
      if (u) {
        setTimeout(() => floatAt(uk(u), 'Résonance !', 'f-reso'), 260);
        burst(e.u);
      }
    }
  });
  sfxEv(ev);
  crochet('journal', ev);
}


/* interactions */
export function autoSel() {
  const cur = B.ordre === 'vitesse' ? acteurCourant(B) : null, // ordre par Vitesse : l'allié dont c'est le tour
    nx =
      B.ordre === 'vitesse'
        ? cur && cur.side === 'a'
          ? cur
          : null
        : B.units.find(x => x.side === 'a' && !x.ko && !x.acted && (!B.coop || joueur418(x) === B.coop));
  ui.sel = nx ? nx.uid : null;
  ui.selE = null;
  ui.mode = null;
  ui.pv = null;
  ui.pk = null;
}


export function clearAim() {
  ui.mode = null;
  ui.pv = null;
  ui.pk = null;
  ui.duo = null;
}


export function confirmAct() {
  const id = ui.sel;
  confirmActCore();
  const u = B && byUid(B, id);
  if (u && u.hr && !u.ko && !B.over) {
    // l’Éclaireur reste sélectionné : il peut encore se replier
    ui.sel = id;
    renderAll();
  }
  crochet('action', id);
}


function confirmActCore() {
  const u = byUid(B, ui.sel);
  if (!u || ui.pk == null) return;
  ui.undo = null;
  ui.tile = null;
  const ev = ui.mode === 'duo' ? pDuo(B, u, byUid(B, ui.duo), ui.pk) : pAct(B, u, ui.mi, ui.pk);
  clearAim();
  if (!ev) {
    renderAll();
    return;
  }
  renderAll();
  playEv(ev);
  if (B.over) {
    finish();
    return;
  }
  if (B.ordre === 'vitesse') {
    // ordre par Vitesse : l'allié garde la main (Relance, Esquive, repli de l'Éclaireur) jusqu'à « Terminer »
    renderAll();
    return;
  }
  if (u.acted || u.ko) {
    const nx = B.units.find(x => x.side === 'a' && !x.ko && !x.acted);
    if (nx) ui.sel = nx.uid;
  }
  renderAll();
}


function tapTile(k) {
  const u = ui.sel && byUid(B, ui.sel),
    v = uAt(B, k);
  if (u && u.hr && u.acted && !u.moved && !ui.mode && !v && reach(B, u)[k] !== undefined) {
    // Éclaireur : après avoir frappé, une case bleue sert à se replier
    const ev = pMove(B, u, k);
    clearAim();
    ui.tile = null;
    renderAll();
    if (ev) playEv(ev);
    if (u.ko) {
      autoSel();
      renderAll();
    }
    return;
  }
  ui.tile = null;
  if (u && ui.mode === 'duo' && ui.duo) {
    const p = byUid(B, ui.duo);
    if (duoTargets(B, u, p).includes(k)) {
      if (ui.pk === k) {
        confirmAct();
        return;
      }
      ui.pk = k;
      const X = duoParts(B, u, p);
      ui.pv = previewRun(B, C => pDuo(C, byUid(C, u.uid), byUid(C, p.uid), k), [
        ...new Set([...affected(B, X.A, X.D.a, k), ...affected(B, X.Bu, X.D.b, k)])
      ]);
      renderAll();
      return;
    }
  }
  if (u && ui.mode === 'target') {
    const m = MV[u.mv[ui.mi]];
    if (targets(B, u, m).includes(k)) {
      if (ui.pk === k) {
        confirmAct();
        return;
      }
      ui.pk = k;
      ui.pv = preview(B, u.uid, ui.mi, k);
      renderAll();
      return;
    }
  }
  if (u && ui.mode === 'dodge') {
    const ev = pDodge(B, u, k);
    if (ev) {
      ui.undo = null;
      clearAim();
      renderAll();
      playEv(ev);
      return;
    }
  }
  if (v) {
    if (v.side === 'a') {
      if (!peutSelectionner(v)) return;
      ui.sel = v.uid;
      ui.selE = null;
    } else ui.selE = v.uid;
    clearAim();
    renderAll();
    return;
  }
  if (u && !u.moved && !u.acted && reach(B, u)[k] !== undefined) {
    ui.undo = { uid: u.uid, snap: JSON.stringify(B), log: LOG.length };
    const ev = pMove(B, u, k);
    clearAim();
    renderAll();
    if (ev) playEv(ev);
    if (u.ko) {
      autoSel();
      renderAll();
    }
    return;
  }
  clearAim();
  ui.selE = null;
  ui.tile = k;
  renderAll();
}


function endTurn() {
  if (B && B.ordre === 'vitesse') return finTourVitesse(); // ordre par Vitesse : seul l'allié courant a fini (v4.5-01)
  if (!B || ui.busy || B.over || B.phase !== 'player') return;
  if (coopPasse418()) return; // coop : le Joueur 1 passe la main au Joueur 2 (v4.18)
  if (duelPasse433()) return; // duel local : chacun son tour (v4.33)
  ui.busy = true;
  ui.turbo428 = false;
  ui.undo = null;
  ui.tile = null;
  clearAim();
  ui.selE = null;
  log(`Fin de la manche ${B.round} : les adversaires passent à l’action.`, 'sys');
  const order = startEnemy(B),
    S0 = B;
  renderAll();
  let i = 0;
  const step = async () => {
    if (!B || B !== S0) return;
    if (B.over) {
      finish();
      return;
    }
    if (i >= order.length) {
      finDeManche(S0);
      return;
    }
    const uid = order[i++],
      e = byUid(B, uid);
    if (!e || e.ko) {
      step();
      return;
    }
    ui.act = uid;
    if (await placerEnnemi(S0, uid)) return; // v4.12 : il se place d'abord, sous vos yeux
    const ev = execFoe(B, uid);
    renderAll();
    playEv(ev);
    setTimeout(step, dl428(200, 380, 900));
  };
  setTimeout(step, dl428(60, 160, 420));
}


/** v4.12 : déplacement de l'adversaire avant son attaque. Renvoie true si le combat a changé entre-temps. */
export async function placerEnnemi(S0, uid) {
  if (!B || !B.jit) return false;
  const pre = preparerEnnemi(B, uid);
  if (!pre.length) return false;
  renderAll();
  playEv(pre);
  if (pre.some(x => x.e === 'mv')) await new Promise(r => setTimeout(r, dl428(60, 240, 460)));
  return !B || B !== S0;
}


/** Fin de manche (les deux modes) : effets de manche, règle d'arène, évolutions adverses, nouvelles annonces.
    Renvoie true si le combat continue. */
export async function finDeManche(S0) {
  ui.act = null;
  const ev = endRound(B);
  if (!B.over) arenaTick(B).forEach(x => ev.push(x));
  for (const x of ev.filter(x => x.e === 'evo')) {
    renderAll();
    await cine(x.from, x.ft, x.to, x.tt, x.side, x.u);
    if (B !== S0) return false;
  }
  ui.busy = false;
  renderAll();
  playEv(ev);
  if (B.over) {
    finish();
    return false;
  }
  log(`Manche ${B.round} : à vous de jouer.`, 'sys');
  autoSel();
  renderAll();
  return true;
}


export function finish() {
  crochet('avantFinCombat');
  // rang du combat
  if (B && B.over && !B._rk) {
    B._rk = 1;
    const r = rankOf(B);
    B.rank = r;
    if (r && SCEN[B.sc] && B.sc !== 'sauvage' && !SCEN[B.sc].sansProgres431) {
      PROFILE.ranks = PROFILE.ranks || {};
      const o = PROFILE.ranks[B.sc];
      B.rankNew = !o || RK.indexOf(r) > RK.indexOf(o);
      if (B.rankNew) PROFILE.ranks[B.sc] = r;
      queueSave();
    }
  }
  // statistiques et progression
  if (B && B.over && !B._counted) {
    B._counted = true;
    if ((SCEN[B.sc] || {}).sansProgres431) {
      // énigme, arène personnalisée, Écho profond : ni compteurs ni progression ordinaire (v4.31)
      SV.lastBattle = null;
      B.rew = progresFixe431(B);
    } else {
      PROFILE.battles++;
      if (B.over === 'win') PROFILE.wins++;
      else if (!B.fuite416) PROFILE.losses++; // une bête qui s’enfuit n’est pas une défaite (v4.16)
      PROFILE.evos += B.stats.evo || 0;
      PROFILE.rx += B.stats.rx || 0;
      PROFILE.kos += B.stats.ko || 0;
      SV.lastBattle = null;
      B.rew = applyProgress(B);
    }
  }
  ui.busy = false;
  ui.act = null;
  renderAll();
  setTimeout(
    () => {
      if (!B) return;
      const win = B.over === 'win';
      if (SCEN[B.sc].gym != null) renderLigue();
      sfx(win ? 'win' : 'lose');
      refreshBattle('result'); // fiche de résultat, rang et citation (v2.4), Nuzlocke, victoire : Result.jsx
      $('#cbResult').hidden = false;
      apres429(B.sc, win); // scène d’après-combat (v4.29)
      const f = $('#cbResult [data-res="again"]');
      if (f) f.focus();
    },
    RM ? 0 : 900
  );
  setTimeout(() => autoSave(true), RM ? 50 : 1200);
  crochet('finCombat');
}

/* ===================== INTERFACE DE COMBAT v0.8 ===================== */
export const BG = { S: 27, OX: 20, OY: 22 };


export const VB = () => (VERT ? [286, 430] : [430, 286]);


/* v4.77 · plateau incliné : HC et HP renvoient des points vus en perspective quand TILT.on.
   Sol = coordonnées d'origine du viewBox ; écran = sol incliné de TILT.a puis recadré. */
export const TILT = { on: false };


export const HC0 = k => {
  const p = P(k),
    q = hc(p[0], p[1], BG.S, BG.OX, BG.OY);
  return VERT ? [q[1], 430 - q[0]] : q;
};


export const HC = k => (TILT.on ? tiltP(...HC0(k)) : HC0(k));


export const HP = (x, y, s) => (TILT.on ? tiltHP(x, y, s) : VERT ? hpf(x, y, s) : hp(x, y, s));


export const ui = { sel: null, selE: null, mode: null, mi: null, pk: null, pv: null, busy: false, act: null, cine: false };


export const L = {};


export const hpc = u => {
  const r = u.hp / u.mhp;
  return r > 0.5 ? '' : r > 0.2 ? 'mid' : 'lo';
};


export const DIA = 'M0 -3.4 2.5 0 0 3.4 -2.5 0Z';


export const STC = { PAR: 'par', GEL: 'gel', SOM: 'som', REC: 'rec', BRÛ: 'bru', RAC: 'rac', TOILE: 'toile', CHARGE: 'chg', VOL: 'vol', PSN: 'psn', AIDE: 'aide', MAUD: 'maud', REQ: 'req', RIPO: 'ripo', MIR: 'ripo', x2: 'aide' };


export const enPips = (n, cls = '') =>
  `<span class="enp ${cls}" aria-label="Énergie d’Éveil ${n} sur 3">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;


export const poly = (k, c) => {
  const [x, y] = HC(k),
    pt = HP(x, y, BG.S - 3);
  return `<polygon points="${pt}" class="${c} gw"/><polygon points="${pt}" class="${c}"/>`;
};

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

VERT = false;


MQV = window.matchMedia ? matchMedia('(max-width: 700px)') : null;


if (MQV) {
  const onMQ = () => {
    if (B && !$('#cbBattle').hidden && VERT !== MQV.matches) {
      buildBoard();
      renderAll();
    }
  };
  MQV.addEventListener ? MQV.addEventListener('change', onMQ) : MQV.addListener(onMQ);
}


B = null,
  LOG = [],
  scSel = 'gue';


$('#scenList').addEventListener('click', e => {
  const b = e.target.closest('[data-sc]');
  if (!b) return;
  scSel = b.dataset.sc;
  renderPrep();
});


$('#bLaunch').addEventListener('click', () => launch());


$('#evoPick').addEventListener('click', async e => {
  const b = e.target.closest('[data-pick]');
  if (!b) {
    if (e.target.id === 'evoPick') $('#evoPick').hidden = true;
    return;
  }
  $('#evoPick').hidden = true;
  const id = b.dataset.pick,
    u = ui.sel && byUid(B, ui.sel);
  if (!id || !u || !canEveil(B, u)) return;
  ui.undo = null;
  const E = BY[id];
  ui.busy = true;
  clearAim();
  renderAll();
  await cine(u.n, u.t, E.n, E.t, 'a', u.uid);
  const ev = pEveil(B, u, id);
  ui.busy = false;
  if (!ev) {
    renderAll();
    return;
  }
  renderAll();
  playEv(ev);
  if (B.over) {
    finish();
    return;
  }
  toast(
    `${E.n} entre en jeu. ${B.voix >= 2 && !B.relance ? 'Relance (2 Voix) pour utiliser ses capacités tout de suite.' : ''}`
  );
  renderAll();
});


document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#evoPick').hidden) $('#evoPick').hidden = true;
});


$('#bSvg').addEventListener('click', e => {
  const p = e.target.closest('[data-k]');
  if (!p || !B || ui.busy || B.over || B.phase !== 'player') return;
  tapTile(p.dataset.k);
});


$('#bPanel').addEventListener('click', e => {
  const b = e.target.closest('button');
  if (!b || !B || ui.busy || B.over) return;
  const u = ui.sel && byUid(B, ui.sel);
  if (b.dataset.fc) {
    ui.selE = null;
    renderAll();
    return;
  }
  if (b.dataset.tile) {
    ui.tile = null;
    renderAll();
    return;
  }
  if (b.dataset.undo && ui.undo) {
    const U = ui.undo;
    ui.undo = null;
    B = JSON.parse(U.snap);
    LOG.splice(0, Math.max(0, LOG.length - U.log));
    renderLog();
    clearAim();
    ui.sel = U.uid;
    renderAll();
    sfx('ui');
    return;
  }
  if (b.dataset.cap) {
    const al = byUid(B, ui.sel),
      e = byUid(B, b.dataset.cap);
    const ev = pCapture(B, al, e);
    if (ev) {
      ui.undo = null;
      ui.selE = null;
      renderAll();
      playEv(ev);
      if (B.over) {
        finish();
        return;
      }
      autoSel();
      renderAll();
    }
    return;
  }
  if (b.dataset.duo && u) {
    if (ui.mode === 'duo' && ui.duo === b.dataset.duo) clearAim();
    else {
      clearAim();
      ui.mode = 'duo';
      ui.duo = b.dataset.duo;
    }
    renderAll();
    return;
  }
  if (b.dataset.evo === 'open' && u) {
    if (canEveil(B, u)) openEvoPick(u);
    return;
  }
  if (b.dataset.mi != null && u) {
    const i = +b.dataset.mi;
    if (ui.mode === 'target' && ui.mi === i) clearAim();
    else {
      ui.mode = 'target';
      ui.mi = i;
      ui.pk = null;
      ui.pv = null;
      const m = MV[u.mv[i]];
      if (m.sh === 'self' || m.sh === 'ring') {
        ui.pk = uk(u);
        ui.pv = preview(B, u.uid, i, ui.pk);
      }
    }
    renderAll();
    return;
  }
  if (b.dataset.pv === 'ok') {
    confirmAct();
    return;
  }
  if (b.dataset.pv === 'no') {
    clearAim();
    renderAll();
    return;
  }
  if (b.dataset.vx === 'dodge' && u) {
    ui.mode = ui.mode === 'dodge' ? null : 'dodge';
    ui.pv = null;
    ui.pk = null;
    renderAll();
    return;
  }
  if (b.dataset.vx === 'relance' && u) {
    const ev = pRelance(B, u);
    if (ev) {
      ui.undo = null;
      renderAll();
      playEv(ev);
    }
    return;
  }
});


['#bPlE', '#bPlA'].forEach(s =>
  $(s).addEventListener('click', e => {
    const b = e.target.closest('[data-u]');
    if (!b || !B || ui.busy || B.over) return;
    const u = byUid(B, b.dataset.u);
    if (!u || u.ko) return;
    if (u.side === 'a') {
      if (!peutSelectionner(u)) return;
      ui.sel = u.uid;
      ui.selE = null;
    } else ui.selE = u.uid;
    clearAim();
    renderAll();
  })
);


$('#bEnd').addEventListener('click', endTurn);


$('#bQuit').addEventListener('click', () => {
  if (ui.busy) return;
  backToPrep();
});


$('#cbResult').addEventListener('click', e => {
  const b = e.target.closest('[data-res]');
  if (!b) return;
  if (b.dataset.res === 'again') {
    $('#cbResult').hidden = true;
    launch();
  } else if (b.dataset.res === 'ligue') {
    backToPrep();
    go('ligue');
  } else backToPrep();
});
}
