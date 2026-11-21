import { REACTIONS } from '../data/game-data.js';
import { MOVES } from '../data/moves.js';
import { POKEMON, SCENARIOS, WEATHER_NAME } from '../pokemon/pokemon.js';
import { HELD_ITEMS, PROFILE, isCamp, ownedItems } from '../state/game-state.js';
import { arenaSetup, arenaTick } from '../modes/gyms.js';
import {
  $,
  reducedMotion,
  wait,
  svgElement,
  typeGlyphPath,
  hexCenter,
  hexPoints,
  typeColor,
  toast,
  zigzagPoints,
} from '../core/utils.js';
import { HOOKS, hook } from '../core/hooks.js';
import { goTo } from '../core/navigation.js';
import { renderLeague } from '../modes/league.js';
import { squad, vBonus } from '../team/team.js';
import {
  MAX_ENERGY,
  parseCellKey,
  affected,
  byUid,
  canAwaken,
  endRound,
  evoOpts,
  execFoe,
  foeEvo,
  hasNx,
  newBattle,
  playerAction,
  playerDodge,
  pAwaken,
  playerMove,
  pReroll,
  prepareEnemy,
  preview,
  reach,
  startEnemy,
  targets,
  unitAt,
  unitKey,
} from './engine.js';
import { champBuild, duoParts, duoTargets, pCapture, playDuo, previewRun, scenLock } from './items-bonds-ai.js';
import { CLOUD_SAVE, autoSave, queueSave, renderSummary } from '../state/saves.js';
import { PREFERENCES } from '../ui/preferences.js';
import { __set_PREPG, renderPrep } from './battle-prep.js';
import { __set_tutorialI, renderCoach } from '../progression/tutorial.js';
import { applyProgress } from '../progression/battle-rewards.js';
import { sfx, playEventSound, vibrate } from '../audio/sound-effects.js';
import { drawObstacles } from '../modes/gym-screen.js';
import { fxReset, playEvent } from './move-effects.js';
import { panelRoleInfo } from '../ui/guide.js';
import {
  isAutomatedRun,
  HP_BAR_MOTION,
  RANKS,
  rankOf,
  turnBanner,
  turnBanners,
  vsIntro,
} from '../progression/prestige.js';
import { renderWallet } from '../ui/wallet.js';
import { tagUnits, tokenArt } from '../assets/illustrations.js';
import { RIVAL_CHALLENGES, rivalBuild, rivalIdx } from '../modes/rival.js';
import { shinyHue } from '../pokemon/shiny.js';
import { towerDraft, towerRun, towerTeam } from '../modes/resonance-tower.js';
import { currentActor, unrollSpeed, endTurnSpeed, chosenOrder, canSelect } from './tactical-engine.js';
import { LIVING_DESC, LIVING_STATE, hourTint, chosenAlive } from './living-board.js';
import { chosenTactic } from './tactics.js';
import { challengeLaunch, activeChallenges, teamSize } from '../progression/campaign-challenges.js';
import { mutTraining, mutInfo } from './mutators.js';
import { charactersChosen, disobedienceChosen } from '../team/characters.js';
import { level } from '../progression/base-camp.js';
import { REPLAYS } from './best-move-replay.js';
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
import { resonanceCandidate } from './resonant-form.js';
import { storyScene } from '../progression/story-dialogues.js';
import { tournamentTeam } from '../modes/friends-tournament.js';
import { coopPassTurn, coopPlayer } from '../modes/coop.js';
import { isSurrounded } from './intensity.js';
import { battleDelay, endSkipSpeedup } from './quick-battle.js';
import { hurtFlash, liveRender, liveToken } from './expressive-pokemon.js';
import { afterBattleScene } from '../progression/story-scenes.js';
import { buildWeeklyChallenge, weeklyTeam } from '../modes/weekly-challenge.js';
import { lockLegendaryCapture } from '../modes/legendary-captures.js';
import { afterRenderTactics } from './battle-sky.js';
import { campOpen } from '../progression/camp.js';
import { chosenDoctrine } from './doctrines.js';
import { afterRenderFog, chosenFog } from './fog-of-war.js';
import { noProgressResult, fixedTeam } from '../modes/camp-challenges.js';
import { afterRenderDuel, duelPassTurn } from '../modes/duel.js';
import { fitPhoneBattle } from './compact-battle.js';
import { announceGimmick } from '../modes/feats-gimmicks.js';

export let isVerticalBoard, phoneQuery, battle, battleLog, selectedScenario;
export function __set_GREEN(v) {
  return (isVerticalBoard = v);
}
export function __set_battle(v) {
  return (battle = v);
}
export function __set_battleLog(v) {
  return (battleLog = v);
}
export function __set_selectedScenario(v) {
  return (selectedScenario = v);
}

export function tiltPoint(x, y) {
  const T = BOARD_TILT,
    d = T.Hb - y,
    s = T.f / (T.f + d * T.sn);
  return [T.ox + (T.cx + (x - T.cx) * s) * T.k, T.oy + (T.Hb - d * T.cs * s) * T.k];
}

