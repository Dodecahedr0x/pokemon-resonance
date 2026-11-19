/* Section d'origine : 4.68 : Arène de défense */

import { MON, SCEN } from './009-03-pokemon.js';
import { isCamp } from './011-05-etat-de-partie.js';
import { BADGES } from './013-07-arenes.js';
import { toast } from './014-08-outils.js';
import { CROCHETS } from './015-v4-8-00-crochets.js';
import { squad } from './020-13-equipe-cartes.js';
import { K, __set_fin, fin, mkUnit, plan, say, uAt } from './021-14-moteur-combat.js';
import { OBST } from './023-16-roles-synergies-obstacles.js';
import { B, backToPrep } from './024-17-interface-combat.js';
import { overlay } from './030-24-prestige-mise-en-scene.js';
import { fermer } from '../screens/overlays/tempStore.js';
import { __set_groupOf, groupOf } from './031-25-v3-parcours-accueil.js';
import { goFight } from './036-v4-04-accueil.js';
import { NEWS416 } from './056-v4-16-1-01-finitions.js';

export let DEF_VAGUES, DEF_VIES;
let dfSt468, dfSave468, dfOk468, groupOfOld468, dfPool468, finOld468;


function dfVague468(S, ev) {
  const D = S.def468;
  if (!D || D.w >= DEF_VAGUES) return false;
  D.w++;
  const nb = Math.min(6 - S.units.filter(u => u.side === 'e' && !u.ko).length, 2 + Math.floor(D.w / 2));
  const pool = dfPool468(),
    bad = BADGES.length,
    Dx = { hb: 4 + D.w * 3, pb: Math.floor(D.w / 2) + (bad >= 5 ? 1 : 0), lv: 14 + D.w * 3 + Math.min(10, bad * 2) };
  let made = 0;
  for (let i = 0; i < nb; i++) {
    const libres = [];
    for (let y = 0; y < 6; y++) [7, 6].forEach(x => S.tiles[K(x, y)] && !S.tiles[K(x, y)].rock && !uAt(S, K(x, y)) && libres.push([x, y]));
    if (!libres.length || !pool.length) break;
    const p = libres[Math.floor(Math.random() * libres.length)],
      m = pool[Math.floor(Math.random() * pool.length)];
    D.n++;
    S.units.push(mkUnit(m.id, 'e', p, 'd' + D.n, Dx));
    made++;
  }
  if (made) {
    say(ev, `Vague ${D.w} sur ${DEF_VAGUES} : ${made} adversaire${made > 1 ? 's' : ''} arrive${made > 1 ? 'nt' : ''} !`);
    ev.push({ e: 'terrain' });
    try {
      plan(S, ev);
    } catch (e) {}
  }
  return made > 0;
}


function dfOpen468() {
  const st = dfSt468();
  // rendu : src/screens/overlays/temporaires/Fenetres.jsx (Df468)
  const o = overlay('df468o', { d: SCEN.def468.d, best: st.best, won: st.won, ok: !!dfOk468() });
  o.addEventListener('click', e => {
    if (e.target === o) fermer('df468o');
  });
}


