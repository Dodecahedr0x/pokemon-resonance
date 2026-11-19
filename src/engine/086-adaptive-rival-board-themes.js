/* Original section: 4.55: adaptive rival, board themes */

import { BY, SCEN } from './009-pokemon.js';
import { PROFILE } from './011-game-state.js';
import { toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { squad } from './020-team-cards.js';
import { teff } from './021-combat-engine.js';
import { B } from './024-combat-ui.js';
import { PREF, savePref, sfx } from './026-campaign-tutorial-sound.js';
import { savePurse } from './032-v4-foundation.js';
import { DEXS } from './038-pokedex.js';
import { renderParams } from './040-settings.js';
import { RIVAL_KEYS, rivalIdx } from './043-adventure-plus.js';
import { RIV429 } from './064-quality.js';



/* ---------- 1. evolving rival ---------- */
export function rvSt455() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-rv455') || '{}');
  } catch (e) {
    s = {};
  }
  s.w = s.w || 0;
  s.l = s.l || 0;
  return s;
}


export function typeDom455() {
  const c = {};
  (squad || []).forEach(id => {
    const m = BY[id];
    if (m) m.t.forEach(t => (c[t] = (c[t] || 0) + 1));
  });
  const e = Object.entries(c).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1));
  return e.length ? e[0][0] : null;
}


function counter455(T, rem, used) {
  const pw = id => BY[id].s.reduce((a, b) => a + b, 0),
    target = pw(rem);
  let best = null,
    bs = -1;
  DEXS.forEach(m => {
    if (m.c !== BY[rem].c || used.includes(m.id) || !BY[m.id] || m.id === rem) return;
    const e = Math.max(...m.t.map(t => teff(t, [T])));
    const d = Math.abs(pw(m.id) - target);
    if (e < 2 || d > 3) return;
    const sc = e * 10 - d;
    if (sc > bs) {
      bs = sc;
      best = m.id;
    }
  });
  return best;
}


export function rivAdapt455() {
  const s = rvSt455(),
    lvl = Math.min(2, s.w),
    T = typeDom455();
  if (!lvl || !T) return;
  const keys = [...RIVAL_KEYS, ...Object.keys(RIV429).filter(k => k !== 'hd429')];
  keys.forEach(k => {
    const D = SCEN[k];
    if (!D || !D.foes || D._rv455) return;
    const done = [];
    for (let n = 0; n < lvl; n++) {
      const j = D.foes.length - 1 - n;
      if (j < 1) break;
      const used = D.foes.map(f => f[0]),
        c = counter455(T, D.foes[j][0], used);
      if (c) {
        done.push(BY[c].n);
        D.foes[j] = [c, D.foes[j][1]];
      }
    }
    if (done.length) {
      D._rv455 = 1;
      D.d += ` Il a étudié votre équipe, très ${T} : ${done.join(' et ')} ${done.length > 1 ? 'sont' : 'est'} là pour vous contrer.`;
    }
  });
}


function thApply455() {
  const k = TH455[PREF.th455] ? PREF.th455 : 'classique';
  Object.keys(TH455).forEach(x => document.body.classList.toggle('th455-' + x, x === k && k !== 'classique'));
}

/* ---------- 2. board themes ---------- */
export const TH455 = {
  classique: { n: 'Classique', p: 0, c: ['#4A3A28', '#2C4A27'] },
  crepuscule: { n: 'Crépuscule', p: 3, c: ['#3A2F4F', '#41355A'] },
  jardin: { n: 'Jardin', p: 3, c: ['#3C6B3A', '#437542'] },
  givre: { n: 'Givre', p: 5, c: ['#3F6E86', '#467993'] },
  braise: { n: 'Braise', p: 5, c: ['#6A3A2A', '#74422F'] },
  cristal: { n: 'Cristal', p: 8, c: ['#4A4478', '#524B84'] }
};


export const thOk455 = k => !TH455[k].p || (PREF.thU455 || []).includes(k);

// Instructions run at startup, in the original order (see index.js).
export function __init() {

HOOKS.finCombat.push(() => {
  if (B && B.over && !B._rv455 && SCEN[B.sc] && (rivalIdx(B.sc) >= 0 || SCEN[B.sc].rival429)) {
    B._rv455 = 1;
    const s = rvSt455();
    if (B.over === 'win') s.w++;
    else s.l++;
    localStorage.setItem('res-rv455', JSON.stringify(s));
  }
});


// "Thèmes de plateau" (Board themes) panel: rendered by React (src/screens/settings/panels/BoardThemes.jsx)


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-b455]');
  if (!b) return;
  const [a, k] = b.dataset.b455.split(':');
  if (!TH455[k]) return;
  if (a === 'buy') {
    if (thOk455(k) || PROFILE.gems < TH455[k].p) {
      toast(thOk455(k) ? 'Déjà débloqué' : 'Pas assez d’Éclats');
      return;
    }
    PROFILE.gems -= TH455[k].p;
    PREF.thU455 = [...(PREF.thU455 || []), k];
    PREF.th455 = k;
    toast('Thème « ' + TH455[k].n + ' » débloqué');
    savePurse();
  } else if (thOk455(k)) PREF.th455 = k;
  savePref();
  thApply455();
  sfx('ui');
  renderParams();
});


thApply455();

}
