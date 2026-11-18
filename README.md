# Pokémon Résonance

Fangame français : combats tactiques en hexagones, jouable sur téléphone. Application React (Vite), déployée sur Render.

## Jouer en local
```bash
npm install
npm run dev
```
Puis ouvrir l'adresse affichée (http://localhost:5173). `npm run build` produit le site statique dans `dist/`, `npm run preview` le sert.

## Organisation
- `index.html`, `src/main.jsx` : point d'entrée React.
- `src/App.jsx` : monte le shell, puis lance le moteur.
- `src/components/` : écran de lancement, icônes (`SvgSprite`), shell (`Shell` : navigation latérale et basse, barre du haut, écrans, surcouches) et `Garde`, qui isole chaque bloc : une erreur de rendu est signalée par le message « Petit souci technique » sans vider tout l'écran.
- `src/screens/` : tous les écrans, un dossier chacun (`accueil`, `equipe`, `dex`, `carte`, `quetes`, `sac`, `camp`, `ligue`, `guide`, `settings`, `saves`, `combat/prep`, `combat/battle`, `combat/board`) et les surcouches (`overlays` : fiche de rencontre, dialogues, toasts, coach, starter, fenêtres temporaires).
  - Chaque écran a son store (`…Store.js`) : un numéro de version et `useSyncExternalStore`. Les fonctions de rendu du moteur gardent leur nom (`renderParams`, `renderBoard`…) et appellent ce store, qui redessine de façon synchrone (`flushSync`), car le moteur relit souvent le DOM juste après.
  - La logique reste dans le moteur : ses écouteurs sont délégués sur `document` (`closest('[data-…]')`) et les champs de formulaire sont non contrôlés.
- `src/lib/html.jsx` : `<Html html="…" />` transforme un fragment HTML du moteur (textes avec `<b>`, médaillons `medal()`, `tb()`, `badgeSvg()`…) en éléments React, sans élément enveloppe.
- `src/engine/` : moteur du jeu (combat, règles, sauvegardes), un module par section d'origine (`000-…` à `112-…`). Chaque module ne fait que déclarer ; son `__init()` contient le code exécuté au démarrage, et `index.js` appelle les `__init()` dans l'ordre d'origine. Une variable modifiée depuis un autre module passe par son `__set_<nom>()`. Le moteur ne construit plus d'écran ; il garde seulement les effets passagers (voir `docs/plans/2026-11-18-react-migration.md`).
  - En développement, modifier un module du moteur recharge toute la page (greffon `moteur-sans-hmr` de `vite.config.js`) : le moteur ne s'initialise qu'une fois.
- `src/styles/` : polices intégrées et feuilles de style.
- `public/audio/`, `public/img/` : musiques et décors peints, servis tels quels.

## Déploiement (Render)
`render.yaml` est un Blueprint : un site statique construit par `npm ci && npm run build`, publié depuis `dist/`. Dans Render : New › Blueprint, choisir ce dépôt ; chaque push sur `main` redéploie.

## Nouveautés v4.78 : tour guidé
- En combat, le panneau guide chaque Pokémon étape par étape : Déplacer › Agir › Terminer, avec un bouton pour sauter chaque étape (« Rester ici », « Passer l’action », « Terminer »).
- Plus de « Fin du tour » à presser pendant votre phase : la manche se termine seule quand tous vos Pokémon ont joué. Impossible de finir le tour en oubliant un Pokémon.
- Quand un Pokémon a fini, le suivant est sélectionné ; touchez n’importe quel autre Pokémon pour le jouer d’abord.
- Après une attaque, la Relance (2 Voix) et le repli de l’Éclaireur sont proposés avant de passer au suivant.
- Le déplacement s’annule toujours tant que le Pokémon n’a pas agi ou passé.
- Ordre par Vitesse, coop et duel : le tour passe seul au Pokémon ou au joueur suivant.
- Sur téléphone, l’étape en cours s’affiche à la place de « Fin du tour » ; au clavier, Espace passe l’étape.
- « Passer » reste disponible pendant le tour adverse pour l’accélérer.

