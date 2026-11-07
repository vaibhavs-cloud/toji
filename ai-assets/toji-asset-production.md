# Toji Asset Production â€” master ledger

**Source of truth for the overnight asset build.** Update statuses here as work happens. Companion: `progress.md` (session log).

- Repo: `openGym/` (fork, branch `main`)
- Staging: `ai-assets/staging/` Â· Final: `openGym/frontend/public/assets/user/`
- Reference art (user's 9 PNGs): `ai-assets/staging/reference-batch-1/` â€” archival reference only, never shipped
- Deliverable format: **SVG (vector-first, hand-authored)**. PNG/WebP allowed only where vector cannot achieve quality (none found so far).
- Style bible: `ai-assets/art-direction/art-bible.md`
- AI image gen (NIM): endpoint VERIFIED (`ai.api.nvidia.com/v1/genai/black-forest-labs/flux.1-schnell` â€” 200-capable, key valid) but queue-slow >4 min/gen tonight. **Decision: full-SVG build for all slots; NIM kept as fallback for any slot that fails vector QA twice. Probe scripts in `ai-assets/scripts/`.**
- ntfy milestone topic: `vaibhav-agy`
- Prototype: `ai-assets/prototype/` (Figma-style HTML screens linking the final SVGs)

## Canonical palette (design tokens)

| token | hex | use |
|---|---|---|
| ink | `#0B0B0D` | app background |
| graphite-1 | `#17181C` | surfaces |
| graphite-2 | `#1E1F24` | raised surfaces |
| bone | `#EDE9E0` | primary text / highlights |
| smoke | `#8A8D93` | secondary text |
| blood | `#C1121F` | single accent (pressed `#8E0E17`) |
| blood-bright | `#E5312D` | rim-light / glow only, never UI fills |
| jade | `#2E9E77` | success + recovery only |

Illustration may bleed into `#A51F2Bâ€“#E03131` reds per art bible; UI chrome never leaves the table above.

## Slot ledger (44 + fonts)

Status legend: `todo` â†’ `wip` â†’ `qa` â†’ `done` (fail â†’ back to `wip`, attempts tracked)

| # | slot | final name | format | canvas | source | status | notes |
|---|---|---|---|---|---|---|---|
| 1 | bg-home | `bg-home.svg` | SVG | 1536Ã—2688 viewbox | author | done | rebuild of ref: moon, pagoda, torii, splatter, 60% empty centre-left, **no figure-tip watermark** |
| 2 | bg-workout | `bg-workout.svg` | SVG | 1536Ã—2688 | author | done | â‰¥85% dark, faint barbell-warrior panel, left kanji strip |
| 3 | bg-subtle | `bg-subtle.svg` | SVG | 1536Ã—2688 | author | done | mole-screentone + one engraved seal ring + ember specks |
| 4 | texture-screentone | `texture-screentone.svg` | SVG tile | 512Ã—512 | author | done | seamless base64-free pattern; dots ~8% density |
| 5 | texture-grunge | `texture-grunge.svg` | SVG tile | 512Ã—512 | author | done | seamless ink-wash feTurbulence composition |
| 6 | hero-figure | `hero-figure.svg` | SVG | 768Ã—1024 | author | done | faceless silhouette w/ wrapped blade, red rim-light (vector rebuild of ref) |
| 7 | manga-eye | `manga-eye.svg` | SVG | 1024Ã—576 | author | done | B/W vector panel: hatch lines, screentone iris, speed slashes |
| 8 | peek-1 | `peek-1.svg` | SVG | 1024Ã—768 | author | done | corner panel: deadly hand grip on wrapped bar |
| 9 | peek-2 | `peek-2.svg` | SVG | 1024Ã—768 | author | done | shadow silhouette variant, bottom-right |
| 10 | torn-edge | `torn-edge.svg` | SVG | 1080Ã—128 | author | done | black torn-paper strip, flip-safe, transparency 100% |
| 11-14 | ink-athletes | `ink-athlete-{squat,bench,deadlift,pulldown}.svg` | SVG | 768Ã—1024 | author | done | 4 anonymous brush-ink poses, one family |
| 15-22 | equipment glyphs | `glyph-equipment-*.svg` | SVG | 256Ã—256 | author | done | barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, cardio |
| 23-25 | mascot | `mascot-{1,2,3}.svg` | SVG | 512Ã—512 | author | done | chibi brush-ink bud (hoodie+headband, not Gojo): thumbs-up / bow / pep |
| 26-31 | worm | `worm-idle-{1..4}.svg`, `worm-tap-{1,2}.svg` | SVG | 256Ã—256 | author | done | 3-segment chibi worm, red topknot; idle wiggle 4f + flinch 2f |
| 32-34 | bubbles | `bubble-{round-l,round-r,shout}.svg` | SVG | 512Ã—384 | author | done | off-white fill, ink border, EMPTY interiors |
| 35 | black-flash-frame | `black-flash-frame.svg` | SVG | 1080Ã—2340 | author | done | radial shockwave + speed lines, clean centre |
| 36 | black-flash-logo | `black-flash-logo.svg` | SVG | 800Ã—240 | author | done | worn stencil lettering (paths, not font-dependent) |
| 37-39 | domain-spread | `domain-spread-{1,2,3}.svg` | SVG | 1080Ã—2340 | author | done | ink-bloom 3 stages + faint seal ring |
| 40 | card-heavenly-bg | `card-heavenly-bg.svg` | SVG | 800Ã—1000 | author | done | torn panel + embossed seal ring, empty centre |
| 41 | wordmark | `wordmark.svg` | SVG | 1200Ã—400 | author | done | brush "Toji" + dry red underline + ãƒˆãƒ¼ã‚¸ accent |
| 42 | icon pair | `icon-bg.svg` + `icon-fg.svg` | SVG | 1024 | author | done | adaptive layers, T-slash mark, safe zone |
| 43 | splash | `splash.svg` | SVG | 2732Ã—2732 | author | done | centre-safe, single red ink slash + seal ring |
| 44 | seal stamps | `seal-{begin,record,vow,broken,success}.svg` | SVG | 256 | author | done | å§‹ / è¨˜éŒ² / ç¸› / broken variant / jade check |
| 45 | domain ring | `domain-ring.svg` | SVG | 512 | author | done | hairline ring w/ brush gap + dash-anim |
| 46 | tally marks | `tally-{1..5}.svg` | SVG | 128 | author | done | brush strokes 1-5 (one family) |
| 47 | dividers | `divider-{slash-s,slash-h}.svg` | SVG | ~1080Ã—96 | author | done | S-cut + torn horizontal |
| 48 | brush button | `brush-btn.svg` | SVG | 480Ã—120 | author | done | stretchable dry-brush fill (nine-slice friendly) |
| 49 | fonts | `bebas.woff2`, `inter-400/600.woff2`, `shippori-mincho-b1.woff2` | woff2 | - | download | done | licenses into `frontend/public/assets/fonts/licenses/` |

NIM fallback candidates for tonight (only if SVG quality insufficient): slots 1,2,3,6 (painterly complexity), 7,8 (illustrative density). Elsewhere not planned.

## Guardrails

- Never read/serve `catalogue/media/` in generation work.
- Any NIM key stays in env / script var, never echoed to logs.
- Wordmark says **Toji** (rename-agnostic is moot â€” user kept rename; it renders from slot so swapping file rebrands freely).
- No character likeness (no Toji face, sunglasses shibuya buddy, JJK logos, series title kanji-like stamping; kanji limited to glossary: é ˜åŸŸå±•é–‹ å¤©ä¸Žå‘ªç¸› ç¸› é»’é–ƒ å‘ªåŠ›:0 ä»»å‹™ è¨“ç·´ è¨˜éŒ² ç„¡é™ å§‹).
- Each SVG â‰¤150 KB goal (bgs) / â‰¤40 KB others; no external refs, no raster-embedded basis except feTurbulence.

## Acceptance gates tonight

- [x] 44 slots ledgered with a status (this file)
- [x] All `todo` → attempted or explicitly deferred w/ NIM probe reason
- [x] Stage A validator + contact sheets pass for shipped count reported
- [x] Prototype screens show ≥6 real assets positioned like the mock, functional buttons/logic freeformed in HTML/CSS
- [x] progress.md + ntfy recap complete before sleep-time window ends

## Final build recap — 2026-11-07 (overnight, autonomous)

**Shipped: 58 SVG assets + 10 font files, validator PASS, manifest emitted, 4-screen prototype live.**

- Actual files shipped = 58 (ledger planned 48 slots; count grew: 4 ink-athletes, 6 worms, 3 mascots, 3 bubbles, 3 domain-spreads, 5 seals, 5 tallies, 8 glyphs, 2 icons, 2 worm-taps etc. — final count supersedes table above).
- All authored SVG vector w/ feTurbulence ink texture; sizes 0.3–9 KB (≤9 KB actual, far inside budget).
- Validator: `ai-assets/scripts/validate_assets.py` → 58/58 parse+, palette-compliant (art bible illustration latitude incl. gradient shades), no embedded raster, no oversize. Manifest: `frontend/public/assets/user/manifest.json`; machine report: `ai-assets/reports/asset-validation.json`.
- Visual QA: `ai-assets/reports/contact-sheet.html` (embedded base64) → renders spot-checked then a full screenshot archived as `reports/contact-sheet-final.png`. Iterations: bg-workout rewritten once (rim-light boosted ×1.5), wordmark/black-flash-logo/icon-{bg,fg}/splash fake-letterforms replaced with system-font text runs, glyph band/cardio/bodyweight redrawn, hero-figure de-horned, mascot-think deduplicated. manga-eye reworked to red-iris panel.
- Prototype: `ai-assets/prototype/index.html` + `tokens.css` — 4 screens (Today, Live session, Stats, Library), 390×844 frames, links the real woff2 fonts + real SVG assets; screenshot archived `reports/prototype-4-screens.png`.
- NIM: endpoint verified but >4 min/queue at night → SVG glidepath per plan; probe scripts kept (`scripts/nim-*.mjs` in TEMP) for fallback later. NIM requests used: ~6 (discovery only).
- Fonts: Bebas Neue 400, Inter 400/500/600/800, Shippori Mincho B1 (JP+Latin 500/700) in `frontend/public/assets/fonts/`, OFL texts in `licenses/`.
- Next: morning review vs mock; final integration pass (`src/components` theme fork: rip refs to `/assets/user/*` + fonts); polish candidates: bg-workout rim visibility at full-bleed, deadlift pose readability, quote-bubble text-fit.

