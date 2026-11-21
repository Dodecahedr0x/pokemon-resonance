import { POKEMON, PRESETS } from '../pokemon/pokemon.js';
import { synOf } from '../pokemon/roles-synergies.js';

const SYNERGY_PRESETS = {
  grandorage: {
    n: 'Grand orage',
    ids: ['scarhino', 'ramoloss', 'hoothoot', 'loupio'],
    synergyText: 'Tempête, Escadrille, Dojo',
  },
  cieldraco: {
    n: 'Ciel draconique',
    ids: ['evoli', 'scarhino', 'hoothoot', 'minidraco'],
    synergyText: 'Escadrille, Dojo, Ciel draconique',
  },
  forge: {
    n: 'Forge volcanique',
    ids: ['hoothoot', 'onix', 'limagma', 'scarhino'],
    synergyText: 'Forge, Escadrille, Dojo',
  },
  jardin: {
    n: 'Jardin gelé',
    ids: ['lokhlass', 'marill', 'fantominus', 'bulbizarre'],
    synergyText: 'Toxines, Banquise, Bénédiction',
  },
  brume: {
    n: 'Brume toxique',
    ids: ['granivol', 'fantominus', 'porygon', 'scarhino'],
    synergyText: 'Escadrille, Dojo, Toxines',
  },
  lumiere: {
    n: 'Lame et lumière',
    ids: ['tarsal', 'absol', 'magneti', 'bulbizarre'],
    synergyText: 'Acier trempé, Bénédiction',
  },
  abysses: { n: 'Abysses', ids: ['natu', 'axoloto', 'lokhlass', 'tenefix'], synergyText: 'Esprit, Banquise' },
  oragedraco: {
    n: 'Orage draconique',
    ids: ['draby', 'lokhlass', 'pichu', 'hoothoot'],
    synergyText: 'Tempête, Ciel draconique',
  },
};

/* =====================================================================
   Synergy formations (added in v4.32): eight new recommended teams; every
   preset gets its synergy summary.
   ===================================================================== */

// Startup statements, run in their original order (see index.js).
export function init() {
  Object.assign(PRESETS, SYNERGY_PRESETS);

  Object.keys(PRESETS).forEach(k => {
    const P = PRESETS[k];
    P.ids = P.ids.filter(id => POKEMON[id]);
    if (!P.synergyText) {
      P.synergyText = synOf(P.ids)
        .map(x => x.n)
        .join(', ');
    }
  });
}
