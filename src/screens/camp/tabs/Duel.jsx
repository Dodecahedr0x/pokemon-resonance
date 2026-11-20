import { MV } from '../../../engine/data/moves.js';
import { BY, familyOf } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { tc } from '../../../engine/core/utils.js';
import { STLN } from '../../../engine/team/team.js';
import { ART } from '../../../engine/assets/item-icons.js';
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
    <i key={i} className="duel-report-ty" style={{ '--c': tc(t) }}>
      {t}
    </i>
  ));
}

// Toggle buttons for the settings (data-duel-report-s).
function Seg({ k, L, v }) {
  return (
    <div className="v4-seg" role="group">
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
    <div className="duel-report-cfg">
      <div className="duel-report-row">
        <label className="form-field duel-report-n dj1">
          <span>Joueur 1 · commence</span>
          <input type="text" data-duel-report-n="0" maxLength={14} defaultValue={C.names[0]} autoComplete="off" />
        </label>
        <label className="form-field duel-report-n dj2">
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
      <div className="duel-report-row">
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
      <p className="duel-report-h">{`${C.sizeValue * 2 + 4} Pokémon tirés au hasard, un bannissement chacun, puis le choix en serpent : ${C.sizeValue === 3 ? 'J1, J2, J2, J1, J1, J2' : 'J1, J2, J2, J1, J1, J2, J2, J1'}. Le Joueur 2 joue en second : il choisit deux fois d’affilée en premier.`}</p>
      <div className="duel-report-a">
        <Button variant="primary" data-duel-report="tirer">
          Tirer les Pokémon
        </Button>
      </div>
    </div>
  );
}

// A draw card (data-duel-report-p): banned, taken or selected.
function Card({ C, id }) {
  const m = BY[id],
    ban = C.bans[0].includes(id) ? 1 : C.bans[1].includes(id) ? 2 : 0,
    pk = C.picks[0].includes(id) ? 1 : C.picks[1].includes(id) ? 2 : 0,
    family = familyOf(id),
    nEv = C.mode === 'final' ? 0 : Math.max(0, ...family.map(x => (x.st || 1) - (m.st || 1)));
  const cls = ban ? ' ban' : pk ? ' pk dj' + pk : C.sel === id ? ' sel' : '';
  return (
    <button
      type="button"
      className={`duel-report-c${cls}`}
      data-duel-report-p={id}
      disabled={!!(ban || pk)}
      aria-pressed={C.sel === id}
    >
      <img src={ART(m.no)} alt="" loading="lazy" />
      <b>{m.n}</b>
      <span className="duel-report-t">
        <Types T={m.t} />
      </span>
      <em>{m.r || ''}</em>
      <span className="duel-report-s" aria-label={STLN.map((n, i) => n + ' ' + m.s[i]).join(', ')}>
        {m.s.map((v, i) => (
          <i key={i} title={`${STLN[i]} ${v}`} style={{ '--v': `${Math.round((v / STAT_MAX) * 100)}%` }} />
        ))}
      </span>
      {nEv ? <small>{`${nEv} Éveil${nEv > 1 ? 's' : ''}`}</small> : null}
      {ban ? (
        <span className="duel-report-x">{`Banni · J${ban}`}</span>
      ) : pk ? (
        <span className="duel-report-x">{`J${pk}`}</span>
      ) : null}
    </button>
  );
}

