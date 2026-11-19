import { Html } from '../../lib/html.jsx';
import { strength } from '../../lib/power.js';
import { MV, SHAPE, TAL } from '../../engine/data/moves.js';
import { REGION_NAMES } from '../../engine/data/hoenn.js';
import { BY, NOTES, familyOf } from '../../engine/pokemon/pokemon.js';
import { RC, ROLEFX } from '../../engine/pokemon/roles-synergies.js';
import { tb, tc } from '../../engine/core/utils.js';
import { STLN, squad } from '../../engine/team/team.js';
import { ART, PIX } from '../../engine/assets/item-icons.js';
import { V4 } from '../../engine/ui/screen-state.js';
import { ownedFam } from '../../engine/progression/trainer-stats.js';
import { DEXM } from '../../engine/data/pokedex.js';
import { LORE } from '../../engine/data/pokedex-texts.js';
import { DEXS } from '../../engine/progression/pokedex.js';
import { SPARK, isShinyOwned, shinyHue } from '../../engine/pokemon/shiny.js';
import { roleBadgeHtml } from '../../engine/combat/resonance.js';
import { captureSite } from '../../engine/world/catch-anywhere.js';
import { REGIONAL_FORM_LIST } from '../../engine/pokemon/regional-forms.js';

const no3 = n => String(n).padStart(3, '0');

