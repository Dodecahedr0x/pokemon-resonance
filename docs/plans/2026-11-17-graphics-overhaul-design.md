# Graphics overhaul — design

Date: 2026-11-17 · Baseline: v4.76

## Goal

Drastically improve the look of the whole game (combat, world map, menus) in a
**painterly cinematic** style that extends the existing title-screen painting.
Art is generated with the **Codex CLI** image tool and shipped as WebP files in an
`img/` folder beside the HTML (like `audio/`). Game logic is untouched; this is a
rendering layer with a full fallback to the v4.76 look.

## 1. Asset pipeline and art bible

- **Art bible:** a shared style prefix for every prompt — "painterly anime
  landscape, soft brushwork, warm cinematic light, rich but not oversaturated,
  no characters, no text, no logos, no UI". The title painting is the reference.
  Lighting variants follow the board's time-of-day system (`jour`, `crépuscule`,
  `nuit`).
- **`art/manifest.json`** (dev only): id, prompt, aspect ratio, target size,
  output path, optional reference image.
- **`art/gen.sh`:** for each missing asset, `codex exec` with the image tool,
  raw PNG saved to `art/raw/` (git-ignored).
- **`art/build.sh`:** resize (2048 px backdrops, 1024 px vignettes, 512 px
  textures) and convert with `cwebp -q 78` into `img/`. Terrain textures are made
  seamless with an ImageMagick offset-and-blend pass; procedural SVG pattern
  stays as fallback if a texture tiles badly.
- **Inventory (~55 images, ~5–6 MB WebP):**
  - Combat backdrops: 4 biomes (`gue`, `roche`, `tour`, `ligue`) × 3 times of
    day + 8 arenas = 20
  - Terrain textures: grass, stone, sand, water, ash, marble, rune, mud, lava = 9
  - Region maps: 3
  - Menu header vignettes: 6
  - Type backdrops for cards: ~18
- Validated on 2026-11-17: one `codex exec` call produced a 1672×941 meadow
  backdrop in ~1 min that matches the title art.

## 2. Combat board (real 3D tilt)

- **Stage:** the `.board.bio-*` gradients are replaced by the painted backdrop
  for the current biome/arena and time of day (`background-size: cover`), with a
  vignette and bottom fog so the board sits in the scene.
- **Two layers instead of one SVG:**
  1. **Ground layer** — tiles, textures, marks, move/danger/menace highlights,
     arena zones, fog, traps. CSS `perspective(1000px) rotateX(~38deg)`,
     origin bottom-centre. Tile taps keep using the existing `data-k` handlers
     (browsers hit-test through 3D transforms).
  2. **Unit layer** — tokens, HP bars, names, intent arrows, damage numbers,
     untilted. Token positions = hex centres projected through the same
     `DOMMatrix` (recomputed on resize only). Sprites stay upright, scale with
     depth. `pointer-events:none` except on tokens.
- Text currently drawn on tiles (trap/mark icons) moves to the unit layer.
- Tilt ~28° on narrow portrait phones so the far row stays tappable; 0° in
  Léger mode.
- **Tiles:** extruded 6 px "earth lip" under each hex; generated textures fed
  through the existing `tx-*` pattern ids (`<image href="img/tex-*.webp">`), so
  `renderBoard` is unchanged; top-left highlight / bottom-right shade matching
  the backdrop light; painted boulder sprites; water sheen animation
  (GPU-only).
- **Tokens:** larger sprites, elliptical contact shadow, team-coloured ground
  ring, staggered idle bob, HP bar closer to the sprite.
- **Effects:** type-coloured particle bursts on a canvas overlay with one shared
  rAF loop that runs only while an effect plays; hit flash; existing shake kept
  and applied to the right layer.
- **Performance budget:** no per-frame layout, animate only
  `transform`/`opacity`, max one rAF loop, backdrops ≤ 2048 px.
- **Setting:** Paramètres › Habillage Pokémon › "Graphismes : Riche / Léger".
  Léger = v4.76 look.
- Highest-risk part: built first, behind the switch, tap-tested at phone size
  before anything else.

## 3. World map and menus

- **Map:** render each region's current procedural map to PNG, pass it to Codex
  as a reference (`codex exec -i`) and ask for a top-down painterly repaint that
  keeps every biome, path and landmark in place. The painting becomes the base
  layer; the interactive SVG (routes, towns, player marker, encounter halo,
  fog) stays on top, restyled as thin gold ink.
- Alignment check: overlay the layout at 50 % on the painting. If drift is too
  large for a region, that region falls back to painted biome textures clipped
  into the existing ellipses with feathered edges.
- **Menus:** painted 16:5 header vignettes for Équipe, Pokédex, Carte, Camp,
  Sac et Boutique, Quêtes (fading into the panel like the home banner); subtle
  paper grain and warm top light on panels; type-themed painted backdrops
  behind sprites on starter and team cards. Navy/gold palette kept.
- **Unchanged:** layout, navigation, copy, dialog boxes (v4.75), title screen.

## 4. Rollout, fallback, verification

- **Releases**, each a PR in the existing style (version bump, renamed HTML,
  French "Nouveautés" in README):
  1. v4.77 — pipeline, combat backdrops and textures, tilted two-layer board,
     tokens, effects, Riche/Léger switch.
  2. v4.78 — painted region maps.
  3. v4.79 — menu vignettes, surface treatment, card backdrops.
- **Fallback:** `art(id)` helper for URLs; a 1×1 probe in `img/` at startup sets
  `body.no-art` when the folder is missing; `no-art` or Léger restores v4.76
  styling; per-image `onerror` fallback.
- **Verification per release:**
  - Before/after screenshots of the same 9 screens, at desktop and 375×812.
  - Combat at phone size: tap every row incl. the far one to select, move and
    attack; token vs ground taps; tutorial overlay still targets the right
    tiles.
  - Chrome performance trace of one full Riche-mode combat turn: no
    layout-driven long frames, a single rAF loop.
  - Rename `img/` → game identical to v4.76, no console errors. Same for Léger
    with `img/` present.
- **Art review gate:** after the first batch (4 meadow backdrops + 3 textures),
  stop and show contact sheets before generating the rest.
