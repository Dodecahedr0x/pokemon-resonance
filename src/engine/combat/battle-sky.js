import { WEATHER } from '../data/game-data.js';
import { WEATHER_NAME } from '../pokemon/pokemon.js';
import { getHost, hostSet } from '../../screens/combat/board/boardStore.js';
import { battle, ui } from './ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { LIVING_DESC, LIVING_STATE, LIVING_NAME } from './living-board.js';
import { deployRender } from './deployment.js';

/* =====================================================================
   Battle sky (added in v4.30): a permanent logo (time, weather) and an
   announcement when the time or weather changes.
   ===================================================================== */
function skyState(S) {
  return { ph: S.cycle ? S.cycle.ph : S.time === 'nuit' ? 'nuit' : 'jour', wx: S.wx && S.wx.n > 0 ? S.wx.k : '' };
}

function weatherInfo(k) {
  const w = WEATHER.find(x => x.n === WEATHER_NAME[k]);
  return w ? w.d : '';
}

function renderSky() {
  const bd = document.getElementById('bBoard');
  if (!bd || !battle) {
    return;
  }
  const E = skyState(battle);
  // #skyBanner: rendered by React (Board.jsx)
  const [ic, co] = SKY_STYLES[E.ph] || SKY_STYLES.jour,
    w = E.wx && SKY_STYLES[E.wx];
  const sky = {
    ic,
    co,
    ti: LIVING_NAME[E.ph] || '',
    w: w ? [w[0], w[1], WEATHER_NAME[E.wx]] : null,
    displayName: (LIVING_NAME[E.ph] || 'Jour') + (w ? ' · ' + WEATHER_NAME[E.wx] + ' ' + battle.wx.n : ''),
    vent: !!battle.vent,
  };
  if (JSON.stringify(sky) !== JSON.stringify(getHost().ciel)) {
    hostSet({ ciel: sky });
  }
  // announcement when the time or weather changes
  const prevSky = battle.skyBanner;
  battle.skyBanner = E;
  if (!prevSky || battle.over) {
    return;
  }
  if (prevSky.ph !== E.ph) {
    announceSky(SKY_STYLES[E.ph], LIVING_STATE[E.ph] || LIVING_NAME[E.ph], LIVING_DESC[E.ph] || '');
  } else if (prevSky.wx !== E.wx) {
    E.wx
      ? announceSky(SKY_STYLES[E.wx], `${WEATHER_NAME[E.wx]} · ${battle.wx.n} manches`, weatherInfo(E.wx))
      : announceSky(['i-sol', '#cfe6ff'], 'Le ciel se dégage', 'La météo est terminée.');
  }
}

export function announceSky(ic, heading, text) {
  const bd = document.getElementById('bBoard');
  if (!bd || !ic) {
    return;
  }
  // #skyBannerBox: rendered by React (Board.jsx); the « on » class is removed then set again to restart the animation
  const b = { ic: [ic[0], ic[1]], titre: heading, bodyText: text, on: false };
  hostSet({ skyBanner: b });
  void bd.offsetWidth;
  hostSet({ skyBanner: { ...b, on: true } });
  clearTimeout(announceSky.t);
  announceSky.t = setTimeout(
    () => {
      const c = getHost().skyBanner;
      if (c) {
        hostSet({ skyBanner: { ...c, on: false } });
      }
    },
    PREFERENCES.fast || ui.skipSpeedup ? 1300 : 2400
  );
}

/* ---------- after each battle render: sky, then deployment ---------- */
export function afterRenderTactics() {
  if (!battle) {
    return;
  }
  try {
    renderSky();
    deployRender();
    // doctrine chip (#bWx): rendered by React (TopBar.jsx)
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

const SKY_STYLES = {
  jour: ['i-sol', '#f2c94c'],
  aube: ['i-aube', '#f0a6a0'],
  crepuscule: ['i-crep', '#e8774a'],
  nuit: ['i-lune', '#9aa8ff'],
  pluie: ['i-pluie', '#5aa9ff'],
  soleil: ['i-sol', '#ff9a3c'],
  grele: ['i-grele', '#9fe3ff'],
  sable: ['i-sable', '#d9b26a'],
};
