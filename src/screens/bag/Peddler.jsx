import { ITEMS2, PROFILE } from '../../engine/011-game-state.js';
import { ITM, SHOP, bagN, fmt } from '../../engine/032-v4-foundation.js';
import { costOf0 } from '../../engine/049-identity.js';
import { costHeld414 } from '../../engine/053-resonance.js';
import { peddler454 } from '../../engine/084-peddler-route-missions.js';
import { Disc } from './Items.jsx';

// Boutique › Colporteur (v4.54) : stock limité du jour, data-am454 (moteur).
export default function Peddler() {
  const A = peddler454();
  if (!A.present) return <p className="v4-note">Le colporteur n’est pas passé aujourd’hui. Il revient certains jours, avec des prix réduits.</p>;
  const row = k => {
    const it = SHOP[k],
      px = Math.max(50, Math.round((costOf0(k) * 0.75) / 50) * 50),
      left = (it.mv ? 1 : 3) - (A.st.got[k] || 0);
    return (
      <article key={k} className="v4-it">
        {it.mv ? <Disc it={it} /> : <span className="v4-it-im"><img src={ITM(it.img)} alt="" loading="lazy" /></span>}
        <div className="v4-it-t"><b>{it.n} <span className="v4-off">−25 %</span></b><p>{it.d}</p><em>Reste {left} · Dans le Sac : {bagN(k)}</em></div>
        <div className="v4-buy"><button type="button" className="v4-btn" data-am454={k} disabled={left <= 0 || PROFILE.money < px || bagN(k) >= 99}>{fmt(px)} ₽</button></div>
      </article>
    );
  };
  let th = null;
  if (A.th) {
    const px = Math.round((costHeld414(A.th) * 0.8) / 50) * 50,
      takenSet = A.st.got['h:' + A.th];
    th = (
      <article className="v4-it">
        <span className="v4-it-im"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" strokeWidth="1.6"><path d={ITEMS2[A.th].i} /></svg></span>
        <div className="v4-it-t"><b>{ITEMS2[A.th].n} <span className="v4-off">−20 %</span></b><p>{ITEMS2[A.th].d}</p><em>Objet tenu, un seul exemplaire</em></div>
        <div className="v4-buy"><button type="button" className="v4-btn" data-am454={'h:' + A.th} disabled={!!takenSet || PROFILE.money < px}>{fmt(px)} ₽</button></div>
      </article>
    );
  }
  return (
    <>
      <p className="v4-note am454"><b>{A.nom}, le colporteur</b> a posé sa carriole aujourd’hui. Stock limité, il repart à minuit.</p>
      {A.pick.map(row)}
      {th}
    </>
  );
}
