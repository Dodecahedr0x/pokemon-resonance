import { Html } from '../../lib/html.jsx';
import { dailyDone, dailyKey } from '../../engine/032-v4-00-socle.js';
import { STATE_N, placeIcon, placeName, placeState } from '../../engine/037-v4-05-carte.js';
import { placesR } from '../../engine/054-v4-15-01-johto.js';
import { TH450, trSpots450, trSt450 } from '../../engine/080-v4-50-avatar-de-dresseur-rencontres-rares-heure.js';
import { PNJ460, pnPos460, pnSt460, scPos460, scSt460, scVis460 } from '../../engine/091-4-60-boss-a-phases-lieux-secrets-pnj-itinerants.js';

// Marqueurs de la carte (#mapMarks) : les lieux, puis les trouvailles cachées (v4.50), les lieux
// secrets et le personnage de passage (v4.60), dans l'ordre où les versions les ajoutaient.
// marksSel : lieu choisi au moment du dessin (avant le choix par défaut de renderMap).
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
            <span className="mk-ic"><Html html={placeIcon(p)} /></span>
            {st === 'lock' ? (
              <span className="mk-lk"><svg><use href="#i-lock" /></svg></span>
            ) : st === 'done' ? (
              <span className="mk-ok"><svg><use href="#i-check" /></svg></span>
            ) : null}
            {p.id === dk && !dailyDone() && <span className="mk-day">×2</span>}
            <span className="mk-n">{placeName(p)}</span>
          </button>
        );
      })}
      <Trouvailles />
      <Secrets />
    </>
  );
}

// v4.50 : trouvailles cachées du jour, pas encore ramassées.
function Trouvailles() {
  let spots = [];
  try {
    const s = trSt450();
    spots = trSpots450().filter(sp => !s.got[sp.id]);
  } catch (e) {}
  return spots.map(sp => (
    <button type="button" className="mk sp450" data-tv450={sp.id} style={{ left: sp.x / 10 + '%', top: sp.y / 10 + '%' }} aria-label={'Trouvaille cachée : ' + TH450[sp.th]} key={'tv' + sp.id}>
      <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 2l2.2 6.3L21 10l-5.4 3.7L17 21l-5-3.8L7 21l1.4-7.3L3 10l6.8-1.7Z" fill="currentColor" /></svg>
    </button>
  ));
}

// v4.60 : lieux secrets visibles et personnage de passage.
function Secrets() {
  let sc = [],
    pn = null;
  try {
    const st = scSt460(),
      pos = scPos460();
    sc = scVis460().map(s => ({ s, p: pos[s.id], f: !!st.found[s.id] }));
    const { s } = pnSt460();
    if (!s.done) pn = { p: pnPos460(), n: PNJ460[s.i].n };
  } catch (e) {}
  return (
    <>
      {sc.map(({ s, p, f }) => (
        <button type="button" className={'mk sc460' + (f ? ' vu' : '')} data-sc460={s.id} style={{ left: p.x / 10 + '%', top: p.y / 10 + '%' }} aria-label={'Lieu secret : ' + s.n} key={'sc' + s.id}>
          <svg viewBox="0 0 24 24" width="22" height="22"><path d="M12 3a7 7 0 0 0-7 7c0 5 7 11 7 11s7-6 7-11a7 7 0 0 0-7-7Zm0 9.4a2.4 2.4 0 1 1 0-4.8 2.4 2.4 0 0 1 0 4.8Z" fill="currentColor" /></svg>
        </button>
      ))}
      {pn && (
        <button type="button" className="mk pn460" data-pn460="o" style={{ left: pn.p.x / 10 + '%', top: pn.p.y / 10 + '%' }} aria-label={'Personnage de passage : ' + pn.n} key="pn">
          <svg viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="7.5" r="3.6" fill="currentColor" /><path d="M5 20c0-4 3-6.5 7-6.5s7 2.5 7 6.5Z" fill="currentColor" /></svg>
        </button>
      )}
    </>
  );
}
