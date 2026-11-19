import { RX } from '../data/game-data.js';
import { MV } from '../data/moves.js';
import { BY, SCEN, WXN } from '../pokemon/pokemon.js';
import { ITEMS2, PROFILE, isCamp, ownedItems } from '../state/game-state.js';
import { arenaSetup, arenaTick } from '../modes/gyms.js';
import { $, RM, wait, el, gp, hc, hp, tc, toast, zig } from '../core/utils.js';
import { HOOKS, hook } from '../core/hooks.js';
import { go } from '../core/navigation.js';
import { renderLeague } from '../modes/league.js';
import { squad, vBonus } from '../team/team.js';
import {
  EMAX,
  P,
  affected,
  byUid,
  canAwaken,
  endRound,
  evoOpts,
  execFoe,
  foeEvo,
  hasNx,
  newBattle,
  pAct,
  pDodge,
  pAwaken,
  pMove,
  pReroll,
  prepareEnemy,
  preview,
  reach,
  startEnemy,
  targets,
  uAt,
  uk,
} from './engine.js';
import { champBuild, duoParts, duoTargets, pCapture, pDuo, previewRun, scenLock } from './items-bonds-ai.js';
import { SV, autoSave, queueSave, renderSummary } from '../state/saves.js';
import {
  PREF,
  __set_PREPG,
  __set_tutorialI,
  applyProgress,
  renderCoach,
  renderPrep,
  sfx,
  sfxEv,
  vibe,
} from '../progression/campaign.js';
import { drawObstacles } from '../modes/gym-screen.js';
import { fxReset, playEv } from './move-effects.js';
import { panelRoleInfo } from '../ui/guide.js';
import { AUTO, HPM, RK, rankOf, turnBanner, turnBanners, vsIntro } from '../progression/prestige.js';
import { renderWallet } from '../core/interface.js';
import { tagUnits, tokenArt } from '../assets/illustrations.js';
import { rivalBuild, rivalIdx, shinyHue, towerDraft, towerRun, towerTeam } from '../modes/adventure.js';
import { currentActor, unrollSpeed, endTurnSpeed, chosenOrder, canSelect } from './tactical-engine.js';
import { LIVING_DESC, LIVING_STATE, hourTint, chosenAlive } from './living-board.js';
import { chosenTactic } from './tactics.js';
import {
  challengeLaunch,
  activeChallenges,
  mutTraining,
  mutInfo,
  teamSize,
} from '../progression/achievements-challenges.js';
import { charactersChosen, disobedienceChosen, level } from '../team/identity.js';
import { REPLAYS } from '../world/seasons.js';
import { refreshBattle, evoState } from '../../screens/combat/battle/battleStore.js';
import {
  bdClass,
  bdReplay,
  bdReset,
  boardBuild,
  boardRender,
  evoSet,
  hostSet,
  tokCl,
  unitsBatch,
  unitsDirty,
} from '../../screens/combat/board/boardStore.js';
import { hasXp, bossScene, notesOf } from './resonance.js';
import { resonanceCandidate, storyScene, tournamentTeam } from '../progression/companions.js';
import { coopPassTurn, coopPlayer } from '../modes/fishing-safari-coop.js';
import { isSurrounded } from './intensity.js';
import { battleDelay, endSkipSpeedup } from './catches.js';
import {
  RIVAL_CHALLENGES,
  hurtFlash,
  afterBattleScene,
  buildWeeklyChallenge,
  weeklyTeam,
  lockLegendaryCapture,
  liveRender,
  liveToken,
} from '../progression/quality.js';
import { afterRenderTactics, campOpen, chosenDoctrine } from '../progression/camp.js';
import { afterRenderFog, chosenFog, noProgressResult, fixedTeam } from '../modes/tactical-challenges.js';
import { afterRenderDuel, duelPassTurn } from '../modes/duel.js';
import { fitPhoneBattle } from '../pokemon/eevee.js';
import { announceGimmick } from '../modes/feats-gimmicks.js';

export let VERT, MQV, B, LOG, scSel;
export function __set_GREEN(v) {
  return (VERT = v);
}
export function __set_B(v) {
  return (B = v);
}
export function __set_LOG(v) {
  return (LOG = v);
}
export function __set_scSel(v) {
  return (scSel = v);
}

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

/** apparent size (1 = flat tile) at screen point X,Y */
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

/** Picks scenario k (on its own tab) and switches to the Battles screen, for a launch() that follows.
 *  If a battle is still running, the battle list is not redrawn (openBattle does it).
 *  Wild encounters, the duel and the Home objective keep the manually chosen tab:
 *  they set scSel themselves. */
