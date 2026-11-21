import { Html } from '../../lib/html.jsx';
import { strength } from '../../lib/power.js';
import { MOVES, SHAPE, ABILITIES } from '../../engine/data/moves.js';
import { REGION_NAMES } from '../../engine/data/hoenn.js';
import { POKEMON, NOTES, familyOf } from '../../engine/pokemon/pokemon.js';
import { rosterCost, ROLEFX } from '../../engine/pokemon/roles-synergies.js';
import { typeBadge, typeColor } from '../../engine/core/utils.js';
import { STAT_NAMES, squad } from '../../engine/team/team.js';
import { pokemonArtUrl } from '../../engine/assets/images.js';
import { SCREEN_STATE } from '../../engine/ui/screen-state.js';
import { ownedFam } from '../../engine/progression/trainer-stats.js';
import { DEX_MEASUREMENTS } from '../../engine/data/pokedex.js';
import { LORE } from '../../engine/data/pokedex-texts.js';
import { DEX_SPECIES } from '../../engine/progression/pokedex.js';
import { SPARK, isShinyOwned, shinyHue } from '../../engine/pokemon/shiny.js';
import { roleBadgeHtml } from '../../engine/combat/resonance.js';
import { captureSite } from '../../engine/world/catch-anywhere.js';
import { REGIONAL_FORM_LIST } from '../../engine/pokemon/regional-forms.js';
import { space } from '../../lib/theme.js';

import Button from '../../components/Button.jsx';
const no3 = n => String(n).padStart(3, '0');

// Sheet of the selected Pokémon (#dex4Card). The transient classes scanSweep / dexNew
// (sweep, first discovery) are still set by the engine (v4.48).
export default function DexCard() {
  const m = POKEMON[SCREEN_STATE.dexSel] || DEX_SPECIES[0];
  const dm = DEX_MEASUREMENTS[m.no] || [0, 0, ''],
    own = ownedFam(m.id),
    sh = isShinyOwned(m.id),
    family = familyOf(m.id),
    tl = ABILITIES[m.ability],
    i = DEX_SPECIES.indexOf(m),
    prev = DEX_SPECIES[(i - 1 + DEX_SPECIES.length) % DEX_SPECIES.length],
    next = DEX_SPECIES[(i + 1) % DEX_SPECIES.length],
    note = NOTES[m.id],
    placeLabel = captureSite(m.id),
    fr = REGIONAL_FORM_LIST.find(x => x.id === m.id); // regional form (v4.70)
  const roles = [m.r, m.r2].filter((r, k, a) => r && a.indexOf(r) === k);
  const style = { '--c': typeColor(m.t[0]), '--c2': typeColor(m.t[1] || m.t[0]) };
  if (sh) {
    style['--sh'] = shinyHue(m.id) + 'deg';
  }
  return (
    <article
      className={`dex-card card${sh ? ' shiny' : ''}${own ? ' dex-owned' : ''}`}
      id="dex4Card"
      aria-live="polite"
      style={style}
    >
      <div className="dex-card-top">
        <div className="dex-art">
          <span className="dex-art-shadow" aria-hidden="true" />
          {/* one image per Pokémon: the shiny illustration (v4.25) is set by the engine */}
          <img
            key={m.id}
            src={pokemonArtUrl(m.no)}
            alt={m.n}
            decoding="async"
            className={fr ? 'is-regional-form' : undefined}
            style={fr ? { '--form-hue': fr.hue + 'deg' } : undefined}
          />
          <span className="dex-art-number">{`N° ${no3(m.no)}`}</span>
          {sh && (
            <span className="dex-art-shiny">
              <Html html={SPARK} />
              Chromatique capturé
            </span>
          )}
          {!own && <span className="dex-art-missing">{`Non capturé${placeLabel ? ' · ' + placeLabel : ''}`}</span>}
        </div>
        {'\n  '}
        <div className="dex-info">
          <p className="dex-category">{`Pokémon ${dm[2]} · ${REGION_NAMES[m.gen] || 'Johto'}`}</p>
          <h2 className="dex-name">{m.n}</h2>
          <div className="dex-types">
            {m.t.map((t, k) => (
              <Html key={k} html={typeBadge(t)} />
            ))}
          </div>
          {'\n   '}
          <p className="dex-lore">{LORE[m.id] || ''}</p>
          {'\n   '}
          <dl className="dex-facts">
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
              <dd>{`${rosterCost(m.id)} PC`}</dd>
            </div>
            <div>
              <dt>Stade</dt>
              <dd>{`${m.st} / ${Math.max(...family.map(x => x.st))}`}</dd>
            </div>
          </dl>
        </div>
      </div>
      {'\n  '}
      <div className="dex-sections">
        <section className="dex-section">
          <h3>Rôle</h3>
          <div className="dex-roles">
            {roles.map(r => (
              <span className="dex-role" key={r}>
                <b>{r}</b>
                {ROLEFX[r] ? ` · ${ROLEFX[r].k}` : null}
              </span>
            ))}
          </div>
          {ROLEFX[m.r] ? <p className="dex-note">{ROLEFX[m.r].d}</p> : null}
          {note ? <p className="dex-note is-highlight">{note}</p> : null}
        </section>
        {'\n   '}
        <section className="dex-section">
          <h3>Statistiques</h3>
          <div className="dex-stats">
            {STAT_NAMES.map((n, k) => (
              <div className="dex-stat" key={k}>
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
        <section className="dex-section">
          <h3>Capacités</h3>
          <div className="dex-moves">
            {m.mv.map((id, k) => {
              const v = MOVES[id];
              return (
                <div className="dex-move" key={k}>
                  <Html html={typeBadge(v.t)} />
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
            <p className="dex-note">
              <b>{`Talent · ${tl[0]}.`}</b>
              {` ${tl[1]}`}
            </p>
          ) : null}
        </section>
      </div>
      {'\n  '}
      <div className="dex-family">
        <button
          type="button"
          className="dex-family-arrow"
          data-dex={prev.id}
          aria-label={`Pokémon précédent : ${prev.n}`}
        >
          <svg>
            <use href="#i-chevl" />
          </svg>
        </button>
        {'\n   '}
        <div className="dex-family-chain">
          {family.map((x, k) => [
            k > 0 && (
              <svg className="dex-family-step" aria-hidden="true" key={'to' + k}>
                <use href="#i-chevr" />
              </svg>
            ),
            <button
              type="button"
              className={`dex-family-member${x.id === m.id ? ' is-current' : ''}`}
              data-dex={x.id}
              style={{ '--c': typeColor(x.t[0]) }}
              key={x.id}
            >
              <img src={pokemonArtUrl(x.no)} alt="" loading="lazy" width="56" height="56" />
              <b>{x.n}</b>
              <em>{`Stade ${x.st}`}</em>
            </button>,
          ])}
        </div>
        {'\n   '}
        <button
          type="button"
          className="dex-family-arrow"
          data-dex={next.id}
          aria-label={`Pokémon suivant : ${next.n}`}
        >
          <svg>
            <use href="#i-chevr" />
          </svg>
        </button>
      </div>
      {'\n  '}
      <div className="dex-actions">
        <Button data-v4sheet={m.id}>Fiche tactique complète</Button>
        <Button variant="primary" data-go="pokedex">
          {squad.some(id => POKEMON[id].base === m.base) ? 'Dans l’équipe · voir' : 'Recruter dans l’équipe'}
          <svg>
            <use href="#i-arrow" />
          </svg>
        </Button>
      </div>
      {fr && (
        <p
          className="regional-form"
          style={{
            margin: `${space.sm} 0`,
            padding: `${space.xs} ${space.sm}`,
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
