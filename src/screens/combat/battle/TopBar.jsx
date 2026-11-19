import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/004-data.js';
import { MV } from '../../../engine/005-moves.js';
import { SCEN, WXN, WXT } from '../../../engine/009-pokemon.js';
import { SYN } from '../../../engine/012-recruits-roles-synergies.js';
import { ARENAS, arenaNext } from '../../../engine/013-gyms.js';
import { medal, tc } from '../../../engine/014-utils.js';
import { badgeSvg } from '../../../engine/019-league.js';
import { byUid } from '../../../engine/021-combat-engine.js';
import { B, ui } from '../../../engine/024-combat-ui.js';
import { enemyTurn428 } from '../../../engine/063-combat-catches-home.js';
import { currentActor } from '../../../engine/044-tactical-engine.js';
import { chipTime } from '../../../engine/046-living-board.js';
import { chipWind } from '../../../engine/047-tactics.js';
import { chipMut } from '../../../engine/048-replayability.js';
import { chipChord } from '../../../engine/049-identity.js';
import { chips412 } from '../../../engine/051-epic-tms.js';
import { PREF } from '../../../engine/026-campaign-tutorial-sound.js';
import { DOCTRINES430 } from '../../../engine/065-camp-tactics.js';
import { RELICS431 } from '../../../engine/066-tactical-challenges.js';
import { useBattleVersion } from './battleStore.js';

// Top banner: battle name, round, chips (weather, time, wind…), Voice, ×2, Abandon.
export function BtTop() {
  const v = useBattleVersion('top');
  const on = v > 0 && B;
  const D = B && B.duel433;
  return (
    <div className="bt-top">
      <b id="bScen">
        {!on ? null : D && !B.over ? (
          <>
            Duel · <b className={'dj' + D.j}>{D.noms[D.j - 1]}</b>
          </>
        ) : (
          SCEN[B.sc].n
        )}
      </b>
      <span id="bRound">
        {on && (
          <>
            Manche <b>{B.round}</b> / {B.lim}
          </>
        )}
      </span>
      <Phase />
      <span id="bWx">{on && <Chips />}</span>
      <span className="voix" id="bVoix">
        {on && (
          <>
            <span>Voix</span>
            {Array.from({ length: B.vmax }, (_, i) => (
              <i key={i} className={i < B.voix ? 'on' : ''} />
            ))}
          </>
        )}
      </span>
      <Quick />
      <button className="b b-sm b-ghost" id="bQuit" type="button">
        Abandonner
      </button>
    </div>
  );
}

// Phase chip (compact view): Placement, Your turn, Opponent turn, Awakening. It follows the bottom bar
// ("foot" version, rewritten on every turn change); its data-ph tints the scene (combat-compact.css).
export function phaseOf(B0) {
  if (!B0 || B0.over) return null;
  if (B0.dep430) return 'deploy';
  if (ui.cine) return 'evo';
  if (ui.busy) return enemyTurn428() || B0.phase === 'enemy' ? 'enemy' : 'busy';
  return 'own';
}
const PHASE_T = { deploy: 'Placement', own: 'À vous', enemy: 'Tour adverse', evo: 'Éveil', busy: 'Résolution' };
function Phase() {
  useBattleVersion('foot');
  useBattleVersion('top');
  const ph = phaseOf(B);
  return (
    <span className="bt-ph" data-ph={ph || 'none'} hidden={!ph}>
      <i aria-hidden="true" />
      {ph ? (B.duel433 && ph === 'own' ? B.duel433.noms[B.duel433.j - 1] : PHASE_T[ph]) : null}
    </span>
  );
}

// "×2" button: its state follows the setting (quick428).
function Quick() {
  const v = useBattleVersion('fast');
  return (
    <button
      className="b b-sm b-ghost bfast"
      id="bFast"
      type="button"
      aria-pressed={v > 0 ? !!PREF.fast : false}
      aria-label="Combat rapide, animations deux fois plus courtes"
    >
      ×2
    </button>
  );
}

