/* Section d'origine : 19-sauvegardes.js */

import { RX, TYPES } from './004-data.js';
import { BY, PRESETS, SCEN } from './009-pokemon.js';
import { BUDGET } from './010-in-battle-evolution.js';
import { CAMP_START, DIFFS, ITEMS2, PROFILE, SECTIONS_PROFIL, __set_PROFILE, defProfile, inBox } from './011-game-state.js';
import { BADGES, __set_BADGES } from './013-gyms.js';
import { RC } from './012-recruits-roles-synergies.js';
import { $, wait, writeLS, toast } from './014-utils.js';
import { setSaveIndicator } from '../components/shellStore.js';
import { cur, go } from './016-navigation.js';
import { renderLeague } from './019-league.js';
import { TEAM_MAX, __set_squad, renderSquad, save, squad, validSquad } from './020-team-cards.js';
import { BH, BW } from './021-combat-engine.js';
import { wildScen } from './022-items-bonds-ai.js';
import { OBST } from './023-roles-synergies-obstacles.js';
import { B, LOG, __set_B, __set_LOG, __set_scSel, autoSel, buildBoard, launch, log, renderAll, ui } from './024-combat-ui.js';
import { PREF, openStarter, renderPrep, savePref, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { renderWallet } from './035-interface.js';
import { renderHome } from './036-home.js';
import { v4After } from './040-settings.js';
import { rivalBuild, tdrRestore } from './043-adventure-plus.js';
import { unrollSpeed } from './044-tactical-engine.js';
import { free421 } from './061-catch-anywhere.js';
import { hideSaves, refreshSaves, showSaves } from '../screens/saves/savesStore.js';
import { refreshSummary } from '../screens/combat/prep/prepStore.js';

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
    if (v) localStorage.setItem(LSK(k), JSON.stringify(v));
    else localStorage.removeItem(LSK(k));
    return true;
  } catch (e) {
    return false;
  }
}


function ensureScen(b) {
  try {
    if (b && b.sc === 'sauvage' && !SCEN.sauvage && b.state) {
      const f = b.state.units.find(u => u.side === 'e');
      if (f && BY[f.sp]) wildScen(f.sp, b.state.time, !!f.shiny, !!f.dom);
    }
    if (b && b.sc === 'tdr') tdrRestore();
    if (b && b.sc === 'duel433' && b.state && b.state.duel433 && b.state.duel433.D) {
      SCEN.duel433 = b.state.duel433.D; // duel en cours : son terrain et ses équipes (v4.33)
      OBST.duel433 = b.state.duel433.O || {};
    }
  } catch (e) {}
}


