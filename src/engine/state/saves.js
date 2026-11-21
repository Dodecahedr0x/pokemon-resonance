import { REACTIONS, TYPES } from '../data/game-data.js';
import { POKEMON, PRESETS, SCENARIOS } from '../pokemon/pokemon.js';
import { BUDGET } from '../pokemon/evolution.js';
import {
  CAMP_START,
  DIFFICULTY_NAMES,
  HELD_ITEMS,
  PROFILE,
  PROFILE_SECTIONS,
  __set_PROFILE,
  defProfile,
  inBox,
} from './game-state.js';
import { BADGES, __set_BADGES } from '../modes/gyms.js';
import { rosterCost } from '../pokemon/roles-synergies.js';
import { $, wait, writeLS, toast } from '../core/utils.js';
import { setSaveIndicator } from '../../components/shellStore.js';
import { currentScreen, goTo } from '../core/navigation.js';
import { renderLeague } from '../modes/league.js';
import { TEAM_MAX, __set_squad, renderSquad, save, squad, validSquad } from '../team/team.js';
import { BOARD_ROWS, BOARD_COLS } from '../combat/engine.js';
import { wildScen } from '../combat/items-bonds-ai.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import {
  battle,
  battleLog,
  __set_battle,
  __set_battleLog,
  __set_selectedScenario,
  autoSel,
  buildBoard,
  launch,
  addLog,
  renderAll,
  ui,
} from '../combat/ui.js';
import { PREFERENCES, savePref } from '../ui/preferences.js';
import { openStarter } from '../progression/campaign.js';
import { renderPrep } from '../combat/battle-prep.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { renderWallet } from '../ui/wallet.js';
import { renderHome } from '../world/home.js';
import { v4After } from '../ui/settings.js';
import { rivalBuild } from '../modes/rival.js';
import { towerRestore } from '../modes/resonance-tower.js';
import { unrollSpeed } from '../combat/tactical-engine.js';
import { fillFreeBox } from '../world/catch-anywhere.js';
import { hideSaves, refreshSaves, showSaves } from '../../screens/saves/savesStore.js';
import { refreshSummary } from '../../screens/combat/prep/prepStore.js';
import { migrateKeys } from '../../lib/saveMigration.js';

export let SAVE_V, SLOTS;
let LSK, svT;

