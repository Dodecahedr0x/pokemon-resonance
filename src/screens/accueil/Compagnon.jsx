import { parseStyle } from '../../lib/html.jsx';
import { tc } from '../../engine/014-08-outils.js';
import { ART } from '../../engine/032-v4-00-socle.js';
import { shinyStyle } from '../../engine/043-v4-4-01-aventure-plus.js';
import { compData417 } from '../../engine/057-v4-17-01-compagnons-et-resonance.js';
import { cp461Data } from '../../engine/092-4-61-compagnon-ufs-d-elevage-expeditions.js';

// Compagnon (#v4Comp, v4.17) et ses boutons Baie, Cadeau et Souvenirs (.cp461, v4.61).
// Les clics (data-comp, data-cp461) restent gérés par le moteur.
export default function Compagnon() {
  const d = compData417();
  return (
    <section id="v4Comp" className="v4-comp v4-panel" aria-label="Compagnon" style={d ? { '--c': tc(d.m.t[0]) } : undefined}>
      {d ? <Fiche d={d} /> : <Vide />}
    </section>
  );
}

function Vide() {
  return (
    <div className="cp-vide">
      <span className="cp-ic"><svg><use href="#i-team" /></svg></span>
      <span>
        <b>Un compagnon ?</b>
        <em>Choisissez le Pokémon qui vous accompagne partout. Son affection grandit à chaque combat et lui donne des bonus.</em>
      </span>
      <button type="button" className="b b-sm b-gold" data-comp="choisir">Choisir</button>
    </div>
  );
}

function Fiche({ d }) {
  const { m, h, pr, caresse, hum, sh, bonus } = d,
    x = cp461Data();
  return (
    <>
      <div className={'cp-art' + (sh ? ' shiny' : '')} style={sh ? parseStyle(shinyStyle(m.base)) : undefined}>
        <img src={ART(m.no)} alt="" loading="lazy" />
      </div>
      <div className="cp-t">
        <small>Compagnon</small>
        <b>{m.n}</b>
        <span className="cp-h" aria-label={`${h} cœur${h > 1 ? 's' : ''} sur 5`}>
          {[1, 2, 3, 4, 5].map(i => (
            <i key={i} className={i <= h ? 'on' : ''}>♥</i>
          ))}
        </span>
        <span className="cp-bar"><i style={{ width: `${pr}%` }} /></span>
        <em>{hum}</em>
        <em className="cp-bn">{bonus || '2 cœurs : premier bonus en combat'}</em>
      </div>
      <div className="cp-a">
        <button type="button" className={`b b-sm ${caresse ? 'b-ghost' : 'b-gold'}`} data-comp="caresser" disabled={caresse}>{caresse ? 'Câliné ✓' : 'Câliner'}</button>
        <button type="button" className="b b-sm b-ghost" data-comp="choisir">Changer</button>
      </div>
      {x && (
        <div className="cp461">
          <button type="button" className="b b-sm" data-cp461="baie" disabled={!!(x.feed || !x.baie)}>{x.feed ? 'Baie offerte ✓' : x.baie ? 'Offrir une Baie' : 'Pas de Baie'}</button>
          <button type="button" className={'b b-sm' + (x.h >= 3 && !x.gift ? ' b-gold' : ' b-ghost')} data-cp461="cadeau" disabled={!(x.h >= 3 && !x.gift)}>{x.h < 3 ? 'Cadeau à 3 ♥' : x.gift ? 'Cadeau reçu ✓' : 'Cadeau du jour'}</button>
          <button type="button" className={'b b-sm' + (x.nouv ? ' b-gold' : ' b-ghost')} data-cp461="souv" disabled={!x.h}>Souvenirs{x.nouv ? ' · nouveau' : ''}</button>
        </div>
      )}
    </>
  );
}