export function validBattle(b) {
  ensureScen(b);
  try {
    return !!(
      b &&
      SCEN[b.sc] &&
      b.state &&
      b.state.sc === b.sc &&
      Array.isArray(b.state.units) &&
      b.state.units.length &&
      b.state.units.every(u => BY[u.id] && BY[u.sp] && Array.isArray(u.pos)) &&
      b.state.tiles &&
      Object.keys(b.state.tiles).length === BW * BH &&
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
  const sections = () => SECTIONS_PROFIL.map(([, tidy]) => tidy(p));
  if (!p || typeof p !== 'object') return Object.assign(o, ...sections());
  if (typeof p.name === 'string') o.name = p.name.slice(0, 24);
  ['battles', 'wins', 'losses', 'evos', 'rx', 'kos', 'caught'].forEach(k => {
    if (Number.isFinite(p[k]) && p[k] >= 0) o[k] = Math.floor(p[k]);
  });
  if (p.mode === 'campagne') o.mode = 'campagne';
  if (DIFFS[p.diff]) o.diff = p.diff;
  const ids = a => (Array.isArray(a) ? [...new Set(a.filter(id => BY[id] && BY[id].st === 1))] : []);
  o.box = ids(p.box);
  o.dex = ids(p.dex);
  o.forms = Array.isArray(p.forms) ? [...new Set(p.forms.filter(id => BY[id] && BY[id].st > 1))] : [];
  o.ranks = {};
  if (p.ranks && typeof p.ranks === 'object')
    for (const [k, v] of Object.entries(p.ranks))
      if (/^[a-z0-9_-]{1,24}$/i.test(k) && ['S', 'A', 'B'].includes(v)) o.ranks[k] = v;
  o.items = Array.isArray(p.items) ? [...new Set(p.items.filter(k => ITEMS2[k]))] : [];
  if (p.equip && typeof p.equip === 'object')
    for (const k in p.equip) if (BY[k] && ITEMS2[p.equip[k]]) o.equip[k] = p.equip[k];
  if (p.fatigue && typeof p.fatigue === 'object')
    for (const k in p.fatigue)
      if (BY[k] && Number.isFinite(p.fatigue[k])) o.fatigue[k] = Math.max(0, Math.min(100, Math.round(p.fatigue[k])));
  if (p.links && typeof p.links === 'object')
    for (const k in p.links) {
      const [a, b] = k.split('|');
      if (BY[a] && BY[b] && Number.isFinite(p.links[k]) && p.links[k] > 0)
        o.links[k] = Math.min(999, Math.floor(p.links[k]));
    }
  if (Array.isArray(p.hist))
    o.hist = p.hist
      .slice(-10)
      .filter(h => h && typeof h === 'object')
      .map(h => ({
        atk: Array.isArray(h.atk) ? h.atk.filter(t => TYPES[t]) : [],
        def: Array.isArray(h.def) ? h.def.filter(t => TYPES[t]) : [],
        rx: Object.fromEntries(Object.entries(h.rx || {}).filter(([k, v]) => RX[k] && Number.isFinite(v)))
      }));
  if (Number.isFinite(p.elite)) o.elite = Math.max(0, Math.min(5, Math.floor(p.elite)));
  if (p.tuto) o.tuto = 1;
  if (o.mode === 'campagne' && !o.box.length) o.box = [...CAMP_START];
  return Object.assign(o, ...sections());
}


function battleNow() {
  if (B && !B.over) {
    if (B.phase === 'player' && !ui.busy) {
      SV.lastBattle = { sc: B.sc, state: JSON.parse(JSON.stringify(B)), log: LOG.slice(0, 40) };
    }
    return SV.lastBattle;
  }
  if (B && B.over) SV.lastBattle = null;
  return SV.lastBattle;
}


export function snapshot() {
  return {
    v: SAVE_V,
    savedAt: new Date().toISOString(),
    squad: [...squad],
    badges: [...BADGES],
    profile: JSON.parse(JSON.stringify(PROFILE)),
    battle: battleNow()
  };
}


export function queueSave() {
  if (!SV.boot) return;
  clearTimeout(svT);
  svT = setTimeout(autoSave, 600);
}


export function autoSave(force) {
  const s = snapshot(),
    g = sigOf(s);
  if (!force && g === SV.lastSig) return;
  SV.lastSig = g;
  SV.local.auto = s;
  lsSet('auto', s);
  pushRemote('auto', s, force);
  SV.at = Date.now();
  svIndicator();
  renderSummary();
}


function ref(k) {
  return SV.db.collection('data/users/' + SV.uid).doc(k);
}


async function pushRemote(k, s, now) {
  if (!SV.db || !SV.uid) return;
  SV.pend[k] = s;
  if (SV.busy[k]) return;
  SV.busy[k] = true;
  svIndicator();
  try {
    while (SV.pend[k]) {
      const x = SV.pend[k];
      SV.pend[k] = null;
      let ok = false;
      for (let a = 0; a < 2 && !ok; a++) {
        try {
          await ref(k).set(JSON.parse(JSON.stringify(x)));
          SV.remote[k] = x;
          ok = true;
        } catch (e) {
          const c = e && e.code;
          if (c === 'unavailable' && a === 0) {
            await wait(800 + Math.random() * 700);
            continue;
          }
          if (c === 'quota_exceeded')
            toast('Espace de sauvegarde du compte plein : la partie reste enregistrée sur cet appareil.');
          else if (c !== 'resource_exhausted') {
            SV.db = null;
            SV.cloud = false;
          }
          break;
        }
      }
      if (k === 'auto' && !now && SV.pend[k]) await wait(5000);
    }
  } finally {
    SV.busy[k] = false;
    svIndicator();
    if (!$('#saves').hidden) renderSaves();
  }
}


async function delRemote(k) {
  delete SV.remote[k];
  if (!SV.db) return;
  try {
    await ref(k).delete();
  } catch (e) {}
}


/* ---- application d’une sauvegarde ---- */
export function applySave(s, opt) {
  opt = opt || {};
  __set_PROFILE(cleanProfile(s.profile));
  rivalBuild();
  tdrRestore();
  free421(s.squad, s.badges); // Libre : la Box se remplit une seule fois (v4.21)
  __set_squad(s.squad.filter(id => inBox(id)));
  if (!squad.length)
    __set_squad(PROFILE.box.slice(0, 4).filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + BY[x].c, 0) <= BUDGET));
  save();
  __set_BADGES(s.badges
    .filter(i => Number.isInteger(i) && i >= 0 && i < 8)
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => a - b));
  writeLS('res9-badges', BADGES);
  SV.lastBattle = validBattle(s.battle) ? JSON.parse(JSON.stringify(s.battle)) : null;
  renderSquad();
  renderLeague();
  renderSummary();
  renderHome();
  if (opt.resume && SV.lastBattle) resumeBattle();
  else if (opt.leaveBattle && B) {
    __set_B(null);
    $('#cbBattle').hidden = true;
    $('#cbResult').hidden = true;
    $('#evoPick').hidden = true;
    $('#cbPrep').hidden = false;
    renderPrep();
  }
  renderWallet();
  if (cur !== 'combat') v4After(cur);
}


