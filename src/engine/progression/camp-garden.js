/* =====================================================================
   The Camp Garden (added in v4.17): three berry plots at the Camp
   (Campaign), harvested after a number of battles, watered once a day.
   ===================================================================== */
import { PROFILE } from '../state/game-state.js';
import { toast } from '../core/utils.js';
import { queueSave } from '../state/saves.js';
import { sfx, vibrate } from '../audio/sound-effects.js';
import { SHOP, bagCount, today } from '../state/economy.js';
import { renderWallet } from '../ui/wallet.js';
import { MACHINES } from '../moves/tms.js';
import { renderCampBase } from './base-camp.js';
import { campOpen } from './camp.js';

let POT_I;
export { POTAGER, plotSprout, POT_I }; // read by the Camp Garden (src/screens/camp)

const POTAGER = {
  oran: { n: 'Baie Oran', p: 200, duration: 3, d: '3 Baies Oran (soin en combat)' },
  sitrus: { n: 'Baie Sitrus', p: 600, duration: 5, d: 'une Baie Sitrus (objet tenu), sinon 3 Baies Oran et 2 Éclats' },
  mystere: { n: 'Graine mystère', p: 400, duration: 6, d: 'une surprise : Éclats, Balls ou une CT' },
};

const plotSprout = x => (x ? Math.max(0, x.fin - PROFILE.battles) : 0);

function plantSeed(i, g) {
  const G = POTAGER[g];
  if (!campOpen() || !G || PROFILE.garden[i]) {
    return;
  }
  if (PROFILE.money < G.p) {
    return void toast('Pas assez de Pokédollars.');
  }
  PROFILE.money -= G.p;
  PROFILE.garden[i] = { g, fin: PROFILE.battles + G.duration };
  sfx('ui');
  toast(`${G.n} plantée : récolte dans ${G.duration} combats.`);
  queueSave();
  renderWallet();
  renderCampBase();
}

function harvestPlot(i) {
  const x = PROFILE.garden[i];
  if (!x || plotSprout(x) > 0) {
    return;
  }
  const add = (k, n) => SHOP[k] && (PROFILE.bag[k] = Math.min(99, bagCount(k) + n));
  let txt = '';
  if (x.g === 'oran') {
    add('baieoran', 3);
    txt = '3 Baies Oran';
  } else if (x.g === 'sitrus') {
    if (!PROFILE.items.includes('sitrus')) {
      PROFILE.items.push('sitrus');
      txt = 'une Baie Sitrus (objet tenu)';
    } else {
      add('baieoran', 3);
      PROFILE.gems = Math.min(99999, PROFILE.gems + 2);
      txt = '3 Baies Oran et 2 Éclats';
    }
  } else {
    const r = Math.random(),
      cts = Object.keys(MACHINES).filter(k => SHOP[k] && !MACHINES[k].cs);
    if (r < 0.2 && cts.length) {
      const k = cts[Math.floor(Math.random() * cts.length)];
      add(k, 1);
      txt = SHOP[k].n;
    } else if (r < 0.6) {
      add('super', 3);
      txt = '3 Super Balls';
    } else {
      const g = 3 + Math.floor(Math.random() * 4);
      PROFILE.gems = Math.min(99999, PROFILE.gems + g);
      txt = `${g} Éclats`;
    }
  }
  PROFILE.garden[i] = null;
  sfx('ui');
  vibrate(20);
  toast(`Récolte : ${txt} !`);
  queueSave();
  renderWallet();
  renderCampBase();
}

function waterGarden() {
  if (!campOpen() || PROFILE.watered === today()) {
    return;
  }
  PROFILE.watered = today();
  let n = 0;
  PROFILE.garden.forEach(x => {
    if (x && plotSprout(x) > 0) {
      x.fin--;
      n++;
    }
  });
  toast(n ? 'Le Potager est arrosé : une récolte plus tôt.' : 'Rien à arroser pour l’instant.');
  queueSave();
  renderCampBase();
}

// the base Camp Garden is rendered by React: src/screens/camp/CampBase.jsx

// Statements run at startup, in the original order (see index.js).
export function init() {
  POT_I = -1;

  document.addEventListener('click', e => {
    const i = e.target.closest('[data-pot-i]');
    if (i) {
      POT_I = +i.dataset.potI;
      renderCampBase();
      return;
    }
    const g = e.target.closest('[data-pot-g]');
    if (g && POT_I >= 0) {
      const k = POT_I;
      POT_I = -1;
      plantSeed(k, g.dataset.potG);
      return;
    }
    if (e.target.closest('[data-pot-x]')) {
      POT_I = -1;
      renderCampBase();
      return;
    }
    const r = e.target.closest('[data-pot-r]');
    if (r) {
      return void harvestPlot(+r.dataset.potR);
    }
    if (e.target.closest('[data-pot-eau]')) {
      waterGarden();
    }
  });
}
