import { useState } from 'react';
import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/data/game-data.js';
import { MV } from '../../../engine/data/moves.js';
import { SCEN, WXN, WXT } from '../../../engine/pokemon/pokemon.js';
import { SYN } from '../../../engine/pokemon/roles-synergies.js';
import { ARENAS, arenaNext } from '../../../engine/modes/gyms.js';
import { medal, tc } from '../../../engine/core/utils.js';
import { badgeSvg } from '../../../engine/modes/league.js';
import { byUid } from '../../../engine/combat/engine.js';
import { B, ui } from '../../../engine/combat/ui.js';
import { isEnemyTurn } from '../../../engine/combat/quick-battle.js';
import { currentActor } from '../../../engine/combat/tactical-engine.js';
import { chipTime } from '../../../engine/combat/living-board.js';
import { chipWind } from '../../../engine/combat/tactics.js';
import { chipMut } from '../../../engine/combat/mutators.js';
import { chipChord } from '../../../engine/combat/resonance-chords.js';
import { fieldEffectChips } from '../../../engine/moves/epic-tms.js';
import { PREF } from '../../../engine/ui/preferences.js';
import { DOCTRINE_DEFS } from '../../../engine/combat/doctrines.js';
import { RELIC_DEFS } from '../../../engine/modes/deep-echo.js';
import { useBattleVersion } from './battleStore.js';

import Button from '../../../components/Button.jsx';
// Top banner: battle name, round, chips (weather, time, wind…), Voice, ×2, Abandon.
export function BtTop() {
  const v = useBattleVersion('top');
  const on = v > 0 && B;
  const D = B && B.duel433;
  return (
    <div className="battle-topbar">
      <b id="bScen" className="battle-topbar-name">
        {!on ? null : D && !B.over ? (
          <>
            Duel · <b className={'dj' + D.j}>{D.names[D.j - 1]}</b>
          </>
        ) : (
          SCEN[B.sc].n
        )}
      </b>
      <span id="bRound" className="battle-topbar-round">
        {on && (
          <>
            Manche <b>{B.round}</b> / {B.lim}
          </>
        )}
      </span>
      <Phase />
      <span id="bWx" className="battle-topbar-chips">
        {on && <Chips />}
      </span>
      <span className="battle-voice" id="bVoix">
        {on && (
          <>
            <span>Voix</span>
            {Array.from({ length: B.vmax }, (_, i) => (
              <i key={i} className={i < B.voice ? 'is-on' : ''} />
            ))}
          </>
        )}
      </span>
      <Quick />
      <Button size="small" variant="ghost" className="battle-quit" id="bQuit">
        Abandonner
      </Button>
    </div>
  );
}

// Phase chip (compact view): Placement, Your turn, Opponent turn, Awakening. It follows the bottom bar
// ("foot" version, rewritten on every turn change); its data-ph tints the scene (combat-compact.css).
export function phaseOf(B0) {
  if (!B0 || B0.over) {
    return null;
  }
  if (B0.deployPhase) {
    return 'deploy';
  }
  if (ui.cutscene) {
    return 'evo';
  }
  if (ui.busy) {
    return isEnemyTurn() || B0.phase === 'enemy' ? 'enemy' : 'busy';
  }
  return 'own';
}
const PHASE_T = { deploy: 'Placement', own: 'À vous', enemy: 'Tour adverse', evo: 'Éveil', busy: 'Résolution' };
function Phase() {
  useBattleVersion('foot');
  useBattleVersion('top');
  const ph = phaseOf(B);
  return (
    <span className="battle-phase" data-ph={ph || 'none'} hidden={!ph}>
      <i aria-hidden="true" />
      {ph ? (B.duel433 && ph === 'own' ? B.duel433.names[B.duel433.j - 1] : PHASE_T[ph]) : null}
    </span>
  );
}

// "×2" button: its state follows the setting (endSkipSpeedup).
function Quick() {
  const v = useBattleVersion('fast');
  return (
    <Button
      size="small"
      variant="ghost"
      className="battle-speed"
      id="bFast"
      aria-pressed={v > 0 ? !!PREF.fast : false}
      aria-label="Combat rapide, animations deux fois plus courtes"
    >
      ×2
    </Button>
  );
}

