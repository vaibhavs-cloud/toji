// Toji Manga Art Manifest and Muscle Mapping Engine
export const ASSET_BASE = '/assets/toji'

export const MUSCLE_ART_MAP = {
  legs: `${ASSET_BASE}/ink-squat.webp`,
  chest: `${ASSET_BASE}/ink-bench.webp`,
  back: `${ASSET_BASE}/ink-deadlift.webp`,
  lats: `${ASSET_BASE}/ink-pulldown.webp`,
  arms: `${ASSET_BASE}/ink-arms.webp`,
  shoulders: `${ASSET_BASE}/ink-shoulders.webp`,
  core: `${ASSET_BASE}/ink-core.webp`,
}

export const TOJI_HERO_ART = `${ASSET_BASE}/home-hero-master.webp`
export const MANGA_EYE_ART = `${ASSET_BASE}/manga-eye.webp`
export const GOJO_MASCOT_1 = `${ASSET_BASE}/mascot-1.webp`
export const GOJO_MASCOT_2 = `${ASSET_BASE}/mascot-2.webp`
export const WORM_IDLE_ART = `${ASSET_BASE}/worm-idle.webp`
export const WORM_TAP_ART = `${ASSET_BASE}/worm-tap.webp`
export const BLACK_FLASH_FRAME = `${ASSET_BASE}/black-flash-frame.webp`
export const BLACK_FLASH_LOGO = `${ASSET_BASE}/black-flash-logo.webp`
export const DOMAIN_RING_ART = `${ASSET_BASE}/domain-ring.webp`

/**
 * Maps exercise metadata (bodypart, target muscle, exercise name) to the exact 7 muscle group art
 */
export function getMuscleArt(ex) {
  if (!ex) return MUSCLE_ART_MAP.back

  const bp = String(ex.bp || ex.bodyPart || '').toLowerCase()
  const tg = String(ex.tg || ex.target || '').toLowerCase()
  const name = String(ex.n || ex.name || '').toLowerCase()

  // 1. Lat specific checks (pulldown, pull-up, row with lat focus)
  if (tg.includes('lat') || name.includes('pulldown') || name.includes('pull-up') || name.includes('chin-up') || name.includes('pull up') || name.includes('lat pulldown')) {
    return MUSCLE_ART_MAP.lats
  }

  // 2. Chest (bench, fly, dip, push-up)
  if (bp === 'chest' || tg.includes('pec') || name.includes('bench') || name.includes('chest') || name.includes('push-up') || name.includes('fly')) {
    return MUSCLE_ART_MAP.chest
  }

  // 3. Legs (squat, quad, hamstring, calf, lunge, leg press)
  if (bp === 'upper legs' || bp === 'lower legs' || bp === 'legs' || tg.includes('quad') || tg.includes('glute') || tg.includes('hamstring') || tg.includes('calves') || name.includes('squat') || name.includes('leg') || name.includes('lunge') || name.includes('calf')) {
    return MUSCLE_ART_MAP.legs
  }

  // 4. Arms (biceps, triceps, forearms, curls, extensions)
  if (bp === 'upper arms' || bp === 'lower arms' || bp === 'arms' || tg.includes('bicep') || tg.includes('tricep') || name.includes('curl') || name.includes('tricep') || name.includes('bicep') || name.includes('arm')) {
    return MUSCLE_ART_MAP.arms
  }

  // 5. Shoulders & Neck (overhead press, deltoids, lateral raise)
  if (bp === 'shoulders' || bp === 'neck' || tg.includes('delt') || tg.includes('trap') || name.includes('press') && !name.includes('bench') && !name.includes('leg') || name.includes('shoulder') || name.includes('lateral raise') || name.includes('overhead')) {
    return MUSCLE_ART_MAP.shoulders
  }

  // 6. Core & Waist (abs, planks, leg raises, oblique)
  if (bp === 'waist' || bp === 'core' || tg.includes('ab') || name.includes('crunch') || name.includes('plank') || name.includes('leg raise') || name.includes('core')) {
    return MUSCLE_ART_MAP.core
  }

  // 7. Back default (deadlift, row, back extension)
  if (bp === 'back' || name.includes('deadlift') || name.includes('row')) {
    return MUSCLE_ART_MAP.back
  }

  return MUSCLE_ART_MAP.back
}

/**
 * Wisdom and motivational quotes mapped to muscle groups and JJK lore
 */
export const MUSCLE_QUOTES = {
  legs: [
    { quote: "Keep your core tight, like a sorcerer's barrier.", speaker: "Gojo Satoru" },
    { quote: "If you can't walk tomorrow, then you did it right.", speaker: "Toji Fushiguro" },
    { quote: "Every stride is anchored in absolute physical mastery.", speaker: "Toji Fushiguro" }
  ],
  chest: [
    { quote: "No cursed energy can match pure physical chest drive.", speaker: "Toji Fushiguro" },
    { quote: "A barrier is only as strong as its foundation. Push.", speaker: "Gojo Satoru" },
    { quote: "Drive through the lockout with zero hesitation.", speaker: "Kento Nanami" }
  ],
  back: [
    { quote: "Build a back wide enough to carry the entire Zen'in clan's regret.", speaker: "Toji Fushiguro" },
    { quote: "Engage the lats. Maximum output without hesitation.", speaker: "Kento Nanami" },
    { quote: "Iron erectors. A foundation cursed spirits cannot shake.", speaker: "Toji Fushiguro" }
  ],
  lats: [
    { quote: "Flare the lats. Unleash unconstrained wings of raw strength.", speaker: "Toji Fushiguro" },
    { quote: "Pull with conviction. Infinity yields to true physical force.", speaker: "Gojo Satoru" }
  ],
  arms: [
    { quote: "Pump until the cursed spirit within screams.", speaker: "Aoi Todo" },
    { quote: "Arms crafted by heavenly restriction.", speaker: "Toji Fushiguro" },
    { quote: "True power needs no incantation — only grip.", speaker: "Toji Fushiguro" }
  ],
  shoulders: [
    { quote: "Boulder shoulders to bear the weight of infinity.", speaker: "Gojo Satoru" },
    { quote: "Overhead press: elevate your strength beyond limits.", speaker: "Toji Fushiguro" }
  ],
  core: [
    { quote: "Brace hard. An iron core deflects all incoming curses.", speaker: "Toji Fushiguro" },
    { quote: "Center of balance, absolute control.", speaker: "Gojo Satoru" }
  ],
  pr: [
    { quote: "A spark of black... The boundary between physical limits and divine ascension.", speaker: "Black Flash" },
    { quote: "Pure physical restriction breaks all conventional boundaries.", speaker: "Toji Fushiguro" }
  ],
  default: [
    { quote: "Don't stop. Keep going.", speaker: "Toji Fushiguro" },
    { quote: "Zero cursed energy, all physical — pure raw training.", speaker: "Heavenly Restriction" }
  ]
}

export function getContextualQuote(group = 'default', index = 0) {
  const list = MUSCLE_QUOTES[group] || MUSCLE_QUOTES.default
  return list[index % list.length]
}