## Nouveautés v4.77 : combats lisibles sur téléphone, plateau peint
- Plateau incliné en vraie perspective : les cases s'éloignent vers l'horizon, posées sur un socle de terre ; les Pokémon restent debout et rapetissent au fond.
- Décors peints derrière le plateau selon le lieu et l'heure, de jour comme de nuit : prairie, canyon, tour mystique, stade de la Ligue. Les arènes prennent le décor du type du champion (canyon pour Roche, tour pour Spectre…).
- Textures peintes sur les cases : herbe, pierre, eau, sable, cendre, marbre, runes, et boue ou lave quand une attaque les crée. Boue, lave, zone de déploiement et brouillard restent visibles sur les textures.
- Repères A–H et 1–6 recalés au bord du plateau incliné.
- Pastilles de sol (Fissuré, etc.) plus petites au fond du plateau, posées dans leur case au lieu de déborder sur la case de derrière.
- Pokémon debout sur un anneau couché au sol, aux couleurs de leur camp, avec leur ombre ; ceux du fond passent derrière ceux de devant, et les noms restent toujours lisibles par-dessus.
- Animations : les Pokémon respirent, sautent quand ils se déplacent et soulèvent de la poussière en retombant ; onde de choc au sol quand un coup porte, nuage de poussière au K.O. ; la caméra se pose sur le plateau au début du combat ; les effets d'attaque partent du corps du Pokémon et rapetissent au fond du plateau.
- Lumière : brume vers l'horizon, teinte de lune la nuit, ombres de nuages qui glissent sur le plateau de jour ; pollen ou poussière dans l'air le jour, lucioles et braises la nuit ; reflets de lumière qui glissent sur l'eau, avec des éclats qui scintillent (ils suivent la marée de l'Arène Eau).
- Quand la nuit tombe (ou que le jour se lève) en plein combat, le décor peint passe en fondu vers sa version de nuit, et la lumière, les reflets de l'eau et les lucioles suivent.
- « Réduire les animations » et « Effets animés » coupent aussi ces animations.
- Paramètres › Habillage Pokémon › « Graphismes » : Riche (décors et plateau incliné) ou Léger (plateau à plat d'avant).
- Adversaires en rouge, votre équipe en bleu : anneau plein autour de chaque Pokémon, nom et ombre teintés, cartes d'équipe colorées avec les étiquettes « Adversaires » et « Votre équipe ».
- Sur téléphone, tout le combat tient dans l'écran sans défiler : la barre de navigation du bas s'efface pendant le combat, « Fin du tour » partage la ligne des outils, cartes d'équipe plus compactes et plateau ajusté à la hauteur de l'écran.

## Nouveautés v4.76 : nettoyage des surcouches
- L'ancien écran titre n'est plus créé (puis refermé aussitôt) sous l'écran de lancement.
- Pendant l'écran de lancement, les animations du jeu caché dessous sont en pause.
- Démarrage : le Pokédex, l'analyse d'équipe et l'accueil ne sont plus dessinés deux fois.
- Poké Balls en filigrane immobiles (elles tournaient en continu, à peine visibles).
- 7 règles CSS qui ne pouvaient jamais s'appliquer retirées.
- Rendu vérifié identique, élément par élément, sur 9 écrans.

## Nouveautés v4.75 : dialogues fluides
- Texte lettre par lettre plus léger : les lettres cachées ne créent plus chacune un calque, et l'écran se met à jour environ 22 fois par seconde au lieu de 60.
- Les mots en rouge restent rouges pendant que le texte s'écrit.
- Combat : la largeur du plateau n'est plus relue à chaque rendu, et le bond des jetons et la secousse du plateau ne forcent plus la mise en page de toute la page.

## Nouveautés v4.74 : fluidité
- Écran titre : la tour et la Poké Ball géante retirées du paysage (aussi sur le bandeau d'accueil).
- Accueil plus fluide : météo et saisons animées par la carte graphique, sans repeindre le bandeau à chaque image.
- Carte plus fluide : le halo de « Rencontre sur la route » ne relance plus le calcul de toute la page.
- Message « Petit souci technique » affiché en haut de l'écran, avec le numéro de version.

## Nouveautés v4.73 : le monde Pokémon
- Entrée en combat qui brise l'écran en bandes (flashs pour un Pokémon sauvage, bandes dorées pour une Arène ou la Ligue).
- Les Pokémon sortent de leur Poké Ball au début du combat et y retournent au K.O.
- Barres de PV comme dans les jeux, qui descendent progressivement.
- Boîtes de dialogue classiques avec texte lettre par lettre (Prof. Sorbier, scènes, tutoriel, champions, vendeur).
- Silhouettes noires pour les Pokémon pas encore capturés.
- Cartes d'équipe à collectionner : cadre selon le rang, reflet holographique pour les chromatiques.
- Boîte à badges en velours et cérémonie à chaque nouveau badge.
- Évolution avec la vraie silhouette du Pokémon.
- Boutique avec vendeur et étagères, Sac à poches.
- Sons d'interface synthétisés (aucun son officiel).

Ces effets se règlent dans Paramètres, rubrique « Habillage Pokémon ».

## Contribuer
1. Forkez le dépôt.
2. Modifiez le code dans `src/` de votre fork (`npm run dev` pour tester).
3. Ouvrez une pull request avec une description claire de vos changements.

Merci de ne pas publier de code secret ni de clé dans les contributions.
