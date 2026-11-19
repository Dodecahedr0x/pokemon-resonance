import { PREF } from '../../../engine/ui/preferences.js';
import { Switch } from '../controls.jsx';

const DEPLOYMENTS = [
  ['grands', 'Grands combats'],
  ['tous', 'Tous'],
  ['jamais', 'Jamais'],
];

// Deployment before the battle. The engine handles data-deploy-phase.
function Deployment() {
  const v = PREF.deployPhase || 'grands';
  return (
    <div className="v4-fld deploy-phase-f">
      <span>Déploiement avant le combat</span>
      <div className="v4-seg" role="group" aria-label="Déploiement">
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
    <section className="v4-panel v4-ps">
      <header className="v4-ph">
        <svg>
          <use href="#i-bolt" />
        </svg>
        <b>Combat</b>
      </header>
      <Switch
        k="livingBoard"
        on={PREF.livingBoard !== false}
        lab="Plateau vivant"
        sub="Le jour et la nuit passent pendant le combat, le feu court dans les hautes herbes, la pluie l’éteint et la grêle gèle les flaques. Pour les combats suivants."
      />
      <Switch
        k="tactics"
        on={PREF.tactics !== false}
        lab="Tactique avancée"
        sub="Entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre, Éclaireurs). Lance-Soleil et Vol partent en fin de manche. Pour les combats suivants."
      />
      <Switch
        k="characters"
        on={PREF.characters !== false}
        lab="Natures et talents"
        sub="Chaque Pokémon capturé a sa nature (Brave, Prudent, Vif…) et son talent, gardés à travers ses évolutions. Voir la fiche du Pokémon."
      />
      <Switch
        k="disobedience"
        on={PREF.disobedience}
        lab="Désobéissance"
        sub="En Campagne, un Pokémon épuisé ou têtu peut ignorer un ordre."
      />
      <Switch
        k="trainingMutators"
        on={PREF.trainingMutators}
        lab="Mutateurs en Entraînement"
        sub="Chaque combat d’entraînement tire une règle au hasard (Déluge, Gravité…). +50 % de Pokédollars."
      />
      <Switch
        k="vitesse"
        on={PREF.vitesse}
        lab="Ordre par Vitesse"
        sub="Alliés et adversaires jouent chacun leur tour, du plus rapide au plus lent. Pour les combats suivants."
      />
      <Switch
        k="coop"
        on={PREF.coop}
        lab="Coop à 2 joueurs"
        sub="Sur le même téléphone : le Joueur 1 dirige les 2 premiers Pokémon de l’équipe, le Joueur 2 les autres. Le Joueur 1 passe la main, puis les adversaires jouent. Sans effet avec l’Ordre par Vitesse."
      />
      <Switch k="fast" on={PREF.fast} lab="Combat rapide" sub="Animations et présentations plus courtes" />
      <Switch
        k="animEnabled"
        on={PREF.animEnabled !== false}
        lab="Pokémon animés"
        sub="Souffle au repos, bond vers la cible, recul sous les coups"
      />
      <Switch
        k="seenTips"
        on={PREF.seenTips !== false}
        lab="Astuces du Prof."
        sub="Une explication la première fois qu’une mécanique apparaît en combat"
      />
      <Deployment />
      <Switch
        k="fogOfWar"
        on={PREF.fogOfWar}
        lab="Brouillard de guerre"
        sub="Vous ne voyez que ce que vos Pokémon voient : 2 cases, 3 pour Vol et Psy, une de moins la nuit. +25 % de Pokédollars en victoire."
      />
      <Switch k="info" on={PREF.info} lab="Descriptions détaillées" sub="Texte complet des capacités dans le panneau" />
      <p className="v4-ps-n">Le mouvement réduit de votre appareil est respecté automatiquement.</p>
    </section>
  );
}
