/**
 * AI Gym Partner Tool Layer (Coach Mode & Operator Mode).
 * 
 * Read Tools:
 *   - get_exercise_history({ exId, limit })
 *   - get_recovery_overview()
 *   - summarize_week()
 * 
 * Write/Action Tools (Operator Mode - requires user confirmation):
 *   - log_set({ exId, weight, reps, sec, min, rir, rpe })
 *   - start_rest_timer({ seconds })
 *   - suggest_alternatives({ exId, reason, replace, substituteExId })
 *   - modify_routine({ routineId, name, addExercises, removeExercises })
 * 
 * Strict local-first architecture. All writes execute through validated app APIs in store/useStore.js.
 */
import { exerciseHistory } from './exercise-history.js'
import { fatigueOf, fatiguedMuscles, detrainedMuscles, FATIGUE_STATES } from './recovery.js'
import { fatigueStateOf, fatigueRecoveryMs, fmtRecoveryIn } from './recovery-view.js'
import { MUSCLES } from './muscles.js'
import { EXIDX, CATALOGUE, canonicalExId } from './exercises.js'
import { todayISO, weekStartOf, DAYS } from './format.js'
import { useUI } from '../store/useUI.js'
import { REST_MAX } from './duration.js'

export const READ_TOOLS = ['get_exercise_history', 'get_recovery_overview', 'summarize_week']
export const WRITE_TOOLS = ['log_set', 'start_rest_timer', 'suggest_alternatives', 'modify_routine']

export const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'get_exercise_history',
      description: 'Get performance history, best weight/reps, PRs, and recent sessions for an exercise.',
      parameters: {
        type: 'object',
        properties: {
          exId: { type: 'string', description: 'Exercise ID or name (e.g. "0025", "Bench Press", "Squat")' },
          limit: { type: 'number', description: 'Max number of recent sessions to return (default 5)' }
        },
        required: ['exId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_recovery_overview',
      description: 'Get muscle recovery status across all muscle groups, highlighting fatigued, recovering, and ready muscles with estimated time to full recovery.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'summarize_week',
      description: 'Summarize the current week’s training volume, completed sets, workouts logged, and consistency.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function',
    function: {
      name: 'log_set',
      description: 'Log a completed set into the active workout session. Requires user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          exId: { type: 'string', description: 'Exercise ID or name (optional if active exercise is obvious)' },
          weight: { type: 'number', description: 'Weight lifted in kg or lbs' },
          reps: { type: 'number', description: 'Reps completed' },
          sec: { type: 'number', description: 'Hold time in seconds for timed holds' },
          rir: { type: 'number', description: 'Reps in reserve (0 to 5)' },
          rpe: { type: 'number', description: 'Rating of perceived exertion (6 to 10)' }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'start_rest_timer',
      description: 'Start the rest timer countdown between sets. Requires user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          seconds: { type: 'number', description: 'Rest time in seconds (e.g. 60, 90, 120, 180)' }
        },
        required: ['seconds']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'suggest_alternatives',
      description: 'Find biomechanical alternative exercises targeting the same primary muscles. Optionally swaps in active workout.',
      parameters: {
        type: 'object',
        properties: {
          exId: { type: 'string', description: 'Exercise ID or name to substitute' },
          reason: { type: 'string', description: 'Reason for alternative (e.g. "equipment busy", "shoulder pain")' },
          replace: { type: 'boolean', description: 'Whether to replace this exercise in current session' },
          substituteExId: { type: 'string', description: 'Chosen replacement exercise ID' }
        },
        required: ['exId']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'modify_routine',
      description: 'Modify a workout routine: rename, add exercises, or remove exercises. Requires user confirmation.',
      parameters: {
        type: 'object',
        properties: {
          routineId: { type: 'string', description: 'Routine ID or name to modify' },
          name: { type: 'string', description: 'New routine name' },
          addExercises: { type: 'array', items: { type: 'string' }, description: 'Exercise IDs to add' },
          removeExercises: { type: 'array', items: { type: 'string' }, description: 'Exercise IDs to remove' }
        },
        required: ['routineId']
      }
    }
  }
]

