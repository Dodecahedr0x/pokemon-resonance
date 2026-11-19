import { jxSt467 } from '../../../engine/098-feats-journal-gimmick-boards.js';

// Feats Journal (v4.67): records and latest battles.
export default function FeatsJournal() {
  const st = jxSt467();
  const h8 = st.h.slice(0, 8);
  return (
    <section className="v4-panel" id="jx467">
      <h3 className="h3">Journal des exploits</h3>
      <p className="v4-note">
        Exploits obtenus : <b>{st.n}</b> · meilleur coup : <b>{st.rec.best}</b> dégâts · victoire la plus rapide :{' '}
        <b>{st.rec.fast || '—'}</b> manche{st.rec.fast > 1 ? 's' : ''}.
      </p>
      {h8.length ? (
        <ul className="sc460-l">
          {h8.map((h, i) => (
            <li key={i} className={`jx467-r${h.w ? '' : ' lose'}`}>
              <b>{h.sc}</b>
              <small>{`${h.w ? 'Victoire' : 'Défaite'} · ${h.r} manche${h.r > 1 ? 's' : ''}${h.mvp ? ` · ${h.mvp} (${h.mdmg})` : ''}${h.ex && h.ex.length ? ` · ${h.ex.join(', ')}` : ''}`}</small>
            </li>
          ))}
        </ul>
      ) : (
        <p className="v4-note">Aucun combat enregistré pour l’instant.</p>
      )}
    </section>
  );
}
