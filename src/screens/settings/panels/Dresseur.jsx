import { DIFFS, PROFILE, isCamp } from '../../../engine/011-05-etat-de-partie.js';
import { BADGES } from '../../../engine/013-07-arenes.js';
import { tLevel } from '../../../engine/032-v4-00-socle.js';
import { libreBox421 } from '../../../engine/061-v4-21-01-capture-partout.js';

// Dresseur : prénom, difficulté, état de la partie. Le moteur gère #v4Nm, data-diff et data-v4saves.
export default function Dresseur() {
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph"><svg><use href="#i-user" /></svg><b>Dresseur</b></header>
      <label className="v4-fld"><span>Prénom</span><input type="text" id="v4Nm" maxLength={14} autoComplete="off" defaultValue={PROFILE.name || ''} placeholder="Votre prénom" /></label>
      <div className="v4-fld"><span>Difficulté</span><div className="v4-seg" role="group" aria-label="Difficulté">
        {Object.entries(DIFFS).map(([k, n]) => <button key={k} type="button" data-diff={k} aria-pressed={PROFILE.diff === k}>{n}</button>)}
      </div></div>
      <p className="v4-ps-n">{isCamp() ? `Campagne en cours · ${BADGES.length} badge${BADGES.length > 1 ? 's' : ''} · Nv. ${tLevel()}` : `Mode Libre : arènes ouvertes · ${libreBox421()}`}</p>
      <div className="v4-ps-a"><button type="button" className="b b-sm" data-v4saves="">Sauvegardes</button></div>
    </section>
  );
}