/** Find exercise in CATALOGUE / EXIDX by ID or fuzzy name */
export function findExercise(query) {
  if (!query) return null
  const q = String(query).trim()
  const canon = canonicalExId(q)
  if (EXIDX[canon]) return EXIDX[canon]
  if (EXIDX[q]) return EXIDX[q]

  const lower = q.toLowerCase()
  // Exact name match
  const exact = CATALOGUE.find(e => (e.name || '').toLowerCase() === lower)
  if (exact) return exact

  // Starts with match
  const starts = CATALOGUE.find(e => (e.name || '').toLowerCase().startsWith(lower))
  if (starts) return starts

  // Includes match
  const includes = CATALOGUE.find(e => (e.name || '').toLowerCase().includes(lower))
  return includes || null
}

/* ==================== READ TOOLS ==================== */

export function executeGetExerciseHistory(S, { exId, limit = 5 } = {}) {
  const ex = findExercise(exId)
  if (!ex) {
    return { ok: false, error: `Exercise not found: "${exId}"` }
  }

  const hist = exerciseHistory(S, ex.id, { limit })
  const formattedSessions = (hist.sessions || []).map(s => ({
    date: s.d,
    mode: s.mode,
    bestValue: s.value,
    pr: !!s.pr,
    volume: s.volume,
    sets: (s.sets || []).map(r => ({
      weight: r.weight,
      reps: r.reps,
      sec: r.sec,
      done: !!r.done,
      rir: r.rir,
      rpe: r.rpe
    }))
  }))

  const summary = hist.total > 0
    ? `${ex.name}: ${hist.total} sessions logged. All-time best: ${hist.best} ${hist.metric === 'weight' ? S?.unit || 'kg' : hist.metric}. Last session: ${formattedSessions[0]?.date || 'N/A'}.`
    : `${ex.name}: No previous completed sessions logged yet.`

  return {
    ok: true,
    exId: ex.id,
    name: ex.name,
    metric: hist.metric,
    best: hist.best,
    prId: hist.prId,
    totalSessions: hist.total,
    sessions: formattedSessions,
    summary
  }
}

export function executeGetRecoveryOverview(S) {
  const workouts = Array.isArray(S?.workouts) ? S.workouts : []
  const now = Date.now()
  const fatigueMap = fatigueOf(workouts, now)
  const fatigued = fatiguedMuscles(workouts, now)
  const detrained = detrainedMuscles(workouts, now)

  const states = {
    [FATIGUE_STATES.READY]: [],
    [FATIGUE_STATES.RECOVERING]: [],
    [FATIGUE_STATES.FATIGUED]: []
  }

  for (const muscle of MUSCLES) {
    const val = fatigueMap[muscle.slug] || 0
    const state = fatigueStateOf(val)
    const rec = fatigueRecoveryMs(val, muscle.slug)
    const timeToReady = rec.toReadyMs != null ? fmtRecoveryIn(rec.toReadyMs) : null

    states[state].push({
      slug: muscle.slug,
      name: muscle.name,
      fatigue: Math.round(val * 100) / 100,
      timeToReady
    })
  }

  const lines = []
  if (states[FATIGUE_STATES.FATIGUED].length) {
    const list = states[FATIGUE_STATES.FATIGUED].map(m => `${m.name} (${m.timeToReady || 'soon'})`).join(', ')
    lines.push(`Fatigued: ${list}`)
  }
  if (states[FATIGUE_STATES.RECOVERING].length) {
    const list = states[FATIGUE_STATES.RECOVERING].map(m => m.name).join(', ')
    lines.push(`Recovering: ${list}`)
  }
  const readyCount = states[FATIGUE_STATES.READY].length
  lines.push(`${readyCount} muscle group${readyCount === 1 ? '' : 's'} fully ready.`)
  if (detrained.length) {
    lines.push(`Untrained/detrained: ${detrained.slice(0, 4).join(', ')}`)
  }

  return {
    ok: true,
    ready: states[FATIGUE_STATES.READY],
    recovering: states[FATIGUE_STATES.RECOVERING],
    fatigued: states[FATIGUE_STATES.FATIGUED],
    detrained,
    summary: lines.join('\n')
  }
}