export function chooseBattle(k) {
  scSel = k;
  __set_PREPG(null);
  go('combat');
}

/** The player requests battle k: Battles screen on that scenario, at the scenario's tab. Does not start the battle. */
export function openBattle(k) {
  chooseBattle(k);
  renderPrep();
}

/** Like openBattle, for a key coming from the interface: no effect if the scenario does not exist (yet). */
export function goFight(k) {
  if (SCEN[k]) {
    openBattle(k);
  }
}

export function challenge(k) {
  openBattle(k);
  if (!squad.length) {
    toast('Recrutez au moins un Pokémon avant de défier une arène.');
    return;
  }
  launch();
}

export function battleOpts() {
  const items = {};
  squad.slice(0, 4).forEach(id => {
    const b = BY[id].base, // held items belong to the family, whatever the stage
      it = PROFILE.equipment[b];
    if (it && ownedItems().includes(it)) {
      items[b] = it;
    }
  });
  return {
    diff: PROFILE.diff,
    items,
    fatigue: isCamp() ? PROFILE.fatigue : {},
    links: PROFILE.links,
    order: chosenOrder(),
    livingBoard: chosenAlive(), // living board (v4.7-01)
    tactics: chosenTactic(), // Advanced Tactics (v4.8-01)
    mut: mutTraining(), // mutator in Training (v4.9-01)
    doctrineChoice: chosenDoctrine(), // doctrine (v4.30)
    fogOfWar: chosenFog(), // fog of war (v4.31)
    challenges: activeChallenges(), // campaign challenges (v4.9-01)
    characters: charactersChosen(), // characters (v4.10-01)
    disobedience: disobedienceChosen(),
    dojo: campOpen() ? level('dojo') : 0,
    learnedTms: PROFILE.learnedTms, // CT et CS (v4.6-01)
  };
}

export function launch() {
  for (const f of HOOKS.launchRefusal) {
    const refusal = f();
    if (refusal) {
      return toast(refusal);
    }
  }
  hook('beforeLaunch');
  const previous = B;
  // story scenes (v4.17): the scene replaces the battle
  if (!storyScene(scSel)) {
    __set_tutorialI(SCEN[scSel] && SCEN[scSel].tuto ? 0 : -1);
    launchCore();
    if (B && !AUTO) {
      vsIntro();
    } // opponent introduction
    else if (B) {
      turnBanner();
    }
    // Speed order: if an opponent is faster, it opens the round (after the introduction)
    if (B && B.order === 'vitesse') {
      setTimeout(unrollSpeed, AUTO || RM ? 950 : PREF.fast ? 1500 : 2400);
    }
  }
  hook('launch', !!B && B !== previous);
}

