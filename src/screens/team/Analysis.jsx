import { Html } from '../../lib/html.jsx';
import { ROLES, RX } from '../../engine/004-data.js';
import { BY, PRESETS } from '../../engine/009-pokemon.js';
import { LINK_N, LINK_T, PROFILE, lvlOfPts, pairKey } from '../../engine/011-game-state.js';
import { SYN, synOf } from '../../engine/012-recruits-roles-synergies.js';
import { medal, tc } from '../../engine/014-utils.js';
import { squad } from '../../engine/020-team-cards.js';
import { startVoice } from '../../engine/021-combat-engine.js';
import { RANGS, rankId, rankTag } from '../../engine/053-resonance.js';
import { duoFor416 } from '../../engine/055-living-johto.js';
import { FORM463, formKey463, formMs463, formOn463 } from '../../engine/094-team-formations.js';

// Analyse repliée (#anaD) : résumé (#anaSum) et cartes (#ana). Clics (data-p, data-rx,
// data-fm463) : écouteurs du moteur sur #ana et sur le document.
export default function Analysis({ A }) {
  return (
    <details className="ana-d" id="anaD">
      <summary>
        <span className="lbl-s">Analyse de l’équipe</span>
        <em id="anaSum">{A && recap(A)}</em>
      </summary>
      <div className="ana-grid" id="ana">
        {A && (
          <>
            <Hint A={A} />
            <Formation />
            <Ranks />
            <div className="ac radar">
              <h4>
                Rôles de l’équipe<span>{A.covered} / 6</span>
              </h4>
              <Radar v={A.roles} />
            </div>
            <Synergies />
            <Reactions A={A} />
            <div className="ac">
              <h4>
                Réactions en chaîne<span>{A.chains.length}</span>
              </h4>
              {A.chains.length ? (
                <div className="presets">
                  {A.chains.map((c, i) => (
                    <span key={i} className="chip">
                      <i style={{ background: 'var(--gold)' }} />
                      {c.n}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="empty">Aucune chaîne, même après Éveil. Essayez Ptitard, Salamèche et Pichu.</p>
              )}
            </div>
            <div className="ac">
              <h4>Note de l’état-major</h4>
              <ul className="alerts">
                {A.al.map(([k, t], i) => (
                  <li key={i} className={k}>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <Links />
            <div className="ac">
              <h4>Équipes types</h4>
              <div className="presets">
                {Object.entries(PRESETS).map(([k, p]) => (
                  <button key={k} type="button" className={`b b-sm${p.f ? ' form' : ''}`} data-p={k} title={p.f ? 'Formation · recrues confirmées' : undefined}>
                    {p.n}
                  </button>
                ))}
                <button type="button" className="b b-sm" data-p="clear">
                  Vider
                </button>
              </div>
              <p className="empty">Chargez une équipe, puis lancez un combat avec elle.</p>
            </div>
          </>
        )}
      </div>
    </details>
  );
}

// Résumé replié (ancien teamSummary).
function recap(A) {
  const n = synOf(squad).length,
    bad = A.al.filter(a => a[0] === 'bad').length;
  return squad.length ? `Indice ${A.score} · ${n} synergie${n > 1 ? 's' : ''}${bad ? ` · ${bad} alerte${bad > 1 ? 's' : ''}` : ''}` : 'Équipe vide';
}

// Indice de Résonance : jauge circulaire et détail.
function Hint({ A }) {
  const L = 2 * Math.PI * 50;
  return (
    <div className="ac orn">
      <h4>
        Indice de Résonance<span>/ 100</span>
      </h4>
      <div className="score">
        <svg viewBox="0 0 118 118" role="img" aria-label={`Indice ${A.score} sur 100`}>
          <circle className="sc-bg" cx="59" cy="59" r="50" />
          <circle
            className="sc-fg"
            cx="59"
            cy="59"
            r="50"
            transform="rotate(-90 59 59)"
            strokeDasharray={L.toFixed(1)}
            strokeDashoffset={(L * (1 - A.score / 100)).toFixed(1)}
          />
          <text className="sc-n" x="59" y="66">
            {A.score}
          </text>
          <text className="sc-l" x="59" y="82">
            INDICE
          </text>
        </svg>
        <div className="brk">
          <div>
            <span>Réactions au départ</span>
            <b>{A.rx.size}</b>
          </div>
          <div>
            <span>Après Éveils</span>
            <b>{A.rxp.size} / 14</b>
          </div>
          <div>
            <span>Éveils possibles</span>
            <b>{A.stages}</b>
          </div>
          <div>
            <span>Voix par manche</span>
            <b>{startVoice(A.bonus)}</b>
          </div>
        </div>
      </div>
    </div>
  );
}

// Couverture des six rôles (ancien radar).
function Radar({ v }) {
  const cx = 150,
    cy = 104,
    R = 70,
    n = 6,
    pt = (i, r) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [+(cx + r * Math.cos(a)).toFixed(1), +(cy + r * Math.sin(a)).toFixed(1)];
    };
  const Pp = v.map((x, i) => pt(i, R * Math.max(0.06, x / 2)));
  return (
    <svg viewBox="0 0 300 208" role="img" aria-label="Couverture des six rôles">
      {[0.5, 1].map(f => (
        <polygon key={f} className="rd-grid" points={[...Array(n)].map((_, i) => pt(i, R * f).join(',')).join(' ')} />
      ))}
      {[...Array(n)].flatMap((_, i) => {
        const [x, y] = pt(i, R),
          [lx, ly] = pt(i, R + 17);
        return [
          <line key={'a' + i} className="rd-axis" x1={cx} y1={cy} x2={x} y2={y} />,
          <text key={'t' + i} className={`rd-lbl${v[i] > 0 ? ' on' : ''}`} x={lx} y={ly + 3}>
            {ROLES[i].n}
          </text>
        ];
      })}
      <polygon className="rd-shape" points={Pp.map(p => p.join(',')).join(' ')} />
      {Pp.map((p, i) => (
        <circle key={i} className="rd-pt" cx={p[0]} cy={p[1]} r="2.6" />
      ))}
    </svg>
  );
}

// Formation d'équipe (v4.63).
function Formation() {
  try {
    const ms = formMs463(),
      k = formKey463(),
      F = FORM463[k],
      ok = formOn463();
    return (
      <div className="ac ac-fm463">
        <h4>
          Formation<span>{F.n}</span>
        </h4>
        <div className="fm463-g">
          {Object.keys(FORM463).map(x => (
            <button key={x} type="button" className={`fm463${x === k ? ' on' : ''}`} data-fm463={x} aria-pressed={x === k}>
              <b>{FORM463[x].n}</b>
            </button>
          ))}
        </div>
        <p className="fm463-d">
          {k === 'libre'
            ? 'Choisissez une formation : un seul bonus, mais il faut composer l’équipe qui va avec. L’ordre de l’équipe compte : le 1er est l’avant-garde, le dernier l’éclaireur.'
            : F.d}
        </p>
        {ms.length && k !== 'libre' ? ok ? <p className="harm on">Formation active : {F.d}</p> : <p className="harm">Formation inactive. {F.need}</p> : null}
      </div>
    );
  } catch {
    return null;
  }
}

// Rangs de l'équipe et Harmonie (v4.14).
function Ranks() {
  const ms = squad.map(id => BY[id]).filter(Boolean),
    n = new Set(ms.map(m => rankId(m.id))).size,
    harm = ms.length >= 3 && n >= 3;
  return (
    <div className="ac ac-rg">
      <h4>
        Rangs de l’équipe<span>{n} / 4</span>
      </h4>
      {ms.length ? (
        <ul>
          {ms.map(m => {
            const r = rankId(m.id);
            return (
              <li key={m.id}>
                <Html html={rankTag(r)} />
                <span>
                  <b>{m.n}</b> · {RANGS[r].n} · {RANGS[r].k}
                </span>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="empty">Ajoutez des Pokémon pour voir leurs rangs.</p>
      )}
      <p className={`harm${harm ? ' on' : ''}`}>
        {harm ? 'Harmonie : chaque Pokémon commence le combat avec 1 losange.' : `Harmonie : réunissez 3 rangs différents (${n} pour l’instant).`}
      </p>
    </div>
  );
}

// Synergies d'équipe (ancien synCard, v1.1).
function Synergies() {
  const act = synOf(squad).map(s => s.k),
    ms = squad.map(id => BY[id]),
    has = r => ms.filter(m => m.r === r),
    displayNames = l => l.map(m => m.n).join(', ');
  const combos = [];
  const F = has('Frappeur'),
    Rm = has('Rempart');
  if (F.length && Rm.length)
    combos.push(`Escorte : ${displayNames(F)} gagne${F.length > 1 ? 'nt' : ''} +25 % au contact de ${Rm.map(m => m.n).join(' ou ')}.`);
  else if (F.length) combos.push(`${displayNames(F)} n’a aucun Rempart pour l’escorter.`);
  if (has('Verrou').length) combos.push(`Prise : ${displayNames(has('Verrou'))} rend vos attaques +25 % sur les cibles altérées.`);
  if (has('Relais').length) combos.push(`Soutien : ${displayNames(has('Relais'))} soigne ses voisins en fin de manche.`);
  if (Rm.length) combos.push(`Gardiennage : ${displayNames(Rm)} s’interpose une fois par manche.`);
  return (
    <div className="ac syn-ac">
      <h4>
        Synergies d’équipe
        <span>
          {act.length} active{act.length > 1 ? 's' : ''}
        </span>
      </h4>
      {combos.length ? (
        <ul className="alerts">
          {combos.map((t, i) => (
            <li key={i} className="ok">
              {t}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="syn-l">
        {SYN.map(s => (
          <div key={s.k} className={`syn-r${act.includes(s.k) ? ' on' : ''}`}>
            <span className="syn-t">
              {s.t.map((t, i) => (
                <i key={i} style={{ background: tc(t) }} />
              ))}
            </span>
            <span>
              <b>{s.n}</b>
              <em>
                {s.t.join(' + ')} · {s.d}
              </em>
            </span>
          </div>
        ))}
      </div>
      <p className="empty">Une synergie demande deux Pokémon différents portant chacun l’un des deux types.</p>
    </div>
  );
}

// Réactions au départ, puis celles qu'ouvrent les Éveils.
function Reactions({ A }) {
  const row = ([id, v], later) => (
    <li key={(later ? 'l' : 'd') + id} className={later ? 'lat' : undefined}>
      <button type="button" className={`chip cat-${RX[id].k}`} data-rx={id}>
        <i />
        {RX[id].n}
      </button>
      <span className="by">
        {later ? 'après Éveil · ' : ''}
        {v.by} → {v.tr}
      </span>
    </li>
  );
  const rows = [...[...A.rx].map(x => row(x, false)), ...[...A.rxp].filter(([id]) => !A.rx.has(id)).map(x => row(x, true))];
  return (
    <div className="ac">
      <h4>
        Réactions
        <span>
          {A.rx.size} → {A.rxp.size}
        </span>
      </h4>
      {rows.length ? <ul className="rxl">{rows}</ul> : <p className="empty">Aucune réaction : il faut une marque et un autre élément.</p>}
    </div>
  );
}

// Liens de l'équipe (ancien linksCard, v1.0).
function Links() {
  const T = squad.map(id => BY[BY[id].base]),
    rows = [];
  for (let i = 0; i < T.length; i++)
    for (let j = i + 1; j < T.length; j++) {
      const k = pairKey(T[i].id, T[j].id),
        v = PROFILE.links[k] || 0;
      rows.push({ a: T[i], b: T[j], v, l: lvlOfPts(v), D: duoFor416(k) });
    }
  rows.sort((x, y) => y.v - x.v || (y.D ? 1 : 0) - (x.D ? 1 : 0));
  const act = rows.filter(r => r.l).length;
  return (
    <div className="ac">
      <h4>
        Liens de l’équipe
        <span>
          {act} actif{act > 1 ? 's' : ''}
        </span>
      </h4>
      {rows.length ? (
        <ul className="lk-l">
          {rows.map(r => (
            <li key={r.a.id + '|' + r.b.id}>
              <span className="lk-m">
                <Html html={medal(r.a.t, 'sm')} />
                <Html html={medal(r.b.t, 'sm')} />
              </span>
              <span>
                <b>
                  {r.a.n} &amp; {r.b.n}
                </b>
                <em>
                  {r.l ? LINK_N[r.l] : 'Aucun palier'} · {r.v} / {LINK_T[r.l] || LINK_T[2]}
                  {r.D ? ` · duo ${r.D.n}` : ''}
                </em>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty">Recrutez au moins deux Pokémon.</p>
      )}
      <p className="empty">
        Une réaction préparée par l’un et déclenchée par l’autre donne +1 Lien (×2 si aucun des deux n’a évolué). Paliers : Soutien {LINK_T[0]} (−1 dégât
        côte à côte), Synchro {LINK_T[1]} (+25 % sur leurs réactions), Duo {LINK_T[2]} (technique combinée).
      </p>
    </div>
  );
}
