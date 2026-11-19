import { Html } from '../../lib/html.jsx';
import { MV, SHAPE, TAL } from '../../engine/005-02-capacites.js';
import { REGN } from '../../engine/008-v4-19-00-hoenn-donnees.js';
import { BY, NOTES, famOf } from '../../engine/009-03-pokemon.js';
import { RC, ROLEFX } from '../../engine/012-06-recrues-roles-synergies.js';
import { tb, tc } from '../../engine/014-08-outils.js';
import { STLN, squad } from '../../engine/020-13-equipe-cartes.js';
import { ART, PIX, V4, ownedFam } from '../../engine/032-v4-00-socle.js';
import { DEXM } from '../../engine/033-v4-01-donnees-pokedex.js';
import { LORE } from '../../engine/034-v4-02-textes-pokedex.js';
import { DEXS } from '../../engine/038-v4-06-pokedex.js';
import { SPARK, isShinyOwned, shinyHue } from '../../engine/043-v4-4-01-aventure-plus.js';
import { mrg414 } from '../../engine/053-v4-14-01-resonance.js';
import { lieuCapture421 } from '../../engine/061-v4-21-01-capture-partout.js';
import { FR470 } from '../../engine/102-v4-70-formes-regionales-pokedex.js';

const no3 = n => String(n).padStart(3, '0');

// Fiche du Pokémon choisi (#dex4Card). Les classes passagères scan448 / new448
// (balayage, première découverte) restent posées par le moteur (v4.48).
export default function DexCard() {
  const m = BY[V4.dexSel] || DEXS[0];
  const dm = DEXM[m.no] || [0, 0, ''],
    own = ownedFam(m.id),
    sh = isShinyOwned(m.id),
    fam = famOf(m.id),
    tl = TAL[m.tal],
    i = DEXS.indexOf(m),
    prev = DEXS[(i - 1 + DEXS.length) % DEXS.length],
    next = DEXS[(i + 1) % DEXS.length],
    note = NOTES[m.id],
    lieu = lieuCapture421(m.id),
    fr = FR470.find(x => x.id === m.id); // forme régionale (v4.70)
  const roles = [m.r, m.r2].filter((r, k, a) => r && a.indexOf(r) === k);
  const style = { '--c': tc(m.t[0]), '--c2': tc(m.t[1] || m.t[0]) };
  if (sh) style['--sh'] = shinyHue(m.id) + 'deg';
  return (
    <article
      className={`v4-dexcard v4-panel${sh ? ' shiny' : ''}${own ? ' own448' : ''}`}
      id="dex4Card"
      aria-live="polite"
      style={style}
    >
      <div className="v4d-top">
        <div className="v4d-art">
          <span className="v4d-glow" aria-hidden="true" />
          {/* une image par Pokémon : l'illustration chromatique (v4.25) est posée par le moteur */}
          <img key={m.id} src={ART(m.no)} alt={m.n} decoding="async" style={fr ? { filter: 'hue-rotate(' + fr.hue + 'deg)' } : undefined} />
          <span className="v4d-no">{`N° ${no3(m.no)}`}</span>
          {sh && (
            <span className="v4d-shn">
              <Html html={SPARK} />
              Chromatique capturé
            </span>
          )}
          {!own && <span className="v4d-own">{`Non capturé${lieu ? ' · ' + lieu : ''}`}</span>}
        </div>
        {'\n  '}
        <div className="v4d-info">
          <p className="v4d-cat">{`Pokémon ${dm[2]} · ${REGN[m.gen] || 'Johto'}`}</p>
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
              <dd>{`${m.st} / ${Math.max(...fam.map(x => x.st))}`}</dd>
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
                    <Html html={mrg414(v)} />
                  </b>
                  <span>{`${v.p ? 'Puiss. ' + v.p : v.fix ? v.fix + ' fixes' : 'Effet'} · ${SHAPE[v.sh]}${v.r ? ' ' + v.r : ''}`}</span>
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
          {fam.map((x, k) => [
            k > 0 && (
              <svg className="v4d-to" aria-hidden="true" key={'to' + k}>
                <use href="#i-chevr" />
              </svg>
            ),
            <button type="button" className={`v4d-f${x.id === m.id ? ' on' : ''}`} data-dex={x.id} style={{ '--c': tc(x.t[0]) }} key={x.id}>
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
          className="fr470"
          style={{ margin: '8px 0', padding: '6px 10px', borderRadius: '10px', background: 'hsl(' + fr.hue + ' 40% 25% / .6)', fontSize: '.85em' }}
        >
          {'Forme régionale · ' + fr.reg + ' : gagne le type ' + fr.plus + ' en combat dans cette région.'}
        </p>
      )}
    </article>
  );
}
