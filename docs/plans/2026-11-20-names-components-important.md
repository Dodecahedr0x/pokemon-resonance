# Readable names, reusable components, no `!important`

Follows [2026-11-20-style-cleanup.md](2026-11-20-style-cleanup.md), which moves styles out of `legacy/` screen by
screen. This plan widens the goal to the whole codebase, CSS and JavaScript.

## Problem

- **`!important`**: ~2,070 declarations, all in `src/styles/legacy/` (27k lines). They exist to win fights between
  release files, and they force the `:where(:not(…))` fences new code needs to escape them.
- **Short names**: ~730 class names made of 1–4 letter fragments (`.b`, `.b-sm`, `.ph`, `.kick`, `.lbl-s`, `.tb`,
  `.stt`, `.enp`, `.rg`, `.ri`, `.dj1`…), in CSS, JSX and the engine's HTML strings. In JavaScript, ~80 short exports
  (`B`, `MV`, `BY`, `TAL`, `RX`, `ui`, `uAt`, `tc`, `tb`, `$`, `$$`…) and short locals almost everywhere (`u`, `e`, `m`,
  `k`, `al`, `st`…).
- **Repetition**: the same markup and the same declarations are written many times (`className="b b-sm b-gold"` in
  ~400 places; the dark card gradient and shadow, the gold left-rule note, the mono label in dozens of rules).

## Target

- No `!important` anywhere (exception kept by the style plan: reduced-motion / calm-mode overrides, which are
  rewritten as normal rules in the last layer).
- Every class, file, function, variable and exported constant says what it is in words. Short names are allowed only
  for conventional loop indices (`i`, `j`), coordinates (`x`, `y`), and callbacks one line long.
- Shared markup is a React component (`<Button size="small" variant="primary">`), shared CSS is a component file in
  `src/styles/components/` or a token in `src/styles/theme/`, shared engine HTML comes from one helper function.

## Constraints (unchanged)

- Persisted names never change: save keys, `localStorage` keys, content IDs (moves, items, scenarios…), share codes.
  A renamed variable that holds them keeps reading and writing the same strings.
- Element ids the engine and saved layouts use (`#bPanel`, `#bLaunch`…) are renamed only together with every reader,
  in one commit.
- No visual change: every CSS step is proven with the style snapshots (375 px and desktop, plus the states that
  matter); every JS step keeps the game playable and `npm run lint` / `npm run build` clean.

## Order

Each step is one commit (or a few), on its own, playable at every point.

1. **Shared CSS components, renamed and made React components**, most used first:
   1. button: `.b`, `.b-sm`, `.b-lg`, `.b-gold`, `.b-ghost` → `.button`, `.button-small`, `.button-large`,
      `.button-primary`, `.button-ghost`; a `Button` React component for JSX; the legacy rules that target the old
      names are renamed with them, and their `!important` removed where the new layer order makes it unnecessary.
   2. page header: `.ph`, `.kick`, `.h1`, `.sub` → `.page-header`, `.kicker`, `.title`, `.lead`; a `PageHeader`
      component.
   3. card and text: `.v4-panel`, `.v4-ph`, `.v4-cnt`, `.v4-fld`, `.lbl-s`, `.h2`, `.h3`, `.sec`, `.sec-h` →
      `.card`, `.card-header`, `.card-count`, `.form-field`, `.caption`, `.section-title`, `.card-title`, `.section`,
      `.section-header`; a `CardHeader` component.
   4. badges: type badges `.tb` (`typeBadge()` in the engine), status badges `.stt`, medals `.medal`, energy pips
      `.enp`, rank tags `.rg`, role icons `.ri`, with their modifier classes (`st-par`, `rg-…`, `ri-…`).
   5. repeated declarations become tokens or components: the dark card surface (gradient + border + shadow), the
      left-rule note, the mono caption.
2. **Screens**, continuing the style plan's order: each screen's remaining legacy rules move to its own file; its
   classes, its JSX and the engine strings that build it are renamed; the `!important` that targeted it disappear
   with the legacy rules.
3. **Engine exports**: the short exported names (`B` → `battle`, `MV` → `MOVES`, `BY` → `POKEMON_BY_ID`, `ui` →
   `battleUi`, `tc` → `typeColor`, `$` → `query`…), one module (and all its importers) per commit.
4. **Engine locals**: module by module, smallest first, renaming parameters and locals (`u` → `unit`, `e` → `enemy`,
   `m` → `move`…); behaviour checked by playing the screens that module drives.
5. **`legacy/` deleted** with the last `!important`; `AGENTS.md` and `README.md` updated.

## Progress

