import { MOVES } from '../../../engine/data/moves.js';
import { POKEMON, familyOf } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { typeColor } from '../../../engine/core/utils.js';
import { STAT_NAMES } from '../../../engine/team/team.js';
import { pokemonArtUrl } from '../../../engine/assets/images.js';
import {
  DUEL_STATE,
  STAT_MAX,
  DUEL_TERRAINS,
  DUEL_TUTORIAL_0,
  duelStep,
  duelNew,
  duelOrder,
} from '../../../engine/modes/duel.js';

import Button from '../../../components/Button.jsx';
import CardHeader from '../../../components/CardHeader.jsx';
const Options = ({ L }) =>
  L.map(([k, n]) => (
    <option key={k} value={k}>
      {n}
    </option>
  ));

function Types({ T }) {
  return T.map((t, i) => (
    <i key={i} className="camp-duel-type" style={{ '--type-color': typeColor(t) }}>
      {t}
    </i>
  ));
}

// Toggle buttons for the settings (data-duel-report-s).
function Seg({ k, L, v }) {
  return (
    <div className="tabs segmented-control" role="group">
      {L.map(([x, n]) => (
        <button key={x} type="button" data-duel-report-s={k} data-v={x} aria-pressed={String(v) === String(x)}>
          {n}
        </button>
      ))}
    </div>
  );
}

// Duel settings: names (input reread by the engine), forms, size, terrain, time of day, rounds.
function Preferences({ C }) {
  return (
    <div className="camp-duel-settings">
      <div className="camp-duel-fields">
        <label className="form-field camp-duel-name dj1">
          <span>Joueur 1 · commence</span>
          <input type="text" data-duel-report-n="0" maxLength={14} defaultValue={C.names[0]} autoComplete="off" />
        </label>
        <label className="form-field camp-duel-name dj2">
          <span>Joueur 2</span>
          <input type="text" data-duel-report-n="1" maxLength={14} defaultValue={C.names[1]} autoComplete="off" />
        </label>
      </div>
      <div className="form-field">
        <span>Formes</span>
        <Seg
          k="mode"
          L={[
            ['base', 'De base · Éveils en combat'],
            ['final', 'Évoluées'],
          ]}
          v={C.mode}
        />
      </div>
      <div className="form-field">
        <span>Pokémon par joueur</span>
        <Seg
          k="sizeValue"
          L={[
            [3, '3'],
            [4, '4'],
          ]}
          v={C.sizeValue}
        />
      </div>
      <div className="camp-duel-fields">
        <label className="form-field">
          <span>Terrain</span>
          <select data-duel-report-c="terrain" defaultValue={String(C.terrain)}>
            <Options L={Object.entries(DUEL_TERRAINS).map(([k, t]) => [k, t.n])} />
          </select>
        </label>
        <label className="form-field">
          <span>Heure</span>
          <select data-duel-report-c="heure" defaultValue={String(C.timeOfDay)}>
            <Options
              L={[
                ['jour', 'Jour'],
                ['nuit', 'Nuit'],
              ]}
            />
          </select>
        </label>
        <label className="form-field">
          <span>Manches</span>
          <select data-duel-report-c="lim" defaultValue={String(C.lim)}>
            <Options L={[8, 10, 12].map(x => [x, String(x)])} />
          </select>
        </label>
      </div>
      <p className="camp-duel-hint">{`${C.sizeValue * 2 + 4} Pokémon tirés au hasard, un bannissement chacun, puis le choix en serpent : ${C.sizeValue === 3 ? 'J1, J2, J2, J1, J1, J2' : 'J1, J2, J2, J1, J1, J2, J2, J1'}. Le Joueur 2 joue en second : il choisit deux fois d’affilée en premier.`}</p>
      <div className="camp-duel-actions">
        <Button variant="primary" data-duel-report="tirer">
          Tirer les Pokémon
        </Button>
      </div>
    </div>
  );
}

