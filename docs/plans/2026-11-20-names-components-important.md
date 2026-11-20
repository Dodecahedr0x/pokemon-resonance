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
