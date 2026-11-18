import { PREF } from '../../../engine/026-20-campagne-tutoriel-son.js';
import { Switch } from '../controls.jsx';

const DEPLOIEMENTS = [
  ['grands', 'Grands combats'],
  ['tous', 'Tous'],
  ['jamais', 'Jamais']
];

// Déploiement avant le combat (depHtml430). Le moteur gère data-dep430.
function Deploiement() {
  const v = PREF.dep430 || 'grands';
  return (
    <div className="v4-fld dep430f"><span>Déploiement avant le combat</span><div className="v4-seg" role="group" aria-label="Déploiement">
      {DEPLOIEMENTS.map(([k, n]) => <button key={k} type="button" data-dep430={k} aria-pressed={v === k}>{n}</button>)}
    </div></div>
  );
}

// Combat : règles et confort du plateau.
export default function Combat() {
  return (
    <section className="v4-panel v4-ps">
      <header className="v4-ph"><svg><use href="#i-bolt" /></svg><b>Combat</b></header>
      <Switch k="vivant" on={PREF.vivant !== false} lab="Plateau vivant" sub="Le jour et la nuit passent pendant le combat, le feu court dans les hautes herbes, la pluie l’éteint et la grêle gèle les flaques. Pour les combats suivants." />
      <Switch k="tactique" on={PREF.tactique !== false} lab="Tactique avancée" sub="Entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre, Éclaireurs). Lance-Soleil et Vol partent en fin de manche. Pour les combats suivants." />
      <Switch k="caracteres" on={PREF.caracteres !== false} lab="Natures et talents" sub="Chaque Pokémon capturé a sa nature (Brave, Prudent, Vif…) et son talent, gardés à travers ses évolutions. Voir la fiche du Pokémon." />
      <Switch k="desob" on={PREF.desob} lab="Désobéissance" sub="En Campagne, un Pokémon épuisé ou têtu peut ignorer un ordre." />
      <Switch k="mutEntr" on={PREF.mutEntr} lab="Mutateurs en Entraînement" sub="Chaque combat d’entraînement tire une règle au hasard (Déluge, Gravité…). +50 % de Pokédollars." />
      <Switch k="vitesse" on={PREF.vitesse} lab="Ordre par Vitesse" sub="Alliés et adversaires jouent chacun leur tour, du plus rapide au plus lent. Pour les combats suivants." />
      <Switch k="coop" on={PREF.coop} lab="Coop à 2 joueurs" sub="Sur le même téléphone : le Joueur 1 dirige les 2 premiers Pokémon de l’équipe, le Joueur 2 les autres. Le Joueur 1 passe la main, puis les adversaires jouent. Sans effet avec l’Ordre par Vitesse." />
      <Switch k="fast" on={PREF.fast} lab="Combat rapide" sub="Animations et présentations plus courtes" />
      <Switch k="anim429" on={PREF.anim429 !== false} lab="Pokémon animés" sub="Souffle au repos, bond vers la cible, recul sous les coups" />
      <Switch k="tips429" on={PREF.tips429 !== false} lab="Astuces du Prof." sub="Une explication la première fois qu’une mécanique apparaît en combat" />
      <Deploiement />
      <Switch k="fog431" on={PREF.fog431} lab="Brouillard de guerre" sub="Vous ne voyez que ce que vos Pokémon voient : 2 cases, 3 pour Vol et Psy, une de moins la nuit. +25 % de Pokédollars en victoire." />
      <Switch k="info" on={PREF.info} lab="Descriptions détaillées" sub="Texte complet des capacités dans le panneau" />
      <p className="v4-ps-n">Le mouvement réduit de votre appareil est respecté automatiquement.</p>
    </section>
  );
}
