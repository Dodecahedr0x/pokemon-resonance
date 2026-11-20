import { CAT, EFF, EL, FAMS, MK, MX, POS, RX, WEATHER } from '../../engine/data/game-data.js';
import { BY } from '../../engine/pokemon/pokemon.js';
import { markOf, medal, mini, tb, tc } from '../../engine/core/utils.js';
import { Html } from '../../lib/html.jsx';
import { selectReaction, useGuide } from './guideStore.js';
import { space } from '../../lib/theme.js';

// Each reaction kind's cell colour (CAT in game-data.js; « ren » is the same element twice).
const KIND_CLASS = { deg: 'is-damage', ctl: 'is-control', ter: 'is-terrain', sou: 'is-support', ren: 'is-same-type' };

// Mark × element matrix: each cell opens the reaction details.
export function Matrix() {
  const { rx } = useGuide();
  return (
    <div className="guide-matrix" id="mx" aria-label="Matrice des réactions">
      <div className="guide-matrix-corner">
        Marque ↓<br />
        Élément →
      </div>
      {EL.map(e => (
        <div key={e} className="guide-matrix-head">
          <Html html={mini(e)} />
          <span>{e}</span>
        </div>
      ))}
      {MK.map(m => [
        <div key={m.id} className="guide-matrix-head is-row">
          <Html html={mini(m.t)} />
          <span>{m.n}</span>
        </div>,
        ...MX[m.id].map((id, i) => {
          if (!id) {
            return (
              <div key={m.id + i} className="guide-matrix-cell is-empty" aria-hidden="true">
                ·
              </div>
            );
          }
          const r = RX[id];
          const sel = rx.m === m.id && rx.e === i;
          return (
            <button
              key={m.id + i}
              type="button"
              className={`guide-matrix-cell ${KIND_CLASS[r.k]}${sel ? ' is-selected' : ''}`}
              data-m={m.id}
              data-e={i}
              aria-label={`${m.n} et ${EL[i]} : ${r.n}`}
              onClick={() => selectReaction(m.id, i)}
            >
              {r.a}
            </button>
          );
        }),
      ])}
    </div>
  );
}

export function DetailReaction() {
  const { rx } = useGuide();
  const m = markOf(rx.m),
    e = EL[rx.e],
    r = RX[MX[rx.m][rx.e]];
  const [a, b] = r.ex && BY[r.ex[0]] && BY[r.ex[1]] ? r.ex.map(x => BY[x]) : [];
  const cat = r.k === 'ren' ? 'ter' : r.k;
  return (
    <div className="guide-frame guide-reaction" id="rxDetail" aria-live="polite">
      <span className="guide-reaction-kicker">{r.k === 'ren' ? 'Même élément' : 'Réaction · ' + CAT[r.k]}</span>
      <h3>{r.n}</h3>
      <div className="guide-formula">
        <Html html={tb(m.t)} />
        <span>{m.n}</span>
        <span className="guide-formula-operator">+</span>
        <Html html={tb(e)} />
        <span className="guide-formula-operator">=</span>
        <span className={`chip cat-${cat}`}>
          <i />
          {r.n}
        </span>
      </div>
      <p className="guide-reaction-effect">
        <Html html={r.d} />
      </p>
      <p className="guide-reaction-tip">
        <Html html={r.tip} />
      </p>
      {a && (
        <div className="guide-reaction-example">
          <span className="guide-pokemon">
            <Html html={medal(a.t)} />
            {a.n}
          </span>
          <span>pose {m.n}</span>
          <span className="guide-formula">
            <span className="guide-formula-operator">→</span>
          </span>
          <span className="guide-pokemon">
            <Html html={medal(b.t)} />
            {b.n}
          </span>
          <span>déclenche</span>
        </div>
      )}
    </div>
  );
}

export function TypeTable() {
  return EFF.map(([a, b, x], i) => (
    <div key={i} className="guide-effectiveness-item">
      <Html html={mini(a)} />
      <span>{a}</span>
      <span className="guide-effectiveness-arrow">→</span>
      <Html html={mini(b)} />
      <span>{b}</span>
      <b>{x}</b>
    </div>
  ));
}

const CHAIN_STEPS = [
  {
    w: 'magneti',
    a: 'Cage-Éclair',
    p: 'Magnéti charge la case d’un ennemi, à 3 cases de distance.',
    res: 'Pose Chargé',
    k: 'ter',
  },
  {
    w: 'magneti',
    a: 'Aimant',
    p: 'Au tour suivant, Aimant tire l’ennemi Chargé de deux cases, jusque dans la rivière.',
    res: 'Ennemi Trempé',
    k: 'ctl',
  },
  {
    w: 'pikachu',
    a: 'Éclair',
    p: 'Pikachu frappe l’eau : le Court-circuit parcourt tout le réseau et paralyse ce qui s’y trouve.',
    res: 'Court-circuit',
    k: 'ctl',
  },
];

