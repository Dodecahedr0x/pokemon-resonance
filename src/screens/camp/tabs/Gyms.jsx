import { BY, MON, SCEN } from '../../../engine/pokemon/pokemon.js';
import { PROFILE } from '../../../engine/state/game-state.js';
import { medal } from '../../../engine/core/utils.js';
import { GYM_EDITOR, GYM_RULES, GYM_TERRAINS, gymShareCode } from '../../../engine/modes/custom-arenas.js';
import { Html } from '../../../lib/html.jsx';

import Button from '../../../components/Button.jsx';
import CardHeader from '../../../components/CardHeader.jsx';
const Options = ({ L }) =>
  L.map(([k, n]) => (
    <option key={k} value={k}>
      {n}
    </option>
  ));

// The gym editor: uncontrolled fields, reread by the engine (change / input on [data-ar]).
function Editor() {
  const E = GYM_EDITOR.a;
  if (!E) {
    return null;
  }
  const sp = MON.filter(m => !m.leg)
    .slice()
    .sort((a, b) => a.n.localeCompare(b.n, 'fr'))
    .map(m => [m.id, m.n]);
  return (
    <div className="camp-gym-editor">
      <h3>{GYM_EDITOR.i >= 0 ? 'Modifier l’arène' : 'Nouvelle arène'}</h3>
      <label className="form-field">
        <span>Nom</span>
        <input type="text" data-ar="n" maxLength={22} defaultValue={E.n} />
      </label>
      <label className="form-field">
        <span>Terrain</span>
        <select data-ar="t" defaultValue={E.t}>
          <Options L={GYM_TERRAINS()} />
        </select>
      </label>
      <label className="form-field">
        <span>Règle</span>
        <select data-ar="r" defaultValue={E.r}>
          <Options L={GYM_RULES()} />
        </select>
      </label>
      <div className="camp-gym-editor-row">
        <label className="form-field">
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
        <label className="form-field">
          <span>Manches</span>
          <select data-ar="lim" defaultValue={String(E.lim)}>
            <Options L={[6, 8, 10, 12].map(x => [String(x), String(x)])} />
          </select>
        </label>
        <label className="form-field">
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
        <label key={i} className="form-field">
          <span>{`Adversaire ${i + 1}`}</span>
          <select data-ar={`f${i}`} defaultValue={E.f[i] || ''}>
            <option value="">—</option>
            <Options L={sp} />
          </select>
        </label>
      ))}
      <div className="camp-gym-actions">
        <Button variant="primary" data-gym-arena="save">
          Enregistrer
        </Button>
        <Button variant="ghost" data-gym-arena="annuler">
          Annuler
        </Button>
      </div>
    </div>
  );
}

// A saved gym: play, share (code), edit, delete (data-gym-arena).
function Gym({ a, i }) {
  const ruleDef = a.r ? ' · règle ' + (GYM_RULES().find(x => x[0] === a.r) || ['', ''])[1] : '';
  return (
    <article className="camp-gym">
      <div className="camp-gym-header">
        <b>{a.n}</b>
        <em>{`${(SCEN[a.t] || {}).n || a.t}${ruleDef} · ${a.h === 'nuit' ? 'nuit' : 'jour'} · ${a.lim} manches${a.author ? ' · par ' + a.author : ''}`}</em>
      </div>
      <div className="camp-gym-foes">
        {a.f.map((id, j) => (
          <span key={j} title={BY[id].n}>
            <Html html={medal(BY[id].t, 'is-tiny')} />
            {BY[id].n}
          </span>
        ))}
      </div>
      <div className="camp-gym-actions">
        <Button size="small" variant="primary" data-gym-arena="jouer" data-i={i}>
          Jouer
        </Button>
        <Button size="small" data-gym-arena="code" data-i={i}>
          Partager
        </Button>
        <Button size="small" data-gym-arena="edit" data-i={i}>
          Modifier
        </Button>
        <Button size="small" variant="ghost" data-gym-arena="suppr" data-i={i}>
          Supprimer
        </Button>
      </div>
      {GYM_EDITOR && GYM_EDITOR.code === i ? (
        <div className="camp-gym-code">
          <textarea readOnly rows={3} aria-label="Code de l’arène" defaultValue={gymShareCode(a)} />
          <Button size="small" data-gym-arena="copier" data-i={i}>
            Copier
          </Button>
        </div>
      ) : null}
    </article>
  );
}

// Camp › Gyms (v4.31): create, import and share custom gyms.
export default function Gyms() {
  const A = PROFILE.customGyms || [];
  return (
    <section className="card camp-gyms">
      <CardHeader icon="league" title="Arènes personnalisées" count={`${A.length} / 12`} />
      <p className="v4-ps-n">
        Composez un combat (terrain, règle, adversaires), testez-le, puis envoyez son code à un ami.
      </p>
      <div className="camp-gyms-actions">
        <Button size="small" variant="primary" data-gym-arena="new">
          Créer une arène
        </Button>
      </div>
      <div className="camp-gyms-import">
        <input
          type="text"
          id="gym-code"
          placeholder="Coller un code ARN-…"
          autoComplete="off"
          spellCheck="false"
          aria-label="Code d’arène"
        />
        <Button size="small" data-gym-arena="import">
          Importer
        </Button>
      </div>
      {GYM_EDITOR ? <Editor /> : null}
      <div className="camp-gyms-list">
        {A.length ? (
          A.map((a, i) => <Gym key={i} a={a} i={i} />)
        ) : (
          <p className="empty-state">Aucune arène pour l’instant.</p>
        )}
      </div>
    </section>
  );
}
