/* Original section: v4.16.1-01-polish.js */

import { $, RM } from './014-utils.js';
import { go } from './016-navigation.js';
import { PREF, savePref } from './026-campaign-tutorial-sound.js';
import { V4 } from './032-v4-foundation.js';
import { renderMap } from './037-map.js';
import { PLACES_J } from './054-johto.js';
import { refreshHome } from '../screens/home/homeStore.js';

/* =====================================================================
   v4.16.1: polish
   - Wandering beasts: their marker is placed where it bothers the others least.
   - Trophies: the Johto badges and the Master title count (22).
   - Home: a « Nouveau » (New) card presents the v4.16 additions
     (once per device).
   ===================================================================== */
/** A free spot next to where the beast roams: its marker and name cover no other place. */
export function roamPos416(h, takenSet) {
  const C = [
      [110, 0],
      [-110, 0],
      [95, -58],
      [-95, -58],
      [95, 62],
      [-95, 62],
      [0, -96],
      [0, 100],
      [150, 0],
      [-150, 0],
    ],
    labelBox = (x, y) => [x - 62, y - 28, x + 62, y + 52], // the circle and the name label
    inter = (a, b) =>
      Math.max(0, Math.min(a[2], b[2]) - Math.max(a[0], b[0])) *
      Math.max(0, Math.min(a[3], b[3]) - Math.max(a[1], b[1])),
    others = [...PLACES_J, ...takenSet].map(p => labelBox(p.x, p.y));
  let best = [h.x + 110, h.y],
    bs = Infinity;
  C.forEach(([dx, dy], i) => {
    const x = Math.max(60, Math.min(940, h.x + dx)),
      y = Math.max(40, Math.min(590, h.y + dy)),
      b = labelBox(x, y),
      sc = others.reduce((t, o) => t + inter(b, o), 0) + i;
    if (sc < bs) {
      bs = sc;
      best = [x, y];
    }
  });
  return best;
}

/** The « Nouveau » (New) panel of Home (#v4News, src/screens/home/News.jsx) has been read. */
export function newsView416() {
  return PREF.news === '471';
}

/* ---------- Home: what's new ---------- */
// The 8 latest news items, most recent first. Startup (111) already shows the
// panel: v4.78 then adds its own (112), keeping 8 entries.
export const NEWS416 = [
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
export function __init() {
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
