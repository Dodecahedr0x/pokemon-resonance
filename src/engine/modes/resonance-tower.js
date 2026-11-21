import { GYMS } from '../data/game-data.js';
import { POKEMON, EEVEE, POKEMON_LIST, SCENARIOS } from '../pokemon/pokemon.js';
import { ITEMS2, PROFILE } from '../state/game-state.js';
import { paintOverlay } from '../../screens/overlays/dialogsStore.js';
import { $, mulberry32 } from '../core/utils.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { B, __set_scSel, backToPrep, chooseBattle, launch } from '../combat/ui.js';
import { queueSave } from '../state/saves.js';
import { __set_PREPG, renderPrep } from '../combat/battle-prep.js';
import { chosenOrder } from '../combat/tactical-engine.js';
import { chosenAlive } from '../combat/living-board.js';
import { chosenTactic } from '../combat/tactics.js';
import { mutOfTurn, mutInfo } from '../combat/mutators.js';
import { charactersChosen } from '../team/characters.js';
import { LEGENDARIES } from './legendaries.js';
import { RIVAL_POS } from './rival.js';

/* Resonance Tower: endlessly replayable post-game ascent with a drafted team (added in v4.4). */

const TOWER_RULES = ['roche', 'eau', 'elec', 'plante', 'poison', 'psy', 'feu', 'sol'];

const TOWER_MAPS = [
  { water: ['4,2', '4,3'], rock: ['3,0', '3,5'] },
  { water: ['5,0', '5,1'], rock: ['3,4'] },
  { water: [], rock: ['3,1', '4,4'] },
  { water: ['3,2', '4,2', '3,3'], rock: [] },
  { water: ['5,4', '5,5'], rock: ['2,2', '4,1'] },
];

const TOWER_OBST = [
  { grass: ['2,2', '2,3'] },
  { pil: ['4,2'] },
  { sand: ['2,1', '2,4', '5,2'] },
  {},
  { pil: ['4,1', '4,4'] },
];

export const towerRun = () => (PROFILE.tdr && PROFILE.tdr.run) || null;

const towerPool = () => POKEMON_LIST.filter(m => !m.leg && m.id !== 'eevee');

/* Tower window: team choice and rewards (#tdrBox rendered by React, src/screens/overlays/TdrBox.jsx) */

const TOWER = { pick: [], cands: [], offer: [] };

/* ---------- reproducible randomness (Tower: a floor is rebuilt identically after a save) ---------- */
function rng(seed) {
  return mulberry32(seed >>> 0 || 1);
}

const pickOf = (r, a) => a[Math.floor(r() * a.length)];

export function towerIdle() {
  SCENARIOS.tdr = {
    n: 'Tour de Résonance',
    lvl: 'Après-jeu · ascension',
    lim: 10,
    time: 'nuit',
    bio: 'tour',
    water: [],
    rock: [],
    hb: 0,
    pb: 0,
    lv: 1,
    tower: true,
    d: `Choisissez 4 Pokémon parmi 8 tirés au hasard, puis montez le plus haut possible. Chaque étage est plus dur, une légende garde tous les 5 étages, et une récompense vous attend entre deux étages. Record : étage ${(PROFILE.tdr && PROFILE.tdr.best) || 0}.`,
    foes: [],
  };
  return SCENARIOS.tdr;
}