// A draw card (data-duel-report-p): banned, taken or selected.
function Card({ C, id }) {
  const m = POKEMON[id],
    ban = C.bans[0].includes(id) ? 1 : C.bans[1].includes(id) ? 2 : 0,
    pk = C.picks[0].includes(id) ? 1 : C.picks[1].includes(id) ? 2 : 0,
    family = familyOf(id),
    nEv = C.mode === 'final' ? 0 : Math.max(0, ...family.map(x => (x.st || 1) - (m.st || 1)));
  const cls = ban ? ' is-banned' : pk ? ' is-picked dj' + pk : C.sel === id ? ' is-selected' : '';
  return (
    <button
      type="button"
      className={`camp-duel-pick${cls}`}
      data-duel-report-p={id}
      disabled={!!(ban || pk)}
      aria-pressed={C.sel === id}
    >
      <img src={pokemonArtUrl(m.no)} alt="" loading="lazy" />
      <b>{m.n}</b>
      <span className="camp-duel-types">
        <Types T={m.t} />
      </span>
      <em>{m.r || ''}</em>
      <span className="camp-duel-stats" aria-label={STAT_NAMES.map((n, i) => n + ' ' + m.s[i]).join(', ')}>
        {m.s.map((v, i) => (
          <i key={i} title={`${STAT_NAMES[i]} ${v}`} style={{ '--v': `${Math.round((v / STAT_MAX) * 100)}%` }} />
        ))}
      </span>
      {nEv ? <small>{`${nEv} Éveil${nEv > 1 ? 's' : ''}`}</small> : null}
      {ban ? (
        <span className="camp-duel-pick-tag">{`Banni · J${ban}`}</span>
      ) : pk ? (
        <span className="camp-duel-pick-tag">{`J${pk}`}</span>
      ) : null}
    </button>
  );
}

// The selected Pokémon: moves, stats, lineage.
function Detail({ C }) {
  const id = C.sel;
  if (!id || !POKEMON[id]) {
    return <p className="camp-duel-hint">Touchez un Pokémon pour voir ses capacités.</p>;
  }
  const m = POKEMON[id],
    family = familyOf(id).map(x => x.n);
  return (
    <div className="camp-duel-detail">
      <div className="camp-duel-detail-header">
        <b>{m.n}</b>
        <Types T={m.t} />
        <em>{[m.r, m.r2].filter(Boolean).join(' · ')}</em>
      </div>
      <div className="camp-duel-moves">
        {m.mv
          .filter(k => MOVES[k])
          .map((k, i) => {
            const v = MOVES[k];
            return (
              <span key={i}>
                <i style={{ background: typeColor(v.t) }} />
                <b>{v.n}</b>
                <em>{`${v.p ? 'Puissance ' + v.p : 'Effet'}${v.r ? ' · portée ' + v.r : ''}`}</em>
              </span>
            );
          })}
      </div>
      <p className="camp-duel-lineage">
        {STAT_NAMES.map((n, i) => `${n} ${m.s[i]}`).join(' · ')}
        {family.length > 1 && C.mode !== 'final' ? (
          <>
            <br />
            {`Lignée : ${family.join(' → ')}`}
          </>
        ) : null}
      </p>
    </div>
  );
}

// A player's team: their picks and their bans.
function Team({ C, j }) {
  const L = C.picks[j],
    B0 = C.bans[j];
  return (
    <div className={`camp-duel-team dj${j + 1}`}>
      <b>{C.names[j]}</b>
      <div className="camp-duel-team-slots">
        {Array.from({ length: C.sizeValue }, (_, i) =>
          L[i] ? (
            <span key={i} title={POKEMON[L[i]].n}>
              <img src={pokemonArtUrl(POKEMON[L[i]].no)} alt={POKEMON[L[i]].n} />
            </span>
          ) : (
            <span key={i} className="is-empty" />
          )
        )}
      </div>
      {B0.length ? <em>{`Banni : ${B0.map(x => POKEMON[x].n).join(', ')}`}</em> : null}
    </div>
  );
}

