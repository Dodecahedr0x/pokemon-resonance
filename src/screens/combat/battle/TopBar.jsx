import { useState } from 'react';
import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/data/game-data.js';
import { MOVES } from '../../../engine/data/moves.js';
import { SCENARIOS, WEATHER_NAME, WEATHER_TYPE } from '../../../engine/pokemon/pokemon.js';
import { SYNERGIES } from '../../../engine/pokemon/roles-synergies.js';
import { ARENAS, arenaNext } from '../../../engine/modes/gyms.js';
import { medal, typeColor } from '../../../engine/core/utils.js';
import { badgeSvg } from '../../../engine/modes/league.js';
import { byUid } from '../../../engine/combat/engine.js';
import { battle, ui } from '../../../engine/combat/ui.js';
import { isEnemyTurn } from '../../../engine/combat/quick-battle.js';
import { currentActor } from '../../../engine/combat/tactical-engine.js';
import { chipTime } from '../../../engine/combat/living-board.js';
import { chipWind } from '../../../engine/combat/tactics.js';
import { chipMut } from '../../../engine/combat/mutators.js';
import { chipChord } from '../../../engine/combat/resonance-chords.js';
import { fieldEffectChips } from '../../../engine/moves/epic-tms.js';
import { PREFERENCES } from '../../../engine/ui/preferences.js';
import { DOCTRINE_DEFS } from '../../../engine/combat/doctrines.js';
import { RELIC_DEFS } from '../../../engine/modes/deep-echo.js';
import { useBattleVersion } from './battleStore.js';

import Button from '../../../components/Button.jsx';
// Top banner: battle name, round, chips (weather, time, wind…), Voice, ×2, Abandon.
export function BtTop() {
  const v = useBattleVersion('top');
  const on = v > 0 && battle;
  const D = battle && battle.duel433;
  return (
    <div className="battle-topbar">
      <b id="bScen" className="battle-topbar-name">
        {!on ? null : D && !battle.over ? (
          <>
            Duel · <b className={'dj' + D.j}>{D.names[D.j - 1]}</b>
          </>
        ) : (
          SCENARIOS[battle.sc].n
        )}
      </b>
      <span id="bRound" className="battle-topbar-round">
        {on && (
          <>
            Manche <b>{battle.round}</b> / {battle.lim}
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
            {Array.from({ length: battle.vmax }, (_, i) => (
              <i key={i} className={i < battle.voice ? 'is-on' : ''} />
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
// ("foot" version, rewritten on every turn change); its data-ph tints the scene (battle-topbar.css).
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
  const ph = phaseOf(battle);
  return (
    <span className="battle-phase" data-ph={ph || 'none'} hidden={!ph}>
      <i aria-hidden="true" />
      {ph ? (battle.duel433 && ph === 'own' ? battle.duel433.names[battle.duel433.j - 1] : PHASE_T[ph]) : null}
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
      aria-pressed={v > 0 ? !!PREFERENCES.fast : false}
      aria-label="Combat rapide, animations deux fois plus courtes"
    >
      ×2
    </Button>
  );
}

// Chips: weather, time, wind, mutator, chord, TM (engine functions), then doctrine (v4.30),
// relics and fog (v4.31).
function Chips() {
  const doc = battle.doctrineChoice && DOCTRINE_DEFS[battle.doctrineChoice];
  return (
    <>
      {battle.wx && (
        <span className="chip">
          <i style={{ background: typeColor(WEATHER_TYPE[battle.wx.k]) }} />
          {WEATHER_NAME[battle.wx.k]} · {battle.wx.n}
        </span>
      )}
      <Html
        html={chipTime(battle) + chipWind(battle) + chipMut(battle) + chipChord(battle) + fieldEffectChips(battle)}
      />
      {doc && (
        <span className="chip chip-doctrine-choice" title={`${doc.d} ${doc.c}`}>
          <svg>
            <use href="#i-doctrine" />
          </svg>
          {doc.n}
        </span>
      )}
      {battle.sc === 'echo431' && battle.relicBag && battle.relicBag.length > 0 && (
        <span className="chip chip-relic-chip" title={battle.relicBag.map(k => RELIC_DEFS[k][0]).join(', ')}>
          {battle.relicBag.length} relique{battle.relicBag.length > 1 ? 's' : ''}
        </span>
      )}
      {battle.fogOfWar && <span className="chip chip-fog-of-war">Brouillard</span>}
    </>
  );
}

// Active team synergies (#bSyn), created on the first render of the battle.
export function Synergies() {
  const v = useBattleVersion('top');
  if (!v) {
    return null;
  }
  const L2 = battle ? (battle.syn || []).map(k => SYNERGIES.find(x => x.k === k)).filter(Boolean) : [];
  return (
    <div className="battle-synergies" id="bSyn" hidden={!L2.length}>
      {L2.length > 0 && (
        <>
          <span className="caption">Synergies</span>
          {L2.map(x => (
            <span key={x.k} className="synergy-chip" title={x.d}>
              {x.t.map((t, i) => (
                <i key={i} style={{ background: typeColor(t) }} />
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
  if (v && battle) {
    const D = SCENARIOS[battle.sc],
      an = arenaNext(battle),
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
  const vis = !!(v && battle && battle.order === 'vitesse' && battle.turnQueue && !battle.over);
  const [last, setLast] = useState(null);
  let cur = null;
  if (vis) {
    const now = currentActor(battle);
    const rows = [];
    battle.turnQueue.forEach((id, i) => {
      const u = byUid(battle, id);
      if (!u) {
        return;
      }
      const doneFlag = i < battle.queueIndex || u.ko,
        prio = u.side === 'e' && u.intent && MOVES[u.intent.mv].prio;
      rows.push({
        i,
        cls: `battle-order-unit ${u.side === 'a' ? 'is-ally' : 'is-enemy'}${u === now ? ' is-current' : ''}${doneFlag ? ' is-done' : ''}${u.ko ? ' is-ko' : ''}`,
        title: 'Vitesse ' + String(battle.queueSpeeds[i]).replace('.', ','),
        t: u.t,
        n: u.n,
        prio: prio || 0,
      });
    });
    cur = { round: battle.round, rows };
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
