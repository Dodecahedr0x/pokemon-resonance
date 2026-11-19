import { PROFILE } from '../../../engine/011-05-etat-de-partie.js';
import { PREF } from '../../../engine/026-20-campagne-tutoriel-son.js';
import { TH455, rvSt455, thOk455, typeDom455 } from '../../../engine/086-4-55-rival-qui-s-adapte-themes-de-plateau.js';

// Thèmes de plateau (v4.55), achetés avec des Éclats, puis bilan du rival Kael.
// Boutons gérés par le moteur (clic délégué sur data-b455).
export default function ThemesPlateau() {
  const cur = TH455[PREF.th455] ? PREF.th455 : 'classique';
  const rv = rvSt455();
  const T = typeDom455();
  const rival = rv.w
    ? ` Il apprend de ses défaites${T ? ` et prépare des Pokémon contre le type ${T}, le plus présent dans votre équipe` : ''}.`
    : ' Battez-le : il s’adaptera à votre style.';
  return (
    <section className="v4-panel" id="at455">
      <h3 className="h3">Thèmes de plateau</h3>
      <p className="v4-note">Change seulement les couleurs du plateau. Éclats de Résonance : {PROFILE.gems}.</p>
      <div className="th455-g">
        {Object.keys(TH455).map(k => {
          const th = TH455[k],
            ok = thOk455(k);
          return (
            <button key={k} type="button" className={`th455-b${cur === k ? ' on' : ''}`} data-b455={`${ok ? 'set' : 'buy'}:${k}`} aria-pressed={cur === k}>
              <span className="th455-s"><i style={{ background: th.c[0] }} /><i style={{ background: th.c[1] }} /></span>
              <b>{th.n}</b>
              <small>{ok ? (cur === k ? 'Actif' : 'Choisir') : th.p + ' Éclats'}</small>
            </button>
          );
        })}
      </div>
      <h3 className="h3" style={{ marginTop: '14px' }}>Votre rival</h3>
      <p className="v4-note">{`Kael : ${rv.w} défaite${rv.w > 1 ? 's' : ''} contre vous, ${rv.l} victoire${rv.l > 1 ? 's' : ''}.${rival}`}</p>
    </section>
  );
}