function launchCore() {
  if (!squad.length && !fixedTeam()) {
    return;
  }
  if (scSel === 'hebdo429') {
    buildWeeklyChallenge();
  } // the week may have changed (v4.29)
  const lk =
    scenLock(scSel) ||
    lockLegendaryCapture(scSel) ||
    (scSel === 'hebdo429' || (SCEN[scSel] || {}).noProgress ? null : challengeLaunch()); // campaign challenges (v4.9-01), legendary quests (v4.29)
  if (lk) {
    toast(lk);
    renderPrep();
    return;
  }
  if (scSel === 'champ') {
    champBuild();
  }
  if (rivalIdx(scSel) >= 0 || RIVAL_CHALLENGES[scSel]) {
    rivalBuild();
  }
  if (scSel === 'tdr' && !towerRun()) {
    towerDraft(); // no ascent yet: choose your team first
    return;
  }
  const T = scSel === 'tdr' ? towerTeam() : weeklyTeam() || fixedTeam() || tournamentTeam(); // weekly challenge (v4.29), riddle and Deep Echo (v4.31) // Resonance Tower, tournament between friends (v4.17): the team is frozen
  B = T
    ? newBattle(scSel, T.team, T.voice, T.opts) // the Tower ignores the budget: only the Voices earned count
    : newBattle(scSel, squad.slice(0, teamSize()), vBonus(), battleOpts()); // Team of 3 (v4.9-01)
  REPLAYS.set(B, { best: null }); // best-move replay (v4.11-01)
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
    duo: null,
  });
  $('#cbPrep').hidden = true;
  $('#cbBattle').hidden = false;
  $('#cbResult').hidden = true;
  $('#evoPick').hidden = true;
  const aev = [...arenaSetup(B), ...announceGimmick(B)];
  buildBoard();
  log(`${SCEN[scSel].n} : à vous de jouer. Touchez un adversaire pour voir sa portée.`, 'sys');
  aev.forEach(x => {
    if (x.e === 'msg') {
      log(x.s, 'arn');
    }
  });
  B.units.forEach(u => {
    if (u.side === 'a' && u.fat) {
      log(`${u.n} est fatigué : −1 Mouvement (un Éveil efface la fatigue).`, 'sys');
    }
    if (u.side === 'a' && u.item) {
      log(`${u.n} tient ${ITEMS2[u.item].n}.`, 'sys');
    }
  });
  if (B.harmonie) {
    log('Harmonie : trois rangs différents dans l’équipe, chaque Pokémon commence avec 1 losange.', 'sys');
  } // v4.14
  if (bossScene(B)) {
    log('Combat de prestige : vos adversaires accumulent eux aussi la Résonance (notes, attaques Expertes).', 'arn');
  }
  if (B.wx) {
    log(`Météo ${WXN[B.wx.k]} dès le début du combat.`, 'sys');
  }
  if (B.disobedience) {
    log('Désobéissance : un Pokémon épuisé ou têtu peut ignorer un ordre.', 'sys');
  }
  if (B.mut) {
    log(`Mutateur · ${mutInfo(B.mut)[0]} : ${mutInfo(B.mut)[1]}`, 'arn');
  }
  if (B.sansEveil) {
    log('Défi Sans Éveil : vos Pokémon ne s’éveilleront pas.', 'sys');
  }
  if (B.tac) {
    log(
      'Tactique avancée : entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre, Éclaireurs). Lance-Soleil et Vol partent en fin de manche.',
      'sys'
    );
  }
  if (B.units.some(u => u.colossus)) {
    log('Colosse : brisez ses parties pour faire tomber sa carapace. Chacune le fait vaciller.', 'sys');
  }
  if (B.livingBoard) {
    log(
      `Plateau vivant : ${LIVING_STATE[B.cycle.ph]} (${LIVING_DESC[B.cycle.ph]}) Le feu court dans les hautes herbes ; la pluie l’éteint.`,
      'sys'
    );
  }
  autoSel();
  renderAll();
  window.scrollTo({ top: 0 });
}

export function backToPrep() {
  if (scSel === 'sauvage') {
    scSel = 'gue';
  } // a wild encounter cannot be relaunched from the list
  B = null;
  $('#cbBattle').hidden = true;
  $('#cbResult').hidden = true;
  $('#evoPick').hidden = true;
  $('#cbPrep').hidden = false;
  renderPrep();
  window.scrollTo({ top: 0 });
  queueSave();
  renderSummary();
  renderCoach();
  renderWallet();
}

/* board */
// The SVG is rendered by React (src/screens/combat/board/): buildBoard remounts all the layers;
// L.tiles, L.t[k], L.tx[k], L.units, L.fx, L.fl… are references set by the render.
export function buildBoard() {
  hook('beforeBoard');
  VERT = !!(MQV && MQV.matches);
  const D = SCEN[B.sc],
    bio = D.bio,
    st = ['arene', 'ligue', 'roche'].includes(D.bio) || D.gym != null || !!D.elite || !!D.champ; // stadium terrain (v1.1)
  // container classes: reset here, then toggled by later versions
  // (#bBoard is rendered by React: classes and variables live in the « host » state of boardStore.js)
  bdReset(['board', 'bio-' + bio, ...(VERT ? ['vert'] : [])]);
  hostSet({ ac: D.at ? tc(D.at) : '' });
  L.t = {};
  L.tx = {};
  L.u = {};
  L.uo = []; // token order in the layer (the tilted board's sort() changes it)
  L.txId = { gue: 'tx-grass', roche: 'tx-stone', tour: 'tx-ash', ligue: 'tx-marble', arene: 'tx-rune' }[bio]; // tile pattern
  B.units.forEach(u => {
    L.u[u.uid] = mkTok(u);
    L.uo.push(u.uid);
  });
  boardBuild({ vb: VB(), bio, stadium: st, tilt: TILT.on }); // the tokens (Units.jsx) are mounted with the board
  bdClass('stadium', st);
  fxReset();
  hook('boardBuilt');
}

