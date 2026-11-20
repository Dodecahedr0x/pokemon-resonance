import { useLayoutEffect, useRef } from 'react';
import { useEngineReady } from '../../engineReady.js';
import { Html } from '../../lib/html.jsx';
import { useSaves } from './savesStore.js';
import { RECRUIT } from '../../engine/pokemon/evolution.js';
import { BY } from '../../engine/pokemon/pokemon.js';
import { DIFFS, PROFILE, isCamp } from '../../engine/state/game-state.js';
import { BADGES } from '../../engine/modes/gyms.js';
import { medal } from '../../engine/core/utils.js';
import { B } from '../../engine/combat/ui.js';
import { SLOTS, SV, battleLine, cleanProfile, fmtD, snapshot, validBattle } from '../../engine/state/saves.js';
import { PREF } from '../../engine/ui/preferences.js';
import { boxCapacityLabel } from '../../engine/world/catch-anywhere.js';
import { boxCount } from '../../engine/modes/legendary-captures.js';
import { space } from '../../lib/theme.js';

import Button from '../../components/Button.jsx';
// "Sauvegardes" (Saves) window (#saves). Clicks, input and import are still handled by
// the engine (listeners on #saves, data-sv, data-resume): here, display only.
export default function Saves() {
  const ready = useEngineReady();
  const { open, version } = useSaves();
  const x = useRef(null);
  // On opening, focus goes to the Close button (old openSaves).
  useLayoutEffect(() => {
    if (open) {
      x.current?.focus();
    }
  }, [open]);

  return (
    <div className="result saves" id="saves" hidden={!open}>
      {open && ready && <Card key={version} xRef={x} />}
    </div>
  );
}

// Summary of a save: team, badges, victories, battle in progress.
function Summary({ s }) {
  const P = cleanProfile(s.profile);
  return (
    <div className="sv-sum">
      <span className="sv-meds">
        {s.squad.map((id, i) => (
          <Html key={i} html={medal(BY[id].t, 'is-small')} />
        ))}
      </span>
      <span className="sv-facts">
        <b>{s.badges.length} / 8</b> badges · <b>{P.wins}</b> victoire{P.wins > 1 ? 's' : ''} · <b>{P.awakenings}</b>{' '}
        Éveil
        {P.awakenings > 1 ? 's' : ''}
      </span>
      {validBattle(s.battle) && <span className="sv-bt">Combat en cours : {battleLine(s.battle)}</span>}
    </div>
  );
}

// A slot (s1, s2, s3), empty or filled, with its confirmation question.
function Slot({ k }) {
  const s = SV.local[k],
    n = k.slice(1),
    cf = SV.confirm && SV.confirm.k === k ? SV.confirm.a : null;
  if (!s) {
    return (
      <article className="sv-slot empty">
        <header>
          <b>Emplacement {n}</b>
          <em>vide</em>
        </header>
        <div className="sv-act">
          <Button size="small" data-sv="put" data-k={k}>
            Sauvegarder ici
          </Button>
        </div>
      </article>
    );
  }
  return (
    <article className="sv-slot">
      <header>
        <b>
          Emplacement {n}
          {s.profile && s.profile.name ? ' · ' + s.profile.name : ''}
        </b>
        <em>{fmtD(s.savedAt)}</em>
      </header>
      <Summary s={s} />
      <div className="sv-act">
        {cf ? (
          <>
            <span className="sv-q">
              {cf === 'load'
                ? 'Remplacer la partie en cours ?'
                : cf === 'put'
                  ? 'Écraser cet emplacement ?'
                  : 'Supprimer définitivement ?'}
            </span>
            <Button size="small" variant="primary" data-sv="ok" data-k={k}>
              Confirmer
            </Button>
            <Button size="small" data-sv="no">
              Annuler
            </Button>
          </>
        ) : (
          <>
            <Button size="small" variant="primary" data-sv="load" data-k={k}>
              Charger
            </Button>
            <Button size="small" data-sv="put" data-k={k}>
              Écraser
            </Button>
            <Button size="small" variant="ghost" data-sv="del" data-k={k}>
              Supprimer
            </Button>
          </>
        )}
      </div>
    </article>
  );
}

// "Save code" area: to copy, or to paste.
function Code() {
  if (!SV.code) {
    return null;
  }
  const copy = SV.code.mode === 'copy';
  return (
    <div className="sv-code" style={{ marginTop: space.md, display: 'grid', gap: space.sm }}>
      <b>{copy ? 'Votre code de sauvegarde' : 'Collez votre code de sauvegarde'}</b>
      <span style={{ opacity: '.8', fontSize: '13px' }}>
        {copy
          ? 'Il est déjà copié si votre appareil le permet. Sinon : touchez le texte, « Tout sélectionner », puis « Copier ». Gardez-le dans une note ou un message.'
          : 'Le code commence par RES1. Le texte d’un fichier de sauvegarde marche aussi.'}
      </span>
      <textarea
        id="svCode"
        rows={5}
        spellCheck="false"
        autoComplete="off"
        readOnly={copy}
        placeholder={copy ? undefined : 'RES1…'}
        defaultValue={copy ? SV.code.text : ''}
        style={{
          width: '100%',
          boxSizing: 'border-box',
          font: '12px/1.4 monospace',
          padding: space.sm,
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,.25)',
          background: 'rgba(0,0,0,.35)',
          color: 'inherit',
          resize: 'vertical',
        }}
      />
      <span style={{ display: 'flex', gap: space.sm, flexWrap: 'wrap' }}>
        {!copy && (
          <Button size="small" variant="primary" data-sv="importcode">
            Importer ce code
          </Button>
        )}
        <Button size="small" data-sv="closecode">
          Fermer
        </Button>
      </span>
    </div>
  );
}