function lsGet(k) {
  try {
    const s = localStorage.getItem(LSK(k));
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function lsSet(k, v) {
  try {
    if (v) {
      localStorage.setItem(LSK(k), JSON.stringify(v));
    } else {
      localStorage.removeItem(LSK(k));
    }
    return true;
  } catch (e) {
    return false;
  }
}

function ensureScen(b) {
  try {
    if (b && b.sc === 'sauvage' && !SCENARIOS.sauvage && b.state) {
      const f = b.state.units.find(u => u.side === 'e');
      if (f && POKEMON[f.sp]) {
        wildScen(f.sp, b.state.time, !!f.shiny, !!f.dom);
      }
    }
    if (b && b.sc === 'tdr') {
      towerRestore();
    }
    if (b && b.sc === 'duel433' && b.state && b.state.duel433 && b.state.duel433.D) {
      SCENARIOS.duel433 = b.state.duel433.D; // duel in progress: its terrain and teams (v4.33)
      OBSTACLES.duel433 = b.state.duel433.O || {};
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

export function validBattle(b) {
  ensureScen(b);
  try {
    return !!(
      b &&
      SCENARIOS[b.sc] &&
      b.state &&
      b.state.sc === b.sc &&
      Array.isArray(b.state.units) &&
      b.state.units.length &&
      b.state.units.every(u => POKEMON[u.id] && POKEMON[u.sp] && Array.isArray(u.pos)) &&
      b.state.tiles &&
      Object.keys(b.state.tiles).length === BOARD_COLS * BOARD_ROWS &&
      b.state.phase === 'player' &&
      !b.state.over
    );
  } catch (e) {
    return false;
  }
}

function validSave(s) {
  return !!(
    s &&
    typeof s === 'object' &&
    s.v === SAVE_V &&
    typeof s.savedAt === 'string' &&
    Array.isArray(s.squad) &&
    validSquad(s.squad) &&
    Array.isArray(s.badges)
  );
}

export function cleanProfile(p) {
  const o = defProfile();
  const sections = () => PROFILE_SECTIONS.map(([, tidy]) => tidy(p));
  if (!p || typeof p !== 'object') {
    return Object.assign(o, ...sections());
  }
  if (typeof p.name === 'string') {
    o.name = p.name.slice(0, 24);
  }
  ['battles', 'wins', 'losses', 'awakenings', 'rx', 'kos', 'caught'].forEach(k => {
    if (Number.isFinite(p[k]) && p[k] >= 0) {
      o[k] = Math.floor(p[k]);
    }
  });
  if (p.mode === 'campagne') {
    o.mode = 'campagne';
  }
  if (DIFFICULTY_NAMES[p.diff]) {
    o.diff = p.diff;
  }
  const ids = a => (Array.isArray(a) ? [...new Set(a.filter(id => POKEMON[id] && POKEMON[id].st === 1))] : []);
  o.box = ids(p.box);
  o.dex = ids(p.dex);
  o.forms = Array.isArray(p.forms) ? [...new Set(p.forms.filter(id => POKEMON[id] && POKEMON[id].st > 1))] : [];
  o.ranks = {};
  if (p.ranks && typeof p.ranks === 'object') {
    for (const [k, v] of Object.entries(p.ranks)) {
      if (/^[a-z0-9_-]{1,24}$/i.test(k) && ['S', 'A', 'B'].includes(v)) {
        o.ranks[k] = v;
      }
    }
  }
  o.items = Array.isArray(p.items) ? [...new Set(p.items.filter(k => HELD_ITEMS[k]))] : [];
  if (p.equipment && typeof p.equipment === 'object') {
    for (const k in p.equipment) {
      if (POKEMON[k] && HELD_ITEMS[p.equipment[k]]) {
        o.equipment[k] = p.equipment[k];
      }
    }
  }
  if (p.fatigue && typeof p.fatigue === 'object') {
    for (const k in p.fatigue) {
      if (POKEMON[k] && Number.isFinite(p.fatigue[k])) {
        o.fatigue[k] = Math.max(0, Math.min(100, Math.round(p.fatigue[k])));
      }
    }
  }
  if (p.links && typeof p.links === 'object') {
    for (const k in p.links) {
      const [a, b] = k.split('|');
      if (POKEMON[a] && POKEMON[b] && Number.isFinite(p.links[k]) && p.links[k] > 0) {
        o.links[k] = Math.min(999, Math.floor(p.links[k]));
      }
    }
  }
  if (Array.isArray(p.history)) {
    o.history = p.history
      .slice(-10)
      .filter(h => h && typeof h === 'object')
      .map(h => ({
        atk: Array.isArray(h.atk) ? h.atk.filter(t => TYPES[t]) : [],
        def: Array.isArray(h.def) ? h.def.filter(t => TYPES[t]) : [],
        rx: Object.fromEntries(Object.entries(h.rx || {}).filter(([k, v]) => REACTIONS[k] && Number.isFinite(v))),
      }));
  }
  if (Number.isFinite(p.elite)) {
    o.elite = Math.max(0, Math.min(5, Math.floor(p.elite)));
  }
  if (p.tuto) {
    o.tuto = 1;
  }
  if (o.mode === 'campagne' && !o.box.length) {
    o.box = [...CAMP_START];
  }
  return Object.assign(o, ...sections());
}

function battleNow() {
  if (battle && !battle.over) {
    if (battle.phase === 'player' && !ui.busy) {
      CLOUD_SAVE.lastBattle = { sc: battle.sc, state: JSON.parse(JSON.stringify(battle)), log: battleLog.slice(0, 40) };
    }
    return CLOUD_SAVE.lastBattle;
  }
  if (battle && battle.over) {
    CLOUD_SAVE.lastBattle = null;
  }
  return CLOUD_SAVE.lastBattle;
}

export function snapshot() {
  return {
    v: SAVE_V,
    savedAt: new Date().toISOString(),
    squad: [...squad],
    badges: [...BADGES],
    profile: JSON.parse(JSON.stringify(PROFILE)),
    battle: battleNow(),
  };
}

export function queueSave() {
  if (!CLOUD_SAVE.boot) {
    return;
  }
  clearTimeout(svT);
  svT = setTimeout(autoSave, 600);
}

export function autoSave(force) {
  const s = snapshot(),
    g = sigOf(s);
  if (!force && g === CLOUD_SAVE.lastSig) {
    return;
  }
  CLOUD_SAVE.lastSig = g;
  CLOUD_SAVE.local.auto = s;
  lsSet('auto', s);
  pushRemote('auto', s, force);
  CLOUD_SAVE.at = Date.now();
  svIndicator();
  renderSummary();
}

function ref(k) {
  return CLOUD_SAVE.db.collection('data/users/' + CLOUD_SAVE.uid).doc(k);
}

async function pushRemote(k, s, now) {
  if (!CLOUD_SAVE.db || !CLOUD_SAVE.uid) {
    return;
  }
  CLOUD_SAVE.pend[k] = s;
  if (CLOUD_SAVE.busy[k]) {
    return;
  }
  CLOUD_SAVE.busy[k] = true;
  svIndicator();
  try {
    while (CLOUD_SAVE.pend[k]) {
      const x = CLOUD_SAVE.pend[k];
      CLOUD_SAVE.pend[k] = null;
      let ok = false;
      for (let a = 0; a < 2 && !ok; a++) {
        try {
          await ref(k).set(JSON.parse(JSON.stringify(x)));
          CLOUD_SAVE.remote[k] = x;
          ok = true;
        } catch (e) {
          const c = e && e.code;
          if (c === 'unavailable' && a === 0) {
            await wait(800 + Math.random() * 700);
            continue;
          }
          if (c === 'quota_exceeded') {
            toast('Espace de sauvegarde du compte plein : la partie reste enregistrée sur cet appareil.');
          } else if (c !== 'resource_exhausted') {
            CLOUD_SAVE.db = null;
            CLOUD_SAVE.cloud = false;
          }
          break;
        }
      }
      if (k === 'auto' && !now && CLOUD_SAVE.pend[k]) {
        await wait(5000);
      }
    }
  } finally {
    CLOUD_SAVE.busy[k] = false;
    svIndicator();
    if (!$('#saves').hidden) {
      renderSaves();
    }
  }
}

async function delRemote(k) {
  delete CLOUD_SAVE.remote[k];
  if (!CLOUD_SAVE.db) {
    return;
  }
  try {
    await ref(k).delete();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ---- applying a save ---- */
export function applySave(s, opt) {
  opt = opt || {};
  __set_PROFILE(cleanProfile(s.profile));
  rivalBuild();
  towerRestore();
  fillFreeBox(s.squad, s.badges); // Free: the Box fills only once (v4.21)
  __set_squad(s.squad.filter(id => inBox(id)));
  if (!squad.length) {
    __set_squad(
      PROFILE.box.slice(0, 4).filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + POKEMON[x].c, 0) <= BUDGET)
    );
  }
  save();
  __set_BADGES(
    s.badges
      .filter(i => Number.isInteger(i) && i >= 0 && i < 8)
      .filter((v, i, a) => a.indexOf(v) === i)
      .sort((a, b) => a - b)
  );
  writeLS('res9-badges', BADGES);
  CLOUD_SAVE.lastBattle = validBattle(s.battle) ? JSON.parse(JSON.stringify(s.battle)) : null;
  renderSquad();
  renderLeague();
  renderSummary();
  renderHome();
  if (opt.resume && CLOUD_SAVE.lastBattle) {
    resumeBattle();
  } else if (opt.leaveBattle && battle) {
    __set_battle(null);
    $('#cbBattle').hidden = true;
    $('#cbResult').hidden = true;
    $('#evoPick').hidden = true;
    $('#cbPrep').hidden = false;
    renderPrep();
  }
  renderWallet();
  if (currentScreen !== 'combat') {
    v4After(currentScreen);
  }
}

function resumeBattle() {
  const b = CLOUD_SAVE.lastBattle;
  if (!validBattle(b)) {
    return;
  }
  __set_battle(JSON.parse(JSON.stringify(b.state)));
  battle.stats.caught = battle.stats.caught || [];
  battle.stats.rxk = battle.stats.rxk || {};
  battle.stats.duo = battle.stats.duo || 0;
  battle.links = battle.links || {};
  battle.diff = battle.diff || 'normal';
  if (!battle.jit) {
    // battle started before v4.12: switch to hidden intentions
    battle.jit = true;
    battle.units.forEach(u => {
      if (u.side === 'e') {
        u.intent = null;
        u.prep = false;
        u.isLost = 0;
        u.force = null;
      }
    });
  }
  if (battle.noCatch === undefined) {
    battle.noCatch = !SCENARIOS[battle.sc].catch;
  }
  __set_battleLog(Array.isArray(b.log) ? b.log.filter(x => x && typeof x.s === 'string').slice(0, 70) : []);
  __set_selectedScenario(b.sc);
  Object.assign(ui, {
    sel: null,
    selE: null,
    mode: null,
    mi: null,
    pk: null,
    pv: null,
    busy: false,
    act: null,
    cutscene: false,
  });
  goTo('combat');
  $('#cbPrep').hidden = true;
  $('#cbBattle').hidden = false;
  $('#cbResult').hidden = true;
  $('#evoPick').hidden = true;
  buildBoard();
  addLog(`Combat repris à la manche ${battle.round}.`, 'sys');
  autoSel();
  renderAll();
  window.scrollTo({ top: 0 });
  if (battle.order === 'vitesse') {
    unrollSpeed();
  } // speed order: the queue resumes where it was
}

export function battleLine(b) {
  if (!validBattle(b)) {
    return '';
  }
  const S = b.state,
    al = S.units.filter(u => u.side === 'a' && !u.ko).length,
    fo = S.units.filter(u => u.side === 'e' && !u.ko).length;
  return `${SCENARIOS[b.sc].n} · manche ${S.round} / ${S.lim} · ${al} contre ${fo}`;
}

function svIndicator() {
  // #sideSaveK and #tbSave: src/components (Nav.jsx, TopBar.jsx)
  setSaveIndicator(Object.values(CLOUD_SAVE.busy).some(Boolean), !!CLOUD_SAVE.cloud);
}

// "Battle in progress" card: #resumePrep is rendered by React (src/screens/combat/prep/Summary.jsx,
// reusable for #resumeHome).
export function renderSummary() {
  refreshSummary(); // #resumePrep and #resumeHome: <ResumeBox> (src/screens/combat/prep/Summary.jsx)
}

function readCode(t) {
  t = String(t || '').trim();
  if (t.startsWith('{')) {
    return migrateKeys(JSON.parse(t));
  }
  return migrateKeys(JSON.parse(decodeURIComponent(escape(atob(t.replace(/^RES1\./, '').replace(/\s+/g, ''))))));
}

// The window is rendered by React (<Saves>, src/screens/saves): we request a new render.
export function renderSaves() {
  refreshSaves();
}

export function openSaves() {
  CLOUD_SAVE.confirm = null;
  CLOUD_SAVE.code = null;
  autoSave();
  showSaves(); // React rereads the state and puts focus on "Fermer" (Close)
}

export function closeSaves() {
  hideSaves();
  CLOUD_SAVE.confirm = null;
}

/* ---- actions ---- */
export function putSlot(k) {
  const s = snapshot();
  CLOUD_SAVE.local[k] = s;
  lsSet(k, s);
  pushRemote(k, s, true);
  toast(`Partie sauvegardée dans l’emplacement ${k.slice(1)}.`);
}

function loadSlot(k) {
  const s = CLOUD_SAVE.local[k];
  if (!validSave(s)) {
    toast('Cette sauvegarde est illisible.');
    return;
  }
  autoSave();
  applySave(s, { resume: true, leaveBattle: true });
  closeSaves();
  autoSave(true);
  toast(`Emplacement ${k.slice(1)} chargé.`);
}

function delSlot(k) {
  delete CLOUD_SAVE.local[k];
  lsSet(k, null);
  delRemote(k);
  toast(`Emplacement ${k.slice(1)} supprimé.`);
}

export function newGame() {
  const name = PROFILE.name,
    diff = PROFILE.diff;
  applySave(
    {
      v: SAVE_V,
      savedAt: new Date().toISOString(),
      squad: [...PRESETS.orage.ids],
      badges: [],
      profile: Object.assign(defProfile(), { name, diff }),
      battle: null,
    },
    { leaveBattle: true }
  );
  closeSaves();
  autoSave(true);
  goTo('accueil');
  toast('Nouvelle partie : équipe de départ et boîte à badges vide.');
}

async function exportSave() {
  const s = snapshot(),
    d = new Date(),
    fn = `resonance-sauvegarde-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`,
    data = JSON.stringify(s, null, 1);
  if (CLOUD_SAVE.dl) {
    try {
      await CLOUD_SAVE.dl.save({ filename: fn, data });
      toast('Fichier de sauvegarde exporté.');
      return;
    } catch (e) {
      if (e && e.code === 'declined') {
        return;
      }
      if (e && e.code === 'rate_limited') {
        toast('Une demande d’enregistrement est déjà ouverte.');
        return;
      }
    }
  }
  try {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = fn;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 1500);
    toast('Fichier de sauvegarde exporté.');
  } catch (e) {
    toast('L’export de fichier n’est pas disponible ici.');
  }
}

async function importSave(file) {
  if (!file) {
    return;
  }
  let s = null;
  try {
    s = readCode(await readText(file));
  } catch (e) {
    toast('Fichier illisible : ce n’est ni un fichier .json ni un code de sauvegarde.');
    const i = $('#svFile');
    if (i) {
      i.value = '';
    }
    return;
  }
  importData(s);
  const i = $('#svFile');
  if (i) {
    i.value = '';
  }
}

/* The import repairs what can be repaired (over-budget team or unknown species filtered out, {auto: …} envelope, other version). */
function normSave(s) {
  if (!s || typeof s !== 'object') {
    return null;
  }
  for (const k of ['auto', 'save', 'data', 'snapshot']) {
    if (!s.squad && !s.profile && s[k] && typeof s[k] === 'object') {
      s = s[k];
    }
  }
  if (!s || typeof s !== 'object' || (!Array.isArray(s.squad) && !s.profile)) {
    return null;
  }
  const o = Object.assign({}, s);
  o.v = SAVE_V;
  if (typeof o.savedAt !== 'string') {
    o.savedAt = new Date().toISOString();
  }
  if (!Array.isArray(o.badges)) {
    o.badges = [];
  }
  const keep = [],
    seen = new Set();
  let cost = 0;
  (Array.isArray(o.squad) ? o.squad : []).forEach(id => {
    if (!POKEMON[id] || keep.length >= TEAM_MAX || seen.has(POKEMON[id].base) || cost + rosterCost(id) > BUDGET) {
      return;
    }
    seen.add(POKEMON[id].base);
    cost += rosterCost(id);
    keep.push(id);
  });
  o.squad = keep.length ? keep : [...PRESETS.orage.ids];
  return o;
}

function importData(s) {
  const n = normSave(s);
  if (!n) {
    toast('Fichier illisible : ce n’est pas une sauvegarde Résonance.');
    return false;
  }
  try {
    if (!validSave(n)) {
      throw new Error('sauvegarde incomplète');
    }
    autoSave();
    applySave(n, { leaveBattle: true });
    closeSaves();
    autoSave(true);
    toast(
      validBattle(CLOUD_SAVE.lastBattle) ? 'Partie importée : un combat en cours vous attend.' : 'Partie importée.'
    );
    return true;
  } catch (e) {
    toast('Import impossible : ' + String((e && e.message) || 'sauvegarde invalide').slice(0, 80));
    return false;
  }
}

/* ---- startup: device first, then Claude account ---- */
export function bootSaves() {
  SLOTS.forEach(k => {
    const s = lsGet(k);
    if (validSave(s)) {
      CLOUD_SAVE.local[k] = s;
    }
  });
  const a = lsGet('auto');
  if (validSave(a)) {
    CLOUD_SAVE.local.auto = a;
    applySave(a);
    CLOUD_SAVE.lastSig = sigOf(a);
  }
  CLOUD_SAVE.boot = true;
  renderSummary();
  svIndicator();
  if (!validSave(a)) {
    autoSave(true);
  }
}

export const CLOUD_SAVE = {
  db: null,
  uid: null,
  dl: null,
  cloud: false,
  boot: false,
  acted: false,
  lastSig: '',
  lastBattle: null,
  local: {},
  remote: {},
  pend: {},
  busy: {},
  confirm: null,
  at: 0,
};

const sigOf = s => JSON.stringify([s.squad, s.badges, s.profile, s.battle]);

/* ---- display ---- */
export const formatDate = iso => {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return '';
  }
};

export const escapeHtml = t =>
  String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* text save: can be copied and pasted anywhere, even where you can neither download nor pick a file */
const saveCode = s => 'RES1.' + btoa(unescape(encodeURIComponent(JSON.stringify(s))));

const readText = f =>
  f.text
    ? f.text()
    : new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(String(fr.result));
        fr.onerror = () => rej(fr.error);
        fr.readAsText(f);
      });

function onSavesOverlayClick(e) {
  if (e.target.id === 'saves') {
    closeSaves();
    return;
  }
  const r = e.target.closest('[data-resume]');
  if (r) {
    closeSaves();
    resumeBattle();
    return;
  }
  const b = e.target.closest('[data-sv]');
  if (!b) {
    return;
  }
  const a = b.dataset.sv,
    k = b.dataset.k;
  if (a === 'close') {
    closeSaves();
    return;
  }
  if (a === 'export') {
    exportSave();
    return;
  }
  if (a === 'copycode') {
    autoSave();
    CLOUD_SAVE.code = { mode: 'copy', text: saveCode(snapshot()) };
    renderSaves();
    const t = $('#svCode');
    if (t) {
      t.focus();
      t.select();
    }
    try {
      navigator.clipboard.writeText(CLOUD_SAVE.code.text).then(
        () => toast('Code de sauvegarde copié.'),
        () => {}
      );
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    return;
  }
  if (a === 'pastecode') {
    CLOUD_SAVE.code = { mode: 'paste' };
    renderSaves();
    const t = $('#svCode');
    if (t) {
      t.focus();
    }
    return;
  }
  if (a === 'closecode') {
    CLOUD_SAVE.code = null;
    renderSaves();
    return;
  }
  if (a === 'importcode') {
    let s = null;
    try {
      s = readCode(($('#svCode') || {}).value);
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    if (importData(s)) {
      CLOUD_SAVE.code = null;
    }
    return;
  }
  if (a === 'no') {
    CLOUD_SAVE.confirm = null;
    renderSaves();
    return;
  }
  if (a === 'ok' && CLOUD_SAVE.confirm) {
    const c = CLOUD_SAVE.confirm;
    CLOUD_SAVE.confirm = null;
    if (c.k === 'reset') {
      newGame();
    } else if (c.a === 'load') {
      loadSlot(c.k);
    } else if (c.a === 'put') {
      putSlot(c.k);
      renderSaves();
    } else if (c.a === 'del') {
      delSlot(c.k);
      renderSaves();
    }
    return;
  }
  if (a === 'put' && !CLOUD_SAVE.local[k]) {
    putSlot(k);
    renderSaves();
    return;
  }
  if (a === 'reset') {
    CLOUD_SAVE.confirm = { k: 'reset', a: 'reset' };
    renderSaves();
    return;
  }
  if (a === 'camp') {
    CLOUD_SAVE.confirm = null;
    closeSaves();
    openStarter();
    return;
  }
  if (a === 'set') {
    const f = b.dataset.f,
      v = b.dataset.v;
    if (f === 'diff') {
      PROFILE.diff = v;
      queueSave();
      renderHome();
    } else {
      PREFERENCES[f] = !PREFERENCES[f];
      savePref();
      if (f === 'sound' && PREFERENCES.sound) {
        sfx('ui');
      }
      if (f === 'vibe' && PREFERENCES.vibe) {
        vibrate(30);
      }
    }
    renderSaves();
    return;
  }
  if (a === 'tuto') {
    closeSaves();
    __set_selectedScenario('tuto');
    goTo('combat');
    renderPrep();
    if (squad.length) {
      launch();
    }
    return;
  }
  if (['load', 'put', 'del'].includes(a)) {
    CLOUD_SAVE.confirm = { k, a };
    renderSaves();
  }
}

function onImportFileClick(e) {
  const b = e.target.closest('[data-sv="importfile"]');
  if (!b) {
    return;
  }
  const i = $('#svFile');
  if (!i) {
    return;
  }
  let opened = false;
  const mark = () => (opened = true);
  window.addEventListener('blur', mark, { once: true });
  document.addEventListener('visibilitychange', mark, { once: true });
  i.addEventListener('change', mark, { once: true });
  i.addEventListener('cancel', mark, { once: true });
  try {
    i.click();
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  setTimeout(() => {
    if (opened) {
      return;
    }
    toast('Le sélecteur de fichiers est bloqué ici : collez le texte de votre sauvegarde ci-dessous.');
    CLOUD_SAVE.code = { mode: 'paste' };
    renderSaves();
    const t = $('#svCode');
    if (t) {
      t.focus();
    }
  }, 1400);
}

// Instructions run at startup, in the original order (see index.js).
export function init() {
  /* ===================== SAVES ===================== */
  /* Automatic save + 3 slots, including the battle in progress.
   Always on the device (localStorage); synced with the Claude account
   when the page has access to it (db, private subtree of each player). */
  ((SAVE_V = 1), (SLOTS = ['s1', 's2', 's3']), (LSK = k => 'res-save-' + k));

  /* ---- writing: device immediately, account with one write at a time per slot ---- */
  svT = null;

  ['click', 'keydown', 'input'].forEach(t =>
    document.addEventListener(
      t,
      () => {
        CLOUD_SAVE.acted = true;
      },
      { capture: true, passive: true }
    )
  );

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && CLOUD_SAVE.boot) {
      clearTimeout(svT);
      autoSave();
    }
  });

  window.addEventListener('pagehide', () => {
    if (CLOUD_SAVE.boot) {
      clearTimeout(svT);
      autoSave();
    }
  });

  $('#saves').addEventListener('click', onSavesOverlayClick);

  $('#saves').addEventListener('change', e => {
    if (e.target.id === 'svFile') {
      importSave(e.target.files && e.target.files[0]);
    }
  });

  /* In some apps the file picker does not open. The button detects this and opens the "Paste a code" area (the .json file's text works there too). */
  document.addEventListener('click', onImportFileClick);

  $('#saves').addEventListener('input', e => {
    if (e.target.id === 'svName') {
      PROFILE.name = e.target.value.slice(0, 24);
      queueSave();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !$('#saves').hidden) {
      closeSaves();
    }
  });

  ['#sideSave', '#tbSave'].forEach(s => {
    const el = $(s);
    if (el) {
      el.addEventListener('click', openSaves);
    }
  });

  document.addEventListener('click', e => {
    const r = e.target.closest('#resumeHome [data-resume],#resumePrep [data-resume]');
    if (r) {
      resumeBattle();
      return;
    }
    const d = e.target.closest('#resumeHome [data-drop],#resumePrep [data-drop]');
    if (d) {
      CLOUD_SAVE.lastBattle = null;
      autoSave(true);
      renderSummary();
      toast('Combat abandonné.');
    }
  });

  (async function () {
    const C = window.claude;
    if (!C || typeof C.use !== 'function') {
      return;
    }
    let db = null,
      user = null;
    try {
      [db, user, CLOUD_SAVE.dl] = await Promise.all([C.use('db'), C.use('user'), C.use('downloads')]);
    } catch (e) {
      return;
    }
    if (!db || !user) {
      return;
    }
    let uid = null;
    try {
      uid = await user.id();
    } catch {
      /* Best effort: failure here is non-fatal. */
    }
    if (!uid) {
      return;
    }
    CLOUD_SAVE.db = db;
    CLOUD_SAVE.uid = uid;
    for (const k of ['auto', ...SLOTS]) {
      try {
        const sn = await ref(k).get();
        if (sn.exists) {
          const d = migrateKeys(JSON.parse(JSON.stringify(sn.data())));
          if (validSave(d)) {
            CLOUD_SAVE.remote[k] = d;
          }
        }
      } catch (e) {
        const c = e && e.code;
        if (c && c !== 'unavailable') {
          CLOUD_SAVE.db = null;
          svIndicator();
          return;
        }
      }
    }
    CLOUD_SAVE.cloud = true;
    const r = CLOUD_SAVE.remote.auto,
      l = CLOUD_SAVE.local.auto;
    if (r && (!l || r.savedAt > l.savedAt) && !CLOUD_SAVE.acted && !battle) {
      applySave(r);
      CLOUD_SAVE.local.auto = r;
      lsSet('auto', r);
      CLOUD_SAVE.lastSig = sigOf(r);
      toast('Partie synchronisée depuis votre compte.');
    } else if (l && (!r || l.savedAt > r.savedAt)) {
      pushRemote('auto', l, true);
    }
    for (const k of SLOTS) {
      const rr = CLOUD_SAVE.remote[k],
        ll = CLOUD_SAVE.local[k];
      if (rr && (!ll || rr.savedAt >= ll.savedAt)) {
        CLOUD_SAVE.local[k] = rr;
        lsSet(k, rr);
      } else if (ll && (!rr || ll.savedAt > rr.savedAt)) {
        pushRemote(k, ll, true);
      }
    }
    svIndicator();
    if (!$('#saves').hidden) {
      renderSaves();
    }
  })();
}