function towerBuild(run) {
  const f = run.floor,
    r = rng(run.seed * 31 + f * 977),
    map = pickOf(r, TOWER_MAPS),
    boss = f % 5 === 0;
  let foes,
    rule = null,
    at;
  if (boss) {
    const L = LEGENDARIES[(f / 5 - 1) % LEGENDARIES.length];
    foes = [
      [L.id, [6, 2], { boss: true, hb: 30 + f * 5, pb: Math.min(10, 3 + Math.floor(f / 3)) }],
      [L.minions[0], [7, 1]],
      [L.minions[1], [7, 4]],
    ];
    rule = L.rule;
    at = L.t[0];
  } else {
    const cap = f < 3 ? 1 : f < 7 ? 2 : 3,
      pool = towerPool().filter(m => m.st <= cap && (f < 7 || m.st >= cap - 1)),
      n = Math.min(5, 2 + Math.floor((f + 1) / 3)),
      families = new Set();
    foes = [];
    for (let i = 0; foes.length < n && i < 60; i++) {
      const m = pickOf(r, pool);
      if (families.has(m.base)) {
        continue;
      }
      families.add(m.base);
      foes.push([m.id, RIVAL_POS[foes.length]]); // same slots as the rival
    }
    if (f % 3 === 0) {
      rule = pickOf(r, TOWER_RULES);
    }
    at = POKEMON[foes[0][0]].t[0];
  }
  OBSTACLES.tdr = pickOf(r, TOWER_OBST);
  SCENARIOS.tdr = {
    n: `Tour · étage ${f}`,
    lvl: `Tour de Résonance · étage ${f}${boss ? ' · légende' : ''}`,
    lim: boss ? 11 : 10,
    time: r() < 0.5 ? 'jour' : 'nuit',
    bio: pickOf(r, ['gue', 'roche', 'arene', 'ligue', 'tour']),
    water: map.water,
    rock: map.rock,
    // difficulty climbs fast up to floor 15, then keeps climbing endlessly, more slowly
    hb: 2 + Math.min(f, 15) * 3 + Math.max(0, f - 15) * 5,
    pb: Math.min(8, Math.floor(f / 2)) + Math.floor(Math.max(0, f - 15) / 5),
    lv: Math.min(100, 8 + f * 4),
    rule,
    style: boss ? 'boss' : null,
    tower: true,
    at,
    mut: mutOfTurn(run, f), // one mutator per floor (v4.9)
    d: `${mutOfTurn(run, f) ? `Mutateur · ${mutInfo(mutOfTurn(run, f))[0]} : ${mutInfo(mutOfTurn(run, f))[1]} ` : ''}${boss ? `Étage de légende : ${POKEMON[foes[0][0]].n} garde le passage.` : `${foes.length} adversaires.`}${rule ? ` Règle du plateau : ${GYMS[TOWER_RULES.indexOf(rule)].r}` : ''} Votre équipe : ${run.team.map(id => POKEMON[id].n).join(', ')}${run.voice ? ` · +${run.voice} Voix` : ''}.`,
    foes,
  };
  return SCENARIOS.tdr;
}

export function towerRestore() {
  const run = towerRun();
  return run ? towerBuild(run) : towerIdle();
}

/* team and battle options of the current ascent */
export function towerTeam() {
  const run = towerRun();
  if (!run) {
    return null;
  }
  const items = {};
  run.team.forEach(id => {
    const b = POKEMON[id].base;
    if (run.items[id]) {
      items[b] = run.items[id];
    }
  });
  return {
    team: run.team.slice(0, 4),
    voice: run.voice,
    opts: {
      diff: PROFILE.diff,
      items,
      fatigue: {},
      links: {},
      order: chosenOrder(),
      livingBoard: chosenAlive(),
      tactics: chosenTactic(),
      characters: charactersChosen(),
    },
  };
}

export function towerDraft() {
  const seed = Math.floor(Math.random() * 1e9),
    r = rng(seed),
    pool = towerPool().filter(m => m.st <= 2 && !m.isEnemy),
    families = new Set(),
    c = [];
  for (let i = 0; c.length < 8 && i < 200; i++) {
    const m = pickOf(r, pool);
    if (families.has(m.base)) {
      continue;
    }
    families.add(m.base);
    c.push(m.id);
  }
  Object.assign(TOWER, { seed, cands: c, pick: [] });
  renderDraft();
  $('#tdrBox').hidden = false;
}

/* rendered by src/screens/overlays/TdrBox.jsx */
function renderDraft() {
  paintOverlay('tdr', { mode: 'draft', cands: [...TOWER.cands], pick: [...TOWER.pick] });
}