function resumeBattle() {
  const b = SV.lastBattle;
  if (!validBattle(b)) return;
  __set_B(JSON.parse(JSON.stringify(b.state)));
  B.stats.caught = B.stats.caught || [];
  B.stats.rxk = B.stats.rxk || {};
  B.stats.duo = B.stats.duo || 0;
  B.links = B.links || {};
  B.diff = B.diff || 'normal';
  if (!B.jit) {
    // combat commencé avant la v4.12 : on passe aux intentions cachées
    B.jit = true;
    B.units.forEach(u => {
      if (u.side === 'e') {
        u.intent = null;
        u.prep = false;
        u.perdu = 0;
        u.force = null;
      }
    });
  }
  if (B.noCatch === undefined) B.noCatch = !SCEN[B.sc].catch;
  __set_LOG(Array.isArray(b.log) ? b.log.filter(x => x && typeof x.s === 'string').slice(0, 70) : []);
  __set_scSel(b.sc);
  Object.assign(ui, {
    sel: null,
    selE: null,
    mode: null,
    mi: null,
    pk: null,
    pv: null,
    busy: false,
    act: null,
    cine: false
  });
  go('combat');
  $('#cbPrep').hidden = true;
  $('#cbBattle').hidden = false;
  $('#cbResult').hidden = true;
  $('#evoPick').hidden = true;
  buildBoard();
  log(`Combat repris à la manche ${B.round}.`, 'sys');
  autoSel();
  renderAll();
  window.scrollTo({ top: 0 });
  if (B.ordre === 'vitesse') unrollSpeed(); // ordre par Vitesse : la file reprend où elle en était
}


export function battleLine(b) {
  if (!validBattle(b)) return '';
  const S = b.state,
    al = S.units.filter(u => u.side === 'a' && !u.ko).length,
    fo = S.units.filter(u => u.side === 'e' && !u.ko).length;
  return `${SCEN[b.sc].n} · manche ${S.round} / ${S.lim} · ${al} contre ${fo}`;
}


