import { useRef } from 'react';
import { byUid, canAwaken, foeEvo } from '../../../engine/021-combat-engine.js';
import { B, ui } from '../../../engine/024-combat-ui.js';
import { currentActor } from '../../../engine/044-tactical-engine.js';
import { coopAlive418 } from '../../../engine/058-fishing-safari-coop.js';
import { enemyTurn428 } from '../../../engine/063-combat-catches-home.js';
import { riddlePhase431 } from '../../../engine/066-tactical-challenges.js';
import { flow478 } from '../../../engine/112-painted-graphics.js';
import { getHost } from '../board/boardStore.js';
import Tools444 from '../board/Tools444.jsx';
import { footPos as barBottom, useBattleVersion } from './battleStore.js';
import { STEP } from './frag.jsx';

// End-of-turn button, phase and step: renderTop, then the versions that rewrote them
// (deployment v4.30, riddle v4.31, duel v4.33, guided tour v4.78), in the same order.
function bar() {
  const foes = B.units.filter(u => u.side === 'e'),
    al = B.units.filter(u => u.side === 'a');
  const ready = al.filter(u => !u.ko && !u.acted).length,
    cur = B.ordre === 'vitesse' ? currentActor(B) : null;
  let disabled = (ui.busy && !enemyTurn428()) || !!B.over || !!ui.turbo428;
  let button = ui.cine ? (
    'Éveil…'
  ) : ui.busy ? (
    enemyTurn428() ? (
      ui.turbo428 ? (
        'Accéléré…'
      ) : (
        <>
          Passer <span className="cnt">»</span>
        </>
      )
    ) : (
      'Tour adverse…'
    )
  ) : cur ? (
    <>
      Terminer <span className="cnt">{cur.n}</span>
    </>
  ) : B.coop ? (
    <>
      {B.coop === 1 && coopAlive418(B, 2) ? 'Passer au J2' : 'Fin du tour'} <span className="cnt">J{B.coop}</span>
    </>
  ) : (
    <>
      Fin du tour
      {ready ? (
        <>
          {' '}
          <span className="cnt">
            {ready} prêt{ready > 1 ? 's' : ''}
          </span>
        </>
      ) : null}
    </>
  );
  const rdy = al.filter(u => !u.ko && canAwaken(B, u)).length,
    warn = foes.filter(u => foeEvo(B, u)).length;
  let phase = ui.cine
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
  if (B.coop && !ui.busy && !ui.cine) phase = `Joueur ${B.coop} · ` + phase; // co-op (v4.18)
  let playerRef = null;
  // deployment (v4.30)
  if (B.dep430 && !B.over) {
    disabled = false;
    button = 'Lancer le combat';
    phase = ui.dsel430 ? 'Touchez une case bleue.' : 'Placez vos Pokémon sur les cases bleues.';
  }
  // riddle (v4.31)
  if (B.sc === 'enigme431' && !B.over && !B.dep430) {
    button = 'Abandonner l’énigme';
    phase = riddlePhase431();
  }
  // local duel (v4.33)
  const D = B.duel433;
  if (D && !B.over && !ui.cine) {
    if (ui.busy) button = 'Fin de manche…';
    else {
      const r = B.units.filter(u => u.side === 'a' && !u.ko && !u.acted).length;
      button = (
        <>
          {D.j === 1 ? `Passer à ${D.noms[1]}` : 'Fin de la manche'}
          {r ? (
            <>
              {' '}
              <span className="cnt">
                {r} prêt{r > 1 ? 's' : ''}
              </span>
            </>
          ) : null}
        </>
      );
      playerRef = <b className={'dj' + D.j}>{D.noms[D.j - 1]}</b>;
      phase = phase.replace('À vous : ', '').replace('Tous vos Pokémon', 'Tous ses Pokémon');
    }
  }
  // guided tour (v4.78): no more "Fin du tour" (End of turn) during your phase
  const g = flow478.guide();
  let step = null;
  if (g) {
    const n = flow478.restants(B).length,
      t = B.ordre === 'vitesse' ? 'À vous : déplacez, puis agissez.' : n ? `Encore ${n} Pokémon à jouer.` : 'Manche terminée.';
    phase = phase.replace(/(À vous : )?déplacez, puis agissez\./, t).replace(/Tous (vos|ses) Pokémon ont joué\./, t);
    const u = ui.sel && byUid(B, ui.sel);
    if (u && u.side === 'a' && !ui.selE)
      step = (
        <>
          <b>{STEP[flow478.etape(B, u)]}</b> {u.n}
          {B.ordre !== 'vitesse' && n ? ` · encore ${n}` : ''}
        </>
      );
  }
  return { disabled, bouton: button, phase, joueur: playerRef, g, etape: step };
}

export default function Footer() {
  const v = useBattleVersion('foot');
  const footPos = useRef(null);
  const x = v && B ? bar() : null;
  // the hidden step keeps its last text, like the old DOM
  if (x && x.etape) footPos.current = x.etape;
  const Q = barBottom.qa,
    tools = getHost().bt444;
  return (
    <div className={barBottom.cls.join(' ')}>
      {/* thumb-reach attacks (phone, v4.43): created on first use, then hidden */}
      {Q && (
        <div id="qa443" className="qa443" role="toolbar" aria-label="Actions du Pokémon choisi" hidden={Q.hidden}>
          {Q.items.map((b, i) => (
            <button key={i} type="button" data-qa443={i} className={b.c + (b.on ? ' on' : '')} style={b.col ? { '--c': b.col } : undefined} disabled={b.disabled}>
              {b.col ? <i /> : null}
              {b.t}
            </button>
          ))}
        </div>
      )}
      <span className="phase" id="bPhase">
        {x && x.joueur ? (
          <>
            {x.joueur} · {x.phase}
          </>
        ) : (
          x && x.phase
        )}
      </span>
      {Q && Q.nom ? <span className="qa443-n">{Q.nom}</span> : null}
      <button className="b b-gold" id="bEnd" type="button" disabled={x ? x.disabled : undefined} style={x ? { display: x.g ? 'none' : '' } : undefined}>
        {x ? x.bouton : 'Fin du tour'}
      </button>
      {v > 0 && (
        <span id="fl478pied" className="fl478-pied" aria-live="polite" hidden={!(x && x.etape)}>
          {footPos.current}
        </span>
      )}
      {v > 0 && (
        <span className="kbd" aria-hidden="true">
          <i>1</i>
          <i>2</i> capacités · <i>Entrée</i> confirmer · <i>Échap</i> annuler · <i>←</i>
          <i>→</i> Pokémon · <i>Espace</i> étape suivante
        </span>
      )}
      {/* board toolbar, under the thumb on phones (v4.44) */}
      {tools && tools.foot && <Tools444 b={tools} />}
    </div>
  );
}
