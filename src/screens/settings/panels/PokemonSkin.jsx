import { PREF } from '../../../engine/ui/preferences.js';

// Pokémon Skin (v4.72), completed by v4.73 (text, sounds) and v4.77 (graphics).
// Buttons handled by the engine (delegated clicks on data-pokemon-skin, data-poke-style, data-gfx-toggle).
const on = k => PREF[k] !== 0; // same rule as on() in engine/ui/pokemon-skin.js and 109

export default function PokemonSkin() {
  const t = on('pokemonSkinT'),
    a = on('pokemonSkinA'),
    t3 = on('pokeStyleT'),
    s3 = on('pokeStyleS'),
    l = PREF.graphicsMode === 'leger';
  return (
    <section className="v4-panel" id="pokemon-skin">
      <h3 className="h3">Habillage Pokémon</h3>
      <p className="v4-note" data-poke-style-n="1">
        Ouverture en Poké Ball quand vous changez d’onglet, voyants du Pokédex, reflets holographiques et entrée animée
        des écrans. L’option « Réduire les animations » coupe aussi ces effets. « Effets animés » règle aussi l’entrée
        en combat, les Poké Balls et la cérémonie du badge.
      </p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${t ? ' b-gold' : ''}`} data-pokemon-skin="t">
          Ouverture Poké Ball : {t ? 'activée' : 'désactivée'}
        </button>
        <button type="button" className={`b b-sm${a ? ' b-gold' : ''}`} data-pokemon-skin="a">
          Effets animés : {a ? 'activés' : 'désactivés'}
        </button>
        <button type="button" className={`b b-sm${t3 ? ' b-gold' : ''}`} data-poke-style="t">
          Texte lettre par lettre : {t3 ? 'activé' : 'désactivé'}
        </button>
        <button type="button" className={`b b-sm${s3 ? ' b-gold' : ''}`} data-poke-style="s">
          Sons d’interface : {s3 ? 'activés' : 'désactivés'}
        </button>
        <button type="button" className={`b b-sm${l ? '' : ' b-gold'}`} data-gfx-toggle="1">
          Graphismes : {l ? 'Léger (plateau à plat)' : 'Riche (décors peints, plateau incliné)'}
        </button>
      </div>
    </section>
  );
}