// The card, recreated at each version (like the old innerHTML): the fields re-read the state.
function Card({ xRef }) {
  const a = SV.local.auto || snapshot(),
    P = PROFILE,
    busy = Object.values(SV.busy).some(Boolean),
    rs = SV.confirm && SV.confirm.k === 'reset';
  return (
    <div className="sv-card" role="dialog" aria-modal="true" aria-labelledby="svTitle">
      <button ref={xRef} className="sh-x" type="button" data-sv="close" aria-label="Fermer">
        <svg>
          <use href="#i-x" />
        </svg>
      </button>
      <p className="kicker">Archives du dresseur</p>
      <h2 className="section-title" id="svTitle">
        Partie et réglages
      </h2>
      <p className={'sv-st ' + (SV.cloud ? 'cloud' : 'local')}>
        <i />
        {SV.cloud
          ? 'Synchronisées avec votre compte Claude : reprenez votre partie sur n’importe quel appareil.'
          : 'Enregistrées dans ce navigateur. Exportez un fichier pour les garder ailleurs.'}
        {busy && (
          <>
            {' '}
            <em>Enregistrement…</em>
          </>
        )}
      </p>
      <div className="sv-prof">
        <label>
          <span>Nom du dresseur</span>
          <input
            id="svName"
            type="text"
            maxLength={24}
            autoComplete="off"
            placeholder="Votre nom"
            defaultValue={P.name}
          />
        </label>
        <div className="sv-k">
          <div>
            <b>{P.battles}</b>
            <span>Combats</span>
          </div>
          <div>
            <b>{P.wins}</b>
            <span>Victoires</span>
          </div>
          <div>
            <b>{P.caught}</b>
            <span>Captures</span>
          </div>
          <div>
            <b>{BADGES.length}</b>
            <span>Badges</span>
          </div>
        </div>
      </div>
      <div className="sv-set">
        <div className="ss-row">
          <span>Mode</span>
          <b>
            {isCamp()
              ? `Campagne · Box ${boxCount()} / ${RECRUIT.length}`
              : `Libre · combats ouverts · ${boxCapacityLabel()}`}
          </b>
        </div>
        <div className="ss-row">
          <span>Difficulté</span>
          <span className="ss-seg">
            {Object.entries(DIFFS).map(([k, n]) => (
              <Button
                key={k}
                size="small"
                data-sv="set"
                data-f="diff"
                data-v={k}
                aria-pressed={String(PROFILE.diff === k)}
              >
                {n}
              </Button>
            ))}
          </span>
        </div>
        <div className="ss-row">
          <span>Confort</span>
          <span className="ss-seg">
            <Button size="small" data-sv="set" data-f="sound" aria-pressed={String(!!PREF.sound)}>
              Son
            </Button>
            <Button size="small" data-sv="set" data-f="vibe" aria-pressed={String(!!PREF.vibe)}>
              Vibrations
            </Button>
            <Button size="small" data-sv="set" data-f="music" aria-pressed={String(!!PREF.music)}>
              Musique
            </Button>
            <Button size="small" data-sv="set" data-f="fast" aria-pressed={String(!!PREF.fast)}>
              Adversaires ×2
            </Button>
            <Button size="small" data-sv="tuto">
              Combat guidé
            </Button>
          </span>
        </div>
      </div>
      <article className="sv-slot auto">
        <header>
          <b>Sauvegarde automatique</b>
          <em>{a.savedAt ? fmtD(a.savedAt) : ''}</em>
        </header>
        <Summary s={a} />
        {validBattle(a.battle) && !B && (
          <div className="sv-act">
            <Button size="small" variant="primary" data-resume="1">
              Reprendre le combat
            </Button>
          </div>
        )}
      </article>
      <div className="sv-list">
        {SLOTS.map(k => (
          <Slot key={k} k={k} />
        ))}
      </div>
      <div className="sv-io">
        <Button size="small" data-sv="export">
          Exporter un fichier
        </Button>
        <Button size="small" data-sv="importfile">
          Importer un fichier
        </Button>
        <input
          id="svFile"
          type="file"
          accept="*/*"
          tabIndex={-1}
          aria-hidden="true"
          style={{ position: 'absolute', width: '1px', height: '1px', opacity: '0', pointerEvents: 'none' }}
        />
        <Button size="small" data-sv="copycode">
          Copier le code
        </Button>
        <Button size="small" data-sv="pastecode">
          Coller un code
        </Button>
        {rs ? (
          <>
            <span className="sv-q">Nouvelle partie : les emplacements restent intacts.</span>
            <Button size="small" variant="primary" data-sv="camp">
              Campagne
            </Button>
            <Button size="small" data-sv="ok" data-k="reset">
              Mode Libre
            </Button>
            <Button size="small" data-sv="no">
              Annuler
            </Button>
          </>
        ) : (
          <Button size="small" variant="ghost" data-sv="reset">
            Nouvelle partie
          </Button>
        )}
      </div>
      <Code />
    </div>
  );
}