// The selected Pokémon: moves, stats, lineage.
function Detail({ C }) {
  const id = C.sel;
  if (!id || !BY[id]) {
    return <p className="duel-report-h">Touchez un Pokémon pour voir ses capacités.</p>;
  }
  const m = BY[id],
    family = familyOf(id).map(x => x.n);
  return (
    <div className="duel-report-d">
      <div className="duel-report-dh">
        <b>{m.n}</b>
        <Types T={m.t} />
        <em>{[m.r, m.r2].filter(Boolean).join(' · ')}</em>
      </div>
      <div className="duel-report-mv">
        {m.mv
          .filter(k => MV[k])
          .map((k, i) => {
            const v = MV[k];
            return (
              <span key={i}>
                <i style={{ background: tc(v.t) }} />
                <b>{v.n}</b>
                <em>{`${v.p ? 'Puissance ' + v.p : 'Effet'}${v.r ? ' · portée ' + v.r : ''}`}</em>
              </span>
            );
          })}
      </div>
      <p className="duel-report-dl">
        {STLN.map((n, i) => `${n} ${m.s[i]}`).join(' · ')}
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
    <div className={`duel-report-eq dj${j + 1}`}>
      <b>{C.names[j]}</b>
      <div className="duel-report-eqm">
        {Array.from({ length: C.sizeValue }, (_, i) =>
          L[i] ? (
            <span key={i} title={BY[L[i]].n}>
              <img src={ART(BY[L[i]].no)} alt={BY[L[i]].n} />
            </span>
          ) : (
            <span key={i} className="v" />
          )
        )}
      </div>
      {B0.length ? <em>{`Banni : ${B0.map(x => BY[x].n).join(', ')}`}</em> : null}
    </div>
  );
}

// The draw: order, step, teams, pool, actions.
function Draw({ C }) {
  const st = duelStep(C),
    ord = duelOrder(C.sizeValue);
  return (
    <>
      <div className="duel-report-o" aria-label="Ordre du tirage">
        {ord.map((x, i) => (
          <span
            key={i}
            className={`dj${x.j + 1}${i < C.stepCount ? ' fait' : i === C.stepCount ? ' now' : ''}${x.a === 'ban' ? ' bn' : ''}`}
          >{`${x.a === 'ban' ? '✕' : ''}J${x.j + 1}`}</span>
        ))}
      </div>
      {st ? (
        <p className="duel-report-st">
          <b className={`dj${st.j + 1}`}>{C.names[st.j]}</b>
          {' ' + (st.a === 'ban' ? 'bannit un Pokémon : personne ne pourra le prendre.' : 'choisit un Pokémon.')}
        </p>
      ) : (
        <p className="duel-report-st">Les équipes sont prêtes.</p>
      )}
      <div className="duel-report-eqs">
        <Team C={C} j={0} />
        <Team C={C} j={1} />
      </div>
      {st ? (
        <>
          <div className="duel-report-pool">
            {C.pool.map(id => (
              <Card key={id} C={C} id={id} />
            ))}
          </div>
          <Detail C={C} />
        </>
      ) : null}
      <div className="duel-report-a">
        {st ? (
          <Button variant="primary" data-duel-report="ok" disabled={!C.sel}>
            {C.sel ? (st.a === 'ban' ? 'Bannir ' : 'Choisir ') + BY[C.sel].n : st.a === 'ban' ? 'Bannir…' : 'Choisir…'}
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
    <section className="card duel-report">
      <CardHeader icon="fight" title="Duel local" count={`${P0.n || 0} duel${(P0.n || 0) > 1 ? 's' : ''}`} />
      <p className="v4-ps-n">
        Deux joueurs, un téléphone. Chacun dirige son équipe à son tour, avec les mêmes règles : ni objets, ni natures,
        ni doctrines, terrain symétrique. Aucune récompense : seulement l’honneur.
      </p>
      {C.e === 'reglages' ? <Preferences C={C} /> : <Draw C={C} />}
      {H.length ? (
        <div className="duel-report-hi">
          <h3>Derniers duels</h3>
          {H.map((x, i) => (
            <div key={i} className="duel-report-hl">
              <span className={x.g === 1 ? 'g' : ''}>{x.n[0]}</span>
              <em>{x.g ? 'contre' : 'nul ·'}</em>
              <span className={x.g === 2 ? 'g' : ''}>{x.n[1]}</span>
              <small>{`${x.d ? x.d.split('-').reverse().join('/') + ' · ' : ''}${x.r} manche${x.r > 1 ? 's' : ''}${x.w === 'temps' ? ' · aux PV' : x.w === 'forfait' ? ' · forfait' : ''}`}</small>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
