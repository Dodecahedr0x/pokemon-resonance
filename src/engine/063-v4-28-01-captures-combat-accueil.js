/* Section d'origine : v4.28-01-captures-combat-accueil.js */

import { BY, SCEN } from './009-03-pokemon.js';
import { PROFILE, isCamp } from './011-05-etat-de-partie.js';
import { $, RM, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { cur } from './016-09-navigation.js';
import { TOD } from './017-10-accueil-route.js';
import { openSheet, squad } from './020-13-equipe-cartes.js';
import { byUid } from './021-14-moteur-combat.js';
import { B, renderAll, ui } from './024-17-interface-combat.js';
import { queueSave } from './025-19-sauvegardes.js';
import { PREF, savePref, sfx, vibe } from './026-20-campagne-tutoriel-son.js';
import { today } from './032-v4-00-socle.js';
import { renderWallet } from './035-v4-03-interface.js';
import { renderHome } from './036-v4-04-accueil.js';
import { isShinyOwned } from './043-v4-4-01-aventure-plus.js';
import { JCHAIN } from './054-v4-15-01-johto.js';
import { coeurs417, compGain417, compId417, renderCompBox417 } from './057-v4-17-01-compagnons-et-resonance.js';
import { refreshAccueil } from '../screens/accueil/accueilStore.js';
import { HCHAIN } from './059-v4-19-01-hoenn.js';
import { REGN421, lieuCapture421, poolRegion421, regionNo421 } from './061-v4-21-01-capture-partout.js';
import { evoSet } from '../screens/combat/board/boardStore.js';
import { refreshBattle } from '../screens/combat/battle/battleStore.js';



/* =====================================================================
   v4.28
   1. Suivi des captures : « Route 29 · 14 / 22 familles », les Pokémon qui
      manquent sur chaque route (silhouettes), compteurs par région au
      Pokédex et un diplôme récompensé par région complétée.
   2. Combat rapide : bouton ×2 dans le combat, et « Passer » pendant le
      tour adverse (la phase adverse se joue en accéléré, mêmes règles).
   3. Accueil vivant : l'illustration suit la région de l'aventure et le
      moment de la journée ; le compagnon y attend, un câlin d'un geste.
   ===================================================================== */
export function V428_0() {
  return { dipl428: [] };
}


export function v428Clean(p) {
  const d = p && Array.isArray(p.dipl428) ? p.dipl428.filter(r => [1, 2, 3].includes(r)) : [];
  return { dipl428: [...new Set(d)] };
}

 // ₽, Éclats
function diplome428() {
  PROFILE.dipl428 = PROFILE.dipl428 || [];
  const nv = [];
  [1, 2, 3].forEach(r => {
    const c = famCapt428(r);
    if (c.t && c.n >= c.t && !PROFILE.dipl428.includes(r)) {
      PROFILE.dipl428.push(r);
      nv.push(r);
    }
  });
  return nv;
}


/** Hors combat (Parc Safari, démarrage) : la récompense est versée tout de suite. */
export function diplomeHors428() {
  const nv = diplome428();
  if (!nv.length) return;
  const [m, g] = gainDipl428(nv);
  PROFILE.money = Math.min(999999, (PROFILE.money || 0) + m);
  PROFILE.gems = Math.min(99999, (PROFILE.gems || 0) + g);
  toast(`Pokédex de ${nv.map(r => REGN421[r]).join(' et ')} complet ! +${m} ₽ · +${g} Éclats`);
  sfx('ui');
  queueSave();
  setTimeout(renderWallet, 0);
}


// compteurs par région du Pokédex (ancien regCnt428) : src/screens/dex/DexList.jsx (DexCount)


// Familles capturées sur la route (#cp428, sous la carte) : src/screens/carte/Captures.jsx.


export function rapide428() {
  if (!B) return;
  if (!ui.busy) ui.turbo428 = false;
  refreshBattle('fast'); // #bFast (aria-pressed) : rendu par React (TopBar.jsx)
}


function heroReg428(g) {
  if (!isCamp()) return regionNo421();
  const k = g.k,
    S = SCEN[k] || {};
  if (HCHAIN.includes(k) || S.hoenn != null) return 3;
  if (JCHAIN.includes(k) || /^j/.test(k) || S.johto != null || S.roam) return 2;
  return 1;
}


/** Accueil vivant : décor du héros selon la région et l'heure, compagnon (rendu : src/screens/accueil/Heros.jsx). */
export function hero428(g) {
  const r = heroReg428(g),
    id = compId417() || squad[0] || '',
    m = BY[id],
    comp = !!compId417();
  return {
    reg: ['', 'kanto', 'johto', 'hoenn'][r],
    tod: TOD,
    tag: `${REGN421[r]} · ${TODN428[TOD] || 'Jour'}`,
    m,
    comp,
    sh: comp && isShinyOwned(m.base),
    coeurs: comp ? coeurs417(PROFILE.comp.aff || 0) : 0
  };
}

/* ---------- 1. suivi des captures ---------- */
export const famCapt428 = r => {
  const L = poolRegion421(r);
  return { L, n: L.filter(m => PROFILE.box.includes(m.id)).length, t: L.length };
};


export const DIPL428 = { 1: [5000, 40], 2: [6000, 50], 3: [4000, 40] };


const gainDipl428 = nv => nv.reduce((a, r) => [a[0] + DIPL428[r][0], a[1] + DIPL428[r][1]], [0, 0]);


/* ---------- 2. combat rapide ---------- */
export const dl428 = (rm, fast, slow) => (RM || ui.turbo428 ? rm : PREF.fast ? fast : slow);


export const tourAdverse428 = () =>
  !!(B && !B.over && ui.busy && !ui.cine && (B.phase === 'enemy' || (B.ordre === 'vitesse' && ui.act && (byUid(B, ui.act) || {}).side === 'e')));


/* ---------- 3. accueil vivant ---------- */
const TODN428 = { matin: 'Matin', jour: 'Jour', nuit: 'Nuit' };

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {


CROCHETS.progres.push((S, rew) => {
  const nv = diplome428();
  if (!nv.length) return null;
  rew.dipl428 = nv;
  return gainDipl428(nv);
});


CROCHETS.resultat.push(r =>
  r.dipl428
    ? `<div class="res-l"><h4>Pokédex régional</h4>${r.dipl428
        .map(x => `<div class="rl"><span>${REGN421[x]} : les ${famCapt428(x).t} familles sont capturées !</span><b>+${DIPL428[x][0]} ₽ · +${DIPL428[x][1]} Éclats</b></div>`)
        .join('')}</div>`
    : ''
);


document.addEventListener('click', e => {
  const b = e.target.closest('[data-cp428]');
  if (!b) return;
  const id = b.dataset.cp428;
  if (PROFILE.box.includes(id)) openSheet(id);
  else toast(`Ce Pokémon vit sur la ${lieuCapture421(id)}. Touchez « ! » quand l’herbe bouge, ou pêchez s’il aime l’eau.`);
});


document.addEventListener('click', e => {
  if (e.target.closest('#bFast')) {
    PREF.fast = !PREF.fast;
    savePref();
    rapide428();
    toast(PREF.fast ? 'Combat rapide : animations ×2' : 'Vitesse normale');
    return;
  }
  if (e.target.closest('#bEnd') && tourAdverse428() && !ui.turbo428) {
    ui.turbo428 = true;
    evoSet({ fast: true }); // #evoFx (React)
    renderAll();
  }
});


document.addEventListener('click', e => {
  const b = e.target.closest('[data-hv428]');
  if (b) {
    if (b.dataset.hv428 === 'choisir' || !compId417()) {
      renderCompBox417();
      $('#compBox').hidden = false;
      return;
    }
    b.classList.remove('pop');
    void b.offsetWidth;
    b.classList.add('pop');
    const n = BY[compId417()].n;
    if (PROFILE.comp.j === today()) {
      toast(`${n} est déjà tout content aujourd’hui.`);
      return;
    }
    PROFILE.comp.j = today();
    const up = compGain417(3);
    sfx('ui');
    vibe(25);
    toast(up ? `${n} est ravi : ${up} cœur${up > 1 ? 's' : ''} !` : `${n} ferme les yeux de bonheur.`);
    queueSave();
    refreshAccueil();
    return;
  }
  if (e.target.closest('[data-comp-p]')) setTimeout(() => cur === 'accueil' && renderHome(), 0);
});

}
