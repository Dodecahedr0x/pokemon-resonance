import { BY } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { medal } from '../../engine/core/utils.js';
import { ITM } from '../../engine/assets/item-icons.js';
import { formatNumber, today } from '../../engine/state/economy.js';
import { BUILDINGS, buildingBlocked, level } from '../../engine/progression/base-camp.js';
import { DESTINATIONS, placesExp } from '../../engine/progression/expeditions.js';
import { daycarePair, inheritableMoves, daycareParents } from '../../engine/progression/daycare.js';
import { POTAGER, POT_I, plotSprout } from '../../engine/progression/camp-garden.js';
import { Html } from '../../lib/html.jsx';

import Button from '../../components/Button.jsx';
import CardHeader from '../../components/CardHeader.jsx';
const pl = (n, token) => `${n} ${token}${n > 1 ? 's' : ''}`;

// A building: level, effect, Build / Upgrade button (data-camp-b).
function Building({ k }) {
  const B2 = BUILDINGS[k],
    n = level(k),
    lk = buildingBlocked(k),
    c = n < 3 ? B2.upgradeCost[n] : null;
  return (
    <article className={`camp-building${n ? ' is-built' : ''}`}>
      <div className="camp-building-header">
        <b>{B2.n}</b>
        <span className="camp-building-level" aria-label={`Niveau ${n} sur 3`}>
          {[1, 2, 3].map(i => (
            <i key={i} className={i <= n ? 'is-reached' : undefined} />
          ))}
        </span>
      </div>
      <p>{n ? B2.d(n) : B2.d(1)}</p>
      {lk ? (
        <em className="camp-building-lock">{lk}</em>
      ) : (
        <Button
          size="small"
          variant="primary"
          data-camp-b={k}
          disabled={!(PROFILE.money >= c[0] && PROFILE.gems >= c[1])}
        >{`${n ? 'Améliorer' : 'Construire'} · ${formatNumber(c[0])} ₽${c[1] ? ` + ${c[1]} Éclats` : ''}`}</Button>
      )}
    </article>
  );
}

// An expedition in progress (data-exp-r to collect).
function Expedition({ x, i }) {
  const remainder = x.fin - PROFILE.battles,
    m = BY[x.id];
  return (
    <div className="camp-expedition">
      <Html html={medal(m.t, 'is-small')} />
      <span>
        <b>{m.n}</b>
        <em>{DESTINATIONS[x.destinationId].n + (x.ideal ? ' · terrain idéal' : '')}</em>
      </span>
      {remainder <= 0 ? (
        <Button size="small" variant="primary" data-exp-r={i}>
          Récupérer
        </Button>
      ) : (
        <small>{`Retour dans ${pl(remainder, 'combat')}`}</small>
      )}
    </div>
  );
}

// Daycare · couple (v4.16), visible as soon as the Daycare is built.
function Daycare() {
  const pe = level('pens');
  if (!pe) {
    return null;
  }
  const c = daycarePair(),
    P2 = daycareParents(),
    remainder = Math.max(0, [8, 6, 4][pe - 1] - (PROFILE.camp.oeuf || 0)),
    slot = id =>
      id ? (
        <span className="camp-daycare-slot is-filled">
          <Html html={medal(BY[id].t, 'is-small')} />
          <b>{BY[id].n}</b>
        </span>
      ) : (
        <span className="camp-daycare-slot">
          <svg>
            <use href="#i-plus" />
          </svg>
          <b>Libre</b>
        </span>
      );
  let txt;
  if (P2) {
    const L = inheritableMoves(P2.mother, P2.father);
    txt = `Prochain œuf dans ${pl(remainder, 'combat')} : un ${BY[P2.mother].n}${L.length ? `, qui héritera d’une attaque de ${BY[P2.father].n}` : ''}${P2.meta ? ' (Métamorph : deux fois plus de chances de chromatique)' : ''}.`;
  } else if (c.length === 2) {
    txt = 'Ces deux-là ne s’entendent pas : il faut un type en commun, ou Métamorph.';
  } else {
    txt = `Sans couple, la Pension trouve un œuf d’une famille inconnue (prochain dans ${pl(remainder, 'combat')}). Déposez deux Pokémon qui partagent un type, ou Métamorph : l’œuf sera de leur famille, avec une attaque héritée et plus de chances d’être chromatique.`;
  }
  return (
    <>
      <h3 className="camp-subtitle">Pension · couple</h3>
      <div className="camp-daycare-pair">
        <img className="camp-daycare-egg" src={ITM('oeuf')} alt="" loading="lazy" />
        {slot(c[0])}
        <span className="camp-daycare-plus">+</span>
        {slot(c[1])}
      </div>
      <p className="v4-ps-n">{txt}</p>
      {c.length ? (
        <Button size="small" data-pens="rendre">
          Reprendre le couple
        </Button>
      ) : (
        <Button size="small" variant="primary" data-pens="ouvrir">
          Déposer un couple
        </Button>
      )}
    </>
  );
}