export function executeSummarizeWeek(S) {
  const workouts = Array.isArray(S?.workouts) ? S.workouts : []
  const today = todayISO()
  const startDay = S?.weekStart ?? 1
  const weekStart = weekStartOf(today, startDay)

  const thisWeek = workouts.filter(w => w?.d && w.d >= weekStart && w.d <= today)
  let totalSets = 0
  let totalVolume = 0
  const exercisesSeen = new Set()
  const routinesDone = new Set()

  thisWeek.forEach(w => {
    if (w.routineName) routinesDone.add(w.routineName)
    ;(w.entries || []).forEach(en => {
      if (en.id) exercisesSeen.add(en.id)
      ;(en.sets || []).forEach(s => {
        if (s.done) {
          totalSets++
          const wgt = Number(s.weight) || 0
          const reps = Number(s.reps) || 0
          totalVolume += wgt * reps
        }
      })
    })
  })

  // Scheduled routines in S.week
  const scheduledDays = Object.entries(S?.week || {})
    .filter(([_, rids]) => Array.isArray(rids) ? rids.length : !!rids)
    .length

  const summary = `Week of ${weekStart}: ${thisWeek.length} workout${thisWeek.length === 1 ? '' : 's'} completed (${totalSets} total sets, ${Math.round(totalVolume)} ${S?.unit || 'kg'} volume tonnage, ${exercisesSeen.size} unique exercises). Scheduled frequency: ${scheduledDays} days/week.`

  return {
    ok: true,
    weekStart,
    workoutsCount: thisWeek.length,
    totalSets,
    totalVolumeTonnage: Math.round(totalVolume),
    uniqueExercises: exercisesSeen.size,
    scheduledDays,
    routinesDone: Array.from(routinesDone),
    summary
  }
}

/* ==================== WRITE / ACTION TOOLS (OPERATOR MODE) ==================== */

/**
 * Creates an Operator Mode Proposal for write actions.
 * Never executes without user confirmation!
 */
export function buildActionProposal(toolName, args, S) {
  switch (toolName) {
    case 'log_set': {
      const ex = findExercise(args.exId) || (S?.active?.entries?.[S.active.cur] ? EXIDX[S.active.entries[S.active.cur].id] : null)
      const exName = ex?.name || args.exId || 'Active exercise'
      const weightStr = args.weight != null ? `${args.weight} ${S?.unit || 'kg'}` : ''
      const repsStr = args.reps != null ? `${args.reps} reps` : ''
      const secStr = args.sec != null ? `${args.sec}s` : ''
      const desc = [weightStr, repsStr, secStr].filter(Boolean).join(' × ') || 'Completed set'

      return {
        id: 'prop_' + Math.random().toString(36).slice(2, 8),
        tool: 'log_set',
        title: `Log Set: ${exName}`,
        details: desc + (args.rir != null ? ` (RIR: ${args.rir})` : args.rpe != null ? ` (RPE: ${args.rpe})` : ''),
        args: { ...args, exId: ex?.id || args.exId }
      }
    }

    case 'start_rest_timer': {
      const sec = Math.min(REST_MAX, Math.max(5, Math.round(Number(args.seconds) || 90)))
      const mins = Math.floor(sec / 60)
      const rem = sec % 60
      const formatted = mins > 0 ? `${mins}m${rem ? ` ${rem}s` : ''}` : `${sec}s`

      return {
        id: 'prop_' + Math.random().toString(36).slice(2, 8),
        tool: 'start_rest_timer',
        title: `Start Rest Timer`,
        details: `${formatted} (${sec} seconds)`,
        args: { seconds: sec }
      }
    }

    case 'suggest_alternatives': {
      const ex = findExercise(args.exId)
      if (!ex) return null
      const alts = getExerciseAlternatives(ex.id)
      const topAlts = alts.slice(0, 3)

      return {
        id: 'prop_' + Math.random().toString(36).slice(2, 8),
        tool: 'suggest_alternatives',
        title: `Alternatives for ${ex.name}`,
        details: topAlts.map(a => a.name).join(', '),
        alternatives: topAlts,
        args: { ...args, exId: ex.id }
      }
    }

    case 'modify_routine': {
      const routine = (S?.routines || []).find(r => r.id === args.routineId || (r.name || '').toLowerCase() === (args.routineId || '').toLowerCase())
      const title = routine ? `Modify Routine: ${routine.name}` : `Modify Routine`
      const details = []
      if (args.name) details.push(`Rename to "${args.name}"`)
      if (args.addExercises?.length) details.push(`Add ${args.addExercises.length} exercise(s)`)
      if (args.removeExercises?.length) details.push(`Remove ${args.removeExercises.length} exercise(s)`)

      return {
        id: 'prop_' + Math.random().toString(36).slice(2, 8),
        tool: 'modify_routine',
        title,
        details: details.join('; ') || 'Routine updates',
        args: { ...args, routineId: routine?.id || args.routineId }
      }
    }

    default:
      return null
  }
}