function towerOffer(run) {
  const r = rng(run.seed * 7 + run.floor * 131),
    o = [];
  if (run.voice < 2) {
    o.push({ k: 'voix', t: '+1 Voix', d: 'Pour tout le reste de l’ascension.' });
  }
  const free = run.team.filter(id => !run.items[id]);
  if (free.length) {
    const id = pickOf(r, free),
      it = pickOf(r, Object.keys(ITEMS2));
    o.push({ k: 'item', id, it, t: `${ITEMS2[it].n} pour ${POKEMON[id].n}`, d: ITEMS2[it].d });
  }
  const evo = run.team.filter(id => POKEMON[id].nx);
  if (evo.length) {
    const id = pickOf(r, evo),
      nx =
        POKEMON[id].nx === 'eevee'
          ? Object.values(EEVEE)
          : Array.isArray(POKEMON[id].nx)
            ? POKEMON[id].nx
            : [POKEMON[id].nx],
      to = pickOf(r, nx);
    o.push({
      k: 'evo',
      id,
      to,
      t: `${POKEMON[id].n} devient ${POKEMON[to].n}`,
      d: 'Éveil définitif pour toute l’ascension.',
    });
  } else {
    const pool = towerPool().filter(m => m.st >= 2 && !m.isEnemy && !run.team.some(x => POKEMON[x].base === m.base)),
      nw = pickOf(r, pool),
      out = run.team.reduce((a, b) =>
        POKEMON[a].s.reduce((x, y) => x + y) <= POKEMON[b].s.reduce((x, y) => x + y) ? a : b
      );
    o.push({
      k: 'swap',
      id: out,
      to: nw.id,
      t: `${POKEMON[nw.id].n} remplace ${POKEMON[out].n}`,
      d: 'Une recrue confirmée rejoint l’ascension.',
    });
  }
  return o;
}

function towerReward() {
  const run = towerRun();
  if (!run) {
    return;
  }
  TOWER.offer = towerOffer(run);
  paintOverlay('tdr', { mode: 'reward', floor: run.floor, offer: TOWER.offer });
  $('#tdrBox').hidden = false;
}

/* climb to the current floor */
function towerClimb() {
  const run = towerRun();
  if (!run) {
    return;
  }
  if (run.reward) {
    towerReward();
    return;
  }
  towerBuild(run);
  queueSave();
  if (B) {
    backToPrep();
  }
  chooseBattle('tdr');
  launch();
}

function onTowerBoxClick(e) {
  const p = e.target.closest('[data-tdrp]');
  if (p) {
    const id = p.dataset.tdrp,
      i = TOWER.pick.indexOf(id);
    if (i >= 0) {
      TOWER.pick.splice(i, 1);
    } else if (TOWER.pick.length < 4) {
      TOWER.pick.push(id);
    }
    renderDraft();
    return;
  }
  const rw = e.target.closest('[data-tdrr]');
  if (rw) {
    const run = towerRun(),
      x = TOWER.offer[+rw.dataset.tdrr];
    if (!run || !x) {
      return;
    }
    if (x.k === 'voix') {
      run.voice = Math.min(2, run.voice + 1);
    }
    if (x.k === 'item') {
      run.items[x.id] = x.it;
    }
    if (x.k === 'evo' || x.k === 'swap') {
      const i = run.team.indexOf(x.id);
      if (i >= 0) {
        run.team[i] = x.to;
      }
      if (run.items[x.id]) {
        run.items[x.to] = run.items[x.id];
        delete run.items[x.id];
      }
    }
    run.reward = false;
    $('#tdrBox').hidden = true;
    towerClimb();
    return;
  }
  const b = e.target.closest('[data-tdr]');
  if (!b && e.target.id !== 'tdrBox') {
    return;
  }
  const a = b ? b.dataset.tdr : 'x';
  if (a === 'x') {
    if (!towerRun() || !towerRun().reward) {
      $('#tdrBox').hidden = true;
    }
    return;
  }
  if (a === 'go' && TOWER.pick.length === 4) {
    PROFILE.tdr.run = { seed: TOWER.seed, floor: 1, team: [...TOWER.pick], voice: 0, items: {}, reward: false };
    $('#tdrBox').hidden = true;
    towerClimb();
  }
}

/* Tower result screen buttons: rendered by React (src/screens/combat/battle/Result.jsx) */

// Statements run at startup, in the original order (see index.js).
export function init() {
  $('#tdrBox').addEventListener('click', onTowerBoxClick);

  $('#cbResult').addEventListener(
    'click',
    e => {
      const b = e.target.closest('[data-tdrn]');
      if (!b) {
        return;
      }
      e.stopPropagation();
      backToPrep();
      __set_scSel('tdr');
      __set_PREPG({ g: 'apres', sc: 'tdr' });
      renderPrep();
      if (b.dataset.tdrn === 'reward') {
        towerReward();
      } else {
        towerDraft();
      }
    },
    true
  );
}
