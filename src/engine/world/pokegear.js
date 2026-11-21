/* =====================================================================
   Pokégear (added in v4.17): the daily radio on the Home screen (roaming
   beasts, Dominant sighted, weather, tip); its announcements really
   change the day's gameplay (daily seed, Dominant of the day, weather).
   ===================================================================== */
import { POKEMON } from '../pokemon/pokemon.js';
import { HOOKS } from '../core/hooks.js';
import { today } from '../state/economy.js';
import { PLACE_BY_ID, placeName } from './map.js';
import { isJohtoRegion, routeName } from './johto.js';
import { ROAMING_BEASTS, isRoamingActive, getRoamState, findRoamLegend, roamerCaught } from './roaming-beasts.js';
import { isHoennRegion } from './hoenn.js';
import { regionPool } from './catch-anywhere.js';

const WEATHER_J = [null, 'pluie', 'soleil', null, 'sable', 'grele', null];

export const todayWeather = () => WEATHER_J[dailySeed('wx') % WEATHER_J.length];

const TIPS = [
  'Une case Trempée et une attaque Électrik : Court-circuit. Sortez vos Pokémon de l’eau avant de frapper !',
  'Deux coups sur la même cible dans la même manche déclenchent la Résonance : ×1,5 sur le second.',
  'Trois rangs différents dans l’équipe (Faible, Moyen, Fort…) : l’Harmonie offre 1 losange à chacun.',
  'La Forme Résonante ne coûte pas l’action : déclenchez-la, puis attaquez dans la foulée.',
  'Un Pokémon au palier Duo avec un autre débloque une technique combinée : 2 Voix, deux attaques.',
  'Les bêtes errantes gardent leurs blessures : même une fuite vous rapproche du but.',
  'La nuit, les Pokémon Dominants sont plus fréquents dans les hautes herbes.',
  'L’Esquive coûte 1 Voix et ne gaspille pas l’action : parfait pour sortir d’une zone dangereuse.',
  'Un compagnon à 3 cœurs encaisse un coup fatal avec 1 PV : mettez-le en première ligne.',
  'Les baies du Potager poussent plus vite si vous arrosez chaque jour.',
];

const dailyTip = () => TIPS[dailySeed('tip') % TIPS.length];

const WEATHER_LABELS = { pluie: 'Pluie', soleil: 'Grand soleil', sable: 'Tempête de sable', grele: 'Grêle' };

export function dailySeed(sel) {
  let h = 11;
  for (const ch of today() + sel) {
    h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  }
  return h;
}

/** The Dominant species sighted today (depending on the displayed region). */
export function dailyDominant() {
  const pool = regionPool(); // the sighted Dominant lives in the displayed region (v4.21)
  return pool.length
    ? pool[dailySeed('dom' + (isHoennRegion() ? 'h' : isJohtoRegion() ? 'j' : 'k')) % pool.length].id
    : null;
}

/** "près de l’Arène Vol" (near the Flying Gym), "près de la Route 32" (near Route 32), "près du Lac Colère" (near Lake of Rage). */
export function placeWithArticle(n) {
  if (/^(Lac|Plateau|Puits|Relais)\b/.test(n)) {
    return 'du ' + n;
  }
  if (/^(Route|Tour|Antenne)\b/.test(n)) {
    return 'de la ' + n;
  }
  if (/^[AEÉÈIOUY]/i.test(n)) {
    return 'de l’' + n;
  }
  return 'de ' + n;
}

/** The Pokégear lines (#v4Radio on the Home screen, rendered by src/screens/home/Footer.jsx). */
export function radioLines() {
  const L = [],
    d = dailyDominant(),
    w = todayWeather();
  if (isRoamingActive()) {
    const b = ROAMING_BEASTS.filter(id => !roamerCaught(id)).map(
      id => `${findRoamLegend(id).n} près ${placeWithArticle(placeName(PLACE_BY_ID[getRoamState(id).at]))}`
    );
    if (b.length) {
      L.push(['Bêtes errantes', `Aperçus ce matin : ${b.join(', ')}.`, 'johto']);
    }
  }
  if (d) {
    L.push([
      'Dominant signalé',
      `Un ${POKEMON[d].n} Dominant rôderait sur la ${routeName()}. Il y est plus fréquent aujourd’hui, surtout la nuit.`,
      'herbes',
    ]);
  }
  L.push([
    'Météo',
    w
      ? `${WEATHER_LABELS[w]} sur les hautes herbes aujourd’hui : les combats sauvages commencent sous ${w === 'soleil' ? 'le soleil' : w === 'pluie' ? 'la pluie' : w === 'sable' ? 'le sable' : 'la grêle'}.`
      : 'Temps calme sur les hautes herbes aujourd’hui.',
    null,
  ]);
  L.push(['Le conseil du Prof. Sorbier', dailyTip(), null]);
  return L;
}

// Statements run at startup, in the original order (see index.js).
export function init() {
  // today's weather spills into wild battles (unless the season already imposes one)
  HOOKS.creation.push(S => {
    if (S.sc !== 'sauvage' || S.wx) {
      return;
    }
    const w = todayWeather();
    if (w) {
      S.wx = { k: w, n: 5 };
    }
  });
}
