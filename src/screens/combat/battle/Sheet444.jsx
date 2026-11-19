import { tb } from '../../../engine/014-utils.js';
import { Html } from '../../../lib/html.jsx';
import { sheet444, useBattleVersion } from './battleStore.js';

// Fiche de case (#ti444, v4.44) : appui long ou loupe sur une case. Relevé pris par fiche444 (077),
// position (haut / bas) par place444. Créée à la première ouverture, puis masquée (attribut hidden).
export default function Sheet444() {
  useBattleVersion('ti444');
  const F = sheet444,
    c = F.c;
  if (!F.made || !c) return null;
  return (
    <aside id="ti444" className={'ti444' + (F.haut ? ' haut' : '')} role="dialog" aria-label="Détail de la case" hidden={F.hidden} style={{ top: F.top, bottom: F.bottom }}>
      <header className="ti444-h">
        <i className="ti444-sw" style={{ background: c.sw }} />
        <b>Case {c.nom}</b>
        <span>{c.terrain}</span>
        <button type="button" className="ti444-x" data-ti444="x" aria-label="Fermer">
          ×
        </button>
      </header>
      <div className="ti444-b">
        <ul className="ti444-r">
          {c.seg.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
        {c.rx.length > 0 && (
          <>
            <p className="ti444-k">Réactions sur cette case</p>
            <div className="ti444-rx">
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
          <ul className="ti444-d">
            {c.dg.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {c.cx.length > 0 && (
          <ul className="ti444-c">
            {c.cx.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        )}
        {c.u && <Pokemon v={c.u} />}
        {c.leg && (
          // nouvelle fiche : la légende repart repliée, comme l'ancien innerHTML
          <details key={F.n} className="ti444-leg">
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
        {c.loupe ? (
          <p className="ti444-hint">Loupe active : touchez une autre case. Rangez-la avec la loupe du plateau.</p>
        ) : (
          <p className="ti444-hint">Astuce : un appui long sur n’importe quelle case ouvre sa fiche.</p>
        )}
      </div>
    </aside>
  );
}

// Pokémon présent sur la case.
function Pokemon({ v }) {
  return (
    <div className={'ti444-u ' + (v.e ? 'pe' : 'pa')}>
      <div className="ti444-uh">
        <b>{v.n}</b>
        <span className="ti444-side">{v.e ? 'Adversaire' : 'Allié'}</span>
      </div>
      <div className="ti444-hp">
        <i className={v.hpc} style={{ width: v.pv + '%' }} />
      </div>
      <div className="ti444-ul">
        <span>{v.ko ? 'K.O.' : v.hp + ' / ' + v.mhp + ' PV'}</span>
        <Html html={v.t.map(tb).join('')} />
        {v.badge && <span className={'stt st-' + v.stc}>{v.badge}</span>}
        {v.it ? <em>{v.it}</em> : null}
      </div>
      {v.peut && (
        <button type="button" className="b b-sm" data-ti444="u" data-uid={v.uid}>
          {v.e ? 'Voir sa portée' : 'Le commander'}
        </button>
      )}
    </div>
  );
}
