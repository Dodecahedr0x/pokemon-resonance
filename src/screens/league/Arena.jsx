import { Html } from '../../lib/html.jsx';
import { GYMS } from '../../engine/004-data.js';
import { BY, SCEN } from '../../engine/009-pokemon.js';
import { ARENAS, BADGES } from '../../engine/013-gyms.js';
import { medal } from '../../engine/014-utils.js';
import { badgeSvg, gymSel } from '../../engine/019-league.js';
import { LEAD } from '../../engine/030-prestige-staging.js';

// Fiche de l'arène choisie (#arena), avec la réplique de son Champion d'arène (v4.24).
export default function Arena() {
  const g = GYMS[gymSel],
    a = ARENAS[gymSel],
    D = SCEN[a.k],
    won = BADGES.includes(gymSel),
    L = LEAD[gymSel];
  return (
    <>
      <div className="ar-b"><Html html={badgeSvg(gymSel, g.t, 'bx')} /></div>
      <div>
        <p className="kick">{`Arène ${gymSel + 1} sur 8 · N.${D.lv}${won ? ' · badge obtenu' : ''}`}</p>
        <h3 className="h2"><Html html={g.n} /></h3>
        {L && (
          <div className="ld ar">
            <span className="ld-n"><b><Html html={L.n} /></b><em><Html html={L.t} /></em></span>
            <q><Html html={L.q} /></q>
          </div>
        )}
        <p className="ar-d"><Html html={D.d} /></p>
        <div className="ar-foes">
          {D.foes.map(([f], i) => (
            <span key={i}><Html html={medal(BY[f].t, 'sm')} /><em><Html html={BY[f].n} /></em></span>
          ))}
        </div>
      </div>
      {'\n  '}
      <dl>
        <div><dt>Règle de plateau</dt><dd><Html html={g.r} /></dd></div>
        <div><dt>Leçon</dt><dd><Html html={g.l} /></dd></div>
        <div><dt>Conditions</dt><dd>{`${D.time === 'nuit' ? 'Nuit' : 'Jour'} · ${D.lim} manches · ${D.foes.length} adversaires`}</dd></div>
        <div className="ar-go">
          <button type="button" className="b b-gold b-lg" data-arena={a.k}>{won ? 'Rejouer l’arène' : 'Défier l’arène'}<svg><use href="#i-arrow" /></svg></button>
        </div>
      </dl>
    </>
  );
}