/** Token model (rendered by Units.jsx): what the old DOM carried, in the same order. */
function mkTok(u) {
  const c = ['tok', u.side === 'e' ? 'enemy' : 'ally'];
  if (u.shiny) {
    c.push('shiny');
  }
  if (u.boss) {
    c.push('boss');
  }
  if (u.dom) {
    c.push('dom');
  }
  if (u.seg) {
    c.push('seg');
  }
  if (u.colossus) {
    c.push('colosse');
  }
  return liveToken({
    uid: u.uid,
    c, // token classes (classList order)
    sh: u.shiny ? shinyHue(u.sp) + 'deg' : null, // --sh
    tr: null, // transform (sliding: CSS transition)
    pc: [null, null, null], // diamonds: class of each diamond (null: no attribute)
    nc: [null, null, null], // Resonance notes (v4.14)
    bdc: 'bdg-s',
    bt: '',
    n: '',
  }); // animated group (v4.29)
}

// lone « on » class of an element (classList.toggle('on', v)): null → no attribute, '' → emptied class
const on1 = (cur, v) => (v ? 'on' : cur === 'on' ? '' : cur);

export function updTok(u) {
  hook('beforeToken', u);
  updTokCore(u);
  hook('token', u);
  tokenArt(u);
  hook('illustration', u);
  hook('afterToken', u);
}

function updTokCore(u) {
  const T = L.u[u.uid];
  if (!T) {
    return;
  }
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
  cl(
    'has-en',
    !u.ko && (u.side === 'a' || B.duel433 ? nx || hasXp(u) || resonanceCandidate(B, u) : bossScene(B) && hasXp(u))
  ); // v4.14: diamonds of Expert attacks
  cl('ready', u.side === 'a' && (nx || resonanceCandidate(B, u)) && u.en >= EMAX && !u.ko);
  cl('fres', u.resonant > 0 && !u.ko); // Resonant Form (v4.17)
  cl('cj1', !!B.coop && u.side === 'a' && coopPlayer(u) === 1); // co-op (v4.18)
  cl('cj2', !!B.coop && u.side === 'a' && coopPlayer(u) === 2);
  cl('cjoff', !!B.coop && u.side === 'a' && coopPlayer(u) !== B.coop && B.phase === 'player');
  cl('vigil-strike', !!u.vigilance && !u.ko); // v4.20
  cl('encircled', isSurrounded(B, u));
  cl('ph2', u.bossPhase === 2 && !u.ko);
  cl('ph3', u.bossPhase === 3 && !u.ko);
  cl('in-danger', !u.ko && !!(B.dangerZone && B.dangerZone.k.includes(uk(u)))); // inside an announced zone
  cl('evw', foeEvo(B, u));
  cl('evolved', !!u.evo);
  const nN = notesOf(B, u); // Resonance notes (v4.14)
  T.nc = T.nc.map((p, i) => on1(p, i < nN));
  cl('has-nt', nN > 0 && !u.ko);
  cl('reso', nN >= 3 && !u.ko);
  const b =
    u.badge ||
    (u.vole ? 'VOL' : u.chg ? 'CHARGE' : null) || // charged attacks (v4.8)
    (u.burn > 0
      ? 'BRÛ'
      : u.poisoned > 0
        ? 'PSN'
        : u.maudit > 0
          ? 'MAUD'
          : u.requiem > 0
            ? 'REQ'
            : u.root > 0
              ? 'RAC'
              : u.web > 0
                ? 'TOILE'
                : u.aide
                  ? 'AIDE'
                  : u.riposte
                    ? 'RIPO'
                    : u.miroir
                      ? 'MIR'
                      : u.cogno > 0
                        ? 'x2'
                        : null);
  T.bdc = 'bdg-s' + (b && !u.ko ? ' on st-' + (STC[b] || 'x') : '');
  T.bt = b || '';
  unitsDirty();
}

export function renderBoard() {
  boardRender(); // tiles, marks, highlights, intents, obstacles (React layers)
  unitsBatch(() => {
    B.units.forEach(updTok); // tokens (Units.jsx): redrawn once at the end of the batch
    drawObstacles();
  });
  hook('boardRendered');
}

/* banners */
export function segHp(u) {
  return HOOKS.hpBar.reduce((h, f) => f(h, u), segHpBase(u));
}

function segHpBase(u) {
  const h = `<span class="hp hseg"><i class="${hpc(u)}" style="width:${((u.hp / u.mhp) * 100).toFixed(0)}%"></i></span>`;
  // trail of recent damage
  if (!B) {
    return h;
  }
  const r = Math.max(0, (u.hp / u.mhp) * 100),
    now = performance.now(),
    key = u.uid;
  const m = HPM[key];
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
  if (dt >= 800) {
    return h;
  }
  return h.replace(
    '<i ',
    `<b class="lag" style="--a:${m.a.toFixed(1)}%;--b:${m.b.toFixed(1)}%;animation-delay:-${dt | 0}ms"></b><i `
  );
}

