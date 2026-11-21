import { useKeyed } from '../../lib/useKeyed.js';
import { Html } from '../../lib/html.jsx';
import { strength } from '../../lib/power.js';
import { useEngineReady } from '../../engineReady.js';
import { useRoster } from './teamStore.js';
import { ELEMENT_TYPES, MARKS, MARK_REACTIONS, REACTIONS, dexNo } from '../../engine/data/game-data.js';
import { MOVES, SHAPE, ABILITIES } from '../../engine/data/moves.js';
import { REGION_NAMES } from '../../engine/data/hoenn.js';
import { POKEMON, NOTES, familyOf } from '../../engine/pokemon/pokemon.js';
import { ARRIVAL_EFFECTS } from '../../engine/pokemon/evolution.js';
import { ITEMS2, LINK_N, LINK_T, PROFILE, inBox, isCamp, lvlOfPts, ownedItems } from '../../engine/state/game-state.js';
import { RC, ROLEFX, roleIcon } from '../../engine/pokemon/roles-synergies.js';
import { markOf, medal, typeBadge, typeColor } from '../../engine/core/utils.js';
import { BRANCHES, mhpOf } from '../../engine/combat/engine.js';
import {
  STAT_NAMES,
  branchNote,
  crestSmall,
  evoDiff,
  monEls,
  monMarks,
  nextOf,
  squad,
} from '../../engine/team/team.js';
import { HELD_IMG } from '../../engine/state/economy.js';
import { itemIcon } from '../../engine/assets/item-icons.js';
import { moveLearned } from '../../engine/moves/tms.js';
import { characterHtml } from '../../engine/team/characters.js';
import { RANKS, stars, rankId } from '../../engine/combat/resonance.js';
import { duoTechnique } from '../../engine/combat/duo-techniques.js';
import { captureSite } from '../../engine/world/catch-anywhere.js';

import Button from '../../components/Button.jsx';
// Pokémon sheet (#sheet / #sh). Opening, closing, focus and scrolling: the engine's openSheet /
// closeSheet; clicks (data-close, data-open, data-rx, data-qa, data-eq): the engine's
// listener on #sheet, which stays mounted. When closed, the sheet keeps its last content (old DOM).
export default function Sheet() {
  const ready = useEngineReady();
  const { open, id, sheet } = useRoster();
  const content = useKeyed(() => (ready && id ? <Content id={id} /> : null), [ready, id, sheet]);
  return (
    <div className="team-sheet" id="sheet" hidden={!open}>
      <div className="team-sheet-scrim" data-close="" />
      <div
        className="team-sheet-panel"
        id="sh"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shName"
        style={ready && id ? { '--c': typeColor(POKEMON[id].t[0]) } : undefined}
      >
        {content}
      </div>
    </div>
  );
}

const T = s => <Html html={s} />;