function svIndicator() {
  // #sideSaveK et #tbSave : src/components (Nav.jsx, TopBar.jsx)
  setSaveIndicator(Object.values(SV.busy).some(Boolean), !!SV.cloud);
}


// Carte « Combat en cours » : #resumePrep est rendu par React (src/screens/combat/prep/Resume.jsx,
// réutilisable pour #resumeHome).
export function renderSummary() {
  refreshSummary(); // #resumePrep et #resumeHome : <ResumeBox> (src/screens/combat/prep/Resume.jsx)
}


function readCode(t) {
  t = String(t || '').trim();
  if (t.startsWith('{')) return JSON.parse(t);
  return JSON.parse(decodeURIComponent(escape(atob(t.replace(/^RES1\./, '').replace(/\s+/g, '')))));
}


// La fenêtre est rendue par React (<Saves>, src/screens/saves) : on demande un nouveau rendu.
export function renderSaves() {
  refreshSaves();
}


export function openSaves() {
  SV.confirm = null;
  SV.code = null;
  autoSave();
  showSaves(); // React relit l'état et met le focus sur « Fermer »
}


export function closeSaves() {
  hideSaves();
  SV.confirm = null;
}


/* ---- actions ---- */
export function putSlot(k) {
  const s = snapshot();
  SV.local[k] = s;
  lsSet(k, s);
  pushRemote(k, s, true);
  toast(`Partie sauvegardée dans l’emplacement ${k.slice(1)}.`);
}


function loadSlot(k) {
  const s = SV.local[k];
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
  delete SV.local[k];
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
      battle: null
    },
    { leaveBattle: true }
  );
  closeSaves();
  autoSave(true);
  go('accueil');
  toast('Nouvelle partie : équipe de départ et boîte à badges vide.');
}