// Banner, synergies, arena rule, timeline, plates, bottom bar: rendered by React
// (src/screens/combat/battle). Here, the render's side effects, then the update.
function renderTop() {
  hourTint(B);
  endSkipSpeedup(); // « Passer » (Skip) during the opponent's turn (v4.28): the speed-up ends outside the opponent's turn
  liveRender(); // animations, tips (v4.29)
  refreshBattle('top', 'foot');
  turnBanners();
}

/* panel */
// Command panel (#bPanel): rendered by React (src/screens/combat/battle/Panel.jsx).
// The engine keeps the container's « info-off » class (panelRoleInfo).
export function renderPanel() {
  panelRoleInfo();
  refreshBattle('panel');
}

/* evolution choice: rendered by React (EvoPick.jsx) */
function openEvoPick(u) {
  if (!evoOpts(B, u).length) {
    return;
  }
  evoState.u = u;
  refreshBattle('evo');
  $('#evoPick').hidden = false;
  const f = $('#evoPick .eo');
  if (f) {
    f.focus();
  }
}

/* evolution cutscene */
export function cinematic(fromN, fromT, toN, toT, side, uid) {
  const o = {}; // #evoFx (React): the effect starts from the evolving Pokémon
  if (uid && L.u[uid]) {
    const [x, y] = HC(uk(byUid(B, uid)));
    o.ox = ((x / VB()[0]) * 100).toFixed(1) + '%';
    o.oy = ((y / VB()[1]) * 100).toFixed(1) + '%';
  }
  evoSet({ ...o, on: true, fx: { fromN, fromT, toN, toT, side }, fast: !!(PREF.fast || ui.skipSpeedup) });
  ui.cutscene = true;
  if (B) {
    renderAll();
  }
  sfx('evo');
  vibe([15, 25, 15, 25, 70]);
  return wait(battleDelay(650, 1300, 2500)).then(() => {
    evoSet({ on: false, fx: null });
    ui.cutscene = false;
  });
}

/* log */
export function log(s, c) {
  LOG.unshift({ s, c: c || '', r: B ? B.round : 1 });
  if (LOG.length > 70) {
    LOG.length = 70;
  }
  renderLog();
}

// Log (#bLog, #bLogLast): rendered by React (Log.jsx)
function renderLog() {
  refreshBattle('log');
}

export function renderAll() {
  hook('beforeRender');
  tagUnits(B); // types → species, for the illustrations
  renderAllCore();
  queueSave();
  renderCoach();
  afterRenderTactics(); // sky, deployment, doctrine (v4.30)
  afterRenderFog(); // fog, riddle (v4.31)
  afterRenderDuel(); // local duel (v4.33)
  fitPhoneBattle(); // battle on phone (v4.34)
  hook('rendered');
}

function renderAllCore() {
  if (!B) {
    return;
  }
  renderTop(); // with the Speed-order timeline (v4.5-01)
  renderBoard();
  renderPanel();
}

/* effects */
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
  if (a === b) {
    return;
  }
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
  if (!u) {
    return;
  }
  const [x, y] = HC(uk(u));
  const c = el('circle', { class: 'burst', cx: x, cy: y, r: 10 }, L.fx);
  setTimeout(() => c.remove(), 1100);
}

function arrFx(uid) {
  const u = byUid(B, uid);
  if (!u) {
    return;
  }
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
    T.hit = true; // blinking ring (« hit » class of .tok-ring, Units.jsx)
    unitsDirty();
    setTimeout(() => {
      T.hit = false;
      unitsDirty();
    }, 450);
    hurtFlash(uid); // the Pokémon recoils from the blow (v4.29)
  }
  hook('hit', uid);
}

