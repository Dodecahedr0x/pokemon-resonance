import { parseStyle } from '../../lib/html.jsx';
import { tc } from '../../engine/014-utils.js';
import { ART } from '../../engine/032-v4-foundation.js';
import { shinyStyle } from '../../engine/043-adventure-plus.js';
import { companionData417 } from '../../engine/057-companions-resonance.js';
import { cp461Data } from '../../engine/092-companion-eggs-expeditions.js';

// Companion (#v4Comp, v4.17) and its Berry, Gift and Memories buttons (.cp461, v4.61).
// Clicks (data-comp, data-cp461) are still handled by the engine.
export default function Companion() {
  const d = companionData417();
  return (
    <section id="v4Comp" className="v4-comp v4-panel" aria-label="Compagnon" style={d ? { '--c': tc(d.m.t[0]) } : undefined}>
      {d ? <Sheet d={d} /> : <Empty />}
    </section>
  );
}

function Empty() {
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

function Sheet({ d }) {
  const { m, h, pr, petting: petting, mood: hum, sh, bonus } = d,
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
        <button type="button" className={`b b-sm ${petting ? 'b-ghost' : 'b-gold'}`} data-comp="caresser" disabled={petting}>{petting ? 'Câliné ✓' : 'Câliner'}</button>
        <button type="button" className="b b-sm b-ghost" data-comp="choisir">Changer</button>
      </div>
      {x && (
        <div className="cp461">
          <button type="button" className="b b-sm" data-cp461="baie" disabled={!!(x.feed || !x.baie)}>{x.feed ? 'Baie offerte ✓' : x.baie ? 'Offrir une Baie' : 'Pas de Baie'}</button>
          <button type="button" className={'b b-sm' + (x.h >= 3 && !x.gift ? ' b-gold' : ' b-ghost')} data-cp461="cadeau" disabled={!(x.h >= 3 && !x.gift)}>{x.h < 3 ? 'Cadeau à 3 ♥' : x.gift ? 'Cadeau reçu ✓' : 'Cadeau du jour'}</button>
          <button type="button" className={'b b-sm' + (x.isNew ? ' b-gold' : ' b-ghost')} data-cp461="souv" disabled={!x.h}>Souvenirs{x.isNew ? ' · nouveau' : ''}</button>
        </div>
      )}
    </>
  );
}
