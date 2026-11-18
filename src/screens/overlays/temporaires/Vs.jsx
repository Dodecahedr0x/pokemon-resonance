import { Html } from '../../../lib/html.jsx';
import { GYMS } from '../../../engine/004-01-donnees.js';
import { medal } from '../../../engine/014-08-outils.js';
import { badgeSvg } from '../../../engine/019-12-ligue.js';

// Présentation « VS » avant un combat (#vs, ouverte par vsIntro, 030). Le moteur garde le
// clic qui la ferme ; `out` (fermeture animée) vient du store.
// Ajouts des versions : emblème du dresseur avant le nom (v4.50, `av`), astuce en bas (v4.48, `tip`).
export default function Vs({ d }) {
  return (
    <div id="vs" className={'vs' + d.cls + (d.out ? ' out' : '')} style={{ '--d': d.dur + 'ms' }}>
      <div className="vs-l">
        <span className="vs-k">{d.k1}</span>
        <span className="vs-team"><Html html={d.al.map(t => medal(t)).join('')} /></span>
        {d.av != null && <span className="vs-av450"><Html html={d.av} /></span>}
        <b>{d.nom1}</b>
        <em>{d.em1}</em>
      </div>
      {'\n  '}
      <div className="vs-c"><span>VS</span></div>
      {'\n  '}
      <div className="vs-r" style={{ '--ac': d.ac }}>
        <span className="vs-k">{d.kick}</span>
        {d.badge != null ? (
          <span className="vs-bdg"><Html html={badgeSvg(d.badge, GYMS[d.badge].t, 'vs' + d.badge)} /></span>
        ) : (
          <span className="vs-foes"><Html html={d.foes.map(t => medal(t, 'sm')).join('')} /></span>
        )}
        <b>{d.nom2}</b>
        <em>{d.em2}</em>
        {d.q != null && <q><Html html={d.q} /></q>}
      </div>
      {'\n  '}
      <p className="vs-rule"><Html html={d.rule} /></p>
      {d.tip != null && <p className="tip448"><b>Astuce</b> {d.tip}</p>}
    </div>
  );
}