function Content({ id }) {
  const m = POKEMON[id],
    base = POKEMON[m.base];
  const prep = [],
    trig = [];
  monMarks(m).forEach(k =>
    MARK_REACTIONS[k].forEach(r => {
      if (r && r !== 'ren' && !prep.includes(r)) {
        prep.push(r);
      }
    })
  );
  monEls(m).forEach(e => {
    const i = ELEMENT_TYPES.indexOf(e);
    MARKS.forEach(k => {
      const r = MARK_REACTIONS[k.id][i];
      if (r && r !== 'ren' && !trig.includes(r)) {
        trig.push(r);
      }
    });
  });
  const rl = arr =>
    arr.map(r => (
      <button key={r} type="button" className={`chip cat-${REACTIONS[r].k}`} data-rx={r}>
        <i />
        {REACTIONS[r].n}
      </button>
    ));
  const tl = ABILITIES[m.ability],
    family = familyOf(id),
    nx = nextOf(m),
    rg = rankId(m.id);
  const pn = m.st > 1 ? branchNote(m.prev, id) : '';
  return (
    <>
      <div className="team-sheet-hero">
        <div className="team-sheet-grab" />
        <button className="team-sheet-close" type="button" data-close="" aria-label="Fermer la fiche">
          <svg>
            <use href="#i-x" />
          </svg>
        </button>
        <span className="team-sheet-number">
          {dexNo(m.no)} · {REGION_NAMES[m.gen] || 'Johto'} · stade {m.st}
        </span>
        <div className="team-sheet-crest">{T(crestSmall(m))}</div>
        <h2 className="team-sheet-title" id="shName">
          {m.n}
        </h2>
        <p className="team-sheet-subtitle">
          {m.r} · {m.r2}
        </p>
        <p className="team-sheet-role">
          <span className={`team-sheet-rank rank-tag rank-${rg}`}>{stars(rg)}</span>
          <span>
            <b>
              Rang {RANKS[rg].n} · {RANKS[rg].k}
            </b>{' '}
            · {T(RANKS[rg].d)}
          </span>
        </p>
        {ROLEFX[m.r] ? (
          <p className="team-sheet-role">
            {T(roleIcon(m.r))}
            <span>
              <b>{ROLEFX[m.r].k}</b> · {T(ROLEFX[m.r].d)}
            </span>
          </p>
        ) : null}
        <div className="team-sheet-types">
          {m.t.map(t => (
            <Html key={t} html={typeBadge(t)} />
          ))}
        </div>
      </div>
      <div className="team-sheet-section">
        <div className="team-sheet-stages" role="tablist" aria-label="Stades de la famille">
          {family.map(x => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === id}
              className={`team-sheet-stage${x.id === id ? ' is-selected' : ''}`}
              data-open={x.id}
            >
              <Html html={medal(x.t, 'is-small')} />
              <span>
                <b>{x.n}</b>
                <em>{x.st === 1 ? 'Recrue' : 'Éveil ' + (x.st - 1)}</em>
              </span>
            </button>
          ))}
        </div>
        {m.st === 1 ? (
          <p className="team-sheet-hint is-ok">
            Se recrute pour {m.c} PC.
            {nx.length ? ' Il évolue en combat ; ses formes évoluées se recrutent aussi directement, plus cher.' : ''}
          </p>
        ) : (
          <>
            <p className="team-sheet-hint">
              S’obtient en combat par l’Éveil de <b>{POKEMON[m.prev].n}</b>
              {pn ? ' (' + pn + ')' : ''}.{' '}
              {inBox(id)
                ? `Recrue confirmée : se recrute aussi directement pour ${RC(id)} PC, sans Arrivée ni soin d’Éveil.`
                : `Se recrute directement (${RC(id)} PC) une fois ${base.n} capturé.`}
            </p>
            <Evd a={m.prev} b={id} from />
          </>
        )}
      </div>
      <Extras base={base} />
      <div className="team-sheet-section">
        <h4>
          Capacités<span>{m.mv.length}</span>
        </h4>
        {m.mv.map(x => (
          <MvCard key={x} id={x} />
        ))}
        {T(moveLearned(id))}
        {T(characterHtml(id))}
        {tl ? (
          <div className="mvc tal">
            <div className="t">
              <b>{tl[0]}</b>
              <span className="chip">Talent</span>
            </div>
            <p>{T(tl[1])}</p>
          </div>
        ) : null}
      </div>
      {nx.length ? (
        <div className="team-sheet-section">
          <h4>
            Éveil suivant<span>{nx.length > 1 ? nx.length + ' voies' : 'irréversible'}</span>
          </h4>
          <p className="empty">
            {m.nx === 'eevee'
              ? 'Ses 5 évolutions sont au choix au moment de l’Éveil. En harmonie avec sa case (Trempée : Aquali, Chargée : Voltali, Brûlante : Pyroli) ou avec l’heure (Mentali le jour, Noctali la nuit), il garde 1 losange.'
              : BRANCHES[m.id]
                ? BRANCHES[m.id]
                    .map(
                      b =>
                        `${POKEMON[b.id].n} : ${/^PV/.test(b.why) ? b.why : b.why[0].toLowerCase() + b.why.slice(1)}${b.def ? ' (voie par défaut)' : ''}`
                    )
                    .join(' · ') + '. Une seule sera prise.'
                : Array.isArray(m.nx)
                  ? 'Deux voies au choix : une seule sera prise.'
                  : 'Trois losanges d’énergie, 1 Voix et son action.'}
          </p>
          {nx.map(x => (
            <Evd key={x} a={id} b={x} />
          ))}
        </div>
      ) : null}
      <div className="team-sheet-section">
        <h4>
          Statistiques<span>PV en combat : {mhpOf(m.s)}</span>
        </h4>
        <div className="team-sheet-stats">
          {m.s.map((v, i) => (
            <div key={i} className="team-sheet-stat">
              <span>{STAT_NAMES[i]}</span>
              <div className="team-sheet-stat-bar">
                <i style={{ width: `${v * 20}%`, animationDelay: `${i * 60}ms` }} />
              </div>
              <b>{v}</b>
            </div>
          ))}
        </div>
      </div>
      {NOTES[id] || prep.length || trig.length ? (
        <div className="team-sheet-section">
          <h4>Lecture tactique</h4>
          {NOTES[id] ? <p className="team-sheet-note">{T(NOTES[id])}</p> : null}
          {prep.length ? (
            <>
              <h4>Prépare</h4>
              <div className="team-sheet-reactions">{rl(prep)}</div>
            </>
          ) : null}
          {trig.length ? (
            <>
              <h4>Déclenche</h4>
              <div className="team-sheet-reactions">{rl(trig)}</div>
            </>
          ) : null}
        </div>
      ) : null}
      <div className="team-sheet-actions">
        <Action m={m} base={base} id={id} />
      </div>
    </>
  );
}

