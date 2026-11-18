import { useShell } from './shellStore.js';

// Navigation (v4-03) : 9 destinations sur ordinateur, 5 et un menu sur téléphone.
// Les clics restent gérés par le moteur (délégation sur [data-t], #bnMenu, [data-menux]) ;
// la page marquée (aria-current) vient de show() via shellStore.

const SIDE = [
  ['accueil', 'i-home', 'Accueil'],
  ['pokedex', 'i-team', 'Équipe'],
  ['dex', 'i-dex', 'Pokédex'],
  ['combat', 'i-fight', 'Combats'],
  ['carte', 'i-map', 'Carte'],
  ['camp', 'i-camp', 'Camp'], // v4.30 : juste après « Carte »
  ['quetes', 'i-quest', 'Quêtes'],
  ['sac', 'i-bag', 'Sac et Boutique'],
  ['types', 'i-book', 'Guide'],
  ['params', 'i-gear', 'Paramètres'],
];

const BOTTOM = [
  ['accueil', 'i-home', 'Accueil'],
  ['pokedex', 'i-team', 'Équipe'],
  ['combat', 'i-fight', 'Combats'],
  ['carte', 'i-map', 'Carte'],
  ['camp', 'i-camp', 'Camp'], // v4.30 : juste avant le bouton Menu
];

const MENU = [
  ['dex', 'i-dex', 'Pokédex', '82 Pokémon de Kanto et Johto'],
  ['quetes', 'i-quest', 'Quêtes', 'Chapitres, défis et récompenses'],
  ['sac', 'i-bag', 'Sac et Boutique', 'Poké Balls, Potions, objets'],
  ['types', 'i-book', 'Guide', 'Règles, types et réactions'],
  ['params', 'i-gear', 'Paramètres', 'Son, vibrations, difficulté'],
];

// pages rangées dans le menu du téléphone : le bouton Menu est alors marqué
const IN_MENU = ['dex', 'quetes', 'sac', 'params', 'types'];

const cur = (page, k) => (page === k ? 'page' : undefined);

export function SideNav() {
  const { page, svBusy, svCloud } = useShell();
  return (
    <nav className="side-nav">
      {SIDE.map(([k, i, n]) => (
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

// Menu du téléphone (#v4Menu) : ouvert et fermé par menu() du moteur.
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