export function playLog(ev) {
  ev.forEach(e => {
    if (e.e === 'msg') {
      log(e.s, /^Arène /.test(e.s) ? 'arn' : /^(Arrivée|.* évolue en|.* puise)/.test(e.s) ? 'evo' : '');
    } else if (e.e === 'dmg') {
      const u = byUid(B, e.u);
      if (u) {
        floatAt(uk(u), '−' + e.v, 'f-dmg');
        hit(e.u);
      }
    } else if (e.e === 'heal') {
      const u = byUid(B, e.u);
      if (u) {
        floatAt(uk(u), '+' + e.v, 'f-heal');
      }
    } else if (e.e === 'rx') {
      floatAt(e.k, RX[e.rx].n, 'f-rx');
    } else if (e.e === 'chain') {
      drawChain(e);
    } else if (e.e === 'evo') {
      burst(e.u);
    } else if (e.e === 'arena') {
      bdReplay('shock'); // stays in place until the next build
      bdClass('shock', true);
    } else if (e.e === 'arr') {
      arrFx(e.u);
    } else if (e.e === 'ready') {
      const u = byUid(B, e.u);
      if (u && !u.ko) {
        setTimeout(() => floatAt(uk(u), 'Éveil prêt', 'f-ready'), 380);
      }
    } else if (e.e === 'use') {
      const u = byUid(B, e.u);
      if (u && e.k) {
        beam(uk(u), e.k, u.t[0]);
      }
    } else if (e.e === 'catch') {
      const u = byUid(B, e.u);
      if (u) {
        floatAt(uk(u), 'Capturé !', 'f-ready');
        burst(e.u);
      }
    } else if (e.e === 'duo') {
      [e.a, e.b].forEach(arrFx);
    } else if (e.e === 'note') {
      const u = byUid(B, e.u); // Resonance notes (v4.14)
      if (u && !u.ko) {
        floatAt(uk(u), '♪'.repeat(e.n), 'f-note');
      }
    } else if (e.e === 'reso') {
      const u = byUid(B, e.u);
      if (u) {
        setTimeout(() => floatAt(uk(u), 'Résonance !', 'f-reso'), 260);
        burst(e.u);
      }
    }
  });
  sfxEv(ev);
  hook('journal', ev);
}

/* interactions */
export function autoSel() {
  const cur = B.order === 'vitesse' ? currentActor(B) : null, // Speed order: the ally whose turn it is
    nx =
      B.order === 'vitesse'
        ? cur && cur.side === 'a'
          ? cur
          : null
        : B.units.find(x => x.side === 'a' && !x.ko && !x.acted && (!B.coop || coopPlayer(x) === B.coop));
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
    // the Scout stays selected: it can still fall back
    ui.sel = id;
    renderAll();
  }
  hook('action', id);
}

function confirmActCore() {
  const u = byUid(B, ui.sel);
  if (!u || ui.pk == null) {
    return;
  }
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
  if (B.order === 'vitesse') {
    // Speed order: the ally keeps control (Reroll, Dodge, Scout fallback) until « Terminer » (End)
    renderAll();
    return;
  }
  if (u.acted || u.ko) {
    const nx = B.units.find(x => x.side === 'a' && !x.ko && !x.acted);
    if (nx) {
      ui.sel = nx.uid;
    }
  }
  renderAll();
}

function tapTile(k) {
  const u = ui.sel && byUid(B, ui.sel),
    v = uAt(B, k);
  if (u && u.hr && u.acted && !u.moved && !ui.mode && !v && reach(B, u)[k] !== undefined) {
    // Scout: after striking, a blue tile is used to fall back
    const ev = pMove(B, u, k);
    clearAim();
    ui.tile = null;
    renderAll();
    if (ev) {
      playEv(ev);
    }
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
        ...new Set([...affected(B, X.A, X.D.a, k), ...affected(B, X.Bu, X.D.b, k)]),
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
      if (!canSelect(v)) {
        return;
      }
      ui.sel = v.uid;
      ui.selE = null;
    } else {
      ui.selE = v.uid;
    }
    clearAim();
    renderAll();
    return;
  }
  if (u && !u.moved && !u.acted && reach(B, u)[k] !== undefined) {
    ui.undo = { uid: u.uid, snap: JSON.stringify(B), log: LOG.length };
    const ev = pMove(B, u, k);
    clearAim();
    renderAll();
    if (ev) {
      playEv(ev);
    }
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
  if (B && B.order === 'vitesse') {
    return endTurnSpeed();
  } // Speed order: only the current ally has finished (v4.5-01)
  if (!B || ui.busy || B.over || B.phase !== 'player') {
    return;
  }
  if (coopPassTurn()) {
    return;
  } // co-op: Player 1 hands over to Player 2 (v4.18)
  if (duelPassTurn()) {
    return;
  } // local duel: each takes a turn (v4.33)
  ui.busy = true;
  ui.skipSpeedup = false;
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
    if (!B || B !== S0) {
      return;
    }
    if (B.over) {
      finish();
      return;
    }
    if (i >= order.length) {
      endOfRound(S0);
      return;
    }
    const uid = order[i++],
      e = byUid(B, uid);
    if (!e || e.ko) {
      step();
      return;
    }
    ui.act = uid;
    if (await placeEnemy(S0, uid)) {
      return;
    } // v4.12: it positions itself first, before your eyes
    const ev = execFoe(B, uid);
    renderAll();
    playEv(ev);
    setTimeout(step, battleDelay(200, 380, 900));
  };
  setTimeout(step, battleDelay(60, 160, 420));
}