function tiltU(X, Y) {
  const T = BOARD_TILT,
    q = T.Hb - (Y - T.oy) / T.k,
    d = (q * T.f) / (T.f * T.cs - q * T.sn),
    s = T.f / (T.f + d * T.sn);
  return [T.cx + ((X - T.ox) / T.k - T.cx) / s, T.Hb - d];
}

/** apparent size (1 = flat tile) at screen point X,Y */
export function tiltScale(X, Y) {
  const g = tiltU(X, Y);
  return (BOARD_TILT.f / (BOARD_TILT.f + (BOARD_TILT.Hb - g[1]) * BOARD_TILT.sn)) * BOARD_TILT.k;
}

function tiltHP(X, Y, s) {
  const [x, y] = tiltU(X, Y),
    o = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i - (isVerticalBoard ? 0 : 30)),
      q = tiltPoint(x + s * Math.cos(a), y + s * Math.sin(a));
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
  selectedScenario = k;
  __set_PREPG(null);
  goTo('combat');
}

/** The player requests battle k: Battles screen on that scenario, at the scenario's tab. Does not start the battle. */
export function openBattle(k) {
  chooseBattle(k);
  renderPrep();
}

/** Like openBattle, for a key coming from the interface: no effect if the scenario does not exist (yet). */
export function goFight(k) {
  if (SCENARIOS[k]) {
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
    const b = POKEMON[id].base, // held items belong to the family, whatever the stage
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
  const previous = battle;
  // story scenes (v4.17): the scene replaces the battle
  if (!storyScene(selectedScenario)) {
    __set_tutorialI(SCENARIOS[selectedScenario] && SCENARIOS[selectedScenario].tuto ? 0 : -1);
    launchCore();
    if (battle && !isAutomatedRun) {
      vsIntro();
    } // opponent introduction
    else if (battle) {
      turnBanner();
    }
    // Speed order: if an opponent is faster, it opens the round (after the introduction)
    if (battle && battle.order === 'vitesse') {
      setTimeout(unrollSpeed, isAutomatedRun || reducedMotion ? 950 : PREFERENCES.fast ? 1500 : 2400);
    }
  }
  hook('launch', !!battle && battle !== previous);
}

function launchCore() {
  if (!squad.length && !fixedTeam()) {
    return;
  }
  if (selectedScenario === 'hebdo429') {
    buildWeeklyChallenge();
  } // the week may have changed (v4.29)
  const lk =
    scenLock(selectedScenario) ||
    lockLegendaryCapture(selectedScenario) ||
    (selectedScenario === 'hebdo429' || (SCENARIOS[selectedScenario] || {}).noProgress ? null : challengeLaunch()); // campaign challenges (v4.9-01), legendary quests (v4.29)
  if (lk) {
    toast(lk);
    renderPrep();
    return;
  }
  if (selectedScenario === 'champ') {
    champBuild();
  }
  if (rivalIdx(selectedScenario) >= 0 || RIVAL_CHALLENGES[selectedScenario]) {
    rivalBuild();
  }
  if (selectedScenario === 'tdr' && !towerRun()) {
    towerDraft(); // no ascent yet: choose your team first
    return;
  }
  const T = selectedScenario === 'tdr' ? towerTeam() : weeklyTeam() || fixedTeam() || tournamentTeam(); // weekly challenge (v4.29), riddle and Deep Echo (v4.31) // Resonance Tower, tournament between friends (v4.17): the team is frozen
  battle = T
    ? newBattle(selectedScenario, T.team, T.voice, T.opts) // the Tower ignores the budget: only the Voices earned count
    : newBattle(selectedScenario, squad.slice(0, teamSize()), vBonus(), battleOpts()); // Team of 3 (v4.9-01)
  REPLAYS.set(battle, { best: null }); // best-move replay (v4.11-01)
  battleLog = [];
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
  const aev = [...arenaSetup(battle), ...announceGimmick(battle)];
  buildBoard();
  addLog(`${SCENARIOS[selectedScenario].n} : à vous de jouer. Touchez un adversaire pour voir sa portée.`, 'sys');
  aev.forEach(x => {
    if (x.e === 'msg') {
      addLog(x.s, 'arn');
    }
  });
  battle.units.forEach(u => {
    if (u.side === 'a' && u.fat) {
      addLog(`${u.n} est fatigué : −1 Mouvement (un Éveil efface la fatigue).`, 'sys');
    }
    if (u.side === 'a' && u.item) {
      addLog(`${u.n} tient ${HELD_ITEMS[u.item].n}.`, 'sys');
    }
  });
  if (battle.harmonie) {
    addLog('Harmonie : trois rangs différents dans l’équipe, chaque Pokémon commence avec 1 losange.', 'sys');
  } // v4.14
  if (bossScene(battle)) {
    addLog('Combat de prestige : vos adversaires accumulent eux aussi la Résonance (notes, attaques Expertes).', 'arn');
  }
  if (battle.wx) {
    addLog(`Météo ${WEATHER_NAME[battle.wx.k]} dès le début du combat.`, 'sys');
  }
  if (battle.disobedience) {
    addLog('Désobéissance : un Pokémon épuisé ou têtu peut ignorer un ordre.', 'sys');
  }
  if (battle.mut) {
    addLog(`Mutateur · ${mutInfo(battle.mut)[0]} : ${mutInfo(battle.mut)[1]}`, 'arn');
  }
  if (battle.sansEveil) {
    addLog('Défi Sans Éveil : vos Pokémon ne s’éveilleront pas.', 'sys');
  }
  if (battle.tac) {
    addLog(
      'Tactique avancée : entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre, Éclaireurs). Lance-Soleil et Vol partent en fin de manche.',
      'sys'
    );
  }
  if (battle.units.some(u => u.colossus)) {
    addLog('Colosse : brisez ses parties pour faire tomber sa carapace. Chacune le fait vaciller.', 'sys');
  }
  if (battle.livingBoard) {
    addLog(
      `Plateau vivant : ${LIVING_STATE[battle.cycle.ph]} (${LIVING_DESC[battle.cycle.ph]}) Le feu court dans les hautes herbes ; la pluie l’éteint.`,
      'sys'
    );
  }
  autoSel();
  renderAll();
  window.scrollTo({ top: 0 });
}

export function backToPrep() {
  if (selectedScenario === 'sauvage') {
    selectedScenario = 'gue';
  } // a wild encounter cannot be relaunched from the list
  battle = null;
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
  isVerticalBoard = !!(phoneQuery && phoneQuery.matches);
  const D = SCENARIOS[battle.sc],
    bio = D.bio,
    st = ['arene', 'ligue', 'roche'].includes(D.bio) || D.gym != null || !!D.elite || !!D.champ; // stadium terrain (v1.1)
  // container classes: reset here, then toggled by later versions
  // (#bBoard is rendered by React: classes and variables live in the « host » state of boardStore.js)
  bdReset(['board', 'biome-' + bio, ...(isVerticalBoard ? ['is-vertical'] : [])]);
  hostSet({ ac: D.at ? typeColor(D.at) : '' });
  BOARD_LAYERS.t = {};
  BOARD_LAYERS.tx = {};
  BOARD_LAYERS.u = {};
  BOARD_LAYERS.uo = []; // token order in the layer (the tilted board's sort() changes it)
  BOARD_LAYERS.txId = { gue: 'tx-grass', roche: 'tx-stone', tour: 'tx-ash', ligue: 'tx-marble', arene: 'tx-rune' }[bio]; // tile pattern
  battle.units.forEach(u => {
    BOARD_LAYERS.u[u.uid] = mkTok(u);
    BOARD_LAYERS.uo.push(u.uid);
  });
  boardBuild({ vb: boardViewBox(), bio, stadium: st, tilt: BOARD_TILT.on }); // the tokens (Units.jsx) are mounted with the board
  bdClass('stadium', st);
  fxReset();
  hook('boardBuilt');
}

/** Token model (rendered by Units.jsx): what the old DOM carried, in the same order. */
function mkTok(u) {
  const c = ['token', u.side === 'e' ? 'is-enemy' : 'is-ally'];
  if (u.shiny) {
    c.push('is-shiny');
  }
  if (u.boss) {
    c.push('is-boss');
  }
  if (u.dom) {
    c.push('is-dominant');
  }
  if (u.seg) {
    c.push('is-segment');
  }
  if (u.colossus) {
    c.push('is-colossus');
  }
  return liveToken({
    uid: u.uid,
    c, // token classes (classList order)
    sh: u.shiny ? shinyHue(u.sp) + 'deg' : null, // --sh
    tr: null, // transform (sliding: CSS transition)
    pc: [null, null, null], // diamonds: class of each diamond (null: no attribute)
    nc: [null, null, null], // Resonance notes (v4.14)
    statusClass: 'token-status-tag',
    statusText: '',
    n: '',
  }); // animated group (v4.29)
}

// lone « on » class of an element (classList.toggle('on', v)): null → no attribute, '' → emptied class
const on1 = (cur, v) => (v ? 'on' : cur === 'on' ? '' : cur);

export function updateToken(u) {
  hook('beforeToken', u);
  updTokCore(u);
  hook('token', u);
  tokenArt(u);
  hook('illustration', u);
  hook('afterToken', u);
}

function updTokCore(u) {
  const T = BOARD_LAYERS.u[u.uid];
  if (!T) {
    return;
  }
  const [x, y] = cellCenter(unitKey(u));
  T.tr = `translate(${x}px,${y}px)`;
  const c = typeColor(u.t[0]);
  T.rs = c;
  T.rf = `color-mix(in srgb,${c} 26%,#0F131A)`;
  T.gd = typeGlyphPath(u.t[0]);
  T.gf = c;
  const C = 2 * Math.PI * 16,
    r = u.hp / u.mhp;
  T.ad = `${(C * r).toFixed(1)} ${C.toFixed(1)}`;
  T.as = r > 0.5 ? 'var(--ok)' : r > 0.2 ? 'var(--warn)' : 'var(--bad)';
  T.n = u.n;
  const nx = hasNx(u);
  T.pc = T.pc.map((p, i) => on1(p, i < u.en));
  const cl = (k, v) => tokCl(T, k, v);
  cl('is-ko', u.ko);
  cl('is-selected', ui.sel === u.uid || ui.selE === u.uid);
  cl('is-done', u.side === 'a' && u.acted && !u.ko && battle.phase === 'player');
  cl('is-acting', ui.act === u.uid);
  cl(
    'has-energy',
    !u.ko &&
      (u.side === 'a' || battle.duel433
        ? nx || hasXp(u) || resonanceCandidate(battle, u)
        : bossScene(battle) && hasXp(u))
  ); // v4.14: diamonds of Expert attacks
  cl('is-ready', u.side === 'a' && (nx || resonanceCandidate(battle, u)) && u.en >= MAX_ENERGY && !u.ko);
  cl('is-resonant', u.resonant > 0 && !u.ko); // Resonant Form (v4.17)
  cl('is-coop-player-1', !!battle.coop && u.side === 'a' && coopPlayer(u) === 1); // co-op (v4.18)
  cl('is-coop-player-2', !!battle.coop && u.side === 'a' && coopPlayer(u) === 2);
  cl('is-coop-waiting', !!battle.coop && u.side === 'a' && coopPlayer(u) !== battle.coop && battle.phase === 'player');
  cl('is-vigilant', !!u.vigilance && !u.ko); // v4.20
  cl('is-encircled', isSurrounded(battle, u));
  cl('is-phase-2', u.bossPhase === 2 && !u.ko);
  cl('is-phase-3', u.bossPhase === 3 && !u.ko);
  cl('is-in-danger', !u.ko && !!(battle.dangerZone && battle.dangerZone.k.includes(unitKey(u)))); // inside an announced zone
  cl('can-evolve', foeEvo(battle, u));
  cl('is-evolved', !!u.evo);
  const nN = notesOf(battle, u); // Resonance notes (v4.14)
  T.nc = T.nc.map((p, i) => on1(p, i < nN));
  cl('has-notes', nN > 0 && !u.ko);
  cl('is-resonating', nN >= 3 && !u.ko);
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
  T.statusClass = 'token-status-tag' + (b && !u.ko ? ' is-shown status-' + (STATUS_CLASS[b] || 'other') : '');
  T.statusText = b || '';
  unitsDirty();
}

export function renderBoard() {
  boardRender(); // tiles, marks, highlights, intents, obstacles (React layers)
  unitsBatch(() => {
    battle.units.forEach(updateToken); // tokens (Units.jsx): redrawn once at the end of the batch
    drawObstacles();
  });
  hook('boardRendered');
}

/* banners */
export function segmentedHpBar(u) {
  return HOOKS.hpBar.reduce((h, f) => f(h, u), segHpBase(u));
}

function segHpBase(u) {
  const h = `<span class="hp-bar is-segmented"><i class="${hpClass(u)}" style="width:${((u.hp / u.mhp) * 100).toFixed(0)}%"></i></span>`;
  // trail of recent damage
  if (!battle) {
    return h;
  }
  const r = Math.max(0, (u.hp / u.mhp) * 100),
    now = performance.now(),
    key = u.uid;
  const m = HP_BAR_MOTION[key];
  if (!m || m.s !== battle) {
    HP_BAR_MOTION[key] = { r, s: battle, t0: 0, a: r, b: r };
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
    `<b class="hp-bar-trail" style="--a:${m.a.toFixed(1)}%;--b:${m.b.toFixed(1)}%;animation-delay:-${dt | 0}ms"></b><i `
  );
}

// Banner, synergies, arena rule, timeline, plates, bottom bar: rendered by React
// (src/screens/combat/battle). Here, the render's side effects, then the update.
function renderTop() {
  hourTint(battle);
  endSkipSpeedup(); // « Passer » (Skip) during the opponent's turn (v4.28): the speed-up ends outside the opponent's turn
  liveRender(); // animations, tips (v4.29)
  refreshBattle('top', 'foot');
  turnBanners();
}

/* panel */
// Command panel (#bPanel): rendered by React (src/screens/combat/battle/Panel.jsx).
// The engine keeps the container's « is-info-off » class (panelRoleInfo).
export function renderPanel() {
  panelRoleInfo();
  refreshBattle('panel');
}

/* evolution choice: rendered by React (EvoPick.jsx) */
function openEvoPick(u) {
  if (!evoOpts(battle, u).length) {
    return;
  }
  evoState.u = u;
  refreshBattle('evo');
  $('#evoPick').hidden = false;
  const f = $('#evoPick .evolution-option');
  if (f) {
    f.focus();
  }
}

/* evolution cutscene */
export function cinematic(fromN, fromT, toN, toT, side, uid) {
  const o = {}; // #evoFx (React): the effect starts from the evolving Pokémon
  if (uid && BOARD_LAYERS.u[uid]) {
    const [x, y] = cellCenter(unitKey(byUid(battle, uid)));
    o.ox = ((x / boardViewBox()[0]) * 100).toFixed(1) + '%';
    o.oy = ((y / boardViewBox()[1]) * 100).toFixed(1) + '%';
  }
  evoSet({ ...o, on: true, fx: { fromN, fromT, toN, toT, side }, fast: !!(PREFERENCES.fast || ui.skipSpeedup) });
  ui.cutscene = true;
  if (battle) {
    renderAll();
  }
  sfx('evo');
  vibrate([15, 25, 15, 25, 70]);
  return wait(battleDelay(650, 1300, 2500)).then(() => {
    evoSet({ on: false, fx: null });
    ui.cutscene = false;
  });
}

/* log */
export function addLog(s, c) {
  battleLog.unshift({ s, c: c || '', r: battle ? battle.round : 1 });
  if (battleLog.length > 70) {
    battleLog.length = 70;
  }
  renderLog();
}

// Log (#bLog, #bLogLast): rendered by React (Log.jsx)
function renderLog() {
  refreshBattle('log');
}

export function renderAll() {
  hook('beforeRender');
  tagUnits(battle); // types → species, for the illustrations
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
  if (!battle) {
    return;
  }
  renderTop(); // with the Speed-order timeline (v4.5-01)
  renderBoard();
  renderPanel();
}

/* effects */
// floating text over a cell; cls is its kind (is-damage, is-heal, is-reaction, is-ready…)
export function floatAt(k, txt, cls) {
  const [x, y] = cellCenter(k);
  const t = svgElement(
    'text',
    { class: 'float-text ' + cls, x: x.toFixed(1), y: (y - 16).toFixed(1) },
    BOARD_LAYERS.fl
  );
  t.textContent = txt;
  setTimeout(() => t.remove(), 1500);
}

// chain reaction kind (event .c) → class
const CHAIN_CLASS = { el: 'is-electric', fire: 'is-fire', ice: 'is-ice' };

function drawChain(e) {
  const g = svgElement('g', {}, BOARD_LAYERS.fx);
  e.edges.forEach(([a, b, d]) => {
    const A = cellCenter(a),
      C = cellCenter(b),
      pts = zigzagPoints(A[0], A[1], C[0], C[1], 4, 3.5),
      dl = 0.05 + d * 0.12 + 's';
    svgElement('polyline', { class: 'chain-glow ' + CHAIN_CLASS[e.c], points: pts, style: `--d:${dl}` }, g);
    svgElement('polyline', { class: 'chain-segment ' + CHAIN_CLASS[e.c], points: pts, style: `--d:${dl}` }, g);
  });
  setTimeout(() => g.remove(), 1800);
}

function beam(a, b, typ) {
  if (a === b) {
    return;
  }
  const A = cellCenter(a),
    C = cellCenter(b);
  const l = svgElement(
    'polyline',
    { class: 'attack-beam', points: zigzagPoints(A[0], A[1], C[0], C[1], 5, 2.5), style: `stroke:${typeColor(typ)}` },
    BOARD_LAYERS.fx
  );
  setTimeout(() => l.remove(), 700);
}

function burst(uid) {
  const u = byUid(battle, uid);
  if (!u) {
    return;
  }
  const [x, y] = cellCenter(unitKey(u));
  const c = svgElement('circle', { class: 'unit-burst', cx: x, cy: y, r: 10 }, BOARD_LAYERS.fx);
  setTimeout(() => c.remove(), 1100);
}

function arrFx(uid) {
  const u = byUid(battle, uid);
  if (!u) {
    return;
  }
  const [x, y] = cellCenter(unitKey(u)),
    g = svgElement('g', { class: 'arrival-effect', style: `--c:${typeColor(u.t[0])}` }, BOARD_LAYERS.fx);
  [0, 1].forEach(i =>
    svgElement(
      'polygon',
      {
        points: cellPoints(x, y, BOARD_GEOMETRY.S * 1.9),
        style: `animation-delay:${i * 0.22}s`,
        transform: `rotate(30 ${x} ${y})`,
      },
      g
    )
  );
  setTimeout(() => g.remove(), 1600);
}

function hit(uid) {
  const T = BOARD_LAYERS.u[uid];
  if (T) {
    T.hit = true; // blinking ring (« hit » class of .token-ring, Units.jsx)
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
      addLog(e.s, /^Arène /.test(e.s) ? 'arn' : /^(Arrivée|.* évolue en|.* puise)/.test(e.s) ? 'evo' : '');
    } else if (e.e === 'dmg') {
      const u = byUid(battle, e.u);
      if (u) {
        floatAt(unitKey(u), '−' + e.v, 'is-damage');
        hit(e.u);
      }
    } else if (e.e === 'heal') {
      const u = byUid(battle, e.u);
      if (u) {
        floatAt(unitKey(u), '+' + e.v, 'is-heal');
      }
    } else if (e.e === 'rx') {
      floatAt(e.k, REACTIONS[e.rx].n, 'is-reaction');
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
      const u = byUid(battle, e.u);
      if (u && !u.ko) {
        setTimeout(() => floatAt(unitKey(u), 'Éveil prêt', 'is-ready'), 380);
      }
    } else if (e.e === 'use') {
      const u = byUid(battle, e.u);
      if (u && e.k) {
        beam(unitKey(u), e.k, u.t[0]);
      }
    } else if (e.e === 'catch') {
      const u = byUid(battle, e.u);
      if (u) {
        floatAt(unitKey(u), 'Capturé !', 'is-ready');
        burst(e.u);
      }
    } else if (e.e === 'duo') {
      [e.a, e.b].forEach(arrFx);
    } else if (e.e === 'note') {
      const u = byUid(battle, e.u); // Resonance notes (v4.14)
      if (u && !u.ko) {
        floatAt(unitKey(u), '♪'.repeat(e.n), 'is-note');
      }
    } else if (e.e === 'reso') {
      const u = byUid(battle, e.u);
      if (u) {
        setTimeout(() => floatAt(unitKey(u), 'Résonance !', 'is-resonance'), 260);
        burst(e.u);
      }
    }
  });
  playEventSound(ev);
  hook('journal', ev);
}

