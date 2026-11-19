/* Section d'origine : 09-navigation.js */

import { guideShown } from '../screens/guide/guideStore.js';
import { setShellPage } from '../components/shellStore.js';
import { $$ } from './014-08-outils.js';
import { B, scSel } from './024-17-interface-combat.js';
import { PREPG, __set_PREPG, renderPrep } from './026-20-campagne-tutoriel-son.js';
import { jump } from './029-23-guide-epure.js';
import { afterShow } from './031-25-v3-parcours-accueil.js';
import { v4After } from './040-v4-08-parametres.js';
import { calibre434 } from './069-v4-34-01-calibrage-et-evoli.js';

export let TABS, TNAME, cur;
export function __set_show(v) { return (show = v); }


export function show(t, scroll) {
  if (t === 'ligue') {
    // la Ligue est intégrée aux Combats (onglets Arènes et Ligue)
    __set_PREPG({ g: 'arenes', sc: scSel });
    t = 'combat';
  }
  if (!TABS.includes(t)) t = 'accueil';
  cur = t;
  $$('.page').forEach(p => p.classList.toggle('on', p.id === t));
  setShellPage(t, TNAME[t]); // liens marqués (aria-current) et titre #tbSec : src/components
  if (scroll) window.scrollTo({ top: 0, behavior: 'auto' });
  try {
    localStorage.setItem('res8-tab', t);
  } catch (e) {}
  if (t === 'combat' && !B) renderPrep();
  if (t === 'types') guideShown();
  afterShow(t);
  v4After(cur);
  calibre434(); // combat sur téléphone (v4.34)
}


export function go(t) {
  if (t === 'ligue') {
    __set_PREPG({ g: 'arenes', sc: scSel });
    t = 'combat';
  }
  show(t, true);
  try {
    history.replaceState(null, '', '#' + t);
  } catch (e) {}
}

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {

/* ===================== NAVIGATION ===================== */
TABS = ['accueil', 'pokedex', 'combat', 'types', 'ligue'];


TNAME = {
  accueil: 'Accueil',
  pokedex: 'Pokédex',
  combat: 'Combat',
  types: 'Types et réactions',
  ligue: 'Ligue et studio'
};


cur = 'accueil';


document.addEventListener('click', e => {
  const a = e.target.closest('[data-t],[data-go]');
  if (a) {
    e.preventDefault();
    go(a.dataset.t || a.dataset.go);
    return;
  }
  const b = e.target.closest('.code-link');
  if (b) {
    e.preventDefault();
    e.stopPropagation();
    jump(b.dataset.code);
  }
});


window.addEventListener('hashchange', () => {
  const t = location.hash.slice(1);
  if (TABS.includes(t) && t !== cur) show(t, true);
});
}