// The draw: order, step, teams, pool, actions.
function Draw({ C }) {
  const st = duelStep(C),
    ord = duelOrder(C.sizeValue);
  return (
    <>
      <div className="camp-duel-order" aria-label="Ordre du tirage">
        {ord.map((x, i) => (
          <span
            key={i}
            className={`dj${x.j + 1}${i < C.stepCount ? ' is-done' : i === C.stepCount ? ' is-current' : ''}${x.a === 'ban' ? ' is-ban' : ''}`}
          >{`${x.a === 'ban' ? '✕' : ''}J${x.j + 1}`}</span>
        ))}
      </div>
      {st ? (
        <p className="camp-duel-step">
          <b className={`dj${st.j + 1}`}>{C.names[st.j]}</b>
          {' ' + (st.a === 'ban' ? 'bannit un Pokémon : personne ne pourra le prendre.' : 'choisit un Pokémon.')}
        </p>
      ) : (
        <p className="camp-duel-step">Les équipes sont prêtes.</p>
      )}
      <div className="camp-duel-teams">
        <Team C={C} j={0} />
        <Team C={C} j={1} />
      </div>
      {st ? (
        <>
          <div className="camp-duel-pool">
            {C.pool.map(id => (
              <Card key={id} C={C} id={id} />
            ))}
          </div>
          <Detail C={C} />
        </>
      ) : null}
      <div className="camp-duel-actions">
        {st ? (
          <Button variant="primary" data-duel-report="ok" disabled={!C.sel}>
            {C.sel
              ? (st.a === 'ban' ? 'Bannir ' : 'Choisir ') + POKEMON[C.sel].n
              : st.a === 'ban'
                ? 'Bannir…'
                : 'Choisir…'}
          </Button>
        ) : (
          <Button size="large" variant="primary" data-duel-report="lancer">
            Lancer le duel
          </Button>
        )}
        {C.stepCount ? <Button data-duel-report="annuler">Annuler le dernier choix</Button> : null}
        <Button variant="ghost" data-duel-report="tirer">
          Nouveau tirage
        </Button>
        <Button variant="ghost" data-duel-report="reglages">
          Réglages
        </Button>
      </div>
    </>
  );
}

// Camp › Duel (v4.33): local two-player duel on one phone.
export default function Duel() {
  const C = DUEL_STATE || duelNew(),
    P0 = PROFILE.duel433 || DUEL_TUTORIAL_0().duel433,
    H = (P0.h || []).slice(-5).reverse();
  return (
    <section className="card camp-duel">
      <CardHeader icon="fight" title="Duel local" count={`${P0.n || 0} duel${(P0.n || 0) > 1 ? 's' : ''}`} />
      <p className="v4-ps-n">
        Deux joueurs, un téléphone. Chacun dirige son équipe à son tour, avec les mêmes règles : ni objets, ni natures,
        ni doctrines, terrain symétrique. Aucune récompense : seulement l’honneur.
      </p>
      {C.e === 'reglages' ? <Preferences C={C} /> : <Draw C={C} />}
      {H.length ? (
        <div className="camp-duel-history">
          <h3>Derniers duels</h3>
          {H.map((x, i) => (
            <div key={i} className="camp-duel-history-row">
              <span className={x.g === 1 ? 'is-winner' : undefined}>{x.n[0]}</span>
              <em>{x.g ? 'contre' : 'nul ·'}</em>
              <span className={x.g === 2 ? 'is-winner' : undefined}>{x.n[1]}</span>
              <small>{`${x.d ? x.d.split('-').reverse().join('/') + ' · ' : ''}${x.r} manche${x.r > 1 ? 's' : ''}${x.w === 'temps' ? ' · aux PV' : x.w === 'forfait' ? ' · forfait' : ''}`}</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
