import { describe, expect, it } from 'vitest'
import { volumeDecay7d, undertrainedMuscles, recoverySummary, MIN_EFFECTIVE_SETS_7D } from './recovery.js'

describe('volumeDecay7d heuristics', () => {
  const now = new Date('2026-11-07T12:00:00Z').getTime()
  const dayMs = 86400000

  it('marks all muscles as untrained when there is no workout history', () => {
    const vol = volumeDecay7d([], now)
    expect(vol.chest.sets).toBe(0)
    expect(vol.chest.decayedSets).toBe(0)
    expect(vol.chest.undertrained).toBe(true)
    expect(vol.chest.status).toBe('untrained')
    expect(vol.chest.warning).toBe('No logged sets')
  })

  it('calculates 7-day volume and decay accurately for completed sets', () => {
    // Workout 2 days ago: bench press (chest primary 1.0, triceps secondary 0.4) 3 sets
    // 0025 is Barbell Bench Press in catalogue
    const workouts = [
      {
        d: '2026-11-05',
        start: now - 2 * dayMs,
        entries: [
          {
            id: '0025',
            sets: [
              { done: true, w: 80, r: 8 },
              { done: true, w: 80, r: 8 },
              { done: true, w: 80, r: 8 },
              { done: false, w: 80, r: 8 }, // unfinished set must not count
            ],
          },
        ],
      },
    ]

    const vol = volumeDecay7d(workouts, now)
    // 3 done sets: chest gets 3 * 1.0 = 3
    expect(vol.chest.sets).toBe(3)
    // 2 days ago in a 7-day window has decay factor = 1 - 2/7 ≈ 0.714
    // decayedSets = 3 * (5/7) ≈ 2.1
    expect(vol.chest.decayedSets).toBeGreaterThan(1.8)
    expect(vol.chest.decayedSets).toBeLessThan(2.5)
    expect(vol.chest.undertrained).toBe(true) // 3 sets is < MIN_EFFECTIVE_SETS_7D (4)
    expect(vol.chest.status).toBe('undertrained')
    expect(vol.chest.daysSinceLast).toBe(2)
  })

  it('marks a muscle optimal when meeting or exceeding the minimum effective volume', () => {
    // 5 sets of bench press yesterday
    const workouts = [
      {
        d: '2026-11-06',
        start: now - 1 * dayMs,
        entries: [
          {
            id: '0025',
            sets: [
              { done: true, w: 80, r: 8 },
              { done: true, w: 80, r: 8 },
              { done: true, w: 80, r: 8 },
              { done: true, w: 80, r: 8 },
              { done: true, w: 80, r: 8 },
            ],
          },
        ],
      },
    ]

    const vol = volumeDecay7d(workouts, now)
    expect(vol.chest.sets).toBe(5)
    expect(vol.chest.undertrained).toBe(false)
    expect(vol.chest.warning).toBeNull()
  })

  it('ignores workouts older than the 7-day window for volume while tracking lastTrained', () => {
    const workouts = [
      {
        d: '2026-10-25',
        start: now - 13 * dayMs,
        entries: [
          {
            id: '0025',
            sets: [{ done: true, w: 100, r: 5 }, { done: true, w: 100, r: 5 }],
          },
        ],
      },
    ]

    const vol = volumeDecay7d(workouts, now)
    expect(vol.chest.sets).toBe(0)
    expect(vol.chest.decayedSets).toBe(0)
    expect(vol.chest.undertrained).toBe(true)
    expect(vol.chest.daysSinceLast).toBe(13)
    expect(vol.chest.warning).toContain('13d ago')
  })
})

describe('undertrainedMuscles and recoverySummary', () => {
  const now = new Date('2026-11-07T12:00:00Z').getTime()
  const dayMs = 86400000

  it('lists undertrained muscles and generates honest recovery summary', () => {
    // Workout with only bench press (6 sets)
    const workouts = [
      {
        d: '2026-11-04',
        start: now - 3 * dayMs,
        entries: [
          {
            id: '0025',
            sets: Array.from({ length: 6 }, () => ({ done: true, w: 80, r: 8 })),
          },
        ],
      },
    ]

    const undertrained = undertrainedMuscles(workouts, now)
    expect(undertrained.length).toBeGreaterThan(0)
    // Chest has 6 sets, so chest is NOT undertrained
    expect(undertrained.some(m => m.slug === 'chest')).toBe(false)
    // Quads has 0 sets, so quads IS undertrained
    expect(undertrained.some(m => m.slug === 'quadriceps')).toBe(true)

    const summary = recoverySummary(workouts, now)
    expect(summary.undertrainedCount).toBe(undertrained.length)
    expect(summary.disclaimer).toContain('Not medical advice')
    expect(summary.volumeByMuscle.chest.sets).toBe(6)
  })
})
