import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { PROFILE, isCamp } from '../state/game-state.js';
import { goTo } from '../core/navigation.js';
import { OBSTACLES } from '../combat/synergies-obstacles.js';
import { SCREEN_STATE } from '../ui/screen-state.js';
import { renderQuests } from '../progression/quests-shop.js';
import { FAMILY_REGION_NAMES } from '../world/catch-anywhere.js';
import { familyCaptureStats } from '../progression/regional-dex.js';
import { LEGENDARIES, legKey } from './legendaries.js';

/* Capturable legendaries: one quest per legend, then a capture battle; legends join the Box for 8 PC (added in v4.29). */

/** Displayed Box: captured legends don't count in "Box x / 151". */
export function boxCount() {
  return PROFILE.box.filter(id => !(POKEMON[id] && POKEMON[id].leg)).length;
}

function legendRegion(id) {
  return id === 'mewtwo' ? 1 : 2;
}

export function legendSteps(leg) {
  const r = legendRegion(leg.id),
    c = familyCaptureStats(r);
  return [
    { ok: (PROFILE.legends || []).includes(leg.id), t: `Vaincre ${leg.n} (Combats › Après-jeu)` },
    {
      ok: (PROFILE.regionDiplomas || []).includes(r),
      t: `Compléter le Pokédex de ${FAMILY_REGION_NAMES[r]} (${c.n} / ${c.t})`,
    },
    ...(isCamp() ? [{ ok: !!PROFILE.hchamp, t: 'Devenir Maître de Hoenn' }] : []),
  ];
}

export function lockLegendaryCapture(k) {
  const D = SCENARIOS[k];
  if (!D || !D.captureLegend) {
    return null;
  }
  if (PROFILE.box.includes(D.captureLegend)) {
    return `${POKEMON[D.captureLegend].n} est déjà dans votre Box.`;
  }
  const e = legendSteps(LEGENDARIES.find(leg => leg.id === D.captureLegend)).find(x => !x.ok);
  return e ? `Quête légendaire : ${e.t.replace(/ \(.*\)$/, '')} d’abord.` : null;
}

// "Legends" row of the Team screen: rendered by React (src/screens/team/DexCall.jsx)

// Quests › Legends: rendered by React (src/screens/quests/Legends.jsx)

// Statements run at startup, in the original order (see index.js).
export function init() {
  LEGENDARIES.forEach(leg => {
    POKEMON[leg.id].c = 8; // a legend on the team costs 8 PC
    const lk = legKey(leg.id);
    if (SCENARIOS[lk]) {
      SCENARIOS[lk].d = SCENARIOS[lk].d.replace(
        /Il ne peut pas être capturé[^.]*\.[^.]*\./,
        'Vaincu, il pourra être capturé une fois sa quête terminée (Quêtes › Légendes).'
      );
    }
  });

  LEGENDARIES.forEach(leg => {
    const k = 'lc' + leg.id,
      src = SCENARIOS[legKey(leg.id)];
    if (!src) {
      return;
    }
    SCENARIOS[k] = Object.assign({}, src, {
      n: `${leg.n} · capture`,
      lvl: `Légende · ${leg.title}`,
      catch: true,
      captureLegend: leg.id,
      d: `${leg.n} ne fuit plus. Affaiblissez-le sous 25 %, immobilisez-le, puis capturez-le avec un allié à son contact. Son escorte ne se capture pas.`,
    });
    OBSTACLES[k] = OBSTACLES[legKey(leg.id)] || {};
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-news="legend-quests"]')) {
      return;
    }
    e.stopPropagation();
    SCREEN_STATE.questTab = 'leg';
    goTo('quetes');
    renderQuests();
  });
}