// Chips: weather, time, wind, mutator, chord, TM (engine functions), then doctrine (v4.30),
// relics and fog (v4.31).
function Chips() {
  const doc = B.doc430 && DOCTRINES430[B.doc430];
  return (
    <>
      {B.wx && (
        <span className="chip">
          <i style={{ background: tc(WXT[B.wx.k]) }} />
          {WXN[B.wx.k]} · {B.wx.n}
        </span>
      )}
      <Html html={chipTime(B) + chipWind(B) + chipMut(B) + chipChord(B) + chips412(B)} />
      {doc && (
        <span className="chip chip-doc430" title={`${doc.d} ${doc.c}`}>
          <svg>
            <use href="#i-doctrine" />
          </svg>
          {doc.n}
        </span>
      )}
      {B.sc === 'echo431' && B.rel431 && B.rel431.length > 0 && (
        <span className="chip chip-rel431" title={B.rel431.map(k => RELICS431[k][0]).join(', ')}>
          {B.rel431.length} relique{B.rel431.length > 1 ? 's' : ''}
        </span>
      )}
      {B.fog431 && <span className="chip chip-fog431">Brouillard</span>}
    </>
  );
}

// Active team synergies (#bSyn), created on the first render of the battle.
export function Synergies() {
  const v = useBattleVersion('top');
  if (!v) return null;
  const L2 = B ? (B.syn || []).map(k => SYN.find(x => x.k === k)).filter(Boolean) : [];
  return (
    <div className="bt-syn" id="bSyn" hidden={!L2.length}>
      {L2.length > 0 && (
        <>
          <span className="lbl-s">Synergies</span>
          {L2.map(x => (
            <span key={x.k} className="syn-c" title={x.d}>
              {x.t.map((t, i) => (
                <i key={i} style={{ background: tc(t) }} />
              ))}
              {x.n}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

// Board rule: the arena's, or the same rule picked up by a legend or a Tower floor.
// Hidden, it keeps its last content, like the old DOM.
let lastRule = null;
export function Rule() {
  const v = useBattleVersion('top');
  let cache = true;
  if (v && B) {
    const D = SCEN[B.sc],
      an = arenaNext(B),
      gi = D.gym != null ? D.gym : ARENAS.findIndex(a => a.rule === D.rule);
    cache = !D.rule || gi < 0;
    if (!cache)
      lastRule = (
        <>
          <span className="ba-b">
            <Html html={badgeSvg(gi, GYMS[gi].t, 'ba' + gi)} />
          </span>
          <span>
            <b>
              <Html html={GYMS[gi].r} />
            </b>
            {an ? (
              <em>
                <Html html={an.txt} />
              </em>
            ) : null}
          </span>
        </>
      );
  }
  return (
    <div className="bt-arena" id="bArena" hidden={cache}>
      {v ? lastRule : null}
    </div>
  );
}

// Speed-order timeline (v4.5): who plays, in what order, this round.
let lastFrieze = null;
export function Timeline() {
  const v = useBattleVersion('top');
  const vis = !!(v && B && B.ordre === 'vitesse' && B.file && !B.over);
  if (vis) {
    const cur = currentActor(B);
    lastFrieze = (
      <>
        <span className="bo-k">Ordre · manche {B.round}</span>
        {B.file.map((id, i) => {
          const u = byUid(B, id);
          if (!u) return null;
          const doneFlag = i < B.ifile || u.ko,
            prio = u.side === 'e' && u.intent && MV[u.intent.mv].prio;
          return (
            <span
              key={i}
              className={`bo ${u.side === 'a' ? 'al' : 'en'}${u === cur ? ' now' : ''}${doneFlag ? ' fait' : ''}${u.ko ? ' ko' : ''}`}
              title={'Vitesse ' + String(B.vfile[i]).replace('.', ',')}
            >
              <Html html={medal(u.t, 'sm')} />
              <b>{u.n}</b>
              {prio ? <em>{prio > 0 ? 'Priorité' : 'En dernier'}</em> : null}
            </span>
          );
        })}
      </>
    );
  }
  return (
    <div className="b-ordre" id="bOrdre" hidden={!vis} aria-label="Ordre de jeu de la manche">
      {v ? lastFrieze : null}
    </div>
  );
}
