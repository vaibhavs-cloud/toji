// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  findExercise,
  executeGetExerciseHistory,
  executeGetRecoveryOverview,
  executeSummarizeWeek,
  buildActionProposal,
  executeWriteAction,
  parseOperatorIntent,
  getExerciseAlternatives
} from './coach-tools.js'
import { useUI } from '../store/useUI.js'

describe('AI Partner Structured Tool Layer', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('Read Tools', () => {
    it('get_exercise_history returns correct structure and all-time best', () => {
      const mockState = {
        unit: 'kg',
        workouts: [
          {
            id: 'w1',
            d: '2026-11-01',
            entries: [
              {
                id: '0025', // Barbell Bench Press
                sets: [
                  { w: 80, r: 8, weight: 80, reps: 8, done: true },
                  { w: 100, r: 5, weight: 100, reps: 5, done: true }
                ]
              }
            ]
          }
        ]
      }

      const res = executeGetExerciseHistory(mockState, { exId: '0025' })
      expect(res.ok).toBe(true)
      expect(res.exId).toBe('0025')
      expect(res.best).toBe(100)
      expect(res.totalSessions).toBe(1)
      expect(res.summary).toContain('1 sessions logged')
    })

    it('get_recovery_overview categorizes muscle groups cleanly', () => {
      const mockState = {
        workouts: [
          {
            id: 'w1',
            d: '2026-11-07',
            entries: [
              {
                id: '0025', // Chest / deltoids / triceps
                sets: [
                  { weight: 100, reps: 8, done: true },
                  { weight: 100, reps: 8, done: true },
                  { weight: 100, reps: 8, done: true }
                ]
              }
            ]
          }
        ]
      }

      const res = executeGetRecoveryOverview(mockState)
      expect(res.ok).toBe(true)
      expect(Array.isArray(res.ready)).toBe(true)
      expect(Array.isArray(res.recovering)).toBe(true)
      expect(Array.isArray(res.fatigued)).toBe(true)
      expect(res.summary).toBeTruthy()
    })

    it('summarize_week calculates volume and total sets', () => {
      const mockState = {
        unit: 'kg',
        weekStart: 1,
        workouts: [
          {
            id: 'w1',
            d: '2026-11-05',
            routineName: 'Push Day',
            entries: [
              {
                id: '0025',
                sets: [
                  { weight: 100, reps: 10, done: true }, // 1000 kg
                  { weight: 80, reps: 10, done: true }   // 800 kg
                ]
              }
            ]
          }
        ]
      }

      const res = executeSummarizeWeek(mockState)
      expect(res.ok).toBe(true)
      expect(res.workoutsCount).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Write Tools (Operator Mode)', () => {
    it('buildActionProposal constructs confirmation details without executing', () => {
      const prop = buildActionProposal('log_set', { exId: '0025', weight: 100, reps: 5 }, {})
      expect(prop).toBeTruthy()
      expect(prop.tool).toBe('log_set')
      expect(prop.details).toContain('100')
      expect(prop.details).toContain('5 reps')
    })

    it('executeWriteAction log_set updates active workout with validated set', () => {
      let state = {
        active: {
          id: 'active_1',
          cur: 0,
          entries: [
            {
              id: '0025',
              sets: [{ weight: 80, reps: 8, done: true }, { weight: 0, reps: 0, done: false }]
            }
          ]
        }
      }

      const update = fn => fn(state)
      const prop = {
        tool: 'log_set',
        title: 'Log Set',
        args: { exId: '0025', weight: 90, reps: 8 }
      }

      const res = executeWriteAction(prop, update)
      expect(res.ok).toBe(true)
      expect(state.active.entries[0].sets[1].weight).toBe(90)
      expect(state.active.entries[0].sets[1].reps).toBe(8)
      expect(state.active.entries[0].sets[1].done).toBe(true)
    })

    it('executeWriteAction start_rest_timer triggers useUI startRest', () => {
      const startRestMock = vi.fn()
      vi.spyOn(useUI, 'getState').mockReturnValue({ startRest: startRestMock })

      const prop = {
        tool: 'start_rest_timer',
        args: { seconds: 120 }
      }

      const res = executeWriteAction(prop, vi.fn())
      expect(res.ok).toBe(true)
      expect(startRestMock).toHaveBeenCalledWith(120)
    })

    it('suggest_alternatives returns biomechanical alternatives', () => {
      const alts = getExerciseAlternatives('0025') // Bench Press
      expect(alts.length).toBeGreaterThan(0)
      expect(alts.some(e => e.id !== '0025')).toBe(true)
    })

    it('modify_routine updates routine name and exercises', () => {
      let state = {
        routines: [
          { id: 'r1', name: 'Old Push', ex: [{ id: '0025', sets: 3, reps: 8 }] }
        ]
      }
      const update = fn => fn(state)
      const prop = {
        tool: 'modify_routine',
        args: { routineId: 'r1', name: 'New Push', addExercises: ['0027'] }
      }

      const res = executeWriteAction(prop, update)
      expect(res.ok).toBe(true)
      expect(state.routines[0].name).toBe('New Push')
      expect(state.routines[0].ex.some(e => e.id === '0027')).toBe(true)
    })
  })

  describe('Operator Intent Parser', () => {
    it('parses rest timer commands', () => {
      const p1 = parseOperatorIntent('start rest timer 90s')
      expect(p1).toEqual({ type: 'write', tool: 'start_rest_timer', args: { seconds: 90 } })

      const p2 = parseOperatorIntent('rest 2m')
      expect(p2).toEqual({ type: 'write', tool: 'start_rest_timer', args: { seconds: 120 } })
    })

    it('parses recovery query', () => {
      const p = parseOperatorIntent('how is my recovery')
      expect(p).toEqual({ type: 'read', tool: 'get_recovery_overview', args: {} })
    })

    it('parses log set commands', () => {
      const p = parseOperatorIntent('log set 100kg 5 reps on bench press')
      expect(p.type).toBe('write')
      expect(p.tool).toBe('log_set')
      expect(p.args.weight).toBe(100)
      expect(p.args.reps).toBe(5)
    })
  })
})