// Chips: weather, time, wind, mutator, chord, TM (engine functions), then doctrine (v4.30),
// relics and fog (v4.31).
function Chips() {
  const doc = B.doctrineChoice && DOCTRINE_DEFS[B.doctrineChoice];
  return (
    <>
      {B.wx && (
        <span className="chip">
          <i style={{ background: tc(WXT[B.wx.k]) }} />
          {WXN[B.wx.k]} · {B.wx.n}
        </span>
      )}
      <Html html={chipTime(B) + chipWind(B) + chipMut(B) + chipChord(B) + fieldEffectChips(B)} />
      {doc && (
        <span className="chip chip-doctrine-choice" title={`${doc.d} ${doc.c}`}>
          <svg>
            <use href="#i-doctrine" />
          </svg>
          {doc.n}
        </span>
      )}
      {B.sc === 'echo431' && B.relicBag && B.relicBag.length > 0 && (
        <span className="chip chip-relic-chip" title={B.relicBag.map(k => RELIC_DEFS[k][0]).join(', ')}>
          {B.relicBag.length} relique{B.relicBag.length > 1 ? 's' : ''}
        </span>
      )}
      {B.fogOfWar && <span className="chip chip-fog-of-war">Brouillard</span>}
    </>
  );
}

// Active team synergies (#bSyn), created on the first render of the battle.
export function Synergies() {
  const v = useBattleVersion('top');
  if (!v) {
    return null;
  }
  const L2 = B ? (B.syn || []).map(k => SYN.find(x => x.k === k)).filter(Boolean) : [];
  return (
    <div className="battle-synergies" id="bSyn" hidden={!L2.length}>
      {L2.length > 0 && (
        <>
          <span className="caption">Synergies</span>
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
export function Rule() {
  const v = useBattleVersion('top');
  const [last, setLast] = useState(null);
  let cur = null;
  if (v && B) {
    const D = SCEN[B.sc],
      an = arenaNext(B),
      gi = D.gym != null ? D.gym : ARENAS.findIndex(a => a.rule === D.rule);
    if (D.rule && gi >= 0) {
      cur = { gi, next: an ? an.txt : null };
    }
  }
  if (cur && (!last || last.gi !== cur.gi || last.next !== cur.next)) {
    setLast(cur);
  }
  const R = cur || last;
  return (
    <div className="battle-rule" id="bArena" hidden={!cur}>
      {v && R ? (
        <>
          <span className="battle-rule-badge">
            <Html html={badgeSvg(R.gi, GYMS[R.gi].t, 'ba' + R.gi)} />
          </span>
          <span>
            <b>
              <Html html={GYMS[R.gi].r} />
            </b>
            {R.next ? (
              <em>
                <Html html={R.next} />
              </em>
            ) : null}
          </span>
        </>
      ) : null}
    </div>
  );
}

// Speed-order timeline (v4.5): who plays, in what order, this round.
// Hidden, it keeps its last content, like the old DOM.
export function Timeline() {
  const v = useBattleVersion('top');
  const vis = !!(v && B && B.order === 'vitesse' && B.turnQueue && !B.over);
  const [last, setLast] = useState(null);
  let cur = null;
  if (vis) {
    const now = currentActor(B);
    const rows = [];
    B.turnQueue.forEach((id, i) => {
      const u = byUid(B, id);
      if (!u) {
        return;
      }
      const doneFlag = i < B.queueIndex || u.ko,
        prio = u.side === 'e' && u.intent && MV[u.intent.mv].prio;
      rows.push({
        i,
        cls: `battle-order-unit ${u.side === 'a' ? 'is-ally' : 'is-enemy'}${u === now ? ' is-current' : ''}${doneFlag ? ' is-done' : ''}${u.ko ? ' is-ko' : ''}`,
        title: 'Vitesse ' + String(B.queueSpeeds[i]).replace('.', ','),
        t: u.t,
        n: u.n,
        prio: prio || 0,
      });
    });
    cur = { round: B.round, rows };
  }
  if (cur && JSON.stringify(cur) !== JSON.stringify(last)) {
    setLast(cur);
  }
  const F = cur || last;
  return (
    <div className="battle-order" id="bOrdre" hidden={!vis} aria-label="Ordre de jeu de la manche">
      {v && F ? (
        <>
          <span className="battle-order-label">Ordre · manche {F.round}</span>
          {F.rows.map(r => (
            <span key={r.i} className={r.cls} title={r.title}>
              <Html html={medal(r.t, 'is-small')} />
              <b>{r.n}</b>
              {r.prio ? <em>{r.prio > 0 ? 'Priorité' : 'En dernier'}</em> : null}
            </span>
          ))}
        </>
      ) : null}
    </div>
  );
}
