import { TNAME } from '../engine/016-navigation.js';
import { useShell } from './shellStore.js';

// Navigation (v4-03): 9 destinations on desktop, 5 and a menu on phone.
// Clicks are still handled by the engine (delegation on [data-t], #bnMenu, [data-menux]);
// the marked page (aria-current) comes from show() via shellStore.

// Pages, in sidebar order, with their title taken from TNAME. With a
// description: put in the phone menu; without: in the bottom bar (same order).
const PAGES = [
  ['accueil', 'i-home'],
  ['pokedex', 'i-team'],
  ['dex', 'i-dex', '82 Pokémon de Kanto et Johto'],
  ['combat', 'i-fight'],
  ['carte', 'i-map'],
  ['camp', 'i-camp'], // v4.30: right after « Carte » (Map), right before the Menu button
  ['quetes', 'i-quest', 'Chapitres, défis et récompenses'],
  ['sac', 'i-bag', 'Poké Balls, Potions, objets'],
  ['types', 'i-book', 'Règles, types et réactions'],
  ['params', 'i-gear', 'Son, vibrations, difficulté'],
].map(([k, i, d]) => [k, i, TNAME[k], d]);
const BOTTOM = PAGES.filter(p => !p[3]);
const MENU = PAGES.filter(p => p[3]);

// page put in the phone menu: the Menu button is then marked
const IN_MENU = MENU.map(p => p[0]);

const cur = (page, k) => (page === k ? 'page' : undefined);

export function SideNav() {
  const { page, saveBusy: svBusy, saveCloud: svCloud } = useShell();
  return (
    <nav className="side-nav">
      {PAGES.map(([k, i, n]) => (
        <a key={k} className="nv" data-t={k} href={'#' + k} aria-current={cur(page, k)}><svg><use href={'#' + i} /></svg>{n}</a>
      ))}
      <button type="button" className="nv nv-save" id="sideSave"><svg><use href="#i-save" /></svg>Sauvegardes<span className="k" id="sideSaveK">{svBusy ? '…' : svCloud ? 'COMPTE' : 'AUTO'}</span></button>
    </nav>
  );
}

export function BottomNav() {
  const { page, menu } = useShell();
  return (
    <nav className="bnav n6430" aria-label="Navigation">
      {BOTTOM.map(([k, i, n]) => (
        <a key={k} className="bn" data-t={k} href={'#' + k} aria-current={cur(page, k)}><span className="ic"><svg><use href={'#' + i} /></svg></span>{n}</a>
      ))}
      <button type="button" className="bn bn-menu" id="bnMenu" aria-haspopup="dialog" aria-expanded={menu ? 'true' : 'false'} aria-current={IN_MENU.includes(page) ? 'page' : undefined}><span className="ic"><svg><use href="#i-menu" /></svg></span>Menu</button>
    </nav>
  );
}

// Phone menu (#v4Menu): opened and closed by the engine's menu().
export function V4Menu() {
  const { menu } = useShell();
  return (
    <div className="v4-menu" id="v4Menu" hidden={!menu}>
      <div className="v4-scrim" data-menux="" />
      <div className="v4-ms" role="dialog" aria-modal="true" aria-label="Menu">
        <div className="v4-ms-h"><b>Menu</b><button type="button" className="v4-x" data-menux="" aria-label="Fermer"><svg><use href="#i-x" /></svg></button></div>
        <div className="v4-ms-g">
          {MENU.map(([k, i, n, d]) => (
            <a key={k} className="v4-mi" data-t={k} href={'#' + k}><span className="v4-mi-ic"><svg><use href={'#' + i} /></svg></span><span><b>{n}</b><em>{d}</em></span></a>
          ))}
          <button type="button" className="v4-mi" data-v4saves=""><span className="v4-mi-ic"><svg><use href="#i-save" /></svg></span><span><b>Sauvegardes</b><em>3 emplacements, export</em></span></button>
        </div>
      </div>
    </div>
  );
}
