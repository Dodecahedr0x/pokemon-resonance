# Pokémon Résonance

Fangame français en un seul fichier HTML : combats tactiques en hexagones, jouable sur téléphone.

## Jouer
Ouvrir `Pokemon_Resonance_v4.77.html` dans un navigateur. Les dossiers `audio/` (musiques) et `img/` (décors peints) doivent rester à côté du fichier. Sans `img/`, le jeu garde le plateau à plat d'avant.

## Nouveautés v4.77 : combats lisibles sur téléphone, plateau peint
- Plateau incliné en vraie perspective : les cases s'éloignent vers l'horizon, posées sur un socle de terre ; les Pokémon restent debout et rapetissent au fond.
- Décors peints derrière le plateau selon le lieu et l'heure, de jour comme de nuit : prairie, canyon, tour mystique, stade de la Ligue. Les arènes prennent le décor du type du champion (canyon pour Roche, tour pour Spectre…).
- Textures peintes sur les cases : herbe, pierre, eau, sable, cendre, marbre, runes, et boue ou lave quand une attaque les crée. Boue, lave, zone de déploiement et brouillard restent visibles sur les textures.
- Repères A–H et 1–6 recalés au bord du plateau incliné.
- Pokémon debout sur un anneau couché au sol, aux couleurs de leur camp, avec leur ombre ; ceux du fond passent derrière ceux de devant, et les noms restent toujours lisibles par-dessus.
- Animations : les Pokémon respirent, sautent quand ils se déplacent et soulèvent de la poussière en retombant ; onde de choc au sol quand un coup porte, nuage de poussière au K.O. ; la caméra se pose sur le plateau au début du combat ; les effets d'attaque partent du corps du Pokémon et rapetissent au fond du plateau.
- Lumière : brume vers l'horizon, teinte de lune la nuit, ombres de nuages qui glissent sur le plateau de jour ; pollen ou poussière dans l'air le jour, lucioles et braises la nuit.
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
2. Modifiez `Pokemon_Resonance_v4.77.html` dans votre fork.
3. Ouvrez une pull request avec une description claire de vos changements.

Merci de ne pas publier de code secret ni de clé dans les contributions.
