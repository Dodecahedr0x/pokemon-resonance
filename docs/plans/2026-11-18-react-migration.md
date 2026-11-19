# Migration vers React

## Où on en est (étape 1 : faite)
- Le fichier unique `Pokemon_Resonance_v4.77.html` est remplacé par une application Vite + React 19, déployée sur Render par `render.yaml` (site statique).
- React possède : le point d'entrée, l'écran de lancement (`LaunchScreen`, état React au lieu des deux scripts d'origine), les icônes SVG (`SvgSprite`) et le shell (`Shell` : navigation latérale et basse, barre du haut, conteneurs `#accueil`, `#pokedex`, `#combat`, `#types`, `#ligue`, surcouches `#sheet`, `#enc`, `#saves`, `#starter`, `#coach`, `#toast`).
- Le moteur (`src/engine/`) est chargé par `App` après le premier rendu.
- Pas de `<StrictMode>` : le moteur suppose un seul montage de chaque écran.

## Régression connue
Paramètres › « Télécharger le jeu » / « Enregistrer le jeu » téléchargeaient le fichier HTML unique. Dans l'application construite, ils téléchargent seulement `index.html` (inutilisable hors ligne). À retirer, ou à remplacer par une version PWA hors ligne.

## Suite, par étapes indépendantes et vérifiables
1. ~~**Découper le moteur en modules ES.**~~ Fait : 113 modules, un par section d'origine, avec `import`/`export` explicites.
   - Corps de module = déclarations seulement ; le code de démarrage est dans `__init()`, appelé par `index.js` dans l'ordre du fichier d'origine. Les imports circulaires sont donc sans danger, et l'ordre d'exécution est identique.
   - Les variables d'état réaffectées depuis un autre module (`squad`, `B`, `scSel`…, 18 en tout) passent par `__set_<nom>(v)`, car un import ES est en lecture seule.
   - ~~Fonctions « enveloppées » par des sections de version plus récentes (`show`, `setTod`, `scenLock`…).~~ Fait : plus aucune fonction n'est réaffectée. Les 76 enveloppes sont devenues des abonnements aux événements nommés de `015-…-crochets.js`, ou des règles écrites dans la fonction qu'elles modifiaient (voir le README). Les sections 072 et 073 (import de sauvegarde) sont fondues dans `025`.
   - Les constantes, tables et fonctions sont déclarées dans le corps du module ; `__init()` ne garde que ce qui dépend de l'ordre de démarrage.
   - Vérifié : rendu identique à l'ancien moteur sur Accueil, Équipe, Combats et Guide (aléatoire et horloge figés ; seules différences, la progression du texte lettre par lettre), une manche de combat complète, sauvegarde et rechargement.
   - Prochain nettoyage utile : regrouper les sections de versions (`v4.43 : …`) dans les modules des écrans qu'elles modifient.
2. **Un état de partie observable.** Exposer l'état (`05-etat-de-partie`, sauvegardes) par un petit store (`useSyncExternalStore`) pour que les composants React se re-rendent quand le moteur le modifie.
3. **Porter les écrans un par un**, du plus simple au plus risqué, chacun derrière son conteneur du shell :
   - ~~Guide~~ Fait (`src/screens/guide/`) : les 8 panneaux sont des composants React qui lisent les données du moteur.
     - Le moteur n'écrit plus dans le Guide. Retirés : le rendu de `11-types`, l'anatomie, les règles, les piliers et les chiffres de `10-accueil-route`, les objets et duos de `renderSys`, `codexHtml`, `renderUnivers`, `renderTuto433`, et les insertions « Accords » (v4.10) et « Résonance en combat » (v4.14).
     - Les points d'entrée du moteur gardent leur nom et passent par `guideStore.js` : `setGuide`, `openGuide`, `openRx`, `jump`.
     - `show('types')` appelle `guideShown()`, qui relit l'équipe, les liens, les objets et le tutoriel à chaque affichage. C'est la première pièce du « store » de l'étape 2.
     - Les icônes et textes riches viennent toujours des fonctions du moteur, via `<Html>`, pour garder ses retouches (silhouettes, typographie). Les porter en composants viendra avec l'écran Équipe, qui les utilise le plus.
     - Vérifié : HTML de chaque panneau comparé à l'ancien jeu (aléatoire et horloge figés). Seuls écarts, la mise en forme des styles et l'attribut `onerror` (remplacé par `onError`), plus le nombre de capacités du panneau Projet (178 au lieu de 155 : l'ancien chiffre était calculé avant l'ajout des dernières capacités). Testés : matrice, liens vers une règle, tutoriel lu puis remis à zéro et sauvegardé, onglet mémorisé, `openRx` depuis l'Équipe, synergies du codex qui suivent l'équipe.
     - Méthode réutilisable pour les écrans suivants : chercher dans `src/engine/` chaque id et chaque classe du conteneur, et toute insertion `insertAdjacentHTML` qui vise l'écran (les sections de version en font).
   - ~~Paramètres, sauvegardes~~ Fait (`src/screens/settings/`, `src/screens/saves/`).
     - Paramètres : 23 panneaux, un composant chacun, dans l'ordre où l'ancien jeu les insérait. Les 30 enveloppes `renderParams` des versions 4.41 à 4.77 sont retirées, ainsi que les générateurs `modeHtml430`, `atelierHtml430`, `depHtml430`, `defisHtml`, `a11yHtml432`, `SW` et `SL`.
     - `renderParams()` passe par `settingsStore.js` : il reconstruit la page de façon synchrone (`flushSync`), comme l'ancien `innerHTML`, car le moteur relit parfois la page juste après. Les champs sont non contrôlés et tous les gestionnaires restent dans le moteur (délégation sur `document`).
     - Sauvegardes : `openSaves`, `closeSaves` et `renderSaves` passent par `savesStore.js`, lui aussi synchrone (le moteur sélectionne `#svCode` juste après). L'élément `#saves` reste toujours monté : le moteur y attache ses écouteurs une seule fois.
     - Vérifié : HTML des Paramètres et des Sauvegardes identique à l'ancien jeu (seule différence, l'ordre des propriétés d'un `style`). Testés : interrupteurs, curseurs, difficulté, prénom, plein écran, Nuzlocke (confirmer, annuler), réinitialisation, ouverture et fermeture des Sauvegardes (croix, Échap), emplacements, copier et coller un code, sans erreur dans la console.
   - ~~Tous les autres écrans~~ Fait : Accueil (et la Route 29, montée dans la page Carte), Équipe et fiche, Pokédex, Carte, Quêtes, Sac et boutique, Camp, Ligue, préparation du combat, combat (barre, panneaux, journal, choix d'Éveil, résultat), plateau (terrain, calques, unités, outils), barre latérale et du haut, et toutes les surcouches (rencontre, dialogues, toasts, coach, starter, intro, fenêtres temporaires).
     - Même modèle que les Paramètres : un store par écran, fonctions de rendu du moteur routées vers lui, rendu synchrone, contenu remonté par `key={version}` pour se comporter comme l'ancien `innerHTML`. Les sections de version qui inséraient des morceaux (`insertAdjacentHTML`, enveloppes `__set_renderX`) sont devenues des composants, à leur place finale ; leurs générateurs HTML sont supprimés.
     - Chaque bloc du shell est entouré d'une `Garde` (limite d'erreur) : une erreur de rendu est signalée et n'efface que ce bloc ; elle se réinitialise au changement de page.
     - Vérifié contre l'ancien jeu (aléatoire et horloge figés, animations coupées, deux sauvegardes : partie neuve et partie à 4 badges) : DOM de toutes les pages et surcouches, 20 scénarios d'interaction (recherches, filtres, onglets, fiche, rencontre, sauvegardes, menu), un combat d'arène (début, après le tour adverse, panneaux, ciblage, abandon) et un combat joué jusqu'à la défaite (48 tours). Tout est identique, sauf la position de l'alerte « ! » de la route, que le banc de test ne pouvait pas mesurer (onglet masqué).
   - Ce que le moteur écrit encore lui-même, volontairement :
     - le message d'erreur de `002` (il doit survivre à un plantage de React) ;
     - les effets passagers posés dans des calques vides rendus par React (`L.fx`, `L.fl`, `pk73fx`, ondes `pk-onde`, lettres du texte qui s'écrit, `canvas.fxc`), la transformation image par image `ct453` et la largeur de `#bBoard` (`calibre434`) ;
     - les bascules `hidden` de `#cbBattle`, `#evoPick`, `#cbResult`, le surlignage `coach-hl` hors plateau, `placeAlert()` (position de l'alerte « ! ») ;
     - les liens `<a>` temporaires de téléchargement, les canevas hors écran et le `<style>` du CSS personnalisé (les styles des sections 105 à 112 sont désormais des fichiers de `src/styles/`).
   Pour reprendre un écran : chercher dans `src/engine/` chaque id et chaque classe du conteneur, et toute écriture (`innerHTML`, `insertAdjacentHTML`, `textContent =`, `appendChild`…) ou enveloppe de version qui le vise. Le JSX doit reproduire l'ancien DOM (un attribut vide s'écrit `data-x=""`) ; un état visuel posé par le moteur (`classList`, `hidden`, `style`) passe dans le rendu, ou l'élément reste monté.
4. **Navigation.** Une fois les écrans portés, remplacer `09-navigation` (ancres `#accueil`…) par un état React ; garder les ancres dans l'URL pour les favoris.
5. **Retirer les surcouches de versions** (`<style id="resonance-v4xx">` regroupées dans `src/styles/game.css`) en les fusionnant dans les styles des composants portés.
