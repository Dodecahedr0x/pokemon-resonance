import { PREFERENCES } from '../../../engine/ui/preferences.js';

import Button from '../../../components/Button.jsx';
// Pokémon Skin (v4.72), completed by v4.73 (text, sounds) and v4.77 (graphics).
// Buttons handled by the engine (delegated clicks on data-pokemon-skin, data-poke-style, data-gfx-toggle).
const on = k => PREFERENCES[k] !== 0; // same rule as on() in engine/ui/pokemon-skin.js and 109

export default function PokemonSkin() {
  const t = on('pokemonSkinT'),
    a = on('pokemonSkinA'),
    t3 = on('pokeStyleT'),
    s3 = on('pokeStyleS'),
    l = PREFERENCES.graphicsMode === 'leger';
  return (
    <section className="card" id="pokemon-skin">
      <h3 className="card-title">Habillage Pokémon</h3>
      <p className="note" data-poke-style-n="1">
        Ouverture en Poké Ball quand vous changez d’onglet, voyants du Pokédex, reflets holographiques et entrée animée
        des écrans. L’option « Réduire les animations » coupe aussi ces effets. « Effets animés » règle aussi l’entrée
        en combat, les Poké Balls et la cérémonie du badge.
      </p>
      <div className="button-row">
        <Button size="small" variant={t ? 'primary' : undefined} data-pokemon-skin="t">
          Ouverture Poké Ball : {t ? 'activée' : 'désactivée'}
        </Button>
        <Button size="small" variant={a ? 'primary' : undefined} data-pokemon-skin="a">
          Effets animés : {a ? 'activés' : 'désactivés'}
        </Button>
        <Button size="small" variant={t3 ? 'primary' : undefined} data-poke-style="t">
          Texte lettre par lettre : {t3 ? 'activé' : 'désactivé'}
        </Button>
        <Button size="small" variant={s3 ? 'primary' : undefined} data-poke-style="s">
          Sons d’interface : {s3 ? 'activés' : 'désactivés'}
        </Button>
        <Button size="small" variant={l ? undefined : 'primary'} data-gfx-toggle="1">
          Graphismes : {l ? 'Léger (plateau à plat)' : 'Riche (décors peints, plateau incliné)'}
        </Button>
      </div>
    </section>
  );
}
