import { MV } from '../../../engine/005-moves.js';
import { BY, familyOf } from '../../../engine/009-pokemon.js';
import { PROFILE } from '../../../engine/011-game-state.js';
import { tc } from '../../../engine/014-utils.js';
import { STLN } from '../../../engine/020-team-cards.js';
import { ART } from '../../../engine/032-v4-foundation.js';
import { DUEL433, STMAX433, TERR433, V433_0, duelStep433, duelNew433, duelOrder433 } from '../../../engine/068-duel-tutorial.js';

const Options = ({ L }) => L.map(([k, n]) => <option key={k} value={k}>{n}</option>);

function Types({ T }) {
  return T.map((t, i) => <i key={i} className="du433-ty" style={{ '--c': tc(t) }}>{t}</i>);
}

// Toggle buttons for the settings (data-du433s).
function Seg({ k, L, v }) {
  return (
    <div className="v4-seg" role="group">
      {L.map(([x, n]) => <button key={x} type="button" data-du433s={k} data-v={x} aria-pressed={String(v) === String(x)}>{n}</button>)}
    </div>
  );
}

// Duel settings: names (input reread by the engine), forms, size, terrain, time of day, rounds.
function Preferences({ C }) {
  return (
    <div className="du433-cfg">
      <div className="du433-row">
        <label className="v4-fld du433-n dj1"><span>Joueur 1 · commence</span><input type="text" data-du433n="0" maxLength={14} defaultValue={C.noms[0]} autoComplete="off" /></label>
        <label className="v4-fld du433-n dj2"><span>Joueur 2</span><input type="text" data-du433n="1" maxLength={14} defaultValue={C.noms[1]} autoComplete="off" /></label>
      </div>
      <div className="v4-fld"><span>Formes</span><Seg k="mode" L={[['base', 'De base · Éveils en combat'], ['final', 'Évoluées']]} v={C.mode} /></div>
      <div className="v4-fld"><span>Pokémon par joueur</span><Seg k="taille" L={[[3, '3'], [4, '4']]} v={C.taille} /></div>
      <div className="du433-row">
        <label className="v4-fld"><span>Terrain</span><select data-du433c="terrain" defaultValue={String(C.terrain)}><Options L={Object.entries(TERR433).map(([k, t]) => [k, t.n])} /></select></label>
        <label className="v4-fld"><span>Heure</span><select data-du433c="heure" defaultValue={String(C.heure)}><Options L={[['jour', 'Jour'], ['nuit', 'Nuit']]} /></select></label>
        <label className="v4-fld"><span>Manches</span><select data-du433c="lim" defaultValue={String(C.lim)}><Options L={[8, 10, 12].map(x => [x, String(x)])} /></select></label>
      </div>
      <p className="du433-h">{`${C.taille * 2 + 4} Pokémon tirés au hasard, un bannissement chacun, puis le choix en serpent : ${C.taille === 3 ? 'J1, J2, J2, J1, J1, J2' : 'J1, J2, J2, J1, J1, J2, J2, J1'}. Le Joueur 2 joue en second : il choisit deux fois d’affilée en premier.`}</p>
      <div className="du433-a"><button type="button" className="b b-gold" data-du433="tirer">Tirer les Pokémon</button></div>
    </div>
  );
}

// A draw card (data-du433p): banned, taken or selected.
function MapScreen({ C, id }) {
  const m = BY[id],
    ban = C.bans[0].includes(id) ? 1 : C.bans[1].includes(id) ? 2 : 0,
    pk = C.picks[0].includes(id) ? 1 : C.picks[1].includes(id) ? 2 : 0,
    family = familyOf(id),
    nEv = C.mode === 'final' ? 0 : Math.max(0, ...family.map(x => (x.st || 1) - (m.st || 1)));
  const cls = ban ? ' ban' : pk ? ' pk dj' + pk : C.sel === id ? ' sel' : '';
  return (
    <button type="button" className={`du433-c${cls}`} data-du433p={id} disabled={!!(ban || pk)} aria-pressed={C.sel === id}>
      <img src={ART(m.no)} alt="" loading="lazy" />
      <b>{m.n}</b>
      <span className="du433-t"><Types T={m.t} /></span>
      <em>{m.r || ''}</em>
      <span className="du433-s" aria-label={STLN.map((n, i) => n + ' ' + m.s[i]).join(', ')}>
        {m.s.map((v, i) => <i key={i} title={`${STLN[i]} ${v}`} style={{ '--v': `${Math.round((v / STMAX433) * 100)}%` }} />)}
      </span>
      {nEv ? <small>{`${nEv} Éveil${nEv > 1 ? 's' : ''}`}</small> : null}
      {ban ? <span className="du433-x">{`Banni · J${ban}`}</span> : pk ? <span className="du433-x">{`J${pk}`}</span> : null}
    </button>
  );
}