async function exportSave() {
  const s = snapshot(),
    d = new Date(),
    fn = `resonance-sauvegarde-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`,
    data = JSON.stringify(s, null, 1);
  if (SV.dl) {
    try {
      await SV.dl.save({ filename: fn, data });
      toast('Fichier de sauvegarde exporté.');
      return;
    } catch (e) {
      if (e && e.code === 'declined') return;
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
  if (!file) return;
  let s = null;
  try {
    s = readCode(await readText(file));
  } catch (e) {
    toast('Fichier illisible : ce n’est ni un fichier .json ni un code de sauvegarde.');
    const i = $('#svFile');
    if (i) i.value = '';
    return;
  }
  importData(s);
  const i = $('#svFile');
  if (i) i.value = '';
}


/* L’import répare ce qui peut l’être (équipe hors budget ou espèce inconnue filtrées, enveloppe {auto: …}, autre version). */
function normSave(s) {
  if (!s || typeof s !== 'object') return null;
  for (const k of ['auto', 'save', 'data', 'snapshot'])
    if (!s.squad && !s.profile && s[k] && typeof s[k] === 'object') s = s[k];
  if (!s || typeof s !== 'object' || (!Array.isArray(s.squad) && !s.profile)) return null;
  const o = Object.assign({}, s);
  o.v = SAVE_V;
  if (typeof o.savedAt !== 'string') o.savedAt = new Date().toISOString();
  if (!Array.isArray(o.badges)) o.badges = [];
  const keep = [],
    seen = new Set();
  let cost = 0;
  (Array.isArray(o.squad) ? o.squad : []).forEach(id => {
    if (!BY[id] || keep.length >= TEAM_MAX || seen.has(BY[id].base) || cost + RC(id) > BUDGET) return;
    seen.add(BY[id].base);
    cost += RC(id);
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
    if (!validSave(n)) throw new Error('sauvegarde incomplète');
    autoSave();
    applySave(n, { leaveBattle: true });
    closeSaves();
    autoSave(true);
    toast(validBattle(SV.lastBattle) ? 'Partie importée : un combat en cours vous attend.' : 'Partie importée.');
    return true;
  } catch (e) {
    toast('Import impossible : ' + String((e && e.message) || 'sauvegarde invalide').slice(0, 80));
    return false;
  }
}


/* ---- démarrage : appareil d’abord, puis compte Claude ---- */
export function bootSaves() {
  SLOTS.forEach(k => {
    const s = lsGet(k);
    if (validSave(s)) SV.local[k] = s;
  });
  const a = lsGet('auto');
  if (validSave(a)) {
    SV.local.auto = a;
    applySave(a);
    SV.lastSig = sigOf(a);
  }
  SV.boot = true;
  renderSummary();
  svIndicator();
  if (!validSave(a)) autoSave(true);
}

export const SV = {
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
  at: 0
};


const sigOf = s => JSON.stringify([s.squad, s.badges, s.profile, s.battle]);


/* ---- affichage ---- */
export const fmtD = iso => {
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '';
  }
};


export const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);


/* sauvegarde en texte : se copie et se colle partout, même là où l’on ne peut ni télécharger ni choisir un fichier */
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

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== SAUVEGARDES ===================== */
/* Sauvegarde automatique + 3 emplacements, combat en cours compris.
   Toujours sur l’appareil (localStorage) ; synchronisées avec le compte Claude
   quand la page y a accès (db, sous-arbre privé de chaque joueur). */
SAVE_V = 1,
  SLOTS = ['s1', 's2', 's3'],
  LSK = k => 'res-save-' + k;


/* ---- écriture : appareil tout de suite, compte avec une écriture à la fois par emplacement ---- */
svT = null;


['click', 'keydown', 'input'].forEach(t =>
  document.addEventListener(
    t,
    () => {
      SV.acted = true;
    },
    { capture: true, passive: true }
  )
);


document.addEventListener('visibilitychange', () => {
  if (document.hidden && SV.boot) {
    clearTimeout(svT);
    autoSave();
  }
});


window.addEventListener('pagehide', () => {
  if (SV.boot) {
    clearTimeout(svT);
    autoSave();
  }
});


$('#saves').addEventListener('click', e => {
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
  if (!b) return;
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
    SV.code = { mode: 'copy', text: saveCode(snapshot()) };
    renderSaves();
    const t = $('#svCode');
    if (t) {
      t.focus();
      t.select();
    }
    try {
      navigator.clipboard.writeText(SV.code.text).then(
        () => toast('Code de sauvegarde copié.'),
        () => {}
      );
    } catch (e) {}
    return;
  }
  if (a === 'pastecode') {
    SV.code = { mode: 'paste' };
    renderSaves();
    const t = $('#svCode');
    if (t) t.focus();
    return;
  }
  if (a === 'closecode') {
    SV.code = null;
    renderSaves();
    return;
  }
  if (a === 'importcode') {
    let s = null;
    try {
      s = readCode(($('#svCode') || {}).value);
    } catch (e) {}
    if (importData(s)) SV.code = null;
    return;
  }
  if (a === 'no') {
    SV.confirm = null;
    renderSaves();
    return;
  }
  if (a === 'ok' && SV.confirm) {
    const c = SV.confirm;
    SV.confirm = null;
    if (c.k === 'reset') newGame();
    else if (c.a === 'load') loadSlot(c.k);
    else if (c.a === 'put') {
      putSlot(c.k);
      renderSaves();
    } else if (c.a === 'del') {
      delSlot(c.k);
      renderSaves();
    }
    return;
  }
  if (a === 'put' && !SV.local[k]) {
    putSlot(k);
    renderSaves();
    return;
  }
  if (a === 'reset') {
    SV.confirm = { k: 'reset', a: 'reset' };
    renderSaves();
    return;
  }
  if (a === 'camp') {
    SV.confirm = null;
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
      PREF[f] = !PREF[f];
      savePref();
      if (f === 'sound' && PREF.sound) sfx('ui');
      if (f === 'vibe' && PREF.vibe) vibe(30);
    }
    renderSaves();
    return;
  }
  if (a === 'tuto') {
    closeSaves();
    __set_scSel('tuto');
    go('combat');
    renderPrep();
    if (squad.length) launch();
    return;
  }
  if (['load', 'put', 'del'].includes(a)) {
    SV.confirm = { k, a };
    renderSaves();
  }
});