export function Chain() {
  return CHAIN_STEPS.map((s, i) => {
    const m = BY[s.w];
    return (
      <div key={i} className="guide-chain-step">
        <span className="guide-chain-number">{i + 1}</span>
        <span className="guide-pokemon">
          <Html html={medal(m.t)} />
          {m.n}
        </span>
        <p>
          <b style={{ color: 'var(--tx)' }}>{s.a}.</b> {s.p}
        </p>
        <span className={`chip cat-${s.k}`} style={{ justifySelf: 'start' }}>
          <i />
          {s.res}
        </span>
      </div>
    );
  });
}

export function Weathers() {
  return WEATHER.map(w => (
    <article key={w.n} className="guide-weather" style={{ '--c': tc(w.t) }}>
      <Html html={medal([w.t])} />
      <span className="guide-weather-move">{w.mv}</span>
      <h3 className="card-title">{w.n}</h3>
      <p>
        <Html html={w.d} />
      </p>
      <span className="guide-weather-duration">5 manches</span>
    </article>
  ));
}

const typeCell = { display: 'inline-flex', gap: space.sm, alignItems: 'center' };

export function Families() {
  return FAMS.map(f => (
    <tr key={f.e}>
      <td>
        <span style={typeCell}>
          <Html html={mini(f.e)} />
          {f.e}
        </span>
      </td>
      <td>{f.from.join(', ')}</td>
      <td>
        <Html html={f.m} />
      </td>
    </tr>
  ));
}

export function Positions() {
  return POS.map(p => (
    <tr key={p.t}>
      <td>
        <span style={typeCell}>
          <Html html={mini(p.t)} />
          {p.t}
        </span>
      </td>
      <td>
        <b style={{ color: 'var(--tx)' }}>{p.n}.</b> <Html html={p.d} />
      </td>
    </tr>
  ));
}

// "Types" tab: reaction matrix, type table, weathers, families.
export default function Reactions() {
  return (
    <>
      <div className="guide-intro">
        <h2 className="section-title">Les types se répondent</h2>
        <p className="d">
          La table des types classique s’applique toujours. Une marque reste deux manches sur une case ; un autre
          élément la consomme et déclenche une réaction. Ligne : marque posée. Colonne : élément qui arrive.
        </p>
      </div>
      <div className="guide-matrix-layout">
        <div className="guide-frame">
          <Matrix />
          <div className="guide-legend">
            <span className="guide-legend-item">
              <i style={{ background: 'var(--enemy)' }} />
              Dégâts
            </span>
            <span className="guide-legend-item">
              <i style={{ background: 'var(--ally)' }} />
              Contrôle
            </span>
            <span className="guide-legend-item">
              <i style={{ background: 'var(--gold)' }} />
              Terrain
            </span>
            <span className="guide-legend-item">
              <i style={{ background: 'var(--ok)' }} />
              Soutien
            </span>
            <span className="guide-legend-item">
              <i style={{ border: '1px solid var(--mut)' }} />
              Renfort
            </span>
          </div>
        </div>
        <DetailReaction />
      </div>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Table des types</p>
            <h2 className="section-title">Les repères restent intacts</h2>
            <p className="d">
              Les multiplicateurs ×2, ×½ et ×0 s’appliquent avant toute réaction. Un joueur de la série retrouve ses
              réflexes dès le premier combat.
            </p>
          </div>
        </div>
        <div className="guide-effectiveness" id="effRow">
          <TypeTable />
        </div>
      </div>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Exemple de chaîne</p>
            <h2 className="section-title">Deux Pokémon, une capture d’eau</h2>
            <p className="d">
              Magnéti charge, attire l’ennemi dans la rivière, Pikachu frappe l’eau. Chaque case parcourue retire 15 %
              de puissance.
            </p>
          </div>
        </div>
        <div className="guide-chain" id="chain">
          <Chain />
        </div>
      </div>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Nouveau · Météo</p>
            <h2 className="section-title">Le ciel change les marques</h2>
            <p className="d">
              Une capacité de météo dure 5 manches et modifie la durée des marques sur tout le plateau.
            </p>
          </div>
        </div>
        <div className="guide-weathers" id="wxGrid">
          <Weathers />
        </div>
      </div>
      <div className="guide-section">
        <div className="guide-section-header">
          <div>
            <p className="kicker">Les 18 types</p>
            <h2 className="section-title">Marquer ou déplacer</h2>
            <p className="d">
              Six familles posent des marques. Les neuf autres types agissent sur les positions : les 18 ont un rôle sur
              le plateau.
            </p>
          </div>
        </div>
        <div className="guide-columns">
          <div className="guide-frame guide-scroll">
            <table className="guide-table" style={{ minWidth: 400 }}>
              <thead>
                <tr>
                  <th>Famille</th>
                  <th>Types</th>
                  <th>Marque</th>
                </tr>
              </thead>
              <tbody id="famBody">
                <Families />
              </tbody>
            </table>
          </div>
          <div className="guide-frame guide-scroll">
            <table className="guide-table" style={{ minWidth: 400 }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Effet de position</th>
                </tr>
              </thead>
              <tbody id="posBody">
                <Positions />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
