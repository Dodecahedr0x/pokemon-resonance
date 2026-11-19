import { tb } from '../../../engine/core/utils.js';
import { Html } from '../../../lib/html.jsx';
import { tileSheet, useBattleVersion } from './battleStore.js';

// Cell sheet (#tileInfo, v4.44): long press or magnifier on a cell. Reading taken by tileSheet (077),
// position (top / bottom) by placeSheet. Created on first opening, then hidden (hidden attribute).
export default function CellSheet() {
  useBattleVersion('tileInfo');
  const F = tileSheet,
    c = F.c;
  if (!F.made || !c) {
    return null;
  }
  return (
    <aside
      id="tile-info"
      className={'tile-info' + (F.isTop ? ' haut' : '')}
      role="dialog"
      aria-label="Détail de la case"
      hidden={F.hidden}
      style={{ top: F.top, bottom: F.bottom }}
    >
      <header className="tile-info-h">
        <i className="tile-info-sw" style={{ background: c.sw }} />
        <b>Case {c.displayName}</b>
        <span>{c.terrain}</span>
        <button type="button" className="tile-info-x" data-tile-info="x" aria-label="Fermer">
          ×
        </button>
      </header>
      <div className="tile-info-b">
        <ul className="tile-info-r">
          {c.seg.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        {c.rx.length > 0 && (
          <>
            <p className="tile-info-k">Réactions sur cette case</p>
            <div className="tile-info-rx">
              {c.rx.map(([cat, t], i) => (
                <span key={i} className={'chip cat-' + cat}>
                  <i />
                  {t}
                </span>
              ))}
            </div>
          </>
        )}
        {c.dg.length > 0 && (
          <ul className="tile-info-d">
            {c.dg.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {c.cx.length > 0 && (
          <ul className="tile-info-c">
            {c.cx.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {c.u && <Pokemon v={c.u} />}
        {c.leg && (
          // new sheet: the legend restarts collapsed, like the old innerHTML
          <details key={F.n} className="tile-info-leg">
            <summary>Légende du plateau</summary>
            <ul>
              {c.leg.map(([col, displayName, ruleDef], i) => (
                <li key={i}>
                  <i style={{ background: col }} />
                  <b>{displayName}</b>
                  <span>{ruleDef}</span>
                </li>
              ))}
              <li>
                <i className="lg-reach" />
                <b>Contour bleu</b>
                <span>Votre Pokémon choisi peut s’y déplacer.</span>
              </li>
              <li>
                <i className="lg-danger" />
                <b>Contour orange</b>
                <span>Visée par une attaque adverse annoncée.</span>
              </li>
            </ul>
          </details>
        )}
        {c.magnifier ? (
          <p className="tile-info-hint">Loupe active : touchez une autre case. Rangez-la avec la loupe du plateau.</p>
        ) : (
          <p className="tile-info-hint">Astuce : un appui long sur n’importe quelle case ouvre sa fiche.</p>
        )}
      </div>
    </aside>
  );
}

// Pokémon present on the cell.
function Pokemon({ v }) {
  return (
    <div className={'tile-info-u ' + (v.e ? 'pe' : 'pa')}>
      <div className="tile-info-uh">
        <b>{v.n}</b>
        <span className="tile-info-side">{v.e ? 'Adversaire' : 'Allié'}</span>
      </div>
      <div className="tile-info-hp">
        <i className={v.hpc} style={{ width: v.pv + '%' }} />
      </div>
      <div className="tile-info-ul">
        <span>{v.ko ? 'K.O.' : v.hp + ' / ' + v.mhp + ' PV'}</span>
        <Html html={v.t.map(tb).join('')} />
        {v.badge && <span className={'stt st-' + v.stc}>{v.badge}</span>}
        {v.it ? <em>{v.it}</em> : null}
      </div>
      {v.canAct && (
        <button type="button" className="b b-sm" data-tile-info="u" data-uid={v.uid}>
          {v.e ? 'Voir sa portée' : 'Le commander'}
        </button>
      )}
    </div>
  );
}
