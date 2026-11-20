import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/data/game-data.js';
import { medal } from '../../../engine/core/utils.js';
import { badgeSvg } from '../../../engine/modes/league.js';

// "VS" presentation before a battle (#vs, opened by vsIntro, 030). The engine keeps the
// click that closes it; `is-leaving` (animated close) comes from the store.
// Version additions: trainer emblem before the name (v4.50, `av`), tip at the bottom (v4.48, `tip`).
export default function Vs({ d }) {
  return (
    <div
      id="vs"
      className={'versus' + d.cls + (d.out ? ' is-leaving' : '')}
      style={{ '--versus-duration': d.dur + 'ms' }}
    >
      <div className="versus-player">
        <span className="versus-kicker">{d.k1}</span>
        <span className="versus-team">
          <Html html={d.al.map(t => medal(t)).join('')} />
        </span>
        {d.av != null && (
          <span className="versus-avatar">
            <Html html={d.av} />
          </span>
        )}
        <b>{d.name1}</b>
        <em>{d.em1}</em>
      </div>
      {'\n  '}
      <div className="versus-mark">
        <span>VS</span>
      </div>
      {'\n  '}
      <div className="versus-opponent" style={{ '--versus-accent': d.ac }}>
        <span className="versus-kicker">{d.kick}</span>
        {d.badge != null ? (
          <span className="versus-badge">
            <Html html={badgeSvg(d.badge, GYMS[d.badge].t, 'vs' + d.badge)} />
          </span>
        ) : (
          <span className="versus-foes">
            <Html html={d.foes.map(t => medal(t, 'is-small')).join('')} />
          </span>
        )}
        <b>{d.name2}</b>
        <em>{d.em2}</em>
        {d.q != null && (
          <q>
            <Html html={d.q} />
          </q>
        )}
      </div>
      {'\n  '}
      <p className="versus-rule">
        <Html html={d.rule} />
      </p>
      {d.tip != null && (
        <p className="versus-tip">
          <b>Astuce</b> {d.tip}
        </p>
      )}
    </div>
  );
}