/** Get biomechanical alternatives from CATALOGUE sharing muscle groups */
export function getExerciseAlternatives(exId) {
  const current = findExercise(exId)
  if (!current) return []
  const primaries = new Set(Array.isArray(current.primaries) ? current.primaries : current.target ? [current.target] : [])

  return CATALOGUE.filter(e => {
    if (e.id === current.id) return false
    const matchTarget = e.target && primaries.has(e.target)
    const matchPrimaries = Array.isArray(e.primaries) && e.primaries.some(p => primaries.has(p))
    return matchTarget || matchPrimaries
  }).slice(0, 6)
}

/**
 * Execute validated write action into app store.
 * Only called after explicit user confirmation!
 */
export function executeWriteAction(proposal, updateStore) {
  const { tool, args } = proposal
  if (!tool || !args) return { ok: false, error: 'Invalid proposal' }

  switch (tool) {
    case 'log_set': {
      let logged = false
      updateStore(s => {
        if (!s.active) {
          // If no active session, cannot log without workout
          return
        }
        const entries = s.active.entries || []
        let entryIdx = args.exId ? entries.findIndex(e => e.id === args.exId) : s.active.cur
        if (entryIdx < 0 && entries.length) entryIdx = s.active.cur || 0
        if (entryIdx < 0) return

        const entry = entries[entryIdx]
        if (!entry) return
        entry.sets = entry.sets || []

        // Find first open set
        let set = entry.sets.find(r => !r.done)
        if (!set) {
          // Add new set row
          const lastSet = entry.sets[entry.sets.length - 1] || {}
          set = { ...lastSet, done: false }
          entry.sets.push(set)
        }

        if (args.weight != null) {
          set.weight = Number(args.weight)
          set.w = Number(args.weight)
        }
        if (args.reps != null) {
          set.reps = Number(args.reps)
          set.r = Number(args.reps)
        }
        if (args.sec != null) set.sec = Number(args.sec)
        if (args.rir != null) set.rir = Number(args.rir)
        if (args.rpe != null) set.rpe = Number(args.rpe)
        set.done = true
        logged = true
      })

      return logged
        ? { ok: true, message: `Logged set on ${proposal.title}` }
        : { ok: false, error: 'No active workout in progress to log set.' }
    }

    case 'start_rest_timer': {
      const sec = Math.min(REST_MAX, Math.max(5, Math.round(Number(args.seconds) || 90)))
      useUI.getState().startRest(sec)
      return { ok: true, message: `Rest timer started for ${sec}s.` }
    }

    case 'suggest_alternatives': {
      if (args.replace && args.substituteExId) {
        let swapped = false
        updateStore(s => {
          if (!s.active || !s.active.entries) return
          const idx = s.active.entries.findIndex(e => e.id === args.exId)
          if (idx >= 0) {
            s.active.entries[idx].id = args.substituteExId
            swapped = true
          }
        })
        return { ok: true, message: swapped ? 'Substituted exercise in active session.' : 'Exercise replaced.' }
      }
      return { ok: true, message: 'Alternatives suggested.' }
    }

    case 'modify_routine': {
      let modified = false
      updateStore(s => {
        const routine = (s.routines || []).find(r => r.id === args.routineId)
        if (!routine) return
        if (args.name && typeof args.name === 'string') {
          routine.name = args.name.trim()
        }
        if (Array.isArray(args.removeExercises) && args.removeExercises.length) {
          const rm = new Set(args.removeExercises)
          routine.ex = (routine.ex || []).filter(e => !rm.has(e.id))
        }
        if (Array.isArray(args.addExercises) && args.addExercises.length) {
          routine.ex = routine.ex || []
          for (const exId of args.addExercises) {
            const ex = findExercise(exId)
            if (ex && !routine.ex.some(e => e.id === ex.id)) {
              routine.ex.push({ id: ex.id, sets: 3, reps: 10, weight: 0 })
            }
          }
        }
        modified = true
      })
      return modified
        ? { ok: true, message: `Routine modified successfully.` }
        : { ok: false, error: 'Routine not found.' }
    }

    default:
      return { ok: false, error: `Unknown tool: ${tool}` }
  }
}

