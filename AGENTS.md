# AGENTS.md

Guide for coding agents working on **Pokémon Résonance**: a French fan game (tactical hex-grid battles, phone-first) built with React 19 + Vite 6, deployed as a static site on Render. `README.md` has the full architecture tour; this file is the short list of rules and gotchas.

## Commands

```bash
npm install
npm run dev       # http://localhost:5173
npm run lint      # ESLint (strict) + Prettier check — must report zero problems
npm run format    # auto-fix lint and formatting
npm run build     # static site in dist/
npm run preview   # serve dist/
```

- There is **no test suite**. Verify changes by running the game (`.claude/launch.json` has a `game` config on port 5173 and a `dist` config on 4174) and checking the affected screen, ideally at phone width too.
- Before finishing any change: `npm run lint` is clean and `npm run build` succeeds.

## Language

- **Code, identifiers, comments, commit messages, docs: English.**
- **Player-facing text: French** (UI strings, dialogues, release notes in `README.md`). Use French typography (« guillemets », space before `! ? : ;`); `engine/ui/french-typography.js` keeps `!` / `?` from wrapping onto a new line.
- Don't put release numbers in new names (functions, CSS classes, storage keys, files). Name things for what they do. Existing content IDs that carry a version (`duel433`, `echo431`…) stay as they are.

## Layout

| Path | What |
| --- | --- |
| `src/main.jsx`, `src/App.jsx` | Entry: runs save migration, mounts the shell, starts the engine |
| `src/components/` | Shell, nav, top bar, launch screen, `Guard` (per-block error boundary), `SvgSprite` |
| `src/screens/<screen>/` | One folder per screen (`home`, `team`, `dex`, `map`, `quests`, `bag`, `camp`, `league`, `guide`, `settings`, `saves`, `combat/{prep,battle,board}`, `overlays`), each with a `…Store.js` |
| `src/lib/` | `store.js` (`version` / `makeStore` / `channel`), `useKeyed.js`, `html.jsx` (`<Html>`), `saveMigration.js` |
| `src/engine/` | Game logic, one folder per area (`core`, `data`, `state`, `pokemon`, `team`, `combat`, `moves`, `items`, `modes`, `world`, `progression`, `ui`, `audio`, `assets`, `tools`); `index.js` calls every module's `init()` in order |
| `src/styles/` | CSS entry `index.css` with cascade layers: `theme/` (tokens), `legacy/` (old per-release files, being emptied), `base/`, `components/`; screen styles live in `src/screens/<screen>/<screen>.css` |
| `public/img`, `public/audio` | Served as-is. `art/` holds the Python pipeline that produces `public/img/*.webp` (not linted) |
| `docs/plans/` | Design docs for past larger changes; add one for a large new change |

## Engine rules

- **Module bodies only declare** constants, tables and functions. Anything that runs at startup (listeners, subscriptions, initial state, values derived from other modules) goes in the module's `init()`, registered in `src/engine/index.js`. The order there matters; append new features at the end unless they must run earlier.
- **Never monkey-patch a function.** To run something before/after core behavior, push onto a named hook in `engine/core/hooks.js` (the list of hooks and their arguments is at the top of that file); add a new hook there and emit it with `hook('name')` if needed. Rules that change a result go in the function itself, calling into the feature module.
- **Cross-module state writes** go through the exported `__set_<name>()` setter (ES imports are read-only), e.g. `squad`, `B`, `scSel`.
- Shared helpers: `core/utils.js` (`$`, `toast`, `readLS` / `writeLS`, `wait`, `mulberry32`…), `state/economy.js` (`savePurse`…). Prefer `readLS` / `writeLS` over raw `localStorage` in new code.
- Engine event listeners are delegated on `document` via `closest('[data-…]')`; form fields are uncontrolled. Keep logic in the engine, not in components.
- Editing anything under `src/engine/` triggers a **full page reload** in dev (no HMR), since the engine initializes once.

## React rules

- A screen redraws when the engine calls its store (`renderX()` → store → `flushSync`). Synchronous on purpose: the engine often reads the DOM right after rendering.
- Use `useKeyed(compute, keys)` instead of `useMemo` when the inputs live in engine modules.
- Engine HTML fragments are rendered with `<Html html="…" />`, not `dangerouslySetInnerHTML`.
- Wrap independent blocks in `Guard` so one render error doesn't blank the screen.

## Saves and persisted data

- Persisted property names (`PROFILE`, battle state `B`, share codes) are English. Renaming one requires adding it to the key maps behind `RENAMED_KEYS` in `src/lib/saveMigration.js` (and bumping its `VERSION` when a new migration pass is needed). Old saves and imported codes must keep loading.
- Content IDs (moves, items, scenarios, achievements, tips) and existing `localStorage` keys are **never renamed**.

## Styles

- The styles are being moved out of `src/styles/legacy/` (see `docs/plans/2026-11-20-style-cleanup.md`). **Add nothing to `legacy/`.** Screen-specific CSS goes in `src/screens/<screen>/<screen>.css`, imported from `styles/index.css` with `layer(screens)`; shared pieces go in `src/styles/components/`. Later layers beat earlier ones whatever the specificity, so no `!important` and no id chains in new code.
- Class names say what the thing is (`.settings-switch`, not `.v4-sw`); no release numbers. Colours and fonts come from the semantic tokens in `theme/colors.css` (`--color-text`, `--color-accent`…), not the per-release palettes (`--v4-*`, `--rx-*`…).
- Prove a style refactor changes nothing with the style snapshots (`tools/style-snapshot/`): `await styleSnapshot('name', '#screen')` in the dev page, then `node tools/style-snapshot/diff.js before after`. Capture at 375 px and desktop width.
- Every padding, margin and gap uses the `--space-*` scale from `src/styles/theme/spacing.css` (2, 4, 6, 8, 12, 16, 20, 24, 32, 40, 48, 64 px). Pick the nearest step; only `0`, `1px` hairlines, fluid values (`clamp`, `vw`) and layout offsets stay literal. This applies to inline styles in JSX too.
- Keep each CSS file **≤ ~400 lines**. Folders such as `game/`, `skin/`, `phone/` are split into numbered files imported by their `index.css`; add a new numbered file rather than growing one. Order is cascade order.
- Phone layout matters most: check changes at ~375 px wide, with 40–44 px tap targets and no horizontal page scroll.
- The engine does not inject `<style>` (except the Workshop's user CSS).

## Lint and formatting

- Prettier: 120 columns, see `.prettierrc.json`. ESLint config is strict (`eqeqeq`, `curly: all`, `no-shadow`, `prefer-const`, `object-shorthand`, `no-console` except `warn`/`error`, unused args must start with `_`…). Don't disable rules inline to get around them; fix the code.
- `art/`, `public/`, `dist/`, `.claude/` and `*.md` are ignored by lint/Prettier.

## Releases and git

- The player-facing changelog lives in `README.md` under "Release notes" (French, newest first, `### Nouveautés vX.YY : titre`); the in-game « Nouveau » card is `engine/ui/whats-new.js`. Version is in `package.json`.
- Commit messages: one English sentence describing the change (see `git log`). Work on a branch and merge into `main`; every push to `main` redeploys on Render (`render.yaml`), so don't push without being asked.
