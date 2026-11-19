import { PREF } from '../../../engine/026-20-campagne-tutoriel-son.js';

// Habillage Pokémon (v4.72), complété par v4.73 (texte, sons) et v4.77 (graphismes).
// Boutons gérés par le moteur (clics délégués sur data-pk472, data-pk473, data-pk477).
const on = k => PREF[k] !== 0; // même règle que on() dans les modules 107 et 109

export default function HabillagePokemon() {
  const t = on('pk472t'),
    a = on('pk472a'),
    t3 = on('pk473t'),
    s3 = on('pk473s'),
    l = PREF.gfx477 === 'leger';
  return (
    <section className="v4-panel" id="pk472">
      <h3 className="h3">Habillage Pokémon</h3>
      <p className="v4-note" data-pk473n="1">Ouverture en Poké Ball quand vous changez d’onglet, voyants du Pokédex, reflets holographiques et entrée animée des écrans. L’option « Réduire les animations » coupe aussi ces effets. « Effets animés » règle aussi l’entrée en combat, les Poké Balls et la cérémonie du badge.</p>
      <div className="sv-io">
        <button type="button" className={`b b-sm${t ? ' b-gold' : ''}`} data-pk472="t">Ouverture Poké Ball : {t ? 'activée' : 'désactivée'}</button>
        <button type="button" className={`b b-sm${a ? ' b-gold' : ''}`} data-pk472="a">Effets animés : {a ? 'activés' : 'désactivés'}</button>
        <button type="button" className={`b b-sm${t3 ? ' b-gold' : ''}`} data-pk473="t">Texte lettre par lettre : {t3 ? 'activé' : 'désactivé'}</button>
        <button type="button" className={`b b-sm${s3 ? ' b-gold' : ''}`} data-pk473="s">Sons d’interface : {s3 ? 'activés' : 'désactivés'}</button>
        <button type="button" className={`b b-sm${l ? '' : ' b-gold'}`} data-pk477="1">Graphismes : {l ? 'Léger (plateau à plat)' : 'Riche (décors peints, plateau incliné)'}</button>
      </div>
    </section>
  );
}
