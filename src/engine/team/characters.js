import { POKEMON, SCENARIOS } from '../pokemon/pokemon.js';
import { isCamp } from '../state/game-state.js';
import { HOOKS } from '../core/hooks.js';
import { hasNx, pushMessage } from '../combat/engine.js';
import { selectedScenario } from '../combat/ui.js';
import { PREFERENCES } from '../ui/preferences.js';
import { ROLE_PROVIDERS } from '../combat/tactical-engine.js';
import { individualOf, individualHtml } from './individuals.js';

/* =====================================================================
   Character (added in v4.10): each family has a character (Brave,
   Prudent, Quick, Hasty, Docile, Stubborn) that slightly changes its
   battles. Optional disobedience: a tired or stubborn Pokémon may
   ignore an order.
   ===================================================================== */

/** A family's character: always the same for a given family. */
function characterOf(id) {
  const individualInfo = individualOf(id); // individual nature of your Pokémon (v4.32)
  if (individualInfo && CHARACTERS[individualInfo.temperament]) {
    return individualInfo.temperament;
  }
  const b = POKEMON[id] ? POKEMON[id].base : id,
    ks = Object.keys(CHARACTERS);
  let h = 7;
  for (const c of String(b)) {
    h = (h * 31 + c.charCodeAt(0)) % 9973;
  }
  return ks[h % ks.length];
}

/** Before an order: does the Pokémon obey? (null: yes; otherwise the events) */
export function disobeys(S, u) {
  if (!S.disobedience || u.side !== 'a' || u.temperament === 'docile') {
    return null;
  }
  const p = (u.temperament === 'tetu' ? 0.12 : 0.04) + (u.fat ? 0.12 : 0);
  if (Math.random() >= p) {
    return null;
  }
  const ev = [];
  pushMessage(
    ev,
    `${u.n} fait la sourde oreille${u.fat ? ' : il est épuisé' : u.temperament === 'tetu' ? ' : il est têtu' : ''}.`
  );
  ev.push({ e: 'desob', u: u.uid });
  return ev;
}

export function characterHtml(id) {
  const k = characterOf(id);
  return (
    `<div class="mvc car-mvc"><div class="t"><b>${CHARACTERS[k][0]}</b><span class="chip">Nature</span></div><p>${CHARACTERS[k][1]}</p></div>` +
    individualHtml(id)
  ); // ability (v4.32)
}

export const CHARACTERS = {
  brave: ['Brave', '+2 dégâts infligés, +1 dégât subi.'],
  prudent: ['Prudent', '−2 dégâts subis, −1 dégât infligé.'],
  vif: ['Vif', '+1 Mouvement, −1 dégât infligé.'],
  fougueux: ['Fougueux', 'Commence chaque combat avec 1 point d’Éveil, +1 dégât subi.'],
  docile: ['Docile', 'Aucun effet. N’est jamais désobéissant.'],
  tetu: ['Têtu', '+3 dégâts infligés, mais désobéit plus souvent (si la désobéissance est activée).'],
};

export const charactersChosen = () =>
  PREFERENCES.characters !== false && !(SCENARIOS[selectedScenario] && SCENARIOS[selectedScenario].tuto);

export const disobedienceChosen = () =>
  !!PREFERENCES.disobedience && isCamp() && !(SCENARIOS[selectedScenario] && SCENARIOS[selectedScenario].tuto);

// Startup statements, run in their original order (see index.js).
export function init() {
  ROLE_PROVIDERS.push({
    id: 'caractere',
    provide: (c, { u, t }) => {
      const o = [],
        a = { brave: 2, prudent: -1, vif: -1, tetu: 3 }[u.temperament],
        d = { brave: 1, prudent: -2, fougueux: 1 }[t.temperament];
      if (a) {
        o.push({ add: a, labelText: CHARACTERS[u.temperament][0] });
      }
      if (d) {
        o.push({ add: d, labelText: CHARACTERS[t.temperament][0] });
      }
      return o;
    },
  });

  HOOKS.creation.push((S, opt) => {
    if (!opt) {
      return;
    }
    if (opt.characters) {
      S.temperament = true;
      S.units
        .filter(u => u.side === 'a')
        .forEach(u => {
          u.temperament = characterOf(u.sp);
          if (u.temperament === 'fougueux' && hasNx(u)) {
            u.en = Math.max(u.en, 1);
          }
        });
    }
    if (opt.disobedience) {
      S.disobedience = true;
    }
  });
}