/** v4.12: opponent's move before its attack. Returns true if the battle changed in the meantime. */
export async function placeEnemy(S0, uid) {
  if (!B || !B.jit) {
    return false;
  }
  const pre = prepareEnemy(B, uid);
  if (!pre.length) {
    return false;
  }
  renderAll();
  playEv(pre);
  if (pre.some(x => x.e === 'mv')) {
    await new Promise(r => setTimeout(r, battleDelay(60, 240, 460)));
  }
  return !B || B !== S0;
}

/** End of round (both modes): round effects, arena rule, opponent evolutions, new announcements.
    Returns true if the battle continues. */
export async function endOfRound(S0) {
  ui.act = null;
  const ev = endRound(B);
  if (!B.over) {
    arenaTick(B).forEach(x => ev.push(x));
  }
  for (const x of ev.filter(evt => evt.e === 'evo')) {
    renderAll();
    await cinematic(x.from, x.ft, x.to, x.tt, x.side, x.u);
    if (B !== S0) {
      return false;
    }
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
  hook('beforeBattleEnd');
  // battle rank
  if (B && B.over && !B._rk) {
    B._rk = 1;
    const r = rankOf(B);
    B.rank = r;
    if (r && SCEN[B.sc] && B.sc !== 'sauvage' && !SCEN[B.sc].noProgress) {
      PROFILE.ranks = PROFILE.ranks || {};
      const o = PROFILE.ranks[B.sc];
      B.rankNew = !o || RK.indexOf(r) > RK.indexOf(o);
      if (B.rankNew) {
        PROFILE.ranks[B.sc] = r;
      }
      queueSave();
    }
  }
  // statistics and progression
  if (B && B.over && !B._counted) {
    B._counted = true;
    if ((SCEN[B.sc] || {}).noProgress) {
      // riddle, custom arena, Deep Echo: neither counters nor ordinary progression (v4.31)
      SV.lastBattle = null;
      B.rew = noProgressResult(B);
    } else {
      PROFILE.battles++;
      if (B.over === 'win') {
        PROFILE.wins++;
      } else if (!B.fled) {
        PROFILE.losses++;
      } // a beast that runs away is not a defeat (v4.16)
      PROFILE.awakenings += B.stats.evo || 0;
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
      if (!B) {
        return;
      }
      const win = B.over === 'win';
      if (SCEN[B.sc].gym != null) {
        renderLeague();
      }
      sfx(win ? 'win' : 'lose');
      refreshBattle('result'); // result sheet, rank and quote (v2.4), Nuzlocke, victory: Result.jsx
      $('#cbResult').hidden = false;
      afterBattleScene(B.sc, win); // post-battle scene (v4.29)
      const f = $('#cbResult [data-res="again"]');
      if (f) {
        f.focus();
      }
    },
    RM ? 0 : 900
  );
  setTimeout(() => autoSave(true), RM ? 50 : 1200);
  hook('battleEnd');
}

/* ===================== BATTLE INTERFACE v0.8 ===================== */
export const BG = { S: 27, OX: 20, OY: 22 };

export const VB = () => (VERT ? [286, 430] : [430, 286]);

/* v4.77 · tilted board: HC and HP return perspective-view points when TILT.on.
   Ground = original viewBox coordinates; screen = ground tilted by TILT.a then reframed. */
export const TILT = { on: false };

export const HC0 = k => {
  const p = P(k),
    q = hc(p[0], p[1], BG.S, BG.OX, BG.OY);
  return VERT ? [q[1], 430 - q[0]] : q;
};

export const HC = k => (TILT.on ? tiltP(...HC0(k)) : HC0(k));

export const HP = (x, y, s) => (TILT.on ? tiltHP(x, y, s) : VERT ? hpf(x, y, s) : hp(x, y, s));

export const ui = {
  sel: null,
  selE: null,
  mode: null,
  mi: null,
  pk: null,
  pv: null,
  busy: false,
  act: null,
  cutscene: false,
};

export const L = {};

export const hpc = u => {
  const r = u.hp / u.mhp;
  return r > 0.5 ? '' : r > 0.2 ? 'mid' : 'lo';
};

export const DIA = 'M0 -3.4 2.5 0 0 3.4 -2.5 0Z';

export const STC = {
  PAR: 'par',
  GEL: 'gel',
  SOM: 'som',
  REC: 'rec',
  BRÛ: 'bru',
  RAC: 'rac',
  TOILE: 'toile',
  CHARGE: 'chg',
  VOL: 'vol',
  PSN: 'psn',
  AIDE: 'aide',
  MAUD: 'maud',
  REQ: 'req',
  RIPO: 'ripo',
  MIR: 'ripo',
  x2: 'aide',
};

export const enPips = (n, cls = '') =>
  `<span class="enp ${cls}" aria-label="Énergie d’Éveil ${n} sur 3">${[0, 1, 2].map(i => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;

export const poly = (k, c) => {
  const [x, y] = HC(k),
    pt = HP(x, y, BG.S - 3);
  return `<polygon points="${pt}" class="${c} gw"/><polygon points="${pt}" class="${c}"/>`;
};

// Statements run at startup, in the original order (see index.js).
export function init() {
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

  ((B = null), (LOG = []), (scSel = 'gue'));

  $('#scenList').addEventListener('click', e => {
    const b = e.target.closest('[data-sc]');
    if (!b) {
      return;
    }
    scSel = b.dataset.sc;
    renderPrep();
  });

  $('#bLaunch').addEventListener('click', () => launch());

  $('#evoPick').addEventListener('click', async e => {
    const b = e.target.closest('[data-pick]');
    if (!b) {
      if (e.target.id === 'evoPick') {
        $('#evoPick').hidden = true;
      }
      return;
    }
    $('#evoPick').hidden = true;
    const id = b.dataset.pick,
      u = ui.sel && byUid(B, ui.sel);
    if (!id || !u || !canAwaken(B, u)) {
      return;
    }
    ui.undo = null;
    const E = BY[id];
    ui.busy = true;
    clearAim();
    renderAll();
    await cinematic(u.n, u.t, E.n, E.t, 'a', u.uid);
    const ev = pAwaken(B, u, id);
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
      `${E.n} entre en jeu. ${B.voice >= 2 && !B.retrigger ? 'Relance (2 Voix) pour utiliser ses capacités tout de suite.' : ''}`
    );
    renderAll();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#evoPick').hidden) {
      $('#evoPick').hidden = true;
    }
  });

  $('#bSvg').addEventListener('click', e => {
    const p = e.target.closest('[data-k]');
    if (!p || !B || ui.busy || B.over || B.phase !== 'player') {
      return;
    }
    tapTile(p.dataset.k);
  });

  $('#bPanel').addEventListener('click', e => {
    const b = e.target.closest('button');
    if (!b || !B || ui.busy || B.over) {
      return;
    }
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
        target = byUid(B, b.dataset.cap);
      const ev = pCapture(B, al, target);
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
      if (ui.mode === 'duo' && ui.duo === b.dataset.duo) {
        clearAim();
      } else {
        clearAim();
        ui.mode = 'duo';
        ui.duo = b.dataset.duo;
      }
      renderAll();
      return;
    }
    if (b.dataset.evo === 'open' && u) {
      if (canAwaken(B, u)) {
        openEvoPick(u);
      }
      return;
    }
    if (b.dataset.mi != null && u) {
      const i = +b.dataset.mi;
      if (ui.mode === 'target' && ui.mi === i) {
        clearAim();
      } else {
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
      const ev = pReroll(B, u);
      if (ev) {
        ui.undo = null;
        renderAll();
        playEv(ev);
      }
    }
  });

  ['#bPlE', '#bPlA'].forEach(s =>
    $(s).addEventListener('click', e => {
      const b = e.target.closest('[data-u]');
      if (!b || !B || ui.busy || B.over) {
        return;
      }
      const u = byUid(B, b.dataset.u);
      if (!u || u.ko) {
        return;
      }
      if (u.side === 'a') {
        if (!canSelect(u)) {
          return;
        }
        ui.sel = u.uid;
        ui.selE = null;
      } else {
        ui.selE = u.uid;
      }
      clearAim();
      renderAll();
    })
  );

  $('#bEnd').addEventListener('click', endTurn);

  $('#bQuit').addEventListener('click', () => {
    if (ui.busy) {
      return;
    }
    backToPrep();
  });

  $('#cbResult').addEventListener('click', e => {
    const b = e.target.closest('[data-res]');
    if (!b) {
      return;
    }
    if (b.dataset.res === 'again') {
      $('#cbResult').hidden = true;
      launch();
    } else if (b.dataset.res === 'ligue') {
      backToPrep();
      go('ligue');
    } else {
      backToPrep();
    }
  });
}