// A Vegetable garden plot (v4.17): empty, seed choice, growing or ripe.
function Plot({ x, i }) {
  if (!x) {
    return POT_I === i ? (
      <div className="camp-plot is-choosing">
        {Object.entries(POTAGER).map(([g, G]) => (
          <Button key={g} size="small" data-pot-g={g} disabled={!(PROFILE.money >= G.p)}>
            {`${G.n} · ${formatNumber(G.p)} ₽`}
            <em>{`${G.duration} combats : ${G.d}`}</em>
          </Button>
        ))}
        <Button size="small" variant="ghost" data-pot-x="">
          Annuler
        </Button>
      </div>
    ) : (
      <button type="button" className="camp-plot is-empty" data-pot-i={i}>
        <svg>
          <use href="#i-plus" />
        </svg>
        <b>Planter</b>
      </button>
    );
  }
  const r = plotSprout(x),
    G = POTAGER[x.g];
  return r ? (
    <div className="camp-plot is-growing">
      <span
        className={`camp-plant is-stage-${Math.min(3, 1 + Math.floor(((G.duration - r) / G.duration) * 3))}`}
        aria-hidden="true"
      />
      <b>{G.n}</b>
      <em>{`Encore ${pl(r, 'combat')}`}</em>
    </div>
  ) : (
    <button type="button" className="camp-plot is-ripe" data-pot-r={i}>
      <span className="camp-plant is-stage-4" aria-hidden="true" />
      <b>{G.n}</b>
      <em>Récolter !</em>
    </button>
  );
}

function Garden() {
  const P2 = PROFILE.garden || [null, null, null],
    watered = PROFILE.watered === today();
  return (
    <>
      <h3 className="camp-subtitle">Potager</h3>
      <div className="camp-garden">
        {P2.map((x, i) => (
          <Plot key={i} x={x} i={i} />
        ))}
      </div>
      {P2.some(x => x && plotSprout(x) > 0) ? (
        <Button size="small" data-pot-eau="" disabled={watered}>
          {watered ? 'Arrosé aujourd’hui ✓' : 'Arroser (une fois par jour)'}
        </Button>
      ) : null}
    </>
  );
}

// « Base camp » panel (#v4Camp, v4.10): buildings, expeditions, Daycare, Vegetable garden.
// Filled on the engine's first renderCampBase(), rebuilt on each call.
export default function CampBase({ filled: filled }) {
  const exp = PROFILE.exp || [],
    places = filled ? placesExp() : 0;
  return (
    <section className="camp-base card" id="v4Camp" aria-label="Camp de base">
      {filled && (
        <>
          <CardHeader icon="map" title="Camp de base" />
          <div className="camp-buildings">
            {Object.keys(BUILDINGS).map(k => (
              <Building key={k} k={k} />
            ))}
          </div>
          <h3 className="camp-subtitle">{'Expéditions' + (places ? ` · ${exp.length} / ${places}` : '')}</h3>
          {places ? (
            <>
              {exp.map((x, i) => (
                <Expedition key={i} x={x} i={i} />
              ))}
              {places - exp.length > 0 ? (
                <Button size="small" data-exp-new="">
                  Envoyer un Pokémon en expédition
                </Button>
              ) : null}
            </>
          ) : (
            <p className="v4-ps-n">Construisez la Tour de guet pour envoyer vos Pokémon en expédition.</p>
          )}
          <Daycare />
          <Garden />
        </>
      )}
    </section>
  );
}
