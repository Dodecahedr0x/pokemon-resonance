/* Adaptive rival, board themes (added in v4.55). */

import { BY, SCEN } from '../pokemon/pokemon.js';
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { HOOKS } from '../core/hooks.js';
import { squad } from '../team/team.js';
import { teff } from '../combat/engine.js';
import { B } from '../combat/ui.js';
import { PREF, savePref, sfx } from '../progression/campaign.js';
import { savePurse } from '../state/economy.js';
import { DEXS } from '../progression/pokedex.js';
import { renderParams } from '../ui/settings.js';
import { RIVAL_KEYS, rivalIdx } from './adventure.js';
import { RIVAL_CHALLENGES } from '../progression/quality.js';

/* ---------- 1. evolving rival ---------- */
export function rivalState() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-rival-record') || '{}');
  } catch (e) {
    s = {};
  }
  s.w = s.w || 0;
  s.l = s.l || 0;
  return s;
}

export function dominantType() {
  const c = {};
  (squad || []).forEach(id => {
    const m = BY[id];
    if (m) {
      m.t.forEach(t => (c[t] = (c[t] || 0) + 1));
    }
  });
  const e = Object.entries(c).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return e.length ? e[0][0] : null;
}

function pickCounter(T, rem, used) {
  const pw = id => BY[id].s.reduce((a, b) => a + b, 0),
    target = pw(rem);
  let best = null,
    bs = -1;
  DEXS.forEach(m => {
    if (m.c !== BY[rem].c || used.includes(m.id) || !BY[m.id] || m.id === rem) {
      return;
    }
    const e = Math.max(...m.t.map(t => teff(t, [T])));
    const d = Math.abs(pw(m.id) - target);
    if (e < 2 || d > 3) {
      return;
    }
    const sc = e * 10 - d;
    if (sc > bs) {
      bs = sc;
      best = m.id;
    }
  });
  return best;
}

export function adaptRival() {
  const s = rivalState(),
    lvl = Math.min(2, s.w),
    T = dominantType();
  if (!lvl || !T) {
    return;
  }
  const keys = [...RIVAL_KEYS, ...Object.keys(RIVAL_CHALLENGES).filter(k => k !== 'hd429')];
  keys.forEach(k => {
    const D = SCEN[k];
    if (!D || !D.foes || D._rivalDone) {
      return;
    }
    const done = [];
    for (let n = 0; n < lvl; n++) {
      const j = D.foes.length - 1 - n;
      if (j < 1) {
        break;
      }
      const used = D.foes.map(f => f[0]),
        c = pickCounter(T, D.foes[j][0], used);
      if (c) {
        done.push(BY[c].n);
        D.foes[j] = [c, D.foes[j][1]];
      }
    }
    if (done.length) {
      D._rivalDone = 1;
      D.d += ` Il a étudié votre équipe, très ${T} : ${done.join(' et ')} ${done.length > 1 ? 'sont' : 'est'} là pour vous contrer.`;
    }
  });
}

function applyBoardTheme() {
  const k = BOARD_THEMES[PREF.boardTheme] ? PREF.boardTheme : 'classique';
  Object.keys(BOARD_THEMES).forEach(x =>
    document.body.classList.toggle('board-theme-' + x, x === k && k !== 'classique')
  );
}

/* ---------- 2. board themes ---------- */
export const BOARD_THEMES = {
  classique: { n: 'Classique', p: 0, c: ['#4A3A28', '#2C4A27'] },
  crepuscule: { n: 'Crépuscule', p: 3, c: ['#3A2F4F', '#41355A'] },
  jardin: { n: 'Jardin', p: 3, c: ['#3C6B3A', '#437542'] },
  givre: { n: 'Givre', p: 5, c: ['#3F6E86', '#467993'] },
  braise: { n: 'Braise', p: 5, c: ['#6A3A2A', '#74422F'] },
  cristal: { n: 'Cristal', p: 8, c: ['#4A4478', '#524B84'] },
};

export const isThemeUnlocked = k => !BOARD_THEMES[k].p || (PREF.unlockedThemes || []).includes(k);

// Instructions run at startup, in the original order (see index.js).
export function init() {
  HOOKS.battleEnd.push(() => {
    if (B && B.over && !B._rivalDone && SCEN[B.sc] && (rivalIdx(B.sc) >= 0 || SCEN[B.sc].rivalFight)) {
      B._rivalDone = 1;
      const s = rivalState();
      if (B.over === 'win') {
        s.w++;
      } else {
        s.l++;
      }
      localStorage.setItem('res-rival-record', JSON.stringify(s));
    }
  });

  // "Thèmes de plateau" (Board themes) panel: rendered by React (src/screens/settings/panels/BoardThemes.jsx)

  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-board-theme-action]');
    if (!b) {
      return;
    }
    const [a, k] = b.dataset.boardThemeAction.split(':');
    if (!BOARD_THEMES[k]) {
      return;
    }
    if (a === 'buy') {
      if (isThemeUnlocked(k) || PROFILE.gems < BOARD_THEMES[k].p) {
        toast(isThemeUnlocked(k) ? 'Déjà débloqué' : 'Pas assez d’Éclats');
        return;
      }
      PROFILE.gems -= BOARD_THEMES[k].p;
      PREF.unlockedThemes = [...(PREF.unlockedThemes || []), k];
      PREF.boardTheme = k;
      toast('Thème « ' + BOARD_THEMES[k].n + ' » débloqué');
      savePurse();
    } else if (isThemeUnlocked(k)) {
      PREF.boardTheme = k;
    }
    savePref();
    applyBoardTheme();
    sfx('ui');
    renderParams();
  });

  applyBoardTheme();
}