// Sheet of the selected Pokémon (#dex4Card). The transient classes scanSweep / dexNew
// (sweep, first discovery) are still set by the engine (v4.48).
export default function DexCard() {
  const m = BY[V4.dexSel] || DEXS[0];
  const dm = DEXM[m.no] || [0, 0, ''],
    own = ownedFam(m.id),
    sh = isShinyOwned(m.id),
    family = familyOf(m.id),
    tl = TAL[m.ability],
    i = DEXS.indexOf(m),
    prev = DEXS[(i - 1 + DEXS.length) % DEXS.length],
    next = DEXS[(i + 1) % DEXS.length],
    note = NOTES[m.id],
    placeLabel = captureSite(m.id),
    fr = REGIONAL_FORM_LIST.find(x => x.id === m.id); // regional form (v4.70)
  const roles = [m.r, m.r2].filter((r, k, a) => r && a.indexOf(r) === k);
  const style = { '--c': tc(m.t[0]), '--c2': tc(m.t[1] || m.t[0]) };
  if (sh) {
    style['--sh'] = shinyHue(m.id) + 'deg';
  }
  return (
    <article
      className={`v4-dexcard v4-panel${sh ? ' shiny' : ''}${own ? ' dex-owned' : ''}`}
      id="dex4Card"
      aria-live="polite"
      style={style}
    >
      <div className="v4d-top">
        <div className="v4d-art">
          <span className="v4d-glow" aria-hidden="true" />
          {/* one image per Pokémon: the shiny illustration (v4.25) is set by the engine */}
          <img
            key={m.id}
            src={ART(m.no)}
            alt={m.n}
            decoding="async"
            style={fr ? { filter: 'hue-rotate(' + fr.hue + 'deg)' } : undefined}
          />
          <span className="v4d-no">{`N° ${no3(m.no)}`}</span>
          {sh && (
            <span className="v4d-shn">
              <Html html={SPARK} />
              Chromatique capturé
            </span>
          )}
          {!own && <span className="v4d-own">{`Non capturé${placeLabel ? ' · ' + placeLabel : ''}`}</span>}
        </div>
        {'\n  '}
        <div className="v4d-info">
          <p className="v4d-cat">{`Pokémon ${dm[2]} · ${REGION_NAMES[m.gen] || 'Johto'}`}</p>
          <h2 className="v4d-n">{m.n}</h2>
          <div className="v4d-types">
            {m.t.map((t, k) => (
              <Html key={k} html={tb(t)} />
            ))}
          </div>
          {'\n   '}
          <p className="v4d-lore">{LORE[m.id] || ''}</p>
          {'\n   '}
          <dl className="v4d-hw">
            <div>
              <dt>Taille</dt>
              <dd>{`${String(dm[0]).replace('.', ',')} m`}</dd>
            </div>
            <div>
              <dt>Poids</dt>
              <dd>{`${String(dm[1]).replace('.', ',')} kg`}</dd>
            </div>
            <div>
              <dt>Recrutement</dt>
              <dd>{`${RC(m.id)} PC`}</dd>
            </div>
            <div>
              <dt>Stade</dt>
              <dd>{`${m.st} / ${Math.max(...family.map(x => x.st))}`}</dd>
            </div>
          </dl>
        </div>
      </div>
      {'\n  '}
      <div className="v4d-grid">
        <section className="v4d-sec">
          <h3>Rôle</h3>
          <div className="v4d-roles">
            {roles.map(r => (
              <span className="v4d-role" key={r}>
                <b>{r}</b>
                {ROLEFX[r] ? ` · ${ROLEFX[r].k}` : null}
              </span>
            ))}
          </div>
          {ROLEFX[m.r] ? <p className="v4d-p">{ROLEFX[m.r].d}</p> : null}
          {note ? <p className="v4d-p note">{note}</p> : null}
        </section>
        {'\n   '}
        <section className="v4d-sec">
          <h3>Statistiques</h3>
          <div className="v4d-stats">
            {STLN.map((n, k) => (
              <div className="v4-sb" key={k}>
                <span>{n}</span>
                <i>
                  <b style={{ width: m.s[k] * 20 + '%' }} />
                </i>
                <em>{m.s[k]}</em>
              </div>
            ))}
          </div>
        </section>
        {'\n   '}
        <section className="v4d-sec">
          <h3>Capacités</h3>
          <div className="v4d-mv">
            {m.mv.map((id, k) => {
              const v = MV[id];
              return (
                <div className="v4d-m" key={k}>
                  <Html html={tb(v.t)} />
                  <b>
                    {v.n}
                    <Html html={roleBadgeHtml(v)} />
                  </b>
                  <span>{`${strength(v, 'Puiss.')} · ${SHAPE[v.sh]}${v.r ? ' ' + v.r : ''}`}</span>
                  <em>{v.d}</em>
                </div>
              );
            })}
          </div>
          {tl ? (
            <p className="v4d-p">
              <b>{`Talent · ${tl[0]}.`}</b>
              {` ${tl[1]}`}
            </p>
          ) : null}
        </section>
      </div>
      {'\n  '}
      <div className="v4d-fam">
        <button type="button" className="v4d-arr" data-dex={prev.id} aria-label={`Pokémon précédent : ${prev.n}`}>
          <svg>
            <use href="#i-chevl" />
          </svg>
        </button>
        {'\n   '}
        <div className="v4d-chain">
          {family.map((x, k) => [
            k > 0 && (
              <svg className="v4d-to" aria-hidden="true" key={'to' + k}>
                <use href="#i-chevr" />
              </svg>
            ),
            <button
              type="button"
              className={`v4d-f${x.id === m.id ? ' on' : ''}`}
              data-dex={x.id}
              style={{ '--c': tc(x.t[0]) }}
              key={x.id}
            >
              <img src={PIX(x.no)} alt="" loading="lazy" width="56" height="56" />
              <b>{x.n}</b>
              <em>{`Stade ${x.st}`}</em>
            </button>,
          ])}
        </div>
        {'\n   '}
        <button type="button" className="v4d-arr" data-dex={next.id} aria-label={`Pokémon suivant : ${next.n}`}>
          <svg>
            <use href="#i-chevr" />
          </svg>
        </button>
      </div>
      {'\n  '}
      <div className="v4d-act">
        <button type="button" className="b" data-v4sheet={m.id}>
          Fiche tactique complète
        </button>
        <button type="button" className="b b-gold" data-go="pokedex">
          {squad.some(id => BY[id].base === m.base) ? 'Dans l’équipe · voir' : 'Recruter dans l’équipe'}
          <svg>
            <use href="#i-arrow" />
          </svg>
        </button>
      </div>
      {fr && (
        <p
          className="regional-form"
          style={{
            margin: '8px 0',
            padding: '6px 10px',
            borderRadius: '10px',
            background: 'hsl(' + fr.hue + ' 40% 25% / .6)',
            fontSize: '.85em',
          }}
        >
          {'Forme régionale · ' + fr.reg + ' : gagne le type ' + fr.plus + ' en combat dans cette région.'}
        </p>
      )}
    </article>
  );
}
