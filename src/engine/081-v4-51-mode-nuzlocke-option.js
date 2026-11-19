/* Section d'origine : v4.51 : mode Nuzlocke (option) */

import { BY, SCEN } from './009-03-pokemon.js';
import { BUDGET } from './010-04-evolution-en-combat.js';
import { PROFILE } from './011-05-etat-de-partie.js';
import { ecrireLS, toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { __set_squad, squad } from './020-13-equipe-cartes.js';
import { B } from './024-17-interface-combat.js';
import { queueSave } from './025-19-sauvegardes.js';
import { PREF, savePref } from './026-20-campagne-tutoriel-son.js';
import { V4, today } from './032-v4-00-socle.js';
import { renderParams } from './040-v4-08-parametres.js';

export let nzConf450;


export function nzSt450() {
  let s;
  try {
    s = JSON.parse(localStorage.getItem('res-nz450') || '{}');
  } catch (e) {
    s = {};
  }
  s.mort = Array.isArray(s.mort) ? s.mort : [];
  if (!s.enc || s.enc.d !== today()) s.enc = { d: today(), r: {} };
  return s;
}


function nzSave450(s) {
  ecrireLS('res-nz450', s);
}

/** Règle 1 : une seule rencontre par région et par jour. Renvoie false si la rencontre est refusée. */
export function nzRencontre450() {
  if (!NZ450()) return true;
  const s = nzSt450(),
    r = V4.region || 'kanto';
  if (s.enc.r[r]) {
    toast('Nuzlocke : une seule rencontre par région et par jour. Revenez demain.');
    return false;
  }
  s.enc.r[r] = 1;
  nzSave450(s);
  return true;
}

export const NZ450 = () => !!PREF.nuz450;

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {


/** Règle 2 : un Pokémon K.O. à la fin d’un combat est perdu pour de bon. */
CROCHETS.finCombat.push(() => {
  if (!NZ450() || !B || !B.over || B._nz450) return;
  B._nz450 = 1;
  const D = SCEN[B.sc] || {};
  if (D.sansProgres431 || B.duel433 || D.tuto || D.duel433 || SCEN.ami === D) return;
  const bases = [];
  B.units
    .filter(u => u.side === 'a' && u.ko)
    .forEach(u => {
      const b = (BY[u.id] && BY[u.id].base) || u.sp;
      if (b && PROFILE.box.includes(b) && !bases.includes(b)) bases.push(b);
    });
  if (!bases.length) return;
  let epargne = null;
  if (PROFILE.box.length - bases.length < 1) epargne = bases.pop(); // le dernier compagnon est épargné
  const s = nzSt450(),
    noms = [];
  bases.forEach(b => {
    PROFILE.box = PROFILE.box.filter(x => x !== b);
    PROFILE.forms = (PROFILE.forms || []).filter(x => !BY[x] || BY[x].base !== b);
    __set_squad(squad.filter(x => !BY[x] || BY[x].base !== b));
    noms.push(BY[b].n);
    s.mort.push({ id: b, n: BY[b].n, d: today(), sc: B.sc });
  });
  s.mort = s.mort.slice(-60);
  nzSave450(s);
  B._nzdead450 = { noms, epargne: epargne ? BY[epargne].n : '' };
  if (!squad.length)
    __set_squad(PROFILE.box.filter((id, i, a) => a.slice(0, i + 1).reduce((t, x) => t + BY[x].c, 0) <= BUDGET).slice(0, 4));
  ecrireLS('res8-squad', squad);
  queueSave();
});


// les disparus sur la fiche de résultat (.nz450) : rendus par React (src/screens/combat/battle/Result.jsx)


/** Paramètres : activation à confirmer et liste des disparus. */
nzConf450 = false;


// panneau « Mode Nuzlocke » : rendu par React (src/screens/settings/panels/Nuzlocke.jsx)


document.addEventListener('click', e => {
  const b = e.target.closest && e.target.closest('[data-b451]');
  if (!b) return;
  const k = b.dataset.b451;
  if (k === 'ask') nzConf450 = true;
  else if (k === 'no') nzConf450 = false;
  else if (k === 'yes') {
    nzConf450 = false;
    PREF.nuz450 = 1;
    savePref();
  } else if (k === 'off') {
    PREF.nuz450 = 0;
    savePref();
  }
  renderParams();
});

}