// The selected Pokémon: moves, stats, lineage.
function Detail({ C }) {
  const id = C.sel;
  if (!id || !BY[id]) return <p className="du433-h">Touchez un Pokémon pour voir ses capacités.</p>;
  const m = BY[id],
    family = familyOf(id).map(x => x.n);
  return (
    <div className="du433-d">
      <div className="du433-dh"><b>{m.n}</b><Types T={m.t} /><em>{[m.r, m.r2].filter(Boolean).join(' · ')}</em></div>
      <div className="du433-mv">
        {m.mv
          .filter(k => MV[k])
          .map((k, i) => {
            const v = MV[k];
            return <span key={i}><i style={{ background: tc(v.t) }} /><b>{v.n}</b><em>{`${v.p ? 'Puissance ' + v.p : 'Effet'}${v.r ? ' · portée ' + v.r : ''}`}</em></span>;
          })}
      </div>
      <p className="du433-dl">
        {STLN.map((n, i) => `${n} ${m.s[i]}`).join(' · ')}
        {family.length > 1 && C.mode !== 'final' ? <><br />{`Lignée : ${family.join(' → ')}`}</> : null}
      </p>
    </div>
  );
}

// A player's team: their picks and their bans.
function Team({ C, j }) {
  const L = C.picks[j],
    B0 = C.bans[j];
  return (
    <div className={`du433-eq dj${j + 1}`}>
      <b>{C.noms[j]}</b>
      <div className="du433-eqm">
        {Array.from({ length: C.taille }, (_, i) => (L[i] ? <span key={i} title={BY[L[i]].n}><img src={ART(BY[L[i]].no)} alt={BY[L[i]].n} /></span> : <span key={i} className="v" />))}
      </div>
      {B0.length ? <em>{`Banni : ${B0.map(x => BY[x].n).join(', ')}`}</em> : null}
    </div>
  );
}

// The draw: order, step, teams, pool, actions.
function Draw({ C }) {
  const st = duelStep433(C),
    ord = duelOrder433(C.taille);
  return (
    <>
      <div className="du433-o" aria-label="Ordre du tirage">
        {ord.map((x, i) => (
          <span key={i} className={`dj${x.j + 1}${i < C.pas ? ' fait' : i === C.pas ? ' now' : ''}${x.a === 'ban' ? ' bn' : ''}`}>{`${x.a === 'ban' ? '✕' : ''}J${x.j + 1}`}</span>
        ))}
      </div>
      {st ? (
        <p className="du433-st"><b className={`dj${st.j + 1}`}>{C.noms[st.j]}</b>{' ' + (st.a === 'ban' ? 'bannit un Pokémon : personne ne pourra le prendre.' : 'choisit un Pokémon.')}</p>
      ) : (
        <p className="du433-st">Les équipes sont prêtes.</p>
      )}
      <div className="du433-eqs"><Team C={C} j={0} /><Team C={C} j={1} /></div>
      {st ? (
        <>
          <div className="du433-pool">{C.pool.map(id => <MapScreen key={id} C={C} id={id} />)}</div>
          <Detail C={C} />
        </>
      ) : null}
      <div className="du433-a">
        {st ? (
          <button type="button" className="b b-gold" data-du433="ok" disabled={!C.sel}>{C.sel ? (st.a === 'ban' ? 'Bannir ' : 'Choisir ') + BY[C.sel].n : st.a === 'ban' ? 'Bannir…' : 'Choisir…'}</button>
        ) : (
          <button type="button" className="b b-gold b-lg" data-du433="lancer">Lancer le duel</button>
        )}
        {C.pas ? <button type="button" className="b" data-du433="annuler">Annuler le dernier choix</button> : null}
        <button type="button" className="b b-ghost" data-du433="tirer">Nouveau tirage</button>
        <button type="button" className="b b-ghost" data-du433="reglages">Réglages</button>
      </div>
    </>
  );
}

// Camp › Duel (v4.33): local two-player duel on one phone.
export default function Duel() {
  const C = DUEL433 || duelNew433(),
    P0 = PROFILE.duel433 || V433_0().duel433,
    H = (P0.h || []).slice(-5).reverse();
  return (
    <section className="v4-panel du433">
      <header className="v4-ph"><svg><use href="#i-fight" /></svg><b>Duel local</b><span className="v4-cnt">{`${P0.n || 0} duel${(P0.n || 0) > 1 ? 's' : ''}`}</span></header>
      <p className="v4-ps-n">Deux joueurs, un téléphone. Chacun dirige son équipe à son tour, avec les mêmes règles : ni objets, ni natures, ni doctrines, terrain symétrique. Aucune récompense : seulement l’honneur.</p>
      {C.e === 'reglages' ? <Preferences C={C} /> : <Draw C={C} />}
      {H.length ? (
        <div className="du433-hi">
          <h3>Derniers duels</h3>
          {H.map((x, i) => (
            <div key={i} className="du433-hl">
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
