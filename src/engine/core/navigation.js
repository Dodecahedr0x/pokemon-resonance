import { guideShown } from '../../screens/guide/guideStore.js';
import { setShellPage } from '../../components/shellStore.js';
import { $$ } from './utils.js';
import { hook } from './hooks.js';
import { B, scSel } from '../combat/ui.js';
import { __set_PREPG, renderPrep } from '../combat/battle-prep.js';
import { jump } from '../ui/guide.js';
import { afterShow } from '../world/home-journey.js';
import { v4After } from '../ui/settings.js';
import { fitPhoneBattle } from '../combat/compact-battle.js';

export let cur;

export function show(t, scroll) {
  const previous = cur;
  if (t === 'ligue') {
    // the League is integrated into Battles (Gyms and League tabs)
    __set_PREPG({ g: 'arenes', sc: scSel });
    t = 'combat';
  }
  if (!TABS.includes(t)) {
    t = 'accueil';
  }
  cur = t;
  $$('.page').forEach(p => p.classList.toggle('on', p.id === t));
  setShellPage(t, TNAME[t]); // marked links (aria-current) and #tbSec title: src/components
  if (scroll) {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  try {
    localStorage.setItem('res8-tab', t);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  if (t === 'combat' && !B) {
    renderPrep();
  }
  if (t === 'types') {
    guideShown();
  }
  afterShow(t);
  v4After(cur);
  fitPhoneBattle(); // battle on phone (v4.34)
  hook('page', previous);
}

export function goTo(t) {
  show(t, true);
  try {
    history.replaceState(null, '', '#' + (t === 'ligue' ? 'combat' : t));
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
}

/* ===================== NAVIGATION ===================== */
export const TABS = [
  'accueil',
  'pokedex',
  'combat',
  'types',
  'ligue',
  'carte',
  'dex',
  'quetes',
  'sac',
  'params',
  'camp',
];

// page titles (top bar); « ligue » opens inside Battles (see show())
export const TNAME = {
  accueil: 'Accueil',
  pokedex: 'Équipe',
  combat: 'Combats',
  types: 'Guide',
  ligue: 'Combats',
  carte: 'Carte',
  dex: 'Pokédex',
  quetes: 'Quêtes',
  sac: 'Sac et Boutique',
  params: 'Paramètres',
  camp: 'Camp',
};

// Statements run at startup, in the original order (see index.js).
export function init() {
  cur = 'accueil';

  document.addEventListener('click', e => {
    const a = e.target.closest('[data-t],[data-go]');
    if (a) {
      e.preventDefault();
      goTo(a.dataset.t || a.dataset.go);
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
    if (TABS.includes(t) && t !== cur) {
      show(t, true);
    }
  });
}
