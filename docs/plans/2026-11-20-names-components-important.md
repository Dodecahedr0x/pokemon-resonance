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