/* interactions */
export function autoSel() {
  const cur = battle.order === 'vitesse' ? currentActor(battle) : null, // Speed order: the ally whose turn it is
    nx =
      battle.order === 'vitesse'
        ? cur && cur.side === 'a'
          ? cur
          : null
        : battle.units.find(
            x => x.side === 'a' && !x.ko && !x.acted && (!battle.coop || coopPlayer(x) === battle.coop)
          );
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
  const u = battle && byUid(battle, id);
  if (u && u.hr && !u.ko && !battle.over) {
    // the Scout stays selected: it can still fall back
    ui.sel = id;
    renderAll();
  }
  hook('action', id);
}

function confirmActCore() {
  const u = byUid(battle, ui.sel);
  if (!u || ui.pk == null) {
    return;
  }
  ui.undo = null;
  ui.tile = null;
  const ev =
    ui.mode === 'duo' ? playDuo(battle, u, byUid(battle, ui.duo), ui.pk) : playerAction(battle, u, ui.mi, ui.pk);
  clearAim();
  if (!ev) {
    renderAll();
    return;
  }
  renderAll();
  playEvent(ev);
  if (battle.over) {
    finish();
    return;
  }
  if (battle.order === 'vitesse') {
    // Speed order: the ally keeps control (Reroll, Dodge, Scout fallback) until « Terminer » (End)
    renderAll();
    return;
  }
  if (u.acted || u.ko) {
    const nx = battle.units.find(x => x.side === 'a' && !x.ko && !x.acted);
    if (nx) {
      ui.sel = nx.uid;
    }
  }
  renderAll();
}