- 1.1 button: done. Classes renamed everywhere (CSS, JSX, engine strings, legacy selectors); JSX uses
  `src/components/Button.jsx` (`buttonClass()` gives the same class list to code that builds HTML). Players' Design
  Workshop CSS is translated through `src/lib/renamedClasses.js`, where every later rename of a shared class is added.
  The legacy `!important` rules that target buttons are screen tweaks (home call to action, coach, saves, result);
  they go with their screens in step 2.
- 1.2 page header: done. `.ph`, `.kick`, `.h1`, `.sub` → `.page-header`, `.kicker`, `.title`, `.lead`; the ten screen
  headers render `src/components/PageHeader.jsx` (`wide` adds `.page-header-wide`, the only part of `.ph-sm` /
  `.v4-ph-page` any rule still reads: map and battle choice). Renames are done with
  `node tools/rename-classes/rename-classes.mjs '{"old":"new"}'`, which rewrites CSS selectors, JSX `className`, engine
  `class="…"` strings, `classList` calls and selector strings in `querySelector` / `closest` / `matches` / `$`.
- 1.3 card and text: done. `src/styles/components/card.css` (was `panel.css`); the card headers of Settings, Camp,
  Quests, Map and Home render `src/components/CardHeader.jsx` (`icon`, `title`, optional `count`, extra children),
  except the radio card on Home, which draws its own icon.
- 1.4 badges: done. `.tb`, `.tb-s`, `.stt`, `.enp`, `.rg`, `.ri`, `.mdl-a` → `.type-badge`, `.type-badge-icon`,
  `.status-badge`, `.energy-pips`, `.rank-tag`, `.role-icon`, `.medal-art`. Modifiers: status codes in English
  (`STC` in `engine/combat/ui.js`: `status-paralysis`, `status-frozen`…, shared by the board badges), `rank-<rank>`,
  `role-icon-<role>`, medal sizes `is-tiny` / `is-small` / `is-large` / `is-huge` / `is-plate` and `has-art`, energy
  pips `is-filled` / `is-large`. The large pips used to borrow the types legend's `.lg` look; that is now
  `src/styles/components/energy-pips.css`. The helpers keep their short names (`tb()`, `medal()`, `enPips()`) until
  step 3.
- 1.5 repeated declarations: done. `src/styles/theme/surfaces.css` holds the card surface (`--surface-card`,
  `--color-line-card`) and the plate surface (`--surface-plate`, `--color-line-plate`, `--shadow-plate`);
  `theme/colors.css` gains `--color-highlight`, `--color-selected`, `--color-text-bright` and `--color-text-pale`.
  The ability and role notes share one rule. The mono captions were left as they are: their sizes, spacing and
  colours differ from rule to rule, so one shared style would change some of them.