/** Bannière de l'Arène de défense sur l'Accueil (#df468, rendu : src/screens/accueil/Bannieres.jsx). */
export function dfTxt468() {
  return dfOk468() ? `5 vagues · record ${dfSt468().best}` : 'Débloquée avec 3 badges';
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

SCEN.def468 = {
  n: 'Arène de défense',
  lvl: 'Défi · 5 vagues',
  lim: 16,
  time: 'jour',
  bio: 'gue',
  d: 'Cinq vagues d’adversaires déferlent par la droite. Un adversaire qui se trouve sur les lignes A ou B (votre camp) à la fin d’une manche fait une brèche : vous avez 3 vies. Tenez les cinq vagues pour gagner.',
  water: [],
  rock: ['3,0', '3,5'],
  hb: 4,
  pb: 0,
  lv: 14,
  foes: [
    ['racaillou', [6, 2]],
    ['nosferapti', [6, 4]]
  ],
  def468: true
};


try {
  OBST.def468 = { pil: ['4,2'], grass: ['4,4', '5,1'] };
} catch (e) {}


DEF_VAGUES = 5,
  DEF_VIES = 3;


dfSt468 = () => {
  try {
    return JSON.parse(localStorage.getItem('res-df468') || 'null') || { won: 0, best: 0 };
  } catch (e) {
    return { won: 0, best: 0 };
  }
};


dfSave468 = s => {
  try {
    localStorage.setItem('res-df468', JSON.stringify(s));
  } catch (e) {}
};


dfOk468 = () => (isCamp() ? BADGES.length >= 3 : true);


groupOfOld468 = groupOf;


__set_groupOf(function (k) {
  return k === 'def468' ? 'terrains' : groupOfOld468.apply(this, arguments);
});


CROCHETS.creation.push((S, opt, D0) => {
  if (!D0 || !D0.def468) return;
  S.def468 = { w: 1, vies: DEF_VIES, n: 0 };
});


dfPool468 = () => MON.filter(m => m.st === 1 && !m.leg && !m.ennemi && m.base === m.id);


CROCHETS.avantFinManche.unshift((S, ev) => {
  const D = S.def468;
  if (!D || S.over) return;
  S.units
    .filter(u => u.side === 'e' && !u.ko && u.pos[0] <= 1)
    .forEach(u => {
      u.ko = true;
      u.hp = 0;
      D.vies--;
      say(ev, `Brèche ! ${u.n} a atteint la ligne de défense. Vies restantes : ${Math.max(0, D.vies)} / ${DEF_VIES}.`);
    });
  if (D.vies <= 0) {
    S.over = 'lose';
    ev.push({ e: 'over' });
    return;
  }
  if (S.round % 2 === 0) dfVague468(S, ev);
});


finOld468 = fin;


__set_fin(function (S, ev) {
  if (S.def468 && !S.over && !S.units.some(x => x.side === 'e' && !x.ko) && S.def468.w < DEF_VAGUES && S.units.some(x => x.side === 'a' && !x.ko)) dfVague468(S, ev);
  return finOld468.apply(this, arguments);
});


CROCHETS.progres.unshift((S, rew, win) => {
  try {
    const D = S.def468;
    if (!D) return null;
    const st = dfSt468();
    st.best = Math.max(st.best, win ? DEF_VAGUES : D.w - 1);
    if (win) st.won++;
    dfSave468(st);
    rew.df468 = { win, w: D.w, vies: D.vies };
    return win ? [600 + 300 * D.vies, D.vies >= 3 ? 4 : D.vies >= 2 ? 2 : 1] : D.w > 1 ? [100 * (D.w - 1), 0] : null;
  } catch (e) {
    return null;
  }
});


CROCHETS.resultat.unshift(r => {
  const t = r.df468;
  if (!t) return '';
  return `<div class="res-l"><h4>Arène de défense</h4><div class="rl"><span>${t.win ? `<b>Défense tenue !</b> ${DEF_VAGUES} vagues repoussées, ${t.vies} vie${t.vies > 1 ? 's' : ''} restante${t.vies > 1 ? 's' : ''}.` : `Vous avez tenu jusqu’à la vague ${t.w} sur ${DEF_VAGUES}.`}</span></div></div>`;
});


// bandeau des vagues (#df468hud) : rendu par React (src/screens/combat/battle/Battle.jsx)


document.addEventListener(
  'click',
  e => {
    const b = e.target.closest && e.target.closest('[data-df468]');
    if (!b) return;
    e.stopPropagation();
    e.preventDefault();
    const v = b.dataset.df468;
    if (v === 'open') return dfOpen468();
    fermer('df468o');
    if (v === 'go') {
      if (!dfOk468() || !squad.length) return toast(squad.length ? 'Débloquée avec 3 badges.' : 'Composez d’abord une équipe.');
      if (B) backToPrep();
      goFight('def468');
    }
  },
  true
);


NEWS416.unshift(['i-team', 'Arène de défense', 'Cinq vagues d’adversaires attaquent : tenez la ligne de défense avec 3 vies. Lancez le défi depuis la bannière de l’Accueil (3 badges).']);
}
