# Pokémon Résonance

French fan game: tactical hex-grid battles, playable on phones. React app (Vite), deployed on Render. The game text is in French; all code and comments are in English.

## Run locally
```bash
npm install
npm run dev
```
Then open the printed address (http://localhost:5173). `npm run build` produces the static site in `dist/`, `npm run preview` serves it. `npm run lint` runs ESLint (strict config in `eslint.config.js`) and checks Prettier formatting (`.prettierrc.json`, 120 columns); it must report zero problems. `npm run format` fixes what can be fixed automatically.

## Layout
- `index.html`, `src/main.jsx`: React entry point.
- `src/App.jsx`: mounts the shell, then starts the engine.
- `src/components/`: launch screen, icons (`SvgSprite`), shell (`Shell`: side and bottom navigation, top bar, screens, overlays) and `Guard`, which isolates each block: a render error is reported with the « Petit souci technique » message without blanking the whole screen.
- `src/screens/`: every screen, one folder each (`home`, `team`, `dex`, `map`, `quests`, `bag`, `camp`, `league`, `guide`, `settings`, `saves`, `combat/prep`, `combat/battle`, `combat/board`) plus the overlays (`overlays`: encounter card, dialogs, toasts, coach, starter, transient windows).
  - Each screen has its store (`…Store.js`), built from the three pieces of `src/lib/store.js`: `version()` (a counter: the block redraws and re-reads engine state), `makeStore()` (a state object) and `channel()` (the subscription itself). Engine render functions keep their names (`renderParams`, `renderBoard`…) and call that store, which redraws synchronously (`flushSync`) because the engine often reads the DOM right after.
  - `src/lib/useKeyed.js`: `useKeyed(compute, keys)` keeps a value computed from engine state until one of its version keys changes (used instead of `useMemo` when the inputs live in engine modules).
  - Logic stays in the engine: its listeners are delegated on `document` (`closest('[data-…]')`) and form fields are uncontrolled.
- `src/lib/html.jsx`: `<Html html="…" />` turns an engine HTML fragment (text with `<b>`, `medal()`, `tb()`, `badgeSvg()` medallions…) into React elements, without a wrapper element.
- `src/engine/`: game engine (combat, rules, saves), one folder per area: `core` (hooks, utils, navigation, startup), `data` (species, moves, types, region tables), `state` (game state, saves, economy), `pokemon`, `team`, `combat`, `moves`, `items`, `modes` (gyms, league, duel, challenges…), `world` (map, regions, home), `progression` (campaign, quests, companions…), `ui`, `audio`, `assets` and `tools`. The engine no longer builds screens; it only keeps transient effects (see `docs/plans/2026-11-18-react-migration.md`).
  - A module body only declares: constants, tables and functions. Whatever must run at startup (listeners, subscriptions, initial state, values computed from another module) lives in its `init()`, and `index.js` calls the `init()` functions in a fixed order (the order the features were added in, which later features rely on). Circular imports are therefore safe.
  - A function is never replaced after the fact. A feature that wants to act "before" or "after" a core function subscribes to a named event in `core/hooks.js` (`HOOKS.battleEnd.push(…)`, list and arguments at the top of the file); the core function emits it with `hook('battleEnd')`. A rule that changes a result (scenario lock, price, capture conditions…) is written in the function itself, which calls a function exported by the relevant feature module when needed.
  - A state variable modified from another module (`squad`, `B`, `scSel`…) goes through its `__set_<name>()`, because an ES import is read-only. To open the Battles screen on a scenario: `openBattle(k)` (or `chooseBattle(k)` right before a `launch()`), in `combat/ui.js`.
  - Shared helpers: `core/utils.js` (`$`, `toast`, `readLS` / `writeLS` for `localStorage`, `wait`, `mulberry32`…) and `state/economy.js` (`savePurse`…).
  - Persisted object property names (save data in `PROFILE`, battle state `B`, share codes) are in English. Saves written with the older French names are converted by `src/lib/saveMigration.js`: `migrateStorage()` rewrites `localStorage` once at startup (flag `res-keys`), and `migrateKeys()` converts imported files, pasted codes, cloud saves and friend/gym codes. Renaming a persisted key again means adding it to `RENAMED_KEYS`. Content IDs (moves, items, scenarios, achievements, tips) are never renamed; a few scenario IDs still carry the release they were added in (`duel433`, `echo431`, `hebdo429`…), and the per-mode state saved under the same key keeps that name. Other names no longer carry release numbers: don't add new ones (name things for what they do).
  - In development, editing an engine module reloads the whole page (`engine-no-hmr` plugin in `vite.config.js`): the engine initializes only once.
- `src/styles/`: fonts, design tokens, element defaults, shared components, the app shell, utilities and accessibility overrides, imported by `src/styles/index.css` into cascade layers (`theme, base, components, screens, skin, motion, utilities, accessibility`); each screen's styles sit next to it in `src/screens/<screen>/`. The engine does not inject `<style>`, except the Workshop's custom CSS (unlayered, so it wins over everything).
- `public/audio/`, `public/img/`: music and painted backdrops, served as-is.

## Deployment (Render)
`render.yaml` is a Blueprint: a static site built by `npm ci && npm run build`, published from `dist/`. In Render: New › Blueprint, pick this repository; every push to `main` redeploys.

## Release notes (in French, as shown to players)

### Nouveautés v4.79 : confort sur téléphone
- Écran titre : le texte et le bouton « Toucher pour commencer » tiennent dans l'écran (ils étaient coupés à droite) ; la phrase verticale qui passait sur l'illustration disparaît sur téléphone.
- Combat : la barre du bas passe sur deux lignes. Les capacités ont toute la largeur (deux à trois visibles au lieu d'une), les outils du plateau et « Lancer le combat » partagent la seconde ligne ; ce bouton sortait de l'écran pendant le placement.
- Camp : la page ne défile plus de côté à cause de la ligne d'onglets.
- Paramètres : chaque panneau a sa marge intérieure (titres et boutons ne collent plus au bord) ; boutons pleine largeur ; les plateaux à gimmick s'affichent sur deux colonnes.
- Sac : les offres du jour s'affichent une par ligne, noms et prix en entier ; la ligne de catégories s'estompe à droite pour signaler qu'elle défile.
- Guide : les étapes de « Débuter » utilisent toute la largeur de la carte ; la matrice des réactions a des cases plus grandes et des abréviations lisibles ; les onglets collants restent lisibles au-dessus du texte.
- Choix du starter : les trois difficultés sur une seule ligne ; boutons de l'introduction en pleine largeur, le principal en bas sous le pouce.
- Boutons plus faciles à toucher : tutoriel de combat, Matin / Jour / Nuit sur la route, missions du Pokédex, étoiles des recrues, Sauvegardes, « Classement » de l'accueil.
- Titres de section : l'indication passe sous le titre au lieu de l'écraser ; filtres du Pokédex sur toute la ligne ; « 0 / 6 » des Lieux secrets ne coupe plus la phrase.

### Nouveautés v4.78 : tour guidé
- En combat, le panneau guide chaque Pokémon étape par étape : Déplacer › Agir › Terminer, avec un bouton pour sauter chaque étape (« Rester ici », « Passer l’action », « Terminer »).
- Plus de « Fin du tour » à presser pendant votre phase : la manche se termine seule quand tous vos Pokémon ont joué. Impossible de finir le tour en oubliant un Pokémon.
- Quand un Pokémon a fini, le suivant est sélectionné ; touchez n’importe quel autre Pokémon pour le jouer d’abord.
- Après une attaque, la Relance (2 Voix) et le repli de l’Éclaireur sont proposés avant de passer au suivant.
- Le déplacement s’annule toujours tant que le Pokémon n’a pas agi ou passé.
- Ordre par Vitesse, coop et duel : le tour passe seul au Pokémon ou au joueur suivant.
- Sur téléphone, l’étape en cours s’affiche à la place de « Fin du tour » ; au clavier, Espace passe l’étape.
- « Passer » reste disponible pendant le tour adverse pour l’accélérer.

### Nouveautés v4.77 : combats lisibles sur téléphone, plateau peint
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

### Nouveautés v4.76 : nettoyage des surcouches
- L'ancien écran titre n'est plus créé (puis refermé aussitôt) sous l'écran de lancement.
- Pendant l'écran de lancement, les animations du jeu caché dessous sont en pause.
- Démarrage : le Pokédex, l'analyse d'équipe et l'accueil ne sont plus dessinés deux fois.
- Poké Balls en filigrane immobiles (elles tournaient en continu, à peine visibles).
- 7 règles CSS qui ne pouvaient jamais s'appliquer retirées.
- Rendu vérifié identique, élément par élément, sur 9 écrans.

### Nouveautés v4.75 : dialogues fluides
- Texte lettre par lettre plus léger : les lettres cachées ne créent plus chacune un calque, et l'écran se met à jour environ 22 fois par seconde au lieu de 60.
- Les mots en rouge restent rouges pendant que le texte s'écrit.
- Combat : la largeur du plateau n'est plus relue à chaque rendu, et le bond des jetons et la secousse du plateau ne forcent plus la mise en page de toute la page.

### Nouveautés v4.74 : fluidité
- Écran titre : la tour et la Poké Ball géante retirées du paysage (aussi sur le bandeau d'accueil).
- Accueil plus fluide : météo et saisons animées par la carte graphique, sans repeindre le bandeau à chaque image.
- Carte plus fluide : le halo de « Rencontre sur la route » ne relance plus le calcul de toute la page.
- Message « Petit souci technique » affiché en haut de l'écran, avec le numéro de version.

### Nouveautés v4.73 : le monde Pokémon
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

## Contributing
1. Fork the repository.
2. Change the code in `src/` of your fork (`npm run dev` to test, `npm run lint` must pass).
3. Open a pull request with a clear description of your changes.

Please do not publish secret code or keys in contributions.
