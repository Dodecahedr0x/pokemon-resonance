// Full tutorial chapters (Guide › Tutorial, added in v4.33): one chapter per mechanic, from the basics to the duel,
// with a button to try it and progress saved. Rendered by the React Guide (Tutorial.jsx).
import { go } from '../core/navigation.js';
import { openGuide } from './guide.js';
import { V4 } from './screen-state.js';
import { DOCTRINE_DEFS } from '../combat/doctrines.js';
import { PUZZLES } from '../modes/riddles.js';
import { MASTERY_THRESHOLD } from '../progression/family-mastery.js';

export let TUTORIAL_LIST;

// Statements run at startup, in the original order (see index.js).
export function init() {
  // each chapter: key, group, icon, title, text, actions [label, attribute]
  TUTORIAL_LIST = [
    {
      k: 'tour',
      g: 'Les bases',
      ic: 'i-play',
      t: 'Un tour de jeu',
      d: 'Touchez votre Pokémon : les <b>cases bleues</b> montrent où il peut aller. Touchez ensuite une capacité et une <b>case dorée</b> : l’aperçu affiche le résultat exact avant de confirmer. Quand tout le monde a joué, « Fin du tour » : les adversaires agissent à leur tour. Touchez un adversaire pour voir sa <b>zone rouge</b>, tout ce qu’il peut frapper après s’être déplacé.',
      a: [['Jouer le combat guidé', 'data-hm="tuto"']],
    },
    {
      k: 'voix',
      g: 'Les bases',
      ic: 'i-bolt',
      t: 'Voix, marques et réactions',
      d: 'Chaque manche vous donne des <b>Voix</b> : elles servent à Esquiver, Relancer, Éveiller, capturer ou lancer une technique combinée. Certaines capacités laissent une <b>marque</b> de leur type sur une case pendant deux manches ; un autre élément la fait réagir (eau + électricité, feu + herbes…). Préparez avec un Pokémon, déclenchez avec un autre.',
      a: [['Voir les réactions', 'data-guide="reactions"']],
    },
    {
      k: 'eveil',
      g: 'Les bases',
      ic: 'i-star',
      t: 'Éveil, attaques Expertes, Forme Résonante',
      d: 'Les <b>losanges</b> se remplissent en combat. À trois, l’<b>Éveil</b> fait évoluer votre Pokémon sur-le-champ : c’est définitif, gardez-le pour le moment décisif. Au stade final, les losanges servent aux <b>attaques Expertes</b> (2 losanges, 1 pour un Pokémon Expert) et, une fois par combat, à la <b>Forme Résonante</b> : 1 Voix pour 3 manches à +2 Puissance, +1 Mouvement et +20 % de dégâts. Trois rangs différents dans l’équipe : <b>Harmonie</b>, chacun commence avec 1 losange. <b>Évoli</b> choisit librement parmi ses 5 évolutions ; celle en harmonie avec sa case ou l’heure lui laisse 1 losange.',
      a: [],
    },
    {
      k: 'notes',
      g: 'Les bases',
      ic: 'i-book',
      t: 'Notes de Résonance',
      d: 'Chaque Pokémon différent qui frappe la même cible dans la manche y pose une <b>note</b>. À la troisième : « Résonance ! », le coup fait ×1,5 et déclenche l’écho de son type. Concentrez vos attaques sur une seule cible : les notes s’effacent en fin de manche.',
      a: [],
    },
    {
      k: 'vigil',
      g: 'Tactique',
      ic: 'i-fight',
      t: 'Vigilance',
      d: 'Un Pokémon peut renoncer à attaquer pour <b>surveiller</b> : il frappe le premier adversaire qui entre dans sa portée, avant que celui-ci n’attaque. Idéal pour garder un passage ou protéger un allié fragile.',
      a: [],
    },
    {
      k: 'encercle',
      g: 'Tactique',
      ic: 'i-team',
      t: 'Encerclement',
      d: 'Une cible au contact de <b>deux adversaires ou plus</b> subit +20 % de dégâts et perd 1 Mouvement. La règle vaut des deux côtés : ne laissez pas un Pokémon isolé au milieu des adversaires.',
      a: [],
    },
    {
      k: 'tactique',
      g: 'Tactique',
      ic: 'i-league',
      t: 'Tactique avancée',
      d: 'Entrer au contact d’un adversaire arrête le déplacement (sauf volants, Spectre et Éclaireurs). Lance-Soleil et Vol partent en fin de manche, s’ils ne sont pas interrompus. Certains trios de types joués dans la même manche déclenchent un <b>Accord</b> (Éclipse, Incendie, Voltige…). Les pièges posés au sol arrêtent l’adversaire qui les traverse.',
      a: [],
    },
    {
      k: 'capture',
      g: 'Tactique',
      ic: 'i-quest',
      t: 'Capture',
      d: 'Dans les hautes herbes et sur les terrains d’entraînement : affaiblissez le Pokémon (sous 25 % des PV avec une Poké Ball, 40 % avec une Super ou Hyper Ball), immobilisez-le (Gel, Paralysie, Sommeil, Racines ou Toile ; inutile avec une Hyper Ball), puis un allié au contact qui n’a pas encore agi dépense 2 Voix. Un Pokémon K.O. s’enfuit.',
      a: [['Ouvrir la carte', 'data-news="herbes"']],
    },
    {
      k: 'deploiement',
      g: 'Avant le combat',
      ic: 'i-team',
      t: 'Déploiement',
      d: 'Avant les grands combats, placez vos Pokémon sur les <b>cases bleues</b>, puis « Lancer le combat ». Un attaquant devant, un soigneur à l’abri, un tireur sur une hauteur : le placement décide souvent du combat. Réglage : Grands combats, Tous ou Jamais (Paramètres).',
      a: [['Paramètres', 'data-try-it="params"']],
    },
    {
      k: 'doctrine',
      g: 'Avant le combat',
      ic: 'i-fight',
      t: 'Doctrines',
      d: () =>
        'Choisissez une doctrine dans l’écran de préparation : un avantage contre une contrepartie. ' +
        Object.values(DOCTRINE_DEFS)
          .map(x => `<b>${x.n}</b> : ${x.d} ${x.c}`)
          .join(' '),
      a: [['Préparer un combat', 'data-try-it="combat"']],
    },
    {
      k: 'ciel',
      g: 'Avant le combat',
      ic: 'i-sol',
      t: 'Ciel, météo et heure',
      d: 'En haut du combat, un logo annonce le <b>moment de la journée</b> (jour, aube, crépuscule, nuit) et la <b>météo</b> (pluie, grêle, tempête de sable, soleil, vent). La météo change la durée des marques et inflige des dégâts aux types qui n’y résistent pas ; la nuit avantage les Pokémon Spectre et Ténèbres et réduit la vue dans le brouillard.',
      a: [],
    },
    {
      k: 'brouillard',
      g: 'Avant le combat',
      ic: 'i-lune',
      t: 'Brouillard de guerre',
      d: 'Réglage facultatif : vous ne voyez que ce que voient vos Pokémon, à 2 cases (3 pour les Vol et Psy, 1 de moins la nuit). Un adversaire caché dans les hautes herbes n’apparaît qu’au contact. En échange : +25 % de Pokédollars en cas de victoire.',
      a: [['Paramètres', 'data-try-it="params"']],
    },
    {
      k: 'journal',
      g: 'Après le combat',
      ic: 'i-book',
      t: 'Journal tactique',
      d: 'Après chaque combat, le <b>rapport tactique</b> montre les dégâts infligés et subis par Pokémon, et désigne le MVP. Toutes vos statistiques (victoires par catégorie, Pokémon les plus utilisés, séries) sont dans Quêtes › Journal.',
      a: [['Ouvrir le Journal', 'data-try-it="journal"']],
    },
    {
      k: 'camp',
      g: 'Le Camp',
      ic: 'i-camp',
      t: 'Le Camp',
      d: 'L’onglet <b>Camp</b> réunit les bâtiments (Dojo…), les expéditions, la Pension et le Potager, en Campagne comme en Libre. Ses sous-onglets ouvrent les modes de jeu des chapitres suivants.',
      a: [['Ouvrir le Camp', 'data-try-it="camp:base"']],
    },
    {
      k: 'enigmes',
      g: 'Le Camp',
      ic: 'i-quest',
      t: 'Énigmes tactiques',
      d: () =>
        `${PUZZLES.length} énigmes : positions figées, PV au plus juste, mettez tous les adversaires K.O. <b>en une seule manche</b>. Trois étoiles par énigme selon vos essais ; un indice apparaît après un échec. Une énigme du jour change chaque jour.`,
      a: [['Jouer une énigme', 'data-try-it="camp:enigmes"']],
    },
    {
      k: 'echo',
      g: 'Le Camp',
      ic: 'i-star',
      t: 'Écho profond',
      d: 'Une expédition de <b>8 étages</b> avec une seule vie : les PV restent d’un combat à l’autre. À chaque étage, choisissez votre chemin : combat, élite (une relique à la clé), source, marchand ou événement. Le gardien vous attend au dernier étage.',
      a: [['Partir en expédition', 'data-try-it="camp:echo"']],
    },
    {
      k: 'arenes',
      g: 'Le Camp',
      ic: 'i-league',
      t: 'Arènes personnalisées',
      d: 'Composez votre combat : terrain, règle, heure, nombre de manches, robustesse et jusqu’à 5 adversaires. Testez-le, puis envoyez son <b>code</b> (ARN-…) à un ami : il l’importe et relève le défi. Jusqu’à 12 arènes.',
      a: [['Créer une arène', 'data-try-it="camp:arenes"']],
    },
    {
      k: 'maitrise',
      g: 'Le Camp',
      ic: 'i-trophy',
      t: 'Maîtrise des familles',
      d: () =>
        `Après ${MASTERY_THRESHOLD} combats dans votre équipe, une famille débloque un <b>bonus permanent</b>, à choisir entre deux (Puissance, Garde, Mouvement, PV, losange de départ…). Vous pouvez en changer contre des Pokédollars.`,
      a: [['Voir les maîtrises', 'data-try-it="camp:maitrise"']],
    },
    {
      k: 'pantheon',
      g: 'Le Camp',
      ic: 'i-trophy',
      t: 'Panthéon',
      d: 'Chaque équipe qui bat un Champion, un Maître ou le gardien de l’Écho profond y est gravée, avec la date, la difficulté et le nombre de manches.',
      a: [['Voir le Panthéon', 'data-try-it="camp:pantheon"']],
    },
    {
      k: 'natures',
      g: 'Votre équipe',
      ic: 'i-star',
      t: 'Natures et talents',
      d: 'Chaque Pokémon capturé a sa propre <b>nature</b> (Brave, Prudent, Vif…) et son propre <b>talent</b>, logiques avec sa famille et gardés à travers ses évolutions. Deux Salamèche ne se jouent pas forcément pareil : consultez la fiche du Pokémon.',
      a: [['Voir mon équipe', 'data-try-it="pokedex"']],
    },
    {
      k: 'equipes',
      g: 'Votre équipe',
      ic: 'i-team',
      t: 'Équipes et formations',
      d: 'Dans la préparation d’un combat, <b>enregistrez</b> jusqu’à 8 équipes et rappelez-les d’un geste. Les <b>formations</b> proposent des équipes toutes faites, pensées pour leurs synergies de types.',
      a: [['Préparer un combat', 'data-try-it="combat"']],
    },
    {
      k: 'hebdo',
      g: 'Défis et rencontres',
      ic: 'i-trophy',
      t: 'Défi de la semaine',
      d: 'Chaque semaine, la même équipe et la même règle pour tous les joueurs. Votre meilleur score est gardé, la première victoire est récompensée et vous pouvez comparer vos résultats avec vos amis.',
      a: [['Voir le défi', 'data-news="hebdo429"']],
    },
    {
      k: 'legendes',
      g: 'Défis et rencontres',
      ic: 'i-star',
      t: 'Légendes et Kael',
      d: 'Mewtwo, Raikou, Entei, Suicune, Lugia et Ho-Oh se capturent au bout de leur quête (Quêtes › Légendes). Votre rival <b>Kael</b> revient vous défier à Johto et à Hoenn, après 4 badges de chaque région : il a progressé autant que vous.',
      a: [['Quêtes légendaires', 'data-news="legend-quests"']],
    },
    {
      k: 'duel',
      g: 'Défis et rencontres',
      ic: 'i-fight',
      t: 'Duel local à 2',
      d: 'Camp › Duel : deux joueurs sur le même téléphone. Un tirage de Pokémon, un <b>bannissement</b> chacun, puis le choix en serpent (J1, J2, J2, J1…). Chacun joue son tour, puis passe le téléphone ; les Pokémon du Joueur 1 sont cerclés de bleu, ceux du Joueur 2 d’orange. Aucun objet, aucune nature, terrain symétrique : seul le jeu compte. Temps écoulé : le plus de PV restants l’emporte.',
      a: [['Organiser un duel', 'data-try-it="camp:duel"']],
    },
    {
      k: 'reglages',
      g: 'Réglages',
      ic: 'i-gear',
      t: 'Partie et accessibilité',
      d: 'Paramètres : passez de la <b>Campagne</b> au mode <b>Libre</b> (tous les combats ouverts) avec une confirmation, la partie peut d’abord être rangée dans un emplacement. Réglez la <b>taille du texte</b>, le contraste, les couleurs pour daltoniens, le mode gaucher et les animations. Les sauvegardes se gardent sur l’appareil et sur votre compte.',
      a: [['Paramètres', 'data-try-it="params"']],
    },
  ];

  // chapters marked "read": handled by Tutorial.jsx

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-try-it]');
    if (!b) {
      return;
    }
    const a = b.dataset.tryIt;
    if (a.startsWith('camp:')) {
      V4.campTab = a.slice(5);
      go('camp');
    } else if (a === 'journal') {
      V4.questTab = 'journal';
      go('quetes');
    } else {
      go(a);
    }
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('[data-news="tuto433"]')) {
      return;
    }
    e.stopPropagation();
    openGuide('tuto433');
  });
}
