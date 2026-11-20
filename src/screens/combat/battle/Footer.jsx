import { useState } from 'react';
import { byUid, canAwaken, foeEvo } from '../../../engine/combat/engine.js';
import { B, ui } from '../../../engine/combat/ui.js';
import { currentActor } from '../../../engine/combat/tactical-engine.js';
import { isCoopPlayerAlive } from '../../../engine/modes/coop.js';
import { isEnemyTurn } from '../../../engine/combat/quick-battle.js';
import { riddlePhase } from '../../../engine/modes/riddles.js';
import { turnFlow } from '../../../engine/combat/painted-board.js';
import { getHost } from '../board/boardStore.js';
import BoardTools from '../board/BoardTools.jsx';
import { footPos as barBottom, useBattleVersion } from './battleStore.js';
import { STEP } from './frag.jsx';

import Button from '../../../components/Button.jsx';
// End-of-turn button, phase and step: renderTop, then the versions that rewrote them
// (deployment v4.30, riddle v4.31, duel v4.33, guided tour v4.78), in the same order.
function bar() {
  const foes = B.units.filter(u => u.side === 'e'),
    al = B.units.filter(u => u.side === 'a');
  const ready = al.filter(u => !u.ko && !u.acted).length,
    cur = B.order === 'vitesse' ? currentActor(B) : null;
  let disabled = (ui.busy && !isEnemyTurn()) || !!B.over || !!ui.skipSpeedup;
  let button = ui.cutscene ? (
    'Éveil…'
  ) : ui.busy ? (
    isEnemyTurn() ? (
      ui.skipSpeedup ? (
        'Accéléré…'
      ) : (
        <>
          Passer <span className="end-turn-count">»</span>
        </>
      )
    ) : (
      'Tour adverse…'
    )
  ) : cur ? (
    <>
      Terminer <span className="end-turn-count">{cur.n}</span>
    </>
  ) : B.coop ? (
    <>
      {B.coop === 1 && isCoopPlayerAlive(B, 2) ? 'Passer au J2' : 'Fin du tour'}{' '}
      <span className="end-turn-count">J{B.coop}</span>
    </>
  ) : (
    <>
      Fin du tour
      {ready ? (
        <>
          {' '}
          <span className="end-turn-count">
            {ready} prêt{ready > 1 ? 's' : ''}
          </span>
        </>
      ) : null}
    </>
  );
  const rdy = al.filter(u => !u.ko && canAwaken(B, u)).length,
    warn = foes.filter(u => foeEvo(B, u)).length;
  let phase = ui.cutscene
    ? 'Un Pokémon évolue.'
    : ui.busy
      ? 'Les adversaires exécutent leurs attaques.'
      : warn
        ? `${warn} ennemi${warn > 1 ? 's' : ''} sous 50 % : évolution en fin de manche.`
        : rdy
          ? `${rdy} Pokémon prêt${rdy > 1 ? 's' : ''} à s’éveiller.`
          : ready
            ? 'À vous : déplacez, puis agissez.'
            : 'Tous vos Pokémon ont joué.';
  if (B.coop && !ui.busy && !ui.cutscene) {
    phase = `Joueur ${B.coop} · ` + phase;
  } // co-op (v4.18)
  let playerRef = null;
  // deployment (v4.30)
  if (B.deployPhase && !B.over) {
    disabled = false;
    button = 'Lancer le combat';
    phase = ui.deploySel ? 'Touchez une case bleue.' : 'Placez vos Pokémon sur les cases bleues.';
  }
  // riddle (v4.31)
  if (B.sc === 'enigme431' && !B.over && !B.deployPhase) {
    button = 'Abandonner l’énigme';
    phase = riddlePhase();
  }
  // local duel (v4.33)
  const D = B.duel433;
  if (D && !B.over && !ui.cutscene) {
    if (ui.busy) {
      button = 'Fin de manche…';
    } else {
      const r = B.units.filter(u => u.side === 'a' && !u.ko && !u.acted).length;
      button = (
        <>
          {D.j === 1 ? `Passer à ${D.names[1]}` : 'Fin de la manche'}
          {r ? (
            <>
              {' '}
              <span className="end-turn-count">
                {r} prêt{r > 1 ? 's' : ''}
              </span>
            </>
          ) : null}
        </>
      );
      playerRef = <b className={'dj' + D.j}>{D.names[D.j - 1]}</b>;
      phase = phase.replace('À vous : ', '').replace('Tous vos Pokémon', 'Tous ses Pokémon');
    }
  }
  // guided tour (v4.78): no more "Fin du tour" (End of turn) during your phase
  const g = turnFlow.guide();
  let step = null;
  if (g) {
    const n = turnFlow.remaining(B).length,
      t =
        B.order === 'vitesse'
          ? 'À vous : déplacez, puis agissez.'
          : n
            ? `Encore ${n} Pokémon à jouer.`
            : 'Manche terminée.';
    phase = phase.replace(/(À vous : )?déplacez, puis agissez\./, t).replace(/Tous (vos|ses) Pokémon ont joué\./, t);
    const u = ui.sel && byUid(B, ui.sel);
    if (u && u.side === 'a' && !ui.selE) {
      step = (
        <>
          <b>{STEP[turnFlow.stepOf(B, u)]}</b> {u.n}
          {B.order !== 'vitesse' && n ? ` · encore ${n}` : ''}
        </>
      );
    }
  }
  return { disabled, actionButton: button, phase, player: playerRef, g, stepOf: step };
}

