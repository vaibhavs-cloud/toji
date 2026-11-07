================================================================================
openGym "Backgrounds & Textures" Production UI Suite (Board 1)
================================================================================

Strictly compliant with:
1. ZERO CHARACTER ART: No human figures, faces, or JJK likenesses.
2. STRICT COLOR PALETTE: Deep ink black (#050505 to #0D0D0D), deep blood red
   (#8B0000 / #C41E3A), dark charcoal (#1A1A1A to #262626), off-white accents.
3. WCAG AA GYM CONTRAST: Background luminance < 35/255; text area protected.
4. ANTI-HALO DE-FRINGED ALPHA: Zero white/light grey outline artifacts.
5. 100% SEAMLESS TILES: Screentone and grunge wrap with 0.0px boundary seam.

--------------------------------------------------------------------------------
ASSET MANIFEST & SPECIFICATIONS
--------------------------------------------------------------------------------
1. bg-home.png
   - Dimensions: 1536 × 2688 px (9:16 Portrait)
   - Format: 32-bit PNG (Opaque #070707)
   - Visual: Top-third atmospheric blood-red moon with dark pagoda silhouette
     emerging from mist; lower two-thirds clean, calm near-black space.

2. bg-workout.png
   - Dimensions: 1536 × 2688 px (9:16 Portrait)
   - Format: 32-bit PNG (Opaque #050505)
   - Visual: Calm, distraction-free active session background. Subtle upper
     zen brush strokes, faint pagoda at base. Zero figures in central 60% viewport.

3. bg-subtle.png
   - Dimensions: 1536 × 2688 px (9:16 Portrait)
   - Format: 32-bit PNG (Opaque #080808)
   - Visual: Universal dark background with subtle hairline circular domain ring
     in charcoal/dark red with soft ambient radial falloff.

4. manga-ink-bg.png
   - Dimensions: 1536 × 2688 px (9:16 Portrait)
   - Format: 32-bit PNG (Opaque #060606)
   - Visual: High-energy PR backdrop with sumi-e wash & slash splatters in
     dark charcoal and deep blood red (#8B0000). Max luminance <= 51/255.

5. red-moon.png
   - Dimensions: 1024 × 1024 px (1:1 Square)
   - Format: 32-bit PNG (100% True RGBA Alpha)
   - Visual: Blood-red textured moon with dark ink craters, anti-aliased edge
     transitioning to deep red fringe (zero white halo).

6. temple-silhouette.png
   - Dimensions: 1024 × 1024 px (1:1 Square)
   - Format: 32-bit PNG (100% True RGBA Alpha)
   - Visual: Isolated traditional pagoda silhouette in solid ink-black/charcoal
     (#0A0A0A) with subtle blood-red rim accent and glowing red windows.

7. torii-gate.png
   - Dimensions: 1024 × 1024 px (1:1 Square)
   - Format: 32-bit PNG (100% True RGBA Alpha)
   - Visual: Isolated Shinto Torii gate with hanging lanterns in deep charcoal
     (#111111) and crimson accents, completely de-fringed.

8. cloud-ink.png
   - Dimensions: 1536 × 512 px (3:1 Panoramic Banner)
   - Format: 32-bit PNG (100% True RGBA Alpha)
   - Visual: Horizontal sumi-e ink wash banner of dark smoke/ink clouds with
     blood-red edge splatters and vertical linear boundary fading.

9. texture-screentone.png
   - Dimensions: 512 × 512 px (1:1 Seamless Tile)
   - Format: 32-bit PNG (RGBA)
   - Tileability: 100% SEAMLESSLY WRAPPABLE (X & Y seam diff = 0.0px).
   - Visual: Classic 45-degree manga screentone / halftone dot matrix.

10. texture-grunge.png
   - Dimensions: 512 × 512 px (1:1 Seamless Tile)
   - Format: 32-bit PNG (RGBA)
   - Tileability: 100% SEAMLESSLY WRAPPABLE (X & Y seam diff = 0.0px).
   - Visual: Distressed comic book ink grunge, paper grain, and scratches.

--------------------------------------------------------------------------------
DIRECTORY STRUCTURE
--------------------------------------------------------------------------------
- / (Root)            : Primary 32-bit RGBA production PNGs
- /png8_optimized     : Compact PNG-8 versions for bandwidth-constrained mobile apps
- /webp               : Modern high-performance WebP versions
- README.txt          : Technical documentation & manifest
================================================================================