/**
 * Natural language intent parser for quick operator commands.
 * Handles common user commands without requiring full LLM turnaround when offline or fast.
 */
export function parseOperatorIntent(text, S) {
  if (!text || typeof text !== 'string') return null
  const t = text.trim().toLowerCase()

  // 1. Rest timer intent
  const restMatch = t.match(/^(?:start\s+)?rest(?:\s+timer)?(?:\s+(?:for\s+)?(\d+)\s*(s|sec|seconds|m|min|minutes)?)?$/i) ||
                    t.match(/^rest\s+(\d+)\s*(s|sec|seconds|m|min|minutes)?$/i)
  if (restMatch) {
    let num = parseInt(restMatch[1], 10)
    const unit = restMatch[2]
    if (isNaN(num)) num = 90
    if (unit && unit.startsWith('m')) num = num * 60
    return {
      type: 'write',
      tool: 'start_rest_timer',
      args: { seconds: num }
    }
  }

  // 2. Recovery overview intent
  if (t === 'recovery' || t.includes('how is my recovery') || t.includes('recovery status') || t.includes('am i recovered')) {
    return {
      type: 'read',
      tool: 'get_recovery_overview',
      args: {}
    }
  }

  // 3. Week summary intent
  if (t === 'week' || t.includes('summarize week') || t.includes('weekly volume') || t.includes('how was my week') || t.includes('summary of the week')) {
    return {
      type: 'read',
      tool: 'summarize_week',
      args: {}
    }
  }

  // 4. Log set intent: e.g. "log set 80kg 8 reps", "log 100 kg 5 reps", "log set 10 reps"
  const logMatch = t.match(/^log(?:\s+set)?(?:\s+(\d+(?:\.\d+)?)\s*(?:kg|lbs?))?(?:\s+(\d+)\s*reps?)?(?:\s+(?:on|for)\s+(.+))?$/i)
  if (logMatch && (logMatch[1] || logMatch[2])) {
    const weight = logMatch[1] ? parseFloat(logMatch[1]) : undefined
    const reps = logMatch[2] ? parseInt(logMatch[2], 10) : undefined
    const exQuery = logMatch[3]?.trim()
    const ex = exQuery ? findExercise(exQuery) : null

    return {
      type: 'write',
      tool: 'log_set',
      args: {
        exId: ex?.id,
        weight,
        reps
      }
    }
  }

  // 5. Alternatives intent: e.g. "alternatives for bench press"
  const altMatch = t.match(/^(?:suggest\s+)?alternatives?\s+(?:for|to)\s+(.+)$/i)
  if (altMatch) {
    const exQuery = altMatch[1].trim()
    const ex = findExercise(exQuery)
    if (ex) {
      return {
        type: 'write',
        tool: 'suggest_alternatives',
        args: { exId: ex.id }
      }
    }
  }

  // 6. History intent: e.g. "history for squat", "squat pr", "bench press history"
  const histMatch = t.match(/^(?:exercise\s+)?history\s+(?:for\s+)?(.+)$/i) || t.match(/^(.+)\s+(?:pr|history|record)$/i)
  if (histMatch) {
    const exQuery = (histMatch[1] || '').replace(/\b(pr|history|record)\b/gi, '').trim()
    const ex = findExercise(exQuery)
    if (ex) {
      return {
        type: 'read',
        tool: 'get_exercise_history',
        args: { exId: ex.id }
      }
    }
  }

  return null
}