export default function Footer() {
  const v = useBattleVersion('foot');
  const [lastStep, setLastStep] = useState(null);
  const x = v && B ? bar() : null;
  // the hidden step keeps its last text, like the old DOM
  // (keyed by version: the step element is rebuilt on every render)
  if (x && x.stepOf && (!lastStep || lastStep.v !== v)) {
    setLastStep({ v, el: x.stepOf });
  }
  const Q = barBottom.qa,
    tools = getHost().boardTools;
  return (
    <div className={barBottom.cls.join(' ')}>
      {/* thumb-reach attacks (phone, v4.43): created on first use, then hidden */}
      {Q && (
        <div
          id="thumb-reach"
          className="thumb-reach"
          role="toolbar"
          aria-label="Actions du Pokémon choisi"
          hidden={Q.hidden}
        >
          {Q.items.map((b, i) => (
            <button
              key={i}
              type="button"
              data-thumb-reach={i}
              className={b.c + (b.on ? ' on' : '')}
              style={b.col ? { '--c': b.col } : undefined}
              disabled={b.disabled}
            >
              {b.col ? <i /> : null}
              {b.t}
            </button>
          ))}
        </div>
      )}
      <span className="phase" id="bPhase">
        {x && x.player ? (
          <>
            {x.player} · {x.phase}
          </>
        ) : (
          x && x.phase
        )}
      </span>
      {Q && Q.displayName ? <span className="thumb-reach-name">{Q.displayName}</span> : null}
      <Button
        variant="primary"
        id="bEnd"
        className="end-turn-button"
        disabled={x ? x.disabled : undefined}
        style={x ? { display: x.g ? 'none' : '' } : undefined}
      >
        {x ? x.actionButton : 'Fin du tour'}
      </Button>
      {v > 0 && (
        <span id="turn-guide-step" className="turn-guide-step" aria-live="polite" hidden={!(x && x.stepOf)}>
          {(x && x.stepOf) || (lastStep && lastStep.el)}
        </span>
      )}
      {v > 0 && (
        <span className="keyboard-hints" aria-hidden="true">
          <i>1</i>
          <i>2</i> capacités · <i>Entrée</i> confirmer · <i>Échap</i> annuler · <i>←</i>
          <i>→</i> Pokémon · <i>Espace</i> étape suivante
        </span>
      )}
      {/* board toolbar, under the thumb on phones (v4.44) */}
      {tools && tools.foot && <BoardTools b={tools} />}
    </div>
  );
}
