/* Home: the « Nouveau » (New) card presenting the latest additions, once per device (added in v4.16.1). */

import { $, RM } from '../core/utils.js';
import { go } from '../core/navigation.js';
import { PREF, savePref } from './preferences.js';
import { V4 } from './screen-state.js';
import { renderMap } from '../world/map.js';
import { refreshHome } from '../../screens/home/homeStore.js';

/** The « Nouveau » (New) panel of Home (#v4News, src/screens/home/News.jsx) has been read. */
export function hasNewsToView() {
  return PREF.news === '471';
}

/* ---------- Home: what's new ---------- */
// The 8 latest news items, most recent first. Startup (111) already shows the
// panel: v4.78 then adds its own (112), keeping 8 entries.
export const NEWS_ENTRIES = [
  [
    'i-star',
    'Le monde Pokémon',
    'Entrée en combat qui brise l’écran, Pokémon qui sortent de leur Poké Ball et y retournent au K.O., barres de PV comme dans les jeux, dialogues lettre par lettre, silhouettes des Pokémon à capturer, cartes à collectionner, boîte à badges en velours avec sa cérémonie, Boutique avec son vendeur, Sac à poches et sons d’interface.',
  ],
  [
    'i-star',
    'Habillage Pokémon',
    'Onglets en capsules Poké Ball, barre du bas en Poké Balls, menu avec une Ball par rubrique, tête de Pokédex avec ses voyants, ouverture en Poké Ball entre les onglets et carte de résultat holographique. Réglable dans Paramètres.',
  ],
  [
    'i-map',
    'Carte et plateau vivants',
    'La carte est repeinte (relief, villages, arènes, nuages, météo, brouillard des zones inexplorées) et chaque combat se joue sur un vrai terrain : herbe, sable, eau, neige, lave, marbre, tôle ou parquet selon l’arène, avec son ambiance animée.',
  ],
  [
    'i-team',
    'Défis et Ombres',
    'Combattez les Ombres de Résonance, relevez le défi quotidien, ressuscitez des spécimens anciens et montez en prestige depuis la bannière Défis. 20 formes régionales au Pokédex.',
  ],
  [
    'i-team',
    'Arène de défense',
    'Cinq vagues d’adversaires attaquent : tenez la ligne de défense avec 3 vies. Lancez le défi depuis la bannière de l’Accueil (3 badges).',
  ],
  [
    'i-bolt',
    'Journal des exploits et plateaux à gimmick',
    'Après chaque combat : Pokémon du combat, meilleur coup et exploits obtenus. Dans Paramètres, activez des plateaux à gimmick (Marais, Fournaise, Verglas, Orage, Terrain instable) pour varier la tactique.',
  ],
  [
    'i-medal',
    'Boss Rush et reliques',
    'Enchaînez 5 boss d’arène avec la même équipe, sans soin entre les combats. Après chaque boss, choisissez une relique parmi trois. Lancez le défi depuis la bannière de l’Accueil (5 badges).',
  ],
  [
    'i-star',
    'Événements saisonniers',
    'Chaque mois a son thème : un type à l’honneur (+5 % de dégâts), un combat vedette et cinq paliers de récompenses. Touchez la bannière sur l’Accueil.',
  ],
];

// Statements run at startup, in the original order (see index.js).
export function init() {
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-news]');
    if (!b) {
      return;
    }
    const k = b.dataset.news;
    if (k === 'ok') {
      PREF.news = '471';
      savePref();
      refreshHome();
      return;
    }
    if (k === 'johto') {
      V4.region = 'johto';
      V4.mapSel = null;
      go('carte');
      renderMap();
      return;
    }
    if (k === 'herbes') {
      go('carte');
      const r = $('#route');
      if (r && r.scrollIntoView) {
        r.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'center' });
      }
      return;
    }
    if (k === 'safari') {
      V4.region = 'kanto';
      V4.mapSel = 'safari';
      go('carte');
      renderMap();
      return;
    }
    if (k === 'comp') {
      const c = document.getElementById('v4Comp');
      if (c && c.scrollIntoView) {
        c.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      }
      return;
    }
    if (k === 'amis') {
      const a = document.getElementById('v4Amis');
      if (a && a.scrollIntoView) {
        a.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
      }
    }
  });
}
