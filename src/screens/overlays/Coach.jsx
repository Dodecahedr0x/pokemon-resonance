import { Html } from '../../lib/html.jsx';
import { useCoach } from './shellOverlays.js';
import { PROF_AV } from '../../engine/031-25-v3-parcours-accueil.js';

// Coach du combat guidé (#coach) : la Professeure donne la consigne de l'étape.
// renderCoach() (026) choisit l'étape ; les boutons (data-co) restent gérés par le moteur.
// Un nouveau bloc par étape (key) : le texte lettre par lettre (v4.73) remplace les
// nœuds texte du paragraphe, React ne doit donc jamais le mettre à jour sur place.
export default function Coach() {
  const { hidden, k, step, v } = useCoach();
  return (
    <div className="coach" id="coach" hidden={hidden} data-k={k}>
      {step && (
        <div className="co-in" key={v}>
          <Html html={PROF_AV} />
          <span className="co-n">{step.n} / {step.total}</span>
          <b><Html html={step.t} /></b>
          <p><Html html={step.d} /></p>
          <div className="co-a"><button type="button" className="b b-sm b-ghost" data-co="skip">Passer le tutoriel</button><button type="button" className="b b-sm b-gold" data-co="next">{step.last ? 'Terminer' : 'Suivant'}</button></div>
        </div>
      )}
    </div>
  );
}
