import { BY, MON, SCEN } from '../../../engine/009-pokemon.js';
import { PROFILE } from '../../../engine/011-game-state.js';
import { medal } from '../../../engine/014-utils.js';
import { ARN_ED431, RULES431, TERRAINS431, gymCode431 } from '../../../engine/066-tactical-challenges.js';
import { Html } from '../../../lib/html.jsx';

const Options = ({ L }) =>
  L.map(([k, n]) => (
    <option key={k} value={k}>
      {n}
    </option>
  ));

// The gym editor: uncontrolled fields, reread by the engine (change / input on [data-ar]).
function Editor() {
  const E = ARN_ED431.a;
  if (!E) {
    return null;
  }
  const sp = MON.filter(m => !m.leg)
    .slice()
    .sort((a, b) => a.n.localeCompare(b.n, 'fr'))
    .map(m => [m.id, m.n]);
  return (
    <div className="ar431-ed">
      <h3>{ARN_ED431.i >= 0 ? 'Modifier l’arène' : 'Nouvelle arène'}</h3>
      <label className="v4-fld">
        <span>Nom</span>
        <input type="text" data-ar="n" maxLength={22} defaultValue={E.n} />
      </label>
      <label className="v4-fld">
        <span>Terrain</span>
        <select data-ar="t" defaultValue={E.t}>
          <Options L={TERRAINS431()} />
        </select>
      </label>
      <label className="v4-fld">
        <span>Règle</span>
        <select data-ar="r" defaultValue={E.r}>
          <Options L={RULES431()} />
        </select>
      </label>
      <div className="ar431-row">
        <label className="v4-fld">
          <span>Heure</span>
          <select data-ar="h" defaultValue={E.h}>
            <Options
              L={[
                ['jour', 'Jour'],
                ['nuit', 'Nuit'],
              ]}
            />
          </select>
        </label>
        <label className="v4-fld">
          <span>Manches</span>
          <select data-ar="lim" defaultValue={String(E.lim)}>
            <Options L={[6, 8, 10, 12].map(x => [String(x), String(x)])} />
          </select>
        </label>
        <label className="v4-fld">
          <span>Robustesse</span>
          <select data-ar="hb" defaultValue={String(E.hb)}>
            <Options
              L={[
                [0, '+0 PV'],
                [10, '+10 PV'],
                [20, '+20 PV'],
                [30, '+30 PV'],
              ].map(([a, b]) => [String(a), b])}
            />
          </select>
        </label>
      </div>
      {[0, 1, 2, 3, 4].map(i => (
        <label key={i} className="v4-fld">
          <span>{`Adversaire ${i + 1}`}</span>
          <select data-ar={`f${i}`} defaultValue={E.f[i] || ''}>
            <option value="">—</option>
            <Options L={sp} />
          </select>
        </label>
      ))}
      <div className="ar431-b">
        <button type="button" className="b b-gold" data-arn431="save">
          Enregistrer
        </button>
        <button type="button" className="b b-ghost" data-arn431="annuler">
          Annuler
        </button>
      </div>
    </div>
  );
}

// A saved gym: play, share (code), edit, delete (data-arn431).
function Gym({ a, i }) {
  const ruleDef = a.r ? ' · règle ' + (RULES431().find(x => x[0] === a.r) || ['', ''])[1] : '';
  return (
    <article className="ar431-c">
      <div className="ar431-h">
        <b>{a.n}</b>
        <em>{`${(SCEN[a.t] || {}).n || a.t}${ruleDef} · ${a.h === 'nuit' ? 'nuit' : 'jour'} · ${a.lim} manches${a.author ? ' · par ' + a.author : ''}`}</em>
      </div>
      <div className="ar431-f">
        {a.f.map((id, j) => (
          <span key={j} title={BY[id].n}>
            <Html html={medal(BY[id].t, 'xs')} />
            {BY[id].n}
          </span>
        ))}
      </div>
      <div className="ar431-b">
        <button type="button" className="b b-sm b-gold" data-arn431="jouer" data-i={i}>
          Jouer
        </button>
        <button type="button" className="b b-sm" data-arn431="code" data-i={i}>
          Partager
        </button>
        <button type="button" className="b b-sm" data-arn431="edit" data-i={i}>
          Modifier
        </button>
        <button type="button" className="b b-sm b-ghost" data-arn431="suppr" data-i={i}>
          Supprimer
        </button>
      </div>
      {ARN_ED431 && ARN_ED431.code === i ? (
        <div className="ar431-code">
          <textarea readOnly rows={3} aria-label="Code de l’arène" defaultValue={gymCode431(a)} />
          <button type="button" className="b b-sm" data-arn431="copier" data-i={i}>
            Copier
          </button>
        </div>
      ) : null}
    </article>
  );
}

// Camp › Gyms (v4.31): create, import and share custom gyms.
export default function Gyms() {
  const A = PROFILE.gyms431 || [];
  return (
    <section className="v4-panel ar431">
      <header className="v4-ph">
        <svg>
          <use href="#i-league" />
        </svg>
        <b>Arènes personnalisées</b>
        <span className="v4-cnt">{`${A.length} / 12`}</span>
      </header>
      <p className="v4-ps-n">
        Composez un combat (terrain, règle, adversaires), testez-le, puis envoyez son code à un ami.
      </p>
      <div className="ar431-a">
        <button type="button" className="b b-gold b-sm" data-arn431="new">
          Créer une arène
        </button>
      </div>
      <div className="ar431-i">
        <input
          type="text"
          id="arnCode431"
          placeholder="Coller un code ARN-…"
          autoComplete="off"
          spellCheck="false"
          aria-label="Code d’arène"
        />
        <button type="button" className="b b-sm" data-arn431="import">
          Importer
        </button>
      </div>
      {ARN_ED431 ? <Editor /> : null}
      <div className="ar431-l">
        {A.length ? (
          A.map((a, i) => <Gym key={i} a={a} i={i} />)
        ) : (
          <p className="v4-empty">Aucune arène pour l’instant.</p>
        )}
      </div>
    </section>
  );
}
