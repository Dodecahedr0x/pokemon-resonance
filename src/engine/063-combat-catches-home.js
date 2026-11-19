/* Original section: v4.28-01-battle-catches-home.js */

import { BY, SCEN } from './009-pokemon.js';
import { PROFILE, isCamp } from './011-game-state.js';
import { $, RM, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { cur } from './016-navigation.js';
import { TOD } from './017-home-route.js';
import { openSheet, squad } from './020-team-cards.js';
import { byUid } from './021-combat-engine.js';
import { B, renderAll, ui } from './024-combat-ui.js';
import { queueSave } from './025-saves.js';
import { PREF, savePref, sfx, vibe } from './026-campaign-tutorial-sound.js';
import { today } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { renderHome } from './036-home.js';
import { isShinyOwned } from './043-adventure-plus.js';
import { JCHAIN } from './054-johto.js';
import { hearts417, companionGain417, companionId417, renderCompBox417 } from './057-companions-resonance.js';
import { refreshHome } from '../screens/home/homeStore.js';
import { HCHAIN } from './059-hoenn.js';
import { REGION_NAMES421, captureSite421, poolRegion421, regionNo421 } from './061-catch-anywhere.js';
import { evoSet } from '../screens/combat/board/boardStore.js';
import { refreshBattle } from '../screens/combat/battle/battleStore.js';



/* =====================================================================
   v4.28
   1. Catch tracking: « Route 29 · 14 / 22 families », the Pokémon
      missing on each route (silhouettes), per-region counters in the
      Pokédex and a diploma rewarded for each completed region.
   2. Quick battle: ×2 button in battle, and « Passer » (Skip) during the
      opponent turn (the opponent phase plays sped up, same rules).
   3. Living Home: the illustration follows the adventure region and the
      time of day; the companion waits there, a hug with one gesture.
   ===================================================================== */
export function V428_0() {
  return { dipl428: [] };
}


export function v428Clean(p) {
  const d = p && Array.isArray(p.dipl428) ? p.dipl428.filter(r => [1, 2, 3].includes(r)) : [];
  return { dipl428: [...new Set(d)] };
}

 // ₽, Shards
function diploma428() {
  PROFILE.dipl428 = PROFILE.dipl428 || [];
  const nv = [];
  [1, 2, 3].forEach(r => {
    const c = familyCapt428(r);
    if (c.t && c.n >= c.t && !PROFILE.dipl428.includes(r)) {
      PROFILE.dipl428.push(r);
      nv.push(r);
    }
  });
  return nv;
}


/** Outside battle (Safari Park, startup): the reward is paid out immediately. */
export function diplomaOut428() {
  const nv = diploma428();
  if (!nv.length) return;
  const [m, g] = rewardDiploma428(nv);
  PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
  PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
  toast(`Pokédex de ${nv.map(r => REGION_NAMES421[r]).join(' et ')} complet ! +${m} ₽ · +${g} Éclats`);
  sfx('ui');
  queueSave();
  setTimeout(renderWallet, 0);
}


// Pokédex per-region counters (formerly regCnt428): src/screens/dex/DexList.jsx (DexCount)


// Families caught on the route (#cp428, under the map): src/screens/map/Captures.jsx.


export function quick428() {
  if (!B) return;
  if (!ui.busy) ui.turbo428 = false;
  refreshBattle('fast'); // #bFast (aria-pressed): rendered by React (TopBar.jsx)
}


function heroReg428(g) {
  if (!isCamp()) return regionNo421();
  const k = g.k,
    S = SCEN[k] || {};
  if (HCHAIN.includes(k) || S.hoenn != null) return 3;
  if (JCHAIN.includes(k) || /^j/.test(k) || S.johto != null || S.roam) return 2;
  return 1;
}


/** Living Home: hero backdrop according to region and time, companion (render: src/screens/home/Hero.jsx). */
export function hero428(g) {
  const r = heroReg428(g),
    id = companionId417() || squad[0] || '',
    m = BY[id],
    comp = !!companionId417();
  return {
    reg: ['', 'kanto', 'johto', 'hoenn'][r],
    tod: TOD,
    tag: `${REGION_NAMES421[r]} · ${TODN428[TOD] || 'Jour'}`,
    m,
    comp,
    sh: comp && isShinyOwned(m.base),
    coeurs: comp ? hearts417(PROFILE.comp.aff || 0) : 0
  };
}

/* ---------- 1. catch tracking ---------- */
export const familyCapt428 = r => {
  const L = poolRegion421(r);
  return { L, n: L.filter(m => PROFILE.box.includes(m.id)).length, t: L.length };
};


export const DIPL428 = { 1: [5000, 40], 2: [6000, 50], 3: [4000, 40] };


const rewardDiploma428 = nv => nv.reduce((a, r) => [a[0] + DIPL428[r][0], a[1] + DIPL428[r][1]], [0, 0]);


/* ---------- 2. quick battle ---------- */
export const dl428 = (rm, fast, slow) => (RM || ui.turbo428 ? rm : PREF.fast ? fast : slow);


export const enemyTurn428 = () =>
  !!(B && !B.over && ui.busy && !ui.cine && (B.phase === 'enemy' || (B.ordre === 'vitesse' && ui.act && (byUid(B, ui.act) || {}).side === 'e')));


/* ---------- 3. living home ---------- */
const TODN428 = { matin: 'Matin', jour: 'Jour', nuit: 'Nuit' };

// Statements run at startup, in the original order (see index.js).
export function __init() {


HOOKS.progres.push((S, rew) => {
  const nv = diploma428();
  if (!nv.length) return null;
  rew.dipl428 = nv;
  return rewardDiploma428(nv);
});


HOOKS.resultat.push(r =>
  r.dipl428
    ? `<div class="res-l"><h4>Pokédex régional</h4>${r.dipl428
        .map(x => `<div class="rl"><span>${REGION_NAMES421[x]} : les ${familyCapt428(x).t} familles sont capturées !</span><b>+${DIPL428[x][0]} ₽ · +${DIPL428[x][1]} Éclats</b></div>`)
        .join('')}</div>`
    : ''
);


document.addEventListener('click', e => {
  const b = e.target.closest('[data-cp428]');
  if (!b) return;
  const id = b.dataset.cp428;
  if (PROFILE.box.includes(id)) openSheet(id);
  else toast(`Ce Pokémon vit sur la ${captureSite421(id)}. Touchez « ! » quand l’herbe bouge, ou pêchez s’il aime l’eau.`);
});


document.addEventListener('click', e => {
  if (e.target.closest('#bFast')) {
    PREF.fast = !PREF.fast;
    savePref();
    quick428();
    toast(PREF.fast ? 'Combat rapide : animations ×2' : 'Vitesse normale');
    return;
  }
  if (e.target.closest('#bEnd') && enemyTurn428() && !ui.turbo428) {
    ui.turbo428 = true;
    evoSet({ fast: true }); // #evoFx (React)
    renderAll();
  }
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-hv428]');
  if (b) {
    if (b.dataset.hv428 === 'choisir' || !companionId417()) {
      renderCompBox417();
      $('#compBox').hidden = false;
      return;
    }
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    const n = BY[companionId417()].n;
    if (PROFILE.comp.j === today()) {
      toast(`${n} est déjà tout content aujourd’hui.`);
      return;
    }
    PROFILE.comp.j = today();
    const up = companionGain417(3);
    sfx('ui');
    vibe(25);
    toast(up ? `${n} est ravi : ${up} cœur${up > 1 ? 's' : ''} !` : `${n} ferme les yeux de bonheur.`);
    queueSave();
    refreshHome();
    return;
  }
  if (e.target.closest('[data-comp-p]')) setTimeout(() => cur === 'accueil' && renderHome(), 0);
});

}
