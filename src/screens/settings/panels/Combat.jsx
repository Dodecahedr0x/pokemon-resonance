import { PREFERENCES } from '../../../engine/ui/preferences.js';
import { Switch } from '../controls.jsx';

import CardHeader from '../../../components/CardHeader.jsx';
const DEPLOYMENTS = [
  ['grands', 'Grands combats'],
  ['tous', 'Tous'],
  ['jamais', 'Jamais'],
];

// Deployment before the battle. The engine handles data-deploy-phase.
function Deployment() {
  const v = PREFERENCES.deployPhase || 'grands';
  return (
    <div className="form-field deploy-phase-f">
      <span>Déploiement avant le combat</span>
      <div className="tabs segmented-control" role="group" aria-label="Déploiement">
        {DEPLOYMENTS.map(([k, n]) => (
          <button key={k} type="button" data-deploy-phase={k} aria-pressed={v === k}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

// Battle: board rules and comfort.
export default function Combat() {
  return (
    <section className="card v4-ps">
      <CardHeader icon="bolt" title="Combat" />
      <Switch
        k="livingBoard"
        on={PREFERENCES.livingBoard !== false}
        lab="Plateau vivant"
        sub="Le jour et la nuit passent pendant le combat, le feu court dans les hautes herbes, la pluie l’éteint et la grêle gèle les flaques. Pour les combats suivants."
      />
      <Switch
        k="tactics"
        on={PREFERENCES.tactics !== false}
        lab="Tactique avancée"
        sub="Entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre, Éclaireurs). Lance-Soleil et Vol partent en fin de manche. Pour les combats suivants."
      />
      <Switch
        k="characters"
        on={PREFERENCES.characters !== false}
        lab="Natures et talents"
        sub="Chaque Pokémon capturé a sa nature (Brave, Prudent, Vif…) et son talent, gardés à travers ses évolutions. Voir la fiche du Pokémon."
      />
      <Switch
        k="disobedience"
        on={PREFERENCES.disobedience}
        lab="Désobéissance"
        sub="En Campagne, un Pokémon épuisé ou têtu peut ignorer un ordre."
      />
      <Switch
        k="trainingMutators"
        on={PREFERENCES.trainingMutators}
        lab="Mutateurs en Entraînement"
        sub="Chaque combat d’entraînement tire une règle au hasard (Déluge, Gravité…). +50 % de Pokédollars."
      />
      <Switch
        k="vitesse"
        on={PREFERENCES.vitesse}
        lab="Ordre par Vitesse"
        sub="Alliés et adversaires jouent chacun leur tour, du plus rapide au plus lent. Pour les combats suivants."
      />
      <Switch
        k="coop"
        on={PREFERENCES.coop}
        lab="Coop à 2 joueurs"
        sub="Sur le même téléphone : le Joueur 1 dirige les 2 premiers Pokémon de l’équipe, le Joueur 2 les autres. Le Joueur 1 passe la main, puis les adversaires jouent. Sans effet avec l’Ordre par Vitesse."
      />
      <Switch k="fast" on={PREFERENCES.fast} lab="Combat rapide" sub="Animations et présentations plus courtes" />
      <Switch
        k="animEnabled"
        on={PREFERENCES.animEnabled !== false}
        lab="Pokémon animés"
        sub="Souffle au repos, bond vers la cible, recul sous les coups"
      />
      <Switch
        k="seenTips"
        on={PREFERENCES.seenTips !== false}
        lab="Astuces du Prof."
        sub="Une explication la première fois qu’une mécanique apparaît en combat"
      />
      <Deployment />
      <Switch
        k="fogOfWar"
        on={PREFERENCES.fogOfWar}
        lab="Brouillard de guerre"
        sub="Vous ne voyez que ce que vos Pokémon voient : 2 cases, 3 pour Vol et Psy, une de moins la nuit. +25 % de Pokédollars en victoire."
      />
      <Switch
        k="info"
        on={PREFERENCES.info}
        lab="Descriptions détaillées"
        sub="Texte complet des capacités dans le panneau"
      />
      <p className="v4-ps-n">Le mouvement réduit de votre appareil est respecté automatiquement.</p>
    </section>
  );
}
