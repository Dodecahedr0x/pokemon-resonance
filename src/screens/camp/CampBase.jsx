import { BY } from '../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../engine/state/game-state.js';
import { medal } from '../../engine/core/utils.js';
import { ITM } from '../../engine/assets/item-icons.js';
import { fmt, today } from '../../engine/state/economy.js';
import { BUILDINGS, buildingBlocked, level } from '../../engine/progression/base-camp.js';
import { DESTINATIONS, placesExp } from '../../engine/progression/expeditions.js';
import { daycarePair, inheritableMoves, daycareParents } from '../../engine/progression/daycare.js';
import { POTAGER, POT_I, plotSprout } from '../../engine/progression/camp-garden.js';
import { Html } from '../../lib/html.jsx';

import Button from '../../components/Button.jsx';
const pl = (n, token) => `${n} ${token}${n > 1 ? 's' : ''}`;

// A building: level, effect, Build / Upgrade button (data-camp-b).
function Building({ k }) {
  const B2 = BUILDINGS[k],
    n = level(k),
    lk = buildingBlocked(k),
    c = n < 3 ? B2.upgradeCost[n] : null;
  return (
    <article className={`cb-b${n ? ' on' : ''}`}>
      <div className="cb-h">
        <b>{B2.n}</b>
        <span className="cb-lv" aria-label={`Niveau ${n} sur 3`}>
          {[1, 2, 3].map(i => (
            <i key={i} className={i <= n ? 'on' : ''} />
          ))}
        </span>
      </div>
      <p>{n ? B2.d(n) : B2.d(1)}</p>
      {lk ? (
        <em className="cb-lk">{lk}</em>
      ) : (
        <Button
          size="small"
          variant="primary"
          data-camp-b={k}
          disabled={!(PROFILE.money >= c[0] && PROFILE.gems >= c[1])}
        >{`${n ? 'Améliorer' : 'Construire'} · ${fmt(c[0])} ₽${c[1] ? ` + ${c[1]} Éclats` : ''}`}</Button>
      )}
    </article>
  );
}

// An expedition in progress (data-exp-r to collect).
function Expedition({ x, i }) {
  const remainder = x.fin - PROFILE.battles,
    m = BY[x.id];
  return (
    <div className="cb-x">
      <Html html={medal(m.t, 'sm')} />
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
        <span className="pe-s on">
          <Html html={medal(BY[id].t, 'sm')} />
          <b>{BY[id].n}</b>
        </span>
      ) : (
        <span className="pe-s">
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
      <h3 className="cb-st">Pension · couple</h3>
      <div className="pe-row">
        <img className="pe-egg" src={ITM('oeuf')} alt="" loading="lazy" />
        {slot(c[0])}
        <span className="pe-x">+</span>
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
      <div className="pt-p choix">
        {Object.entries(POTAGER).map(([g, G]) => (
          <Button key={g} size="small" data-pot-g={g} disabled={!(PROFILE.money >= G.p)}>
            {`${G.n} · ${fmt(G.p)} ₽`}
            <em>{`${G.duration} combats : ${G.d}`}</em>
          </Button>
        ))}
        <Button size="small" variant="ghost" data-pot-x="">
          Annuler
        </Button>
      </div>
    ) : (
      <button type="button" className="pt-p vide" data-pot-i={i}>
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
    <div className="pt-p pousse">
      <span
        className={`pt-pl s${Math.min(3, 1 + Math.floor(((G.duration - r) / G.duration) * 3))}`}
        aria-hidden="true"
      />
      <b>{G.n}</b>
      <em>{`Encore ${pl(r, 'combat')}`}</em>
    </div>
  ) : (
    <button type="button" className="pt-p mur" data-pot-r={i}>
      <span className="pt-pl s4" aria-hidden="true" />
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
      <h3 className="cb-st">Potager</h3>
      <div className="pt-g">
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
    <section className="camp4 v4-panel" id="v4Camp" aria-label="Camp de base">
      {filled && (
        <>
          <header className="v4-ph">
            <svg>
              <use href="#i-map" />
            </svg>
            <b>Camp de base</b>
          </header>
          <div className="cb-grid">
            {Object.keys(BUILDINGS).map(k => (
              <Building key={k} k={k} />
            ))}
          </div>
          <h3 className="cb-st">{'Expéditions' + (places ? ` · ${exp.length} / ${places}` : '')}</h3>
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
