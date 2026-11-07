# Toji Art Bible — v1 (overnight build)

Single source of visual truth. Every slot in `toji-asset-production.md` must pass against this before `done`.

## Style statement

Dark sumi-e manga ink world inspired by Jujutsu Kaisen's visual language (cursed energy, seals, red moon, Black Flash distortions) — **original motifs only, zero character likenesses, zero traced official panels.** The vibe: "zero cursed energy, all physical."

## Palette

UI chrome (canonical, exact):
- ink `#0B0B0D` · graphite `#17181C` / `#1E1F24` · bone `#EDE9E0` · smoke `#8A8D93`
- blood `#C1121F` (pressed `#8E0E17`) · blood-bright `#E5312D` **rim-light/glow only, never UI fills** · jade `#2E9E77` (success/recovery only)

Illustration latitude: reds may range `#A51F2B`–`#E03131`; jades `#388568`–`#2E9E77`; ink blacks may go `#000`–`#141518`; warm paper greys `#4A4B4F`–`#6B6D71` for screentone. Nothing else. No blue, no purple, no orange.

## Line rules

- Brush-variable strokes (thick→thin) with dry-brush tails; hand-imperfect, never geometric-perfect.
- Outer silhouettes 3–6 units; interior detail 1–2 units; hatching in 0.5-unit parallel clusters.
- Speed/action slashes: tapering wedges, never uniform widths, always grouped in 3–7 with asymmetric spacing.

## Lighting

- Single rim-light source, red, from behind/upper; body stays ink-black silhouette with bone highlight edges.
- Chiaroscuro: shadow eats ≥60% of any figure. Eyes/highlight accents only where focus must land.

## Texture

- Screentone: classic dot halftone, 6–10% density bg use, denser (20–35%) only inside manga panels.
- Ink splatter: irregular blobs with satellite droplets, always anchored to an element (never floating alone).
- Grunge: feTurbulence-based wash, edge-free, seamless when tiled.
- Grain floor: every big canvas gets a ≤4% opacity noise field so flats never look vector-sterile.

## Composition

- Phone-first._bg slots keep **centre-left ~60% content-free** (bg-home ≥60%, bg-workout ≥85% dark, bg-subtle ≥90% empty).
- Bottom 200 units of any full-screen art stays quiet: sheet/tab chrome lives there.
- One dramatic element per screen; everything else whispers. If busy → remove.

## Motif vocabulary (allowed)

Red moon (textured, not flat) · pagoda/torii silhouettes · ink splatter · screentone fields · engraved seal rings (dark masonry style) · curse-script circle glyphs (random-looking but original, non-readable) · torn paper/panel edges · speed wedges · tally marks · brush underline · Ember specks (tiny red, ≤20 per canvas, near energy sources only).

## Mascot reference sheet ("Bud" — original,拟定 NOT Gojo)

Chibi 2-heads-tall buddy, brush-ink outlines: dark spiky-tied hair suggestion via 3 strokes + black bandana tied over the top of the head (NOT a blindfold, NOT white hair, NOT round dark shades) + red headband knot at back; off-white skin; oversized black hoodie with blood-red kanji 訓練 tab; big expressive eyes with bone sclera + ink pupils; jade headband NOT used. Poses: (1) thumbs-up wink, (2) deep training bow (土下座-lite), (3) flexed double-bicep "fighting spirit" pose.

## Worm reference sheet ("Mushi" — original, NOT official Inventory Curse)

3 rounded segments stacked like soft-serve; black outline + paper-white fill; big glossy black eyes; single red topknot bead; tiny brush nub arms. Idle = 4-frame ±6° tilt wiggle; tap = squash-jump 2 frames. ≤32×32 px readable at 256 canvas.

## Kanji glossary (rendered by app, never baked)

領域展開 · 天与呪縛 · 縛 · 黒閃 · 咒力: 0 · 任務 · 訓練 · 記録 · 無限 · 始
Forbidden: 呪術廻戦, character names, random/meaningless kanji.

## Negative prompts (always append to any NIM prompt)

"generic anime style, glossy 3D render, plastic skin, neon colors, blue/purple palette, gradient background, watermark, signature, star watermark, text, logos, copyrighted characters, Jujutsu Kaisen logo, character faces like Toji Fushiguro or Gojo Satoru, cluttered composition, UI mockup"

## Accepted style refs (from reference-batch-1, archived)

- `bg-home.png`: moon+pagoda+torii+backlit hero silhouette ✔️ target structure (minus watermark star, minus figure tip)
- `hero-figure.png`: rim-lit back silhouette w/ wrapped blade ✔️ rebuild vector-clean
- `bg-workout.png`: mid-panel lifter composition ✔️ left strip reserved
- `texture-screentone/grunge`, `torn-edg`, `bg-subtle` engraving ✔️ tones/engraving match
- Rejected traits: AI star watermark (bottom-right), baked UI text, nothing else recurring.

## QA anchors

Every asset: palette-conformant, watermark-free, no baked text, seamless where required, ≤ file budget (ledger). Contact sheets at `ai-assets/reports/`.
