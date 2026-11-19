/* Original section: 4.64: trainer talent tree */

import { SCEN } from './009-pokemon.js';
import { PROFILE } from './011-game-state.js';
import { writeLS, toast } from './014-utils.js';
import { HOOKS } from './015-hooks.js';
import { heal, say } from './021-combat-engine.js';
import { esc, queueSave } from './025-saves.js';
import { sfx, vibe } from './026-campaign-tutorial-sound.js';
import { bagN, tLevel } from './032-v4-foundation.js';
import { renderWallet } from './035-interface.js';
import { renderBag } from './039-quests-shop.js';
import { DAMAGE_PROVIDERS } from './044-tactical-engine.js';

let TAL464, TALMAX464, TALRESET464;
// read by Shop › Talents (React, src/screens/bag/Workshop.jsx)
export { TAL464, TALMAX464, TALRESET464, talSt464, talSpent464, talPts464 };


/** The battle counts for talents and the season (4.65): neither frozen team nor tutorial. */
export function battleCount464(S) {
  return S && !S.fixe431 && !(SCEN[S.sc] && SCEN[S.sc].tuto);
}

const talSt464 = () => {
  const s = (() => {
    try {
      return JSON.parse(localStorage.getItem('res-tal464') || 'null') || {};
    } catch (e) {
      return {};
    }
  })();
  const o = {};
  TAL464.forEach(B => B.t.forEach(t => (o[t.id] = Math.max(0, Math.min(TALMAX464, s[t.id] | 0)))));
  return o;
};


const talSave464 = o => {
  writeLS('res-tal464', o);
};


const talSpent464 = () => Object.values(talSt464()).reduce((a, b) => a + b, 0);


const talPts464 = () => Math.max(0, tLevel() - 1 - talSpent464());


const tal464 = id => talSt464()[id] || 0;

// Statements run at startup, in the original order (see index.js).
export function __init() {

TAL464 = [
  { b: 'attaque', n: 'Attaque', t: [
    { id: 'a1', n: 'Mordant', d: r => `+${r * 2} % de dégâts.` },
    { id: 'a2', n: 'Concentration', d: r => (r >= 3 ? 'Toute l’équipe commence avec 1 losange.' : `Les ${r} premier${r > 1 ? 's' : ''} Pokémon commence${r > 1 ? 'nt' : ''} avec 1 losange.`) },
    { id: 'a3', n: 'Coup de grâce', d: r => `+${r * 4} % de dégâts sur une cible sous 50 % de PV.` }
  ] },
  { b: 'soin', n: 'Soin', t: [
    { id: 's1', n: 'Premiers secours', d: r => `Fin de manche : l’équipe récupère ${r * 2} % de ses PV max.` },
    { id: 's2', n: 'Robustesse', d: r => `L’avant-garde commence avec ${r} de Garde.` },
    { id: 's3', n: 'Second souffle', d: r => `Une fois par combat, un allié sous 30 % de PV récupère ${r * 10} % de ses PV max.` }
  ] },
  { b: 'exploration', n: 'Exploration', t: [
    { id: 'e1', n: 'Négociateur', d: r => `+${r * 40} ₽ après chaque victoire.` },
    { id: 'e2', n: 'Collectionneur', d: r => `${r * 8} % de chances de trouver une Poké Ball après une victoire.` },
    { id: 'e3', n: 'Œil de lynx', d: r => `${r * 8} % de chances de trouver un Éclat après une victoire.` }
  ] }
];


TALMAX464 = 3,
  TALRESET464 = 500;


HOOKS.combat.push(S => {
  if (!battleCount464(S)) return;
  const al = S.units.filter(u => u.side === 'a'),
    a2 = tal464('a2'),
    s2 = tal464('s2');
  al.forEach((u, i) => {
    if (a2 >= 3 || i < a2) u.en = Math.max(u.en || 0, 1);
  });
  if (s2 && al[0]) al[0].guard = Math.max(al[0].guard || 0, s2);
  S.tal464 = { used: {} };
});


HOOKS.avantFinManche.push((S, ev) => {
  if (!S.tal464) return;
  const al = S.units.filter(u => u.side === 'a' && !u.ko),
    s1 = tal464('s1'),
    s3 = tal464('s3');
  if (s1) al.forEach(u => heal(S, u, Math.max(1, Math.round((u.mhp * s1 * 2) / 100)), ev));
  if (s3) {
    al.forEach(u => {
      if (u.hp / u.mhp < 0.3 && !S.tal464.used[u.uid]) {
        S.tal464.used[u.uid] = 1;
        heal(S, u, Math.max(1, Math.round((u.mhp * s3 * 10) / 100)), ev);
        say(ev, `Second souffle : ${u.n} se relève.`);
      }
    });
  }
});


DAMAGE_PROVIDERS.push({
  id: 'talents464',
  fournir: (c, { S, u, t }) => {
    if (!S || !S.tal464 || !u || u.side !== 'a') return false;
    const a1 = tal464('a1'),
      a3 = t && t.hp / t.mhp < 0.5 ? tal464('a3') : 0,
      pc = a1 * 2 + a3 * 4;
    return pc > 0 && { mul: 1 + pc / 100, libelle: 'Talents' };
  }
});


HOOKS.progres.unshift((S, rew, win) => {
  try {
    if (!win || !battleCount464(S)) return null;
    const e1 = tal464('e1'),
      e2 = tal464('e2'),
      e3 = tal464('e3'),
      out = [];
    if (e1) {
      PROFILE.money = Math.min(999999, PROFILE.money + e1 * 40);
      out.push(`+${e1 * 40} ₽`);
    }
    if (e2 && Math.random() < e2 * 0.08) {
      PROFILE.bag.poke = Math.min(99, bagN('poke') + 1);
      out.push('1 Poké Ball');
    }
    if (e3 && Math.random() < e3 * 0.08) {
      PROFILE.gems = Math.min(99999, PROFILE.gems + 1);
      out.push('1 Éclat');
    }
    if (out.length) rew.tal464 = out;
  } catch { /* Best effort: failure here is non-fatal. */ }
  return null;
});


HOOKS.resultat.unshift(r => (r.tal464 ? `<div class="res-l"><h4>Talents</h4><div class="rl"><span>Bonus de talents : ${esc(r.tal464.join(', '))}</span></div></div>` : ''));


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-tal464]');
    if (!b || b.disabled) return;
    e.stopPropagation();
    e.preventDefault();
    const k = b.dataset.tal464,
      st = talSt464();
    if (k === 'reset') {
      if (PROFILE.money < TALRESET464 || !talSpent464()) return;
      PROFILE.money -= TALRESET464;
      talSave464({});
      toast('Talents réinitialisés.');
    } else if (k in st && st[k] < TALMAX464 && talPts464() > 0) {
      st[k]++;
      talSave464(st);
      sfx('ui');
      vibe(20);
    } else return;
    try {
      queueSave();
      renderWallet();
      renderBag();
    } catch { /* Best effort: failure here is non-fatal. */ }
  },
  true
);


}
