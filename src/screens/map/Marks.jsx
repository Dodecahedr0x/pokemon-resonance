import { Html } from '../../lib/html.jsx';
import { dailyDone, dailyKey } from '../../engine/032-v4-foundation.js';
import { STATE_N, placeIcon, placeName, placeState } from '../../engine/037-map.js';
import { placesR } from '../../engine/054-johto.js';
import { TH450, trSpots450, trSt450 } from '../../engine/080-trainer-avatar-rare-encounters.js';
import {
  NPC460,
  npcPos460,
  npcSt460,
  scPos460,
  scSt460,
  scVis460,
} from '../../engine/091-phase-bosses-secret-places.js';

// Map markers (#mapMarks): places, then hidden finds (v4.50), secret places
// and the passing character (v4.60), in the order the versions added them.
// marksSel: place chosen at drawing time (before renderMap's default choice).
export default function Marks({ marksSel }) {
  const dk = dailyKey();
  return (
    <>
      {placesR().map(p => {
        const st = placeState(p);
        return (
          <button
            type="button"
            className={`mk mk-${st}${marksSel === p.id ? ' sel' : ''}${p.grp === 'entrainement' ? ' small' : ''}`}
            data-place={p.id}
            style={{ left: `${p.x / 10}%`, top: `${p.y / 6.4}%` }}
            aria-label={`${placeName(p)} · ${STATE_N[st]}`}
            key={p.id}
          >
            {st === 'next' && <span className="mk-pulse" aria-hidden="true" />}
            <span className="mk-ic">
              <Html html={placeIcon(p)} />
            </span>
            {st === 'lock' ? (
              <span className="mk-lk">
                <svg>
                  <use href="#i-lock" />
                </svg>
              </span>
            ) : st === 'done' ? (
              <span className="mk-ok">
                <svg>
                  <use href="#i-check" />
                </svg>
              </span>
            ) : null}
            {p.id === dk && !dailyDone() && <span className="mk-day">×2</span>}
            <span className="mk-n">{placeName(p)}</span>
          </button>
        );
      })}
      <Finds />
      <Secrets />
    </>
  );
}

// v4.50: today's hidden finds, not yet picked up.
function Finds() {
  let spots = [];
  try {
    const s = trSt450();
    spots = trSpots450().filter(sp => !s.got[sp.id]);
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return spots.map(sp => (
    <button
      type="button"
      className="mk sp450"
      data-tv450={sp.id}
      style={{ left: sp.x / 10 + '%', top: sp.y / 10 + '%' }}
      aria-label={'Trouvaille cachée : ' + TH450[sp.th]}
      key={'tv' + sp.id}
    >
      <svg viewBox="0 0 24 24" width="22" height="22">
        <path d="M12 2l2.2 6.3L21 10l-5.4 3.7L17 21l-5-3.8L7 21l1.4-7.3L3 10l6.8-1.7Z" fill="currentColor" />
      </svg>
    </button>
  ));
}

// v4.60: visible secret places and passing character.
function Secrets() {
  let sc = [],
    pn = null;
  try {
    const st = scSt460(),
      pos = scPos460();
    sc = scVis460().map(s => ({ s, p: pos[s.id], f: !!st.found[s.id] }));
    const { s } = npcSt460();
    if (!s.done) {
      pn = { p: npcPos460(), n: NPC460[s.i].n };
    }
  } catch {
    /* Best effort: failure here is non-fatal. */
  }
  return (
    <>
      {sc.map(({ s, p, f }) => (
        <button
          type="button"
          className={'mk sc460' + (f ? ' vu' : '')}
          data-sc460={s.id}
          style={{ left: p.x / 10 + '%', top: p.y / 10 + '%' }}
          aria-label={'Lieu secret : ' + s.n}
          key={'sc' + s.id}
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <path
              d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Zm0 9.4a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z"
              fill="currentColor"
            />
          </svg>
        </button>
      ))}
      {pn && (
        <button
          type="button"
          className="mk pn460"
          data-pn460="o"
          style={{ left: pn.p.x / 10 + '%', top: pn.p.y / 10 + '%' }}
          aria-label={'Personnage de passage : ' + pn.n}
          key="pn"
        >
          <svg viewBox="0 0 24 24" width="22" height="22">
            <circle cx="12" cy="7.5" r="3.6" fill="currentColor" />
            <path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5Z" fill="currentColor" />
          </svg>
        </button>
      )}
    </>
  );
}