// Recruit, replace or remove this stage.
function Action({ m, base, id }) {
  const cur = squad.find(x => POKEMON[x].base === base.id),
    onM = cur === id,
    ok = inBox(id);
  return (
    <Button variant={onM ? undefined : 'primary'} data-qa={id} disabled={!onM && !ok}>
      {onM
        ? `Retirer ${m.n} de l’équipe`
        : ok
          ? `${cur ? 'Remplacer ' + POKEMON[cur].n + ' par ' : 'Recruter '}${m.n} · ${RC(id)} PC`
          : m.st > 1 && isCamp() && inBox(base.id)
            ? `${m.n} : à éveiller en combat d’abord`
            : `${base.n} : à capturer${captureSite(base.id) ? ' · ' + captureSite(base.id) : ''}`}
    </Button>
  );
}

// Move card (old mvCard).
function MvCard({ id }) {
  const m = MOVES[id];
  const sp = [strength(m), SHAPE[m.sh] + (m.r ? ' ' + m.r : ''), m.mk ? markOf(m.mk).n : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <div className="mvc">
      <div className="t">
        <b>{m.n}</b>
        {T(typeBadge(m.t))}
      </div>
      <span className="mvs">{sp}</span>
      <p>{T(m.d)}</p>
    </div>
  );
}

// What an Awakening changes (old diffHtml). `from`: the Awakening that led to this stage, as an inset.
function Evd({ a, b, from }) {
  const D = evoDiff(a, b),
    B2 = POKEMON[b],
    note = branchNote(a, b);
  const Tag = from ? 'div' : 'button';
  return (
    <Tag
      type={from ? undefined : 'button'}
      className={from ? 'team-evolution is-origin' : 'team-evolution'}
      data-open={b}
    >
      <div className="team-evolution-head">
        <Html html={medal(B2.t)} />
        <b>{B2.n}</b>
        {note ? <em>{note}</em> : null}
      </div>
      <ul>
        {D.gain.length ? (
          <li className="is-gain">
            <span>Gagne</span>
            {D.gain.map(x => MOVES[x].n).join(', ')}
          </li>
        ) : null}
        {D.lose.length ? (
          <li className="is-lose">
            <span>Perd</span>
            {D.lose.map(x => MOVES[x].n).join(', ')}
          </li>
        ) : null}
        {D.tg.length || D.tl.length ? (
          <li>
            <span>Types</span>
            {D.tg.length ? '+' + D.tg.join(', ') : ''}
            {D.tl.length ? (D.tg.length ? ' · ' : '') + '−' + D.tl.join(', ') : ''}
          </li>
        ) : null}
        {D.ability ? (
          <li>
            <span>Talent</span>
            {ABILITIES[D.ability][0]}
          </li>
        ) : null}
        {D.role ? (
          <li>
            <span>Rôle</span>
            {D.role}
          </li>
        ) : null}
        <li>
          <span>PV max</span>
          {D.hp >= 0 ? '+' : ''}
          {D.hp}
        </li>
        {ARRIVAL_EFFECTS[b] ? (
          <li className="is-arrival">
            <span>Arrivée</span>
            {T(ARRIVAL_EFFECTS[b][1])}
          </li>
        ) : null}
      </ul>
    </Tag>
  );
}