- 2 Home, part A (hero): done. `src/screens/home/home-hero.css` (card, text, buttons, professor) and
  `home-hero-backdrop.css` (landscape, time of day, season, weather, place tag, forecast, companion); ~750 legacy lines
  and 102 `!important` gone. Classes are `.home-hero-*` (`has-backdrop`, season `is-spring`…`is-winter` mapped from
  the French season ids in `Hero.jsx`, `is-petted` while the companion's heart pops); the keyframes moved with them.
  The Map's goal chips used the hero's generic chip rule, now their own `.map-info-chips` in
  `src/screens/map/map.css`. The corner brackets and entrance scan stay shared in legacy skin (`.card`, `.home-hero`,
  `.case`).
- 2 Home, part B: done. Home is out of legacy except the shared « Combat en cours » card (`.resume`, with the
  Battles screen). `src/screens/home/home.css` (page glow, layout, Home's card look, « Nouveau », season, radio, daily
  challenge), `home-activities.css` (`.activity` buttons with `activity-season`, `activity-boss-rush`… and
  `.activity-badge` / `.activity-text`) and `home-friends.css` (`.home-friends-*`, `.home-tournament`). About 1,300
  legacy lines targeted Home elements that no longer exist (`.hm-hero`, `.hm-quick`, `.qk`, `.tcard`, `#campBox`,
  `.v4-mon`, `.v4-tile`, `.route` inside Home…) and were deleted with their keyframes; with the moved rules, ~2,000
  lines and 415 `!important` are gone. FriendBox keeps the shared `.am-a` / `.am-nt` rules in legacy.
- 2 Map, part A (map panel): done. `src/screens/map/map.css` (header row, region tabs, layout, panel, scrolling
  stage, arrows, compass, title plate), `map-marks.css` (routes, markers, finds, secret places, passer-by, roaming
  beasts), `map-painting.css` (the painted map and its time-of-day, weather and fog layers, formerly
  `legacy/living-map.css`, now deleted) and `map-info.css` (side column: encounter banner, place card, Elite Four
  rows, place list). Classes are `.map-*` with `is-*` states (`is-next`, `is-locked`, `is-selected`, `is-branch`…);
  the region SVGs are `.map-svg.is-kanto|is-johto|is-hoenn` and the effect layers `.map-fx-shadow`, `-cloud`,
  `-sparkle`, `-puff`, `-birds`, `-lights`. ~1,200 legacy lines and 115 `!important` gone. Two accidental matches
  disappear with the old names: the global sidebar rule `.side` hid the branch routes (`rt side`) below desktop
  width, and the text rule `.d` greyed the east scroll arrow; both now look like their desktop / west twin.
  Still shared in legacy: the state pill `.v4-pill` (Quests), the rank badge `.rk-t`, the tab skin (now listing
  `.map-regions`).
- 2 Map, part B (« hautes herbes »): done. `src/screens/map/map-wild.css` (section, header, the route's frame,
  rare-encounter banner, « ! » alert, sign, time-of-day buttons, dialogue box, captured families) and
  `map-route-scene.css` (the drawing, coloured by `--route-*` properties per time of day). `Route.jsx` moved from
  `home/` to `map/`; its classes are `.route-scene` (`is-shaking`), `.route-alert` (`is-shown`), `.route-overlay`,
  `.route-sign`, `.route-time`, `.route-dialogue`, `.route-stars`, `.route-mountains`… and the captures are
  `.map-captures-*` (`is-caught`). Ids the engine reads (`#route`, `#routeSvg`, `#rtAlert`, `#todBtns`, `#dlgTxt`,
  `#rustle`) stay. The drawing lost parts that never showed: the fireflies (always transparent), the SVG « ! » (hidden
  since the HTML alert replaced it) and the animation delays of the stars, clouds and grass, whose animations the
  performance rules had switched off. Also never visible, and deleted: the season tints of the route (beaten by an
  `!important` shadow) and the `.scene` rules (no such element). The dialogue box loses its background blur, which a
  global performance rule already removed everywhere else. ~950 legacy lines and 28 `!important` gone.
- 2 Team: done. The screen already had its own files from the style plan; what was left: the sidebar and top bar
  team widgets (`SideTeam`, `TbTeam` in `Dock.jsx`, `.steam`, `.tb-team`), hidden at every width by legacy rules,
  are deleted; the type-synergy diamonds and chip shared with the Guide, the battle preparation and the battle's top
  bar are `src/styles/components/synergy.css` (`.synergy-types`, `.synergy-chip`, were `.syn-t`, `.syn-c`); the
  engine's reset / restore / draw row is `.team-actions` (was `.team-x`), styled in `team-dock.css`.
- 2 Saves: done. `src/screens/saves/saves.css` (status, profile and counters, game settings, slots with `is-auto` /
  `is-empty`); classes `.saves-*`. The pieces it shared with other windows got shared names, their rules still in
  legacy until the overlays step: the dialog card `.dialog-card` (was `.sv-card`, every `Dialogue` box), its close
  button `.dialog-close` (was `.sh-x`), the button row `.button-row` (was `.sv-io`, also Settings and the Workshop) and
  the confirm prompt `.confirm-question` (was `.sv-q`). The engraved slab and brass / edge frames are now
  `--surface-slab`, `--border-edge`, `--border-brass`, `--shadow-engrave` and `--radius-card(-large)` in
  `theme/surfaces.css`.
- Shared tabs: done. `src/styles/components/tabs.css`: `.tabs` is the Poké Ball tab look, written once instead of a
  skin rule listing five class names; each bar adds its layout class: `.page-tabs` (Bag, Camp, Quests, was
  `.v4-tabs`), `.segmented-control` (Settings, camp duel, was `.v4-seg`), `.guide-tabs` / `.guide-tab` (was `.gd-tabs`
  / `.gd-t`, in the new `src/screens/guide/guide.css`), `.map-regions`, and `.camp-tabs` (was `.camp-tab`, in the new
  `src/screens/camp/camp.css`). `.scn-tabs` had no element left and is gone. Because `components` sits below
  `legacy`, the two global legacy button rules (transition and its easing) now skip `.tabs > button`.
- Shared pill, note, empty state, gold button: done. `src/components/StatePill.jsx` (`<StatePill state="next|open|done|lock">`,
  label from `STATE_N` unless children are given) and `src/styles/components/state-pill.css` replace `.v4-pill s-*`
  (Map, Quests); its `STATE_CLASS` map is also the Map markers' state class. `src/styles/components/note.css` holds
  `.note` (was `.v4-note`) and `.empty-state` (was `.v4-empty`); `src/styles/components/pill-button.css` holds
  `.pill-button` (was `.v4-btn`, the round gold button of the Bag's workshop, the Pokédex missions and the season
  event). The Pokédex's ready-mission ring on that button was always overridden and is gone.
- Bag: its own classes were already out of legacy. Shared pieces it uses moved to components:
  `src/styles/components/currency.css` (`.coin-icon`, `.gem-icon`, were `.v4-coin`, `.v4-gemi`) and
  `src/styles/components/progress-bar.css` (`.progress-bar`, was `.cp-bar`). The dialogue box (`.dlgbox`,
  `.dlg-who`) goes with the overlays step, since the Pokémon-world skin restyles it in the tip and the intro.
- Quests: done. `src/screens/quests/quests.css` (page cards, tabs and their ready count, trophy case, chapters, side
  quests), `quests-event.css` (challenge of the week, daily challenge) and `quests-journal.css` (legends, journal,
  achievements), with readable names: `.quests-trophies` / `.quests-badges` / `.quests-badge` (`is-earned`, its shine
  staggered by an inline `--i`), `.quests-counts`, `.quests-list`, `.quests-chapter(-emblem, -text, -side)` with the
  state classes of `StatePill`, `.quests-side(-text, -actions, -progress)` (`is-ready`, `is-claimed`),
  `.quests-daily(-text)` (`is-done`), `.weekly-challenge-*`, `.legend-quests` / `.legend-quest(-text, -caught)`
  (`is-ready`, `is-caught`, `--type-color`), `.journal`, `.journal-tiles`, `.stat-tile`, `.journal-section`,
  `.journal-category(-bar)`, `.journal-mvp`, `.journal-battle(-result, -name)` (`is-won`) and `.achievement(-icon,
  -text, -progress, -title, -check)` (`is-unlocked`). Shared pieces: `src/styles/components/reward-list.css`
  (`.reward-list`, and `.reward-line` / `.reward-badge` / `.reward-hp` in the engine's reward lines) and
  `landscape-scene.css` (`.landscape-scene`, also on Home). The old trainer-card badge rules (`.tcb`, `.tc-bdg`)
  had no element and are gone.
- League: done. `src/screens/league/league.css`, its values read from what the six competing `!important` layers
  resolved to: `.league-case` (was `.case`), `.league-case-header` (`.case-h`), `.league-badges` / `.league-badge`
  (`.badges` / `.bdg` on this screen, `is-selected`, `is-won`; the Map and Home emblems keep `.bdg` for now),
  `.league-gym(-badge, -text, -foes, -action)` (`.arena`, `.ar-*`), `.league-leader(-name)` (`.ld`), `.league-elite`,
  `.league-elite-grid`, `.league-elite-card` (`is-won`, `is-locked`, `--type-color`), `.league-elite-number`,
  `.league-elite-leader`, `.league-elite-foes`. The best-rank disc (`.rk-t rk-S`) is the shared
  `src/styles/components/best-rank.css` (`.best-rank is-S`), since `.rank-tag` already names the move-rank stars.
  The cases keep the shared corner and scan effects in the skin. The page entrance animation's selector list in
  `pokemon-skin.js` now names `.league-case` and `.quests-chapter`.
- Camp: done. `src/screens/camp/camp.css` (tabs, page), `camp-base.css` (`.camp-base`, `.camp-buildings` /
  `.camp-building(-header, -level, -lock)` with `is-built` / `is-reached`, `.camp-subtitle`, `.camp-expedition`,
  `.camp-daycare-pair` / `-egg` / `-slot` (`is-filled`) / `-plus`, `.camp-garden`, `.camp-plot` (`is-choosing`,
  `is-empty`, `is-growing`, `is-ripe`), `.camp-plant is-stage-N`), `camp-duel.css` (`.camp-duel-*`, was
  `.duel-report-*`; order chips `is-ban` / `is-done` / `is-current`, picks `is-selected` / `is-banned` / `is-picked`,
  history `is-winner`, type tint `--type-color`), `camp-echo.css` (`.camp-echo-*`, was `.echo-tab-*`; floors
  `is-done` / `is-current`, nodes `is-taken` / `is-boss`, members `is-fainted`) and `camp-modes.css` (Puzzles
  `.camp-puzzle*` with `is-solved`, Gyms `.camp-gym*`, Pantheon `.camp-pantheon-*`, Mastery `.camp-mastery-*` with
  `is-chosen`). `#camp-tab-body` also carries `.camp-tab-body`, so no id selector is left. Still in legacy: the
  battle's duel report (`.duel-report-r*`) and the player colours `.dj1` / `.dj2`, shared with the battle; the form
  field `.form-field` and the card intro `.v4-ps-n`, shared with Settings and Home; the fishing panel (`.pe-*`).
- Guide: done. The panels' ~1,500 legacy lines (up to six competing `!important` layers per element) were folded to the
  values that actually won, then checked against style snapshots of the eight tabs at both widths. Files:
  `guide-layout.css` (`.guide-panel`, `.guide-intro`, `.guide-section` / `-header`, `.guide-frame`, `.guide-scroll`,
  `.guide-table`, `.guide-columns`), `guide-start.css` (`.guide-steps`, `.guide-glossary`, `.tutorial-progress`,
  `.tutorial-chapter` with `is-read`), `guide-combat.css` (`.guide-turn`, `.guide-anatomy-*`, `.guide-rule-*`),
  `guide-types.css` (`.guide-matrix-*` with kind classes `is-damage` / `is-control` / `is-terrain` / `is-support` /
  `is-same-type` from `KIND_CLASS` in `Reactions.jsx`, `.guide-reaction-*`, `.guide-formula`, `.guide-chain-*`,
  `.guide-weather*`, `.guide-effectiveness*`), `guide-team.css` (`.guide-codex-*`, `.guide-obstacle is-<id>`,
  `.guide-chords`), `guide-league.css` (`.guide-topic*`, `.guide-bond-*`, `.guide-fatigue-*`, `.guide-item*`,
  `.guide-combo*`, `.guide-champion*`), `guide-universe.css` (`.guide-lore*`, `.guide-master*`, `.guide-chapters`)
  and `guide-project.css` (`.guide-pillar*`, `.guide-figure*`, `.guide-studio*`, `.guide-layer*`, `.guide-roadmap*`,
  `.guide-legal*`). The old short names were also used by other screens (`.rule`, `.panel`, `.it`, `.k`…), so they
  were renamed only in the Guide's files; their legacy rules stay for those screens, and only the names nothing
  else uses go in the Design Workshop map. Two shared legacy rules still reached Guide elements and are reproduced:
  the generic `.sel` card look on the selected matrix cell and the professor-tip look on the reaction tip; the
  legacy `.section-title` colour now skips the Guide's sections, whose titles are gold.
- App shell: done. `src/styles/shell/` (imported first in the `screens` layer, since legacy still has generic rules that
  reach these elements): `app-layout.css` (`.app-ambient`, `.app-layout`, `.app-main`, `.app-content`,
  `.app-container`, `.app-footer`, `.app-logo` / `-icon`, were `.ambient`, `.app`, `.main`, `.content`, `.wrap`,
  `.foot`, `.logo`, `.lg-ic`), `sidebar.css` (`.sidebar`, `.sidebar-nav`, `.sidebar-link`, `.sidebar-save` and its
  `.sidebar-save-state`, `.sidebar-footer`), `topbar.css` (`.topbar-inner`, `.topbar-leds`, `.topbar-section`,
  `.topbar-save` with `is-busy` / `is-cloud`, `.topbar-profile`, `.topbar-trainer(-text)`, `.trainer-avatar`,
  `.topbar-wallet` with `is-gems`, `.topbar-settings`), `bottom-nav.css` (`.bottom-nav`, `.bottom-nav-link`,
  `.bottom-nav-icon`, `.bottom-nav-menu`), `phone-menu.css` (`.menu-layer`, `.menu-scrim`, `.menu-sheet(-header,
  -close, -grid)`, `.menu-item(-icon)`) and `launch-screen.css` (`.launch-*`, were `.rl-*` / `.v4-rl-*`). The
  `<html>` classes `rl-seen` / `rl-pret` are `launch-seen` / `engine-ready`; the components are `PhoneMenu`,
  `TopbarSection`, `TopbarSave`. ~1,800 legacy lines (about 350 `!important`) were folded to the values that won,
  checked with snapshots of the sidebar, top bar, bottom bar, footer, menu, launch screen and Map page at both widths,
  and of the battle states (`#cbBattle` shown, `compact-battle`, `fullscreen-mode`). The global performance rule that
  removes every backdrop blur now skips the top and bottom bars, whose blur used to beat it. The resolver orders the
  folded rules so that a rule that won a property over another one able to match the same element comes after it.
- Dialogues: done. `src/screens/overlays/`: `dialogue.css` (`.dialogue-box` with `is-large` / `is-small` and its
  `.dialogue-speaker`, were `.dlgbox` / `lg` / `sm` / `.dlg-who`; `.professor-avatar`, was `.pav`; the page tips
  `.professor-tip`, was `.tip`), `intro.css` (`.intro-card`, `-skip`, `-professor`, `-progress` with `is-done`,
  `-rules`, `-name`, `-starters`, `-starter` with `is-selected`, `-difficulty`, `-actions`, `-free-mode`, were
  `.it-*`), `starter.css` (`.starter-card`, `-grid`, `-option`, `-difficulty`, were `.st-*`), `tower.css` (`.tower-box`,
  `-card`, `-grid`, `-option`, `-actions`, `-rewards`, `-reward`, `-reward-icon`, were `.tdr-*`), `coach.css` (coach
  `.coach-card` / `-step` / `-actions`, battle tip `.battle-tip(-avatar, -actions)`, story scene `.story-scene-*`, the
  toast with `is-shown`), `typed-dialogue.css` (`.typed-dialogue`, `.typed-dialogue-arrow` with `is-floating`,
  `.typed-word`, `.typed-letter` with `is-shown`, `is-typing`, were `.pk-*`). The classic white dialogue skin was all
  `!important` over the screens; it is now normal rules in a new `skin` layer after `screens`
  (`typed-dialogue-skin.css`). Checked with snapshots of the five intro steps, the starter choice, the coach, the
  battle and page tips, the story scene, the toast, the Home hero and the Tower draft and reward, at both widths, with
  the typing finished. One accepted change: the intro box's old `lg` class also matched the types legend's `.lg`
  rules (alignment, gap, the arrow's radius); `is-large` does not. The legacy rule that restyles every input now skips
  `.intro-card`. New tokens: `--ease-rise`, `--surface-glass`, `--image-landscape`, and `--bottom-nav-height` (set on
  `body`, where battle and full screen zero the legacy `--bn`).
- Windows: done. `src/screens/overlays/modal.css`: the backdrop layer `.modal` (was `.result`; `.is-raised` above the
  others, was `.exp-box` / `.ct-box`), `.dialog-card` (`.is-compact`, was `.exp-card`) and `.dialog-close`, and the
  battle result's scrolling (`.modal.battle-result`, was `#cbResult`). `encounter.css`: `.encounter` / `.encounter-card`
  (`is-dominant`, `shiny`) / `-title` / `-dominant` / `-crest` / `-evolution` / `-actions` / `-note` (were `.enc-*`),
  `.rare-encounter`, fishing `.fishing-card` / `-water` (`is-biting`) / `-float` / `-alert` / `-catch` / `-total` (were
  `.pe-*`), Safari `.safari-card` / `-counters` / `-pokemon` / `-mood` / `-gauges` / `-gauge` / `-message` / `-grass` /
  `-actions` (were `.sf-*`). `window-boxes.css`: `.picker-list` / `.picker-option` (`is-selected`) for the expedition,
  Daycare and companion choices (were `.exp-list` / `.exp-d`), `.companion-bonuses`, TM `.tm-card` / `-list` /
  `-option` (`is-incompatible`) / `.tm-move`, `.inherited-move`, friend card `.friend-card` / `-label` / `-code`
  (`is-paste`, was `#amiColle`) / `-actions` / `-note` / `-error` (were `.am-*`), and the new-game warning
  `.new-game-scrim` / `-card` / `-warning` / `-actions`. Checked with snapshots of every window state (encounter normal,
  dominant and shiny; the four fishing steps and a shiny catch; Safari walking, encounter and shiny; expedition,
  Daycare, companion, TM, both friend cards, new game, Saves) at both widths. Three declarations that never applied were
  dropped: the encounter crest's 150px size (`.crest-pk > svg` beat it) and the shiny and dominant glows on the
  encounter card (the card's plate shadow was `!important`). A global legacy `[hidden] { display: none !important }`
  still hides every window; it moves to `base/` when `legacy/` goes.
- Effects: done. `src/screens/overlays/effects.css`: the backdrop `.pokeball-backdrop` (`#pk-fond`), the iris
  `.pokeball-iris` (`.pokeball-iris-half.is-top` / `.is-bottom`, `.pokeball-iris-button`; `is-playing`, was `go`), the
  battle entrance `.battle-entrance` (`-flash`, `-band`, `-ball`; `is-playing`, `is-boss`, `is-trainer`, `is-wild`,
  `is-fast`, were `go`, `boss`, `dresseur`, `sauvage`, `vite`), the badge ceremony `.badge-ceremony` (`-content`, `-case`,
  `-badge`, `-spray`, `-title`, `-count`, `-hint`; `is-leaving`, was `out`) and `.battle-transition(-flash, -iris)`; the
  elements keep their ids for the engine, the styles use the classes. `versus.css`: the VS intro `.versus` (was `.vs`;
  `-player`, `-opponent`, `-mark`, `-kicker`, `-team`, `-avatar`, `-badge`, `-foes`, `-rule`, `-tip`; `is-fast`,
  `is-calm`, `is-leaving`, were `fast`, `rm`, `out`). `battle-transients.css`: `.timed-catch` (`-card`, `-text`,
  `-rings`, `-target`, `-closing-ring`, `-center`, `-throw`, `-skip`; `is-perfect`, `is-miss`… were `res-*`) and the
  local duel relay `.duel-relay` (`-card`, `-actions`, `-scores`, was `.forfeit-dialog*`). Local custom properties got
  names (`--band-index`, `--entrance-delay`, `--entrance-exit-delay`, `--versus-duration`, `--versus-accent`); the
  spray's `--a` stays until the result card and the evolution scene, which share its keyframes, move. Checked with
  snapshots of every state (iris, three entrance kinds, badge shown and leaving, transition, three VS variants, three
  timed-catch results, both relay screens) at both widths. The page-entrance list in `pokemon-skin.js` named `.tip`,
  renamed to `.professor-tip` in the dialogue slice; fixed. Players' Workshop CSS written against `#pk-btr.go` and the
  like is not translated (the state classes are too generic to rename blindly).
- Info windows: done. `src/screens/overlays/info-windows.css`: the shared frame of the small windows in
  `transients/Windows.jsx` (`.info-window`, `-card`, `-body`, `-choice`, were `.battle-help*` and `.route-event-c`),
  `.keepsake-locked` (was `.buddy-l`); the trainer challenges' `.x2470-*` became `.trainer-challenges-rivalry`,
  `-showcase`, `-relic` (`is-found`, was `on`), which have no styles. Checked with snapshots of the battle help, a route
  encounter and its outcome, the keepsakes and a passerby at both widths, against the code from before the Windows
  slice: moving `.dialog-close` into the screens layer had let its `position: absolute` beat the legacy
  `.battle-help-c .dialog-close { position: static }`, pinning the × to the top of the screen; this slice restores it.
- Result sheet: done. `src/screens/combat/battle/result.css` (card, rank stamp, quote, badge row, stats, actions),
  `result-lists.css` (`.result-list` / `.result-row`, also used by about forty engine reward sections) and
  `result-effects.css` (celebration, flying badge, holographic edge, seal, confetti). `.res-*` became `.result-*`,
  `.rl` `.result-row` (`.is-replay`, `.is-achievement`, `.is-fallen`, `.is-shiny`), the card's `win` / `lose` /
  `result-fx` / `gold-glow` `.is-win` / `.is-loss` / `.is-celebrating` / `.is-champion`, `.rk-st rk-S` `.result-rank
  is-rank-s`; `#cbResult` rules now hang on `.modal.battle-result`. The generic legacy `.champ` (only ever on the
  League master list) and `.new` declarations that styled the sheet were folded in; `.new` itself stays in legacy for
  its other users. The result-only keyframes moved with readable names, and the confetti's `--a`, `--r`, `--d` became
  `--confetti-angle`, `--confetti-distance`, `--confetti-delay`. New token `--color-surface-raised` (was `--s3`).
  Checked with snapshots of seven sheets (win with rank, champion, new and old gym badge, loss, flight, Nuzlocke) at
  both widths: identical apart from the renamed animations.
- Evolution choice: done. `src/screens/combat/battle/evolution-choice.css`: `.evopick` / `.ep-*` became
  `.evolution-choice` (`-card`, `-from`, `-arrow`, `-options`, `-actions`), `.eo*` `.evolution-option` (`-art`, `-body`,
  `-name`, `-go`), its list items `.is-gain`, `.is-loss`, `.is-arrival`, and the inline `--c` `--evolution-color`.
  `#evoPick` rules hang on `.evolution-choice`. The generic `button:not(…)` transition used to beat the option's own,
  so the option now states it. New token `--border-steel`. Checked with snapshots of one path, Eevee's paths and a
  branch at both widths.
- Board tokens: done. `src/screens/combat/board/token.css`, `token-states.css`, `token-halo.css`, `token-status.css`,
  `token-tilted.css` and `token-motion.css`. `.tok*` became `.token` (`-halo`, `-rim`, `-ring`, `-image`, `-name`, `-body`,
  `-stand`, `-ready-ring`, `-evolution-mark`, `-energy`, `-shadow`, `-notes`, `-gloss`), and the states the engine toggles
  with `tokCl` got readable names: `.is-ally` / `.is-enemy`, `.is-selected`, `.is-acting`, `.is-done`, `.is-ko`,
  `.is-ready`, `.has-energy`, `.can-evolve` (was `evw`), `.is-resonant` (`fres`), `.is-resonating` (`reso`),
  `.has-notes`, `.is-coop-player-1/2`, `.is-coop-waiting`, `.is-phase-2/3`, `.is-duel-player-1/2`, `.is-in-grass`
  (`hid`), `.is-waiting` (`pk-wait`), `.is-flashing` (`pk-rouge`), `.is-fogged`, `.has-image`, `.is-colossus`… The
  board SVG got a `.board-svg` class. Many of these rules used to win through `#bSvg` and `!important`; once folded,
  overlapping states (a token can be selected, shiny and resonant at once) need their original order, so the resolver
  now orders declarations, not rules, and a cascade checker compares every pair of declarations that can hit the same
  element with the legacy winner. Contexts are written `:where(.board.painted-tilt)` so they add no weight, the halo
  rules share one file to keep their order, and the motion switches (calm motion, « reduce animations », reduced
  motion) moved to a new `motion` cascade layer after `skin`, so they beat every state without `!important`. New
  tokens `--color-enemy`, `--color-duel-player-1/2`. Checked with snapshots of the board with six groups of states at
  both widths: what paints is identical (generic legacy `.ally` / `.enemy` / `.done` rules no longer put HTML borders on
  the SVG groups, which never showed); under reduced motion a shiny and resonant token's halo now stays still.
  Lesson for the next slices: after moving a shared class, look for legacy rules that still style it in context.
- Board cells: done. `src/screens/combat/board/cell.css`, `cell-marks.css`, `cell-highlight.css`. `.hx` → `.cell`
  (`.is-alternate`, `.is-fogged`, `.is-deploy-zone`; the terrain words `.river`, `.wet`, `.mud`, `.lava`, `.rock`,
  `.grass`, `.sand`, `.pillar` stay), `.tx` / `.bv` / `.gl` → `.cell-texture` / `.cell-bevel` / `.cell-gloss`, the
  `h-*` highlights → `.highlight-*` (`.highlight-glow` for the outline under each, `.is-picked`, `.is-due`), `mk-*` →
  `.mark-*`, `.fogc2` → `.fog-cloud` (`.is-toxic`), and the pattern pieces in `Defs.jsx` → `.pattern-*`. The cell
  rules mixed ids, `!important` and `:not()` chains so much that no ordering of readable selectors kept every winner:
  states and contexts are now wrapped in `:where()` (`:where(.bio-gue) .cell:where(.wet)`), so every cell rule weighs
  the same as `.cell` and the file order, taken from the legacy winners, decides; the cascade checker reports no
  conflict. The glow rules come after the fills they outline. A dead legacy `.cell { border-radius }` rule was dropped.
  New tokens `--color-cell`, `--color-cell-river`, `--color-cell-wet`. Snapshots with four groups (base, selection,
  cell states, marks) are identical at 375 px; at 1280 px only the tokens' idle animation phase differs, from the
  reload.
- Dead legacy rules: removed. A scan of every legacy selector against the class and id names the code can produce
  (every word in the JS, JSX and `index.html`, plus the prefixes of class names built by concatenation such as
  `'bio-' + …`) found 136 selector parts that need a class nothing produces any more (`ptm`, `tc-*`, `cp-*`, `v4t-*`,
  `v4q-*`, `ob-*`, `qk-*`…). They are gone, and so are the 11 legacy files left empty.
- Evolution cutscene: done. `src/screens/combat/board/evolution-scene.css`, `evolution-scene-keyframes.css` and
  `evolution-scene-motion.css` (reduced motion, in the `motion` layer). `.evofx` → `.evolution-scene` (`.is-fast`),
  `.efx` → `.evolution-scene-burst` (`.is-foe`), `.efx-*` → `.evolution-scene-rays`, `-ring`, `-orb`, `-from`, `-to`,
  `-title`, `-caption`, `-flash`; keyframes `evolution-scene-*`. The old `fa` / `fb` keyframes were always replaced by
  the later `pkFa` / `pkFb` through `!important`, so only those remain, as `evolution-scene-from-flicker` and
  `-to-flicker`. Snapshots of five frames (ally, foe, fast) are identical at both widths apart from keyframe names.
  A second pass that only counts words inside string literals (so `dataset.qk` or a comment no longer keeps `.qk`
  alive) removed 68 more parts (`.hero`, `.qk`, `.qc`, `.tbl`, `.quad`, `.pal`, `.xl` sizes…) and one more file.
- Board decor: done. `src/screens/combat/board/board-decor.css`, `board-decor-painted.css`, `board-decor-motion.css`.
  Pillars (`.pillar-obstacle`, `.pillar-shadow`, `-base`, `-shaft`, `-flutes`, `-ring`, `-capital`, `-top`), tall grass
  (`.grass-back` / `.grass-front` with `.grass-blade-back` / `.grass-blade-front`, `.is-alternate`), `.cover-shield`
  (`.is-enemy`, `.is-ally`), `.ricochet-line` (`.is-picked`) and `.ricochet-point`, `.intent-arrow` (`.is-selected`) and
  `.intent-arrow-head`, biome decor `.terrain-tuft`, `-ember`, `-pebble`, `-glint`, `.terrain-field`, `.axis-label`, `.wave`,
  the lake (`.is-still`) and night haze (`.is-night`), and the Poké Ball layer (`.pokeball-layer`, `.pokeball-top`,
  `-bottom`, `-button`). Keyframes `fire-risk-flicker`, `lake-band-drift`, `lake-glint-drift`. Board snapshots identical
  at both widths apart from keyframe names.
  A third pass that ignores one- to three-letter prefixes (a template such as `s${…}` no longer keeps every class
  starting with « s » alive) removed 142 more parts: the old scenario cards (`.scn`), the splash screen (`.sp-*`,
  `.splash`), the old Pokédex sheet (`.st-*`), `.seg`, `.frise`… and one more file.
