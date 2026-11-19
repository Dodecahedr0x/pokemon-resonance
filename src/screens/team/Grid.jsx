import { Html } from '../../lib/html.jsx';
import { PKA } from '../../engine/003-images.js';
import { dexNo } from '../../engine/004-data.js';
import { MV } from '../../engine/005-moves.js';
import { REGN } from '../../engine/008-hoenn-data.js';
import { BY, familyOf } from '../../engine/009-pokemon.js';
import { BUDGET } from '../../engine/010-in-battle-evolution.js';
import { ITEMS2, PROFILE, inBox, isCamp, ownedItems } from '../../engine/011-game-state.js';
import { RC, ROLEFX } from '../../engine/012-recruits-roles-synergies.js';
import { INK, gp, medal, tb, tc } from '../../engine/014-utils.js';
import { TEAM_MAX, cost, squad } from '../../engine/020-team-cards.js';
import { RANGS, stars, rankId } from '../../engine/053-resonance.js';
import { captureSite421 } from '../../engine/061-catch-anywhere.js';

// Grille des familles (#dexGrid), v : familles visibles (visible() du moteur). Clics (data-stg, data-qa, data-open) et reflet au survol :
// écouteurs du moteur sur #dexGrid, qui reste monté.
export default function Grid({ v }) {
  return (
    <div className="dex-grid fam-grid" id="dexGrid">
      {v && (v.length ? v.map(m => <FamCard key={m.id} m={m} />) : <p className="empty">Aucune famille ne correspond à ces filtres.</p>)}
    </div>
  );
}

// Coût en PC : quatre pastilles.
function Pips({ c }) {
  return [1, 2, 3, 4].map(i => <i key={i} className={i <= c ? 'on' : ''} />);
}

// Orbe de type derrière l'illustration.
function Orb({ m }) {
  return (
    <span className="orb " style={{ '--c': tc(m.t[0]), '--c2': tc(m.t[1] || m.t[0]) }}>
      <span className="orb-in">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d={gp(m.t[0])} fill={INK} fillRule="evenodd" />
        </svg>
      </span>
    </span>
  );
}

// Illustration absente : la carte garde son orbe.
function onArtError(e) {
  const im = e.currentTarget;
  im.style.display = 'none';
  im.parentElement.classList.add('sprite-fallback');
}

// Carte d'une famille (ancien famCard).
function FamCard({ m }) {
  const family = familyOf(m.id),
    later = family.filter(x => x.st > 1),
    inS = squad.find(id => BY[id].base === m.id),
    on = !!inS,
    lock = !inBox(m.id),
    dim = !on && !lock && (m.c > BUDGET - cost() || squad.length >= TEAM_MAX),
    fat = isCamp() && !lock ? PROFILE.fatigue[m.id] || 0 : 0,
    it = PROFILE.equip[m.id] && ownedItems().includes(PROFILE.equip[m.id]) ? ITEMS2[PROFILE.equip[m.id]] : null,
    maxSt = Math.max(...family.map(x => x.st)),
    rg = rankId(m.id),
    placeLabel = lock && !PROFILE.dex.includes(m.id) ? captureSite421(m.id) : '',
    // chromatique capturé (habillage v4.73)
    shiny = ((PROFILE && PROFILE.shiny) || []).includes(m.id);
  const cls =
    'fcard' +
    (family.length > 1 ? ' has-stg' : '') +
    (on ? ' in' : '') +
    (dim ? ' dim' : '') +
    (lock ? ' locked' : '') +
    (later.length > 2 ? ' many' : '') +
    (shiny ? ' pk-shiny' : '');
  return (
    <article className={cls} style={{ '--c': tc(m.t[0]), '--c2': tc(m.t[1] || m.t[0]) }}>
      <div className="fc-in">
        <div className="fc-top">
          <span className="fc-no">{dexNo(m.no)}</span>
          <span className="fc-gen">{REGN[m.gen] || 'Johto'}</span>
          <span className={`fc-rg rg-${rg}`} title={`Rang ${RANGS[rg].n} · ${RANGS[rg].k}`}>
            {stars(rg)}
          </span>
          <span className="pc" title={`${m.c} PC`}>
            <Pips c={m.c} />
          </span>
        </div>
        <div className="fc-art">
          <span className="fc-burst" aria-hidden="true" />
          <Orb m={m} />
          <img className="pokemon-art-sprite" src={PKA(m.no)} alt={m.n} loading="lazy" decoding="async" onError={onArtError} />
          <span className="fc-st">{maxSt > 1 ? `${maxSt} stades` : 'Stade unique'}</span>
          {lock && (
            <span className="fc-lock">
              {PROFILE.dex.includes(m.id) ? 'Vu' : 'À capturer'}
              {placeLabel ? <i>{placeLabel}</i> : null}
            </span>
          )}
          {it && (
            <span className="fc-it" title={`${it.n} : ${it.d}`}>
              <svg viewBox="0 0 24 24">
                <path d={it.i} />
              </svg>
            </span>
          )}
        </div>
        {fat ? (
          <span className={`fc-fat${fat >= 70 ? ' hi' : ''}`} title={`Fatigue ${fat} %`}>
            <i style={{ width: `${fat}%` }} />
          </span>
        ) : null}
        <div className="fc-name">
          <h3>{m.n}</h3>
          <span className="fc-role" title={ROLEFX[m.r] ? ROLEFX[m.r].d : ''}>
            {m.r}
          </span>
        </div>
        {inS && inS !== m.id && (
          <span className="fc-sq">
            En équipe : {BY[inS].n} · {RC(inS)} PC
          </span>
        )}
        <div className="types">
          {m.t.map(t => (
            <Html key={t} html={tb(t)} />
          ))}
        </div>
        <p className="fc-mv">{m.mv.map(id => MV[id].n).join(' · ')}</p>
        {later.length ? null : (
          <div className="fc-chain">
            <em>Stade unique · puissant d’emblée</em>
          </div>
        )}
        {family.length > 1 && <div className={`fc-sp${family.length > 3 ? ' two' : ''}`} aria-hidden="true" />}
        <span className="fc-foil" aria-hidden="true" />
        <span className="fc-glare" aria-hidden="true" />
        {shiny && (
          <span className="pk-shn" aria-hidden="true">
            ✦ Chromatique
          </span>
        )}
      </div>
      <button className="dex-open" type="button" data-open={m.id} aria-label={`Ouvrir la carte de ${m.n}`} />
      {family.length > 1 && (
        <div className={`fc-stg${family.length > 3 ? ' many' : ''}`} role="group" aria-label={`Recruter un stade de ${m.n}`}>
          {family.map(x => {
            const sel = squad.includes(x.id);
            return (
              <button
                key={x.id}
                type="button"
                className={`stg${sel ? ' on' : ''}${x.st > 1 ? ' ev' : ''}`}
                data-stg={x.id}
                aria-pressed={sel}
                disabled={!inBox(x.id)}
                title={`${x.n} · ${RC(x.id)} PC${x.st > 1 ? ' · recrue confirmée' : ''}`}
              >
                <Html html={medal(x.t, 'xs')} />
                <b>{x.n}</b>
                <em>{RC(x.id)} PC</em>
              </button>
            );
          })}
        </div>
      )}
      <button className="qa" type="button" data-qa={m.id} aria-pressed={on} aria-label={`${on ? 'Retirer' : 'Recruter'} ${m.n}`}>
        <svg>
          <use href="#i-plus" />
        </svg>
      </button>
    </article>
  );
}