$('#saves').addEventListener('change', e => {
  if (e.target.id === 'svFile') importSave(e.target.files && e.target.files[0]);
});


/* Dans certaines applis le sélecteur de fichiers ne s’ouvre pas. Le bouton le détecte et ouvre la zone « Coller un code » (le texte du fichier .json y marche aussi). */
document.addEventListener('click', e => {
  const b = e.target.closest('[data-sv="importfile"]');
  if (!b) return;
  const i = $('#svFile');
  if (!i) return;
  let opened = false;
  const mark = () => (opened = true);
  window.addEventListener('blur', mark, { once: true });
  document.addEventListener('visibilitychange', mark, { once: true });
  i.addEventListener('change', mark, { once: true });
  i.addEventListener('cancel', mark, { once: true });
  try {
    i.click();
  } catch (er) {}
  setTimeout(() => {
    if (opened) return;
    toast('Le sélecteur de fichiers est bloqué ici : collez le texte de votre sauvegarde ci-dessous.');
    SV.code = { mode: 'paste' };
    renderSaves();
    const t = $('#svCode');
    if (t) t.focus();
  }, 1400);
});


$('#saves').addEventListener('input', e => {
  if (e.target.id === 'svName') {
    PROFILE.name = e.target.value.slice(0, 24);
    queueSave();
  }
});


document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('#saves').hidden) closeSaves();
});


['#sideSave', '#tbSave'].forEach(s => {
  const el = $(s);
  if (el) el.addEventListener('click', openSaves);
});


document.addEventListener('click', e => {
  const r = e.target.closest('#resumeHome [data-resume],#resumePrep [data-resume]');
  if (r) {
    resumeBattle();
    return;
  }
  const d = e.target.closest('#resumeHome [data-drop],#resumePrep [data-drop]');
  if (d) {
    SV.lastBattle = null;
    autoSave(true);
    renderSummary();
    toast('Combat abandonné.');
  }
});


(async function () {
  const C = window.claude;
  if (!C || typeof C.use !== 'function') return;
  let db = null,
    user = null;
  try {
    [db, user, SV.dl] = await Promise.all([C.use('db'), C.use('user'), C.use('downloads')]);
  } catch (e) {
    return;
  }
  if (!db || !user) return;
  let uid = null;
  try {
    uid = await user.id();
  } catch (e) {}
  if (!uid) return;
  SV.db = db;
  SV.uid = uid;
  for (const k of ['auto', ...SLOTS]) {
    try {
      const sn = await ref(k).get();
      if (sn.exists) {
        const d = JSON.parse(JSON.stringify(sn.data()));
        if (validSave(d)) SV.remote[k] = d;
      }
    } catch (e) {
      const c = e && e.code;
      if (c && c !== 'unavailable') {
        SV.db = null;
        svIndicator();
        return;
      }
    }
  }
  SV.cloud = true;
  const r = SV.remote.auto,
    l = SV.local.auto;
  if (r && (!l || r.savedAt > l.savedAt) && !SV.acted && !B) {
    applySave(r);
    SV.local.auto = r;
    lsSet('auto', r);
    SV.lastSig = sigOf(r);
    toast('Partie synchronisée depuis votre compte.');
  } else if (l && (!r || l.savedAt > r.savedAt)) pushRemote('auto', l, true);
  for (const k of SLOTS) {
    const rr = SV.remote[k],
      ll = SV.local[k];
    if (rr && (!ll || rr.savedAt >= ll.savedAt)) {
      SV.local[k] = rr;
      lsSet(k, rr);
    } else if (ll && (!rr || ll.savedAt > rr.savedAt)) pushRemote(k, ll, true);
  }
  svIndicator();
  if (!$('#saves').hidden) renderSaves();
})();
}
