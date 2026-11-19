import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/004-data.js';
import { medal } from '../../../engine/014-utils.js';
import { badgeSvg } from '../../../engine/019-league.js';

// "VS" presentation before a battle (#vs, opened by vsIntro, 030). The engine keeps the
// click that closes it; `out` (animated close) comes from the store.
// Version additions: trainer emblem before the name (v4.50, `av`), tip at the bottom (v4.48, `tip`).
export default function Vs({ d }) {
  return (
    <div id="vs" className={'vs' + d.cls + (d.out ? ' out' : '')} style={{ '--d': d.dur + 'ms' }}>
      <div className="vs-l">
        <span className="vs-k">{d.k1}</span>
        <span className="vs-team">
          <Html html={d.al.map(t => medal(t)).join('')} />
        </span>
        {d.av != null && (
          <span className="vs-av450">
            <Html html={d.av} />
          </span>
        )}
        <b>{d.name1}</b>
        <em>{d.em1}</em>
      </div>
      {'\n  '}
      <div className="vs-c">
        <span>VS</span>
      </div>
      {'\n  '}
      <div className="vs-r" style={{ '--ac': d.ac }}>
        <span className="vs-k">{d.kick}</span>
        {d.badge != null ? (
          <span className="vs-bdg">
            <Html html={badgeSvg(d.badge, GYMS[d.badge].t, 'vs' + d.badge)} />
          </span>
        ) : (
          <span className="vs-foes">
            <Html html={d.foes.map(t => medal(t, 'sm')).join('')} />
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
      <p className="vs-rule">
        <Html html={d.rule} />
      </p>
      {d.tip != null && (
        <p className="tip448">
          <b>Astuce</b> {d.tip}
        </p>
      )}
    </div>
  );
}
