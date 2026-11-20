import { tb } from '../../../engine/core/utils.js';
import { Html } from '../../../lib/html.jsx';
import { tileSheet, useBattleVersion } from './battleStore.js';

import Button from '../../../components/Button.jsx';
// Cell sheet (#tile-info): long press or magnifier on a cell. Reading taken by tileSheet (077),
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
      className={'tile-info' + (F.isTop ? ' is-top' : '')}
      role="dialog"
      aria-label="Détail de la case"
      hidden={F.hidden}
      style={{ top: F.top, bottom: F.bottom }}
    >
      <header className="tile-info-header">
        <i className="tile-info-swatch" style={{ background: c.sw }} />
        <b>Case {c.displayName}</b>
        <span>{c.terrain}</span>
        <button type="button" className="tile-info-close" data-tile-info="x" aria-label="Fermer">
          ×
        </button>
      </header>
      <div className="tile-info-body">
        <ul className="tile-info-rules">
          {c.seg.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        {c.rx.length > 0 && (
          <>
            <p className="tile-info-label">Réactions sur cette case</p>
            <div className="tile-info-reactions">
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
          <ul className="tile-info-dangers">
            {c.dg.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {c.cx.length > 0 && (
          <ul className="tile-info-context">
            {c.cx.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {c.u && <Pokemon v={c.u} />}
        {c.leg && (
          // new sheet: the legend restarts collapsed, like the old innerHTML
          <details key={F.n} className="tile-info-legend">
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
                <i className="legend-reach" />
                <b>Contour bleu</b>
                <span>Votre Pokémon choisi peut s’y déplacer.</span>
              </li>
              <li>
                <i className="legend-danger" />
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
    <div className={'tile-info-pokemon ' + (v.e ? 'is-enemy' : 'is-ally')}>
      <div className="tile-info-pokemon-header">
        <b>{v.n}</b>
        <span className="tile-info-side">{v.e ? 'Adversaire' : 'Allié'}</span>
      </div>
      <div className="tile-info-hp">
        <i className={v.hpc} style={{ width: v.pv + '%' }} />
      </div>
      <div className="tile-info-pokemon-stats">
        <span>{v.ko ? 'K.O.' : v.hp + ' / ' + v.mhp + ' PV'}</span>
        <Html html={v.t.map(tb).join('')} />
        {v.badge && <span className={'status-badge status-' + v.stc}>{v.badge}</span>}
        {v.it ? <em>{v.it}</em> : null}
      </div>
      {v.canAct && (
        <Button size="small" data-tile-info="u" data-uid={v.uid}>
          {v.e ? 'Voir sa portée' : 'Le commander'}
        </Button>
      )}
    </div>
  );
}
