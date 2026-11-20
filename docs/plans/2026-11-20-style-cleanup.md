# Style cleanup: tokens, components, colocated screen styles

## Problem

`src/styles/` holds ~35,700 lines in 127 files, grouped by **release** (`05-v0-9-legend-prestige-the-legacy/`,
`20-v4161/`, `25-post-init-selector-repair/`…), not by what they style. Each release re-styled earlier elements on top
of the previous ones, so:

- one element's look is spread over many files (`.medal` in 28 files, `.plate` / `.fcard` in 17, `.topbar` in 15), and
  the rule you open is usually not the one that wins;
- 2,876 `!important` and selectors like `html:not(#pkz) body:not(#pkz) #pokedex .fcard` exist only to win those fights;
- ~146 global tokens form seven parallel palettes, one per era (`--cyan`, `--pr-cyan`, `--r22-cyan`, `--r24-cyan`,
  `--rx-cyan`, `--pk-cy`…), redefined on `:root` by several releases; 1,112 distinct hex values are used directly;
- class names are cryptic or carry the era (`.tok`, `.hx`, `.scn`, `.fcard`, `.v4-panel`, `.a11y432`).

## Target

```
src/styles/
  index.css            layer order + imports
  theme/               tokens only: spacing, colors, radius, shadow, type, motion
  base/                reset, body, typography defaults
  components/          shared pieces, one file each: button, panel, page-header, chip, medal, hex-tile…
  legacy/              the old release files, shrinking until gone
src/screens/<screen>/<screen>.css   everything specific to that screen, imported by the screen
```

- **Layers** make the order explicit: `@layer theme, base, components, legacy, screens;`. Later layers win over
  earlier ones regardless of selector specificity, so new code needs no `!important` and no id chains to beat legacy
  rules. Components sit below legacy so the screen-specific tweaks still in legacy (`#pokedex .ph`) keep winning
  until their screen moves; screens sit above it. (Caveat: `!important` inside `legacy` beats normal rules in later
  layers. Delete such legacy rules while migrating the element they target.)
- **Revived rules**: when a component's old global `!important` rules leave legacy, scoped legacy rules they used to
  override (`.champ .h1 { font-size }`) start to apply. Delete those dead declarations in the same commit, or fence an
  element rule off with `:not(:where(.kick))`; the page snapshots show which ones came back.
- **Tokens** have semantic names (`--color-text`, `--color-surface`, `--color-accent`, `--radius-md`,
  `--shadow-raised`, `--text-sm`, `--ease-out`) next to the existing `--space-*` scale.
- **Names** say what the thing is: `.settings-switch`, not `.v4-sw`. Engine HTML strings use the same names.
- **One place per element**: to change the Team card, open `src/screens/team/team.css` (or `components/` if the card is
  shared).

## Safety net: style snapshots

`tools/style-snapshot/` (dev server only) records the computed style and box of every element under a root:

```js
await styleSnapshot('settings-before', '#params'); // in the page
```

```bash
node tools/style-snapshot/diff.js settings-before settings-after
```

Keys come from DOM position (tag, id, child index), never class names, so renames don't break comparisons. One-shot
animations are finished and loops frozen before capture. Two captures of an unchanged page are identical; a one-rule
colour change shows up.

Each migration step: capture the screen at 375 px and desktop width (plus the relevant states: modes such as
`a11y-hc`, open panels, battle phases), change the CSS, capture again, and diff. A pure move must diff clean. A
deliberate visual change (merging two near-identical colours) is listed in the commit message.

## Migration, in order

1. **Layers and tooling.** Snapshot tool; `legacy` layer around the old files; empty `theme`, `base`, `components`
   and `screens` layers. Verify all screens diff clean.
2. **Pilot: Settings.** Settings-only legacy rules (≈60 selector lines in 13 files: `#params`, `.v4-sw`, `.v4-sl`,
   `.v4-params`, panel internals) move to `src/screens/settings/settings.css`, written once with the winning values and
   new names. Shared classes on the page (`.b`, `.v4-panel`, `.ph`) stay in legacy until step 4.
3. **Tokens.** Semantic tokens in `theme/` hold the real values; the era palettes become aliases of them, then
   disappear as their users migrate. Near-duplicate colours are merged as one reviewed visual change.
4. **Shared components**, the most used first: button (`.b`, used in 146 places), page header (`.ph`, `.kick`, `.h1`,
   `.sub`), panel (`.v4-panel`), chips, medals, hex tile. Each must diff clean on every screen that uses it.
5. **Screens**, one per commit, smallest first: saves, guide, settings (finish), quests, bag, league, dex, home, camp,
   team, map, combat (prep, board, battle), overlays. The engine's HTML strings for that screen are renamed together.
6. **Delete `legacy/`** once nothing is left in it, and update `AGENTS.md` / `README.md` with the new layout.

Each step is its own branch and merge, playable at every point.

## Rules going forward

- New styles go in the screen's own file or a component file, never in `legacy/`.
- No `!important` outside `legacy/` (exception: `prefers-reduced-motion` / calm mode overrides).
- Colours, radii, shadows and type sizes come from tokens; raw values only for one-off art (painted gradients).
- Files stay ≤ ~400 lines; a screen that needs more splits by block (`team/team-card.css`).
