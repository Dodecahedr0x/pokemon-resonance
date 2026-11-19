import { Html } from '../../../lib/html.jsx';
import { MV } from '../../../engine/005-moves.js';
import { veiled } from '../../../engine/013-gyms.js';
import { medal } from '../../../engine/014-utils.js';
import { EMAX, awakeningInfo, foeEvo, hasNx } from '../../../engine/021-combat-engine.js';
import { B, STC, enPips, segHp, ui } from '../../../engine/024-combat-ui.js';
import { hasXp, bossScene, plateRank414 } from '../../../engine/053-resonance.js';
import { cache431, vision431 } from '../../../engine/066-tactical-challenges.js';
import { useBattleVersion } from './battleStore.js';

// The plates of the two teams, above (#bPlE) and below (#bPlA) the board.
export function PlatesE() {
  const v = useBattleVersion('top');
  if (!v || !B) {
    return <div className="plates" id="bPlE" />;
  }
  const foes = B.units.filter(u => u.side === 'e'),
    D = B.duel433;
  // fog (v4.31): opponents out of sight are veiled
  const fog = !!(B.fog431 && !B.over),
    vu = fog ? vision431(B) : null;
  return (
    <div
      className={'plates' + (foes.length >= 5 ? ' many' : '')}
      id="bPlE"
      style={{ '--n': foes.length }}
      data-dj433={D ? 3 - D.j : undefined}
    >
      {foes.map(u => (
        <Plate key={u.uid} u={u} fog={fog && cache431(B, u, vu)} />
      ))}
    </div>
  );
}

export function PlatesA() {
  const v = useBattleVersion('top');
  if (!v || !B) {
    return <div className="plates" id="bPlA" />;
  }
  const al = B.units.filter(u => u.side === 'a'),
    D = B.duel433;
  return (
    <div className="plates" id="bPlA" style={{ '--n': al.length }} data-dj433={D ? D.j : undefined}>
      {al.map(u => (
        <Plate key={u.uid} u={u} />
      ))}
    </div>
  );
}

// What the plate announces: enemy intent, fatigue, Awakening ready…
function state(u, fe, nx) {
  if (u.side === 'e') {
    return u.caught ? (
      <span className="rdy">Capturé</span>
    ) : u.ko ? (
      ''
    ) : fe ? (
      <span className="evw">Évolue en fin de manche</span>
    ) : B.jit ? (
      u.done ? (
        'A agi'
      ) : u.badge || u.isLost ? (
        'Neutralisé'
      ) : u.force ? (
        { taunt: 'Provoqué', turn: 'Troublé', confuse: 'Confus' }[u.force.fx] || 'En garde'
      ) : (
        'En garde'
      )
    ) : u.intent && veiled(B) ? (
      'Intention voilée'
    ) : u.intent ? (
      `→ ${MV[u.intent.mv].n}`
    ) : u.badge ? (
      'Neutralisé'
    ) : u.done ? (
      'A agi'
    ) : (
      'Approche'
    );
  }
  return u.ko ? (
    ''
  ) : u.fat && !u.acted ? (
    <span className="fatg">Fatigué</span>
  ) : u.sn ? (
    'Immobilisé'
  ) : u.acted ? (
    'A joué'
  ) : u.en >= EMAX && nx ? (
    <span className="rdy">Éveil !</span>
  ) : (
    'Prêt'
  );
}

function Plate({ u, fog }) {
  const fe = foeEvo(B, u),
    nx = hasNx(u) ? awakeningInfo(B, u) : null;
  const cls =
    `plate ${u.side === 'e' ? 'pe' : 'pa'}${u.ko ? ' ko' : ''}${ui.sel === u.uid || ui.selE === u.uid ? ' act' : ''}` +
    `${ui.act === u.uid ? ' now' : ''}${fe ? ' fev' : ''}${u.side === 'a' && u.en >= EMAX && nx && !u.ko ? ' rd' : ''}${fog ? ' fog431' : ''}`;
  const pips = u.side === 'a' ? hasNx(u) || hasXp(u) : bossScene(B) && hasXp(u);
  return (
    <button type="button" className={cls} data-u={u.uid}>
      <Html html={medal(u.t, 'pm')} />
      <span className="pl-b">
        <span className="pl-h">
          <span className="n">{u.n}</span>
          <Html html={plateRank414(u)} />
          {pips ? <Html html={enPips(u.en)} /> : u.lv ? <span className="lv">N.{u.lv}</span> : null}
        </span>
        <Html html={segHp(u)} />
        <span className="pl-s">
          <span>{u.ko ? 'K.O.' : u.hp + ' / ' + u.mhp}</span>
          {u.badge && !u.ko ? (
            <span className={`stt st-${STC[u.badge] || 'x'}`}>{u.badge}</span>
          ) : (
            <span className="it">{state(u, fe, nx)}</span>
          )}
        </span>
      </span>
    </button>
  );
}