function tapTile(k) {
  const u = ui.sel && byUid(battle, ui.sel),
    v = unitAt(battle, k);
  if (u && u.hr && u.acted && !u.moved && !ui.mode && !v && reach(battle, u)[k] !== undefined) {
    // Scout: after striking, a blue tile is used to fall back
    const ev = playerMove(battle, u, k);
    clearAim();
    ui.tile = null;
    renderAll();
    if (ev) {
      playEvent(ev);
    }
    if (u.ko) {
      autoSel();
      renderAll();
    }
    return;
  }
  ui.tile = null;
  if (u && ui.mode === 'duo' && ui.duo) {
    const p = byUid(battle, ui.duo);
    if (duoTargets(battle, u, p).includes(k)) {
      if (ui.pk === k) {
        confirmAct();
        return;
      }
      ui.pk = k;
      const X = duoParts(battle, u, p);
      ui.pv = previewRun(battle, C => playDuo(C, byUid(C, u.uid), byUid(C, p.uid), k), [
        ...new Set([...affected(battle, X.A, X.D.a, k), ...affected(battle, X.Bu, X.D.b, k)]),
      ]);
      renderAll();
      return;
    }
  }
  if (u && ui.mode === 'target') {
    const m = MOVES[u.mv[ui.mi]];
    if (targets(battle, u, m).includes(k)) {
      if (ui.pk === k) {
        confirmAct();
        return;
      }
      ui.pk = k;
      ui.pv = preview(battle, u.uid, ui.mi, k);
      renderAll();
      return;
    }
  }
  if (u && ui.mode === 'dodge') {
    const ev = playerDodge(battle, u, k);
    if (ev) {
      ui.undo = null;
      clearAim();
      renderAll();
      playEvent(ev);
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
  if (u && !u.moved && !u.acted && reach(battle, u)[k] !== undefined) {
    ui.undo = { uid: u.uid, snap: JSON.stringify(battle), log: battleLog.length };
    const ev = playerMove(battle, u, k);
    clearAim();
    renderAll();
    if (ev) {
      playEvent(ev);
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
  if (battle && battle.order === 'vitesse') {
    return endTurnSpeed();
  } // Speed order: only the current ally has finished (v4.5-01)
  if (!battle || ui.busy || battle.over || battle.phase !== 'player') {
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
  addLog(`Fin de la manche ${battle.round} : les adversaires passent à l’action.`, 'sys');
  const order = startEnemy(battle),
    S0 = battle;
  renderAll();
  let i = 0;
  const step = async () => {
    if (!battle || battle !== S0) {
      return;
    }
    if (battle.over) {
      finish();
      return;
    }
    if (i >= order.length) {
      endOfRound(S0);
      return;
    }
    const uid = order[i++],
      e = byUid(battle, uid);
    if (!e || e.ko) {
      step();
      return;
    }
    ui.act = uid;
    if (await placeEnemy(S0, uid)) {
      return;
    } // v4.12: it positions itself first, before your eyes
    const ev = execFoe(battle, uid);
    renderAll();
    playEvent(ev);
    setTimeout(step, battleDelay(200, 380, 900));
  };
  setTimeout(step, battleDelay(60, 160, 420));
}

/** v4.12: opponent's move before its attack. Returns true if the battle changed in the meantime. */
export async function placeEnemy(S0, uid) {
  if (!battle || !battle.jit) {
    return false;
  }
  const pre = prepareEnemy(battle, uid);
  if (!pre.length) {
    return false;
  }
  renderAll();
  playEvent(pre);
  if (pre.some(x => x.e === 'mv')) {
    await new Promise(r => setTimeout(r, battleDelay(60, 240, 460)));
  }
  return !battle || battle !== S0;
}

/** End of round (both modes): round effects, arena rule, opponent evolutions, new announcements.
    Returns true if the battle continues. */
export async function endOfRound(S0) {
  ui.act = null;
  const ev = endRound(battle);
  if (!battle.over) {
    arenaTick(battle).forEach(x => ev.push(x));
  }
  for (const x of ev.filter(evt => evt.e === 'evo')) {
    renderAll();
    await cinematic(x.from, x.ft, x.to, x.tt, x.side, x.u);
    if (battle !== S0) {
      return false;
    }
  }
  ui.busy = false;
  renderAll();
  playEvent(ev);
  if (battle.over) {
    finish();
    return false;
  }
  addLog(`Manche ${battle.round} : à vous de jouer.`, 'sys');
  autoSel();
  renderAll();
  return true;
}

export function finish() {
  hook('beforeBattleEnd');
  // battle rank
  if (battle && battle.over && !battle._rk) {
    battle._rk = 1;
    const r = rankOf(battle);
    battle.rank = r;
    if (r && SCENARIOS[battle.sc] && battle.sc !== 'sauvage' && !SCENARIOS[battle.sc].noProgress) {
      PROFILE.ranks = PROFILE.ranks || {};
      const o = PROFILE.ranks[battle.sc];
      battle.rankNew = !o || RANKS.indexOf(r) > RANKS.indexOf(o);
      if (battle.rankNew) {
        PROFILE.ranks[battle.sc] = r;
      }
      queueSave();
    }
  }
  // statistics and progression
  if (battle && battle.over && !battle._counted) {
    battle._counted = true;
    if ((SCENARIOS[battle.sc] || {}).noProgress) {
      // riddle, custom arena, Deep Echo: neither counters nor ordinary progression (v4.31)
      CLOUD_SAVE.lastBattle = null;
      battle.rew = noProgressResult(battle);
    } else {
      PROFILE.battles++;
      if (battle.over === 'win') {
        PROFILE.wins++;
      } else if (!battle.fled) {
        PROFILE.losses++;
      } // a beast that runs away is not a defeat (v4.16)
      PROFILE.awakenings += battle.stats.evo || 0;
      PROFILE.rx += battle.stats.rx || 0;
      PROFILE.kos += battle.stats.ko || 0;
      CLOUD_SAVE.lastBattle = null;
      battle.rew = applyProgress(battle);
    }
  }
  ui.busy = false;
  ui.act = null;
  renderAll();
  setTimeout(
    () => {
      if (!battle) {
        return;
      }
      const win = battle.over === 'win';
      if (SCENARIOS[battle.sc].gym != null) {
        renderLeague();
      }
      sfx(win ? 'win' : 'lose');
      refreshBattle('result'); // result sheet, rank and quote (v2.4), Nuzlocke, victory: Result.jsx
      $('#cbResult').hidden = false;
      afterBattleScene(battle.sc, win); // post-battle scene (v4.29)
      const f = $('#cbResult [data-res="again"]');
      if (f) {
        f.focus();
      }
    },
    reducedMotion ? 0 : 900
  );
  setTimeout(() => autoSave(true), reducedMotion ? 50 : 1200);
  hook('battleEnd');
}

/* ===================== BATTLE INTERFACE v0.8 ===================== */
export const BOARD_GEOMETRY = { S: 27, OX: 20, OY: 22 };

export const boardViewBox = () => (isVerticalBoard ? [286, 430] : [430, 286]);

/* v4.77 · tilted board: HC and HP return perspective-view points when TILT.on.
   Ground = original viewBox coordinates; screen = ground tilted by TILT.a then reframed. */
export const BOARD_TILT = { on: false };

export const flatCellCenter = k => {
  const p = parseCellKey(k),
    q = hexCenter(p[0], p[1], BOARD_GEOMETRY.S, BOARD_GEOMETRY.OX, BOARD_GEOMETRY.OY);
  return isVerticalBoard ? [q[1], 430 - q[0]] : q;
};

export const cellCenter = k => (BOARD_TILT.on ? tiltPoint(...flatCellCenter(k)) : flatCellCenter(k));

export const cellPoints = (x, y, s) =>
  BOARD_TILT.on ? tiltHP(x, y, s) : isVerticalBoard ? hpf(x, y, s) : hexPoints(x, y, s);

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

export const BOARD_LAYERS = {};

export const hpClass = u => {
  const r = u.hp / u.mhp;
  return r > 0.5 ? '' : r > 0.2 ? 'is-half' : 'is-low';
};

export const DIAMOND_PATH = 'M0 -3.4 2.5 0 0 3.4 -2.5 0Z';

export const STATUS_CLASS = {
  PAR: 'paralysis',
  GEL: 'frozen',
  SOM: 'asleep',
  REC: 'recharging',
  BRÛ: 'burned',
  RAC: 'rooted',
  TOILE: 'webbed',
  CHARGE: 'charging',
  VOL: 'flying',
  PSN: 'poisoned',
  AIDE: 'helped',
  MAUD: 'cursed',
  REQ: 'doomed',
  RIPO: 'countering',
  MIR: 'countering',
  x2: 'helped',
};

export const energyPips = (n, cls = '') =>
  `<span class="energy-pips ${cls}" aria-label="Énergie d’Éveil ${n} sur 3">${[0, 1, 2].map(i => `<i class="${i < n ? 'is-filled' : ''}"></i>`).join('')}</span>`;

export const cellPolygon = (k, c) => {
  const [x, y] = cellCenter(k),
    pt = cellPoints(x, y, BOARD_GEOMETRY.S - 3);
  return `<polygon points="${pt}" class="${c} highlight-glow"/><polygon points="${pt}" class="${c}"/>`;
};

async function onEvoPickClick(e) {
  const b = e.target.closest('[data-pick]');
  if (!b) {
    if (e.target.id === 'evoPick') {
      $('#evoPick').hidden = true;
    }
    return;
  }
  $('#evoPick').hidden = true;
  const id = b.dataset.pick,
    u = ui.sel && byUid(battle, ui.sel);
  if (!id || !u || !canAwaken(battle, u)) {
    return;
  }
  ui.undo = null;
  const E = POKEMON[id];
  ui.busy = true;
  clearAim();
  renderAll();
  await cinematic(u.n, u.t, E.n, E.t, 'a', u.uid);
  const ev = pAwaken(battle, u, id);
  ui.busy = false;
  if (!ev) {
    renderAll();
    return;
  }
  renderAll();
  playEvent(ev);
  if (battle.over) {
    finish();
    return;
  }
  toast(
    `${E.n} entre en jeu. ${battle.voice >= 2 && !battle.retrigger ? 'Relance (2 Voix) pour utiliser ses capacités tout de suite.' : ''}`
  );
  renderAll();
}

function onBattlePanelClick(e) {
  const b = e.target.closest('button');
  if (!b || !battle || ui.busy || battle.over) {
    return;
  }
  const u = ui.sel && byUid(battle, ui.sel);
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
    battle = JSON.parse(U.snap);
    battleLog.splice(0, Math.max(0, battleLog.length - U.log));
    renderLog();
    clearAim();
    ui.sel = U.uid;
    renderAll();
    sfx('ui');
    return;
  }
  if (b.dataset.cap) {
    const al = byUid(battle, ui.sel),
      target = byUid(battle, b.dataset.cap);
    const ev = pCapture(battle, al, target);
    if (ev) {
      ui.undo = null;
      ui.selE = null;
      renderAll();
      playEvent(ev);
      if (battle.over) {
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
    if (canAwaken(battle, u)) {
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
      const m = MOVES[u.mv[i]];
      if (m.sh === 'self' || m.sh === 'ring') {
        ui.pk = unitKey(u);
        ui.pv = preview(battle, u.uid, i, ui.pk);
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
    const ev = pReroll(battle, u);
    if (ev) {
      ui.undo = null;
      renderAll();
      playEvent(ev);
    }
  }
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  isVerticalBoard = false;

  phoneQuery = window.matchMedia ? matchMedia('(max-width: 700px)') : null;

  if (phoneQuery) {
    const onMQ = () => {
      if (battle && !$('#cbBattle').hidden && isVerticalBoard !== phoneQuery.matches) {
        buildBoard();
        renderAll();
      }
    };
    phoneQuery.addEventListener ? phoneQuery.addEventListener('change', onMQ) : phoneQuery.addListener(onMQ);
  }

  ((battle = null), (battleLog = []), (selectedScenario = 'gue'));

  $('#scenList').addEventListener('click', e => {
    const b = e.target.closest('[data-sc]');
    if (!b) {
      return;
    }
    selectedScenario = b.dataset.sc;
    renderPrep();
  });

  $('#bLaunch').addEventListener('click', () => launch());

  $('#evoPick').addEventListener('click', onEvoPickClick);

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#evoPick').hidden) {
      $('#evoPick').hidden = true;
    }
  });

  $('#bSvg').addEventListener('click', e => {
    const p = e.target.closest('[data-k]');
    if (!p || !battle || ui.busy || battle.over || battle.phase !== 'player') {
      return;
    }
    tapTile(p.dataset.k);
  });

  $('#bPanel').addEventListener('click', onBattlePanelClick);

  ['#bPlE', '#bPlA'].forEach(s =>
    $(s).addEventListener('click', e => {
      const b = e.target.closest('[data-u]');
      if (!b || !battle || ui.busy || battle.over) {
        return;
      }
      const u = byUid(battle, b.dataset.u);
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
      goTo('ligue');
    } else {
      backToPrep();
    }
  });
}