// Illustrated item icon (old itemizeDom on the sheet); without an image, it is hidden.
function ItemImg({ k }) {
  const k2 = Object.keys(ITEMS2).find(x => ITEMS2[x].i === ITEMS2[k].i) || k;
  return (
    <img
      className="it-img"
      src={itemIcon(HELD_IMG[k2])}
      alt=""
      loading="lazy"
      onError={e => (e.currentTarget.style.display = 'none')}
    />
  );
}

// Held item, fatigue and links (old sheetExtras, v1.0).
function Extras({ base }) {
  const own = inBox(base.id),
    its = ownedItems(),
    cur = PROFILE.equipment[base.id],
    fat = isCamp() ? PROFILE.fatigue[base.id] || 0 : 0;
  const mates = Object.entries(PROFILE.links)
    .filter(([k]) => k.split('|').includes(base.id))
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <>
      <div className="team-sheet-section">
        <h4>
          Objet tenu
          <span>
            {its.length} disponible{its.length > 1 ? 's' : ''}
          </span>
        </h4>
        {own ? (
          its.length ? (
            <div className="team-sheet-items">
              {its.map(k => {
                const holder = Object.keys(PROFILE.equipment).find(x => PROFILE.equipment[x] === k && x !== base.id);
                return (
                  <button
                    key={k}
                    type="button"
                    className={`team-sheet-item${cur === k ? ' is-selected' : ''}`}
                    data-eq={base.id}
                    data-it={cur === k ? '' : k}
                  >
                    <span className="it-ic">
                      <ItemImg k={k} />
                    </span>
                    <span>
                      <b>{ITEMS2[k].n}</b>
                      <em>
                        {T(ITEMS2[k].d)}
                        {holder ? ` · tenu par ${POKEMON[holder].n}` : ''}
                      </em>
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="empty">Aucun objet pour l’instant : les badges en rapportent, la Boutique en vend.</p>
          )
        ) : (
          <p className="empty">{base.n} doit d’abord être capturé.</p>
        )}
        {fat ? (
          <p className={`team-sheet-hint${fat >= 70 ? '' : ' is-ok'}`}>
            Fatigue {fat} %
            {fat >= 70
              ? ' : −1 Mouvement au prochain combat. Laissez-le se reposer un combat, ou faites-le évoluer.'
              : ''}
          </p>
        ) : null}
      </div>
      {mates.length ? (
        <div className="team-sheet-section">
          <h4>
            Liens<span>{mates.length}</span>
          </h4>
          {mates.map(([k, v]) => {
            const o = k.split('|').find(x => x !== base.id) || base.id,
              l = lvlOfPts(v),
              D = duoTechnique(k);
            return (
              <div key={k} className="team-sheet-link">
                <Html html={medal(POKEMON[o].t, 'is-small')} />
                <span>
                  <b>{POKEMON[o].n}</b>
                  <em>
                    {l ? LINK_N[l] : 'Pas encore de palier'} · {v} point{v > 1 ? 's' : ''}
                    {D ? ` · duo : ${D.n}${l >= 3 ? '' : ' (palier Duo)'}` : ''}
                  </em>
                </span>
                <span className="team-sheet-link-bar">
                  <i style={{ width: `${Math.min(100, (v / LINK_T[2]) * 100)}%` }} />
                </span>
              </div>
            );
          })}
        </div>
      ) : null}
    </>
  );
}
