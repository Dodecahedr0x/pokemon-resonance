/* Section d'origine : v4-03-interface.js */

import { PROFILE } from './011-05-etat-de-partie.js';
import { $, $$ } from './014-08-outils.js';
import { openSaves } from './025-19-sauvegardes.js';
import { V4, fmt } from './032-v4-00-socle.js';
import { refreshWallet, setMenuOpen } from '../components/shellStore.js';


function menu(open) {
  V4.menu = open;
  setMenuOpen(open); // #v4Menu et #bnMenu (aria-expanded) : src/components/Nav.jsx
  if (open) {
    const f = $('#v4Menu .v4-mi');
    if (f) f.focus();
  }
}


// Dresseur, Pokédollars et Éclats de la barre du haut : redessinés par React (TopBar.jsx).
export function renderWallet() {
  refreshWallet();
  $$('[data-wallet]').forEach(el => {
    el.textContent = fmt(el.dataset.wallet === 'gems' ? PROFILE.gems : PROFILE.money);
  });
}

/* pictogrammes supplémentaires : dans src/components/SvgSprite.jsx */


/* ---------- navigation : 9 destinations sur ordinateur, 5 sur téléphone ---------- */
// pages et titres : TABS et TNAME (016) ; barre latérale, barre du bas et menu du
// téléphone (#v4Menu) : src/components/Nav.jsx

// Instructions exécutées au démarrage, dans l'ordre d'origine (voir index.js).
export function __init() {


document.addEventListener('click', e => {
  if (e.target.closest('#bnMenu')) {
    menu(!V4.menu);
    return;
  }
  if (e.target.closest('[data-menux]')) {
    menu(false);
    return;
  }
  if (V4.menu && e.target.closest('#v4Menu [data-t]')) menu(false);
  if (e.target.closest('[data-v4saves]')) {
    menu(false);
    openSaves();
  }
});


document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && V4.menu) menu(false);
});


// barre du haut (dresseur, Pokédollars, Éclats, réglages) : src/components/TopBar.jsx
// écran de lancement (titre et bouton) : src/components/LaunchScreen.jsx
}
