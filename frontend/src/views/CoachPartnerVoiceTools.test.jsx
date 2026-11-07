// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import CoachChat from './CoachChat.jsx'
import { HTTP_PROVIDERS } from '../../../api/coach/core/providers.js'
import { CONSENT_VERSION } from '../lib/coach.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => {
  const state = {
    toast: vi.fn(),
    openSheet: vi.fn(),
    nav: vi.fn(),
    refresh: vi.fn(),
    startRest: vi.fn(),
    S: null,
    user: { id: 'u1' },
    config: { coach: { enabled: true } },
    coachLocal: { mode: 'byok', provider: 'nvidia', model: 'meta/llama-3.1-70b-instruct' },
    ready: true,
    pending: null,
    job: null
  }
  state.storeSnapshot = () => ({
    user: state.user,
    config: state.config,
    coachLocal: state.coachLocal,
    ready: state.ready,
    S: state.S,
    update: mut => mut(state.S)
  })
  state.uiSnapshot = () => ({
    toast: state.toast,
    openSheet: state.openSheet,
    startRest: state.startRest
  })
  return state
})

vi.mock('../store/useStore.js', () => {
  const useStore = selector => selector(mocks.storeSnapshot())
  useStore.getState = mocks.storeSnapshot
  return { useStore }
})

vi.mock('../store/useUI.js', () => {
  const useUI = selector => (selector ? selector(mocks.uiSnapshot()) : mocks.uiSnapshot())
  useUI.getState = mocks.uiSnapshot
  return { useUI }
})

vi.mock('react-router-dom', () => ({ useNavigate: () => mocks.nav }))

vi.mock('../lib/use-coach-gate.js', () => ({
  useCoachGate: () => ({ ok: true, known: true })
}))

vi.mock('../lib/coach-api.js', () => ({
  useCoachStatus: () => ({
    pending: mocks.pending,
    job: mocks.job,
    cap: { limit: 10, used: 2 },
    loading: false,
    lastError: null,
    last: null,
    refresh: mocks.refresh,
    maxMessageLen: 1000
  }),
  resolvePending: vi.fn(() => Promise.resolve({})),
  refinePlan: vi.fn(() => Promise.resolve({})),
  requestReview: vi.fn(() => Promise.resolve({})),
  requestDebrief: vi.fn(() => Promise.resolve({})),
  requestPlan: vi.fn(() => Promise.resolve({})),
  askCoach: vi.fn(() => Promise.resolve({})),
  cohortStats: vi.fn(() => Promise.resolve({ ok: false, enabled: true, sharing: false })),
  setCohortShare: vi.fn(() => Promise.resolve({ ok: true, sharing: true })),
  JOB_ERRORS: { internal: 'x' },
  ensureAiConsent: vi.fn(() => Promise.resolve(true)),
  isDeclined: e => e?.code === 'declined',
  awaitedJob: () => null,
  settleAwaited: vi.fn()
}))

vi.mock('../sheets.jsx', () => ({ startFlow: vi.fn(), confirmSheet: vi.fn() }))
vi.mock('../coach.css', () => ({}))

function defaultState() {
  return {
    unit: 'kg',
    lang: 'en',
    customEx: [],
    workouts: [],
    bodyweight: [],
    exWeights: {},
    dayPlan: {},
    routines: [{ id: 'r1', name: 'Chest Day', ex: [{ id: '0025', sets: 3, reps: 8 }] }],
    week: {},
    active: {
      id: 'act1',
      cur: 0,
      entries: [
        { id: '0025', sets: [{ w: 100, r: 8, done: true }, { w: 100, r: 8, done: false }] }
      ]
    },
    coach: {
      consent: { agreedAt: '2026-07-01T00:00:00Z', version: CONSENT_VERSION },
      profile: { goal: 'muscle', experience: 'new', daysPerWeek: 3, sessionMin: 60, preferredDays: [1, 3, 5], equipment: [] },
      log: [],
      snapshots: [],
      chat: [{ id: 'c1', role: 'user', kind: 'intake', at: 1 }],
      timings: []
    }
  }
}

function type(el, value) {
  Object.getOwnPropertyDescriptor(el.constructor.prototype, 'value').set.call(el, value)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

let host, root

const mount = () => act(() => { root.render(<CoachChat />) })

beforeEach(() => {
  vi.clearAllMocks()
  mocks.S = defaultState()
  host = document.createElement('div')
  document.body.appendChild(host)
  root = createRoot(host)
})

afterEach(() => {
  act(() => { root.unmount() })
  host.remove()
})

describe('Phase 6: AI Gym Partner with NVIDIA NIM & Voice I/O', () => {
  it('NVIDIA NIM is configured as the top-level recommended provider', () => {
    expect(HTTP_PROVIDERS.nvidia).toBeDefined()
    expect(HTTP_PROVIDERS.nvidia.recommended).toBe(true)
    expect(HTTP_PROVIDERS.nvidia.defaultBase).toBe('https://integrate.api.nvidia.com/v1')
    expect(HTTP_PROVIDERS.nvidia.defaultModel).toBe('meta/llama-3.1-70b-instruct')
    expect(HTTP_PROVIDERS.nvidia.models).toContain('meta/llama-3.1-70b-instruct')
    expect(HTTP_PROVIDERS.nvidia.models).toContain('meta/llama-3.1-8b-instruct')
    expect(HTTP_PROVIDERS.nvidia.models).toContain('mistralai/mixtral-8x22b-instruct-v0.1')
  })

  it('CoachChat renders provider badge and Partner Mode controls', async () => {
    await mount()
    const badge = host.querySelector('.provider-badge')
    expect(badge).toBeTruthy()
    expect(badge.textContent).toContain('NVIDIA NIM')

    const modePill = host.querySelector('.partner-mode-pill')
    expect(modePill).toBeTruthy()
    expect(modePill.textContent).toContain('Coach Mode')
  })

  it('Toggling Partner Mode flips to Operator Mode and displays Operator quick tools', async () => {
    await mount()
    const modePill = host.querySelector('.partner-mode-pill')
    await act(async () => {
      modePill.dispatchEvent(new Event('click', { bubbles: true }))
    })

    expect(modePill.textContent).toContain('Operator Mode')
    const chips = [...host.querySelectorAll('.qchip')].map(c => c.textContent.trim())
    expect(chips).toContain('Recovery')
    expect(chips).toContain('Week summary')
    expect(chips).toContain('Rest (90s)')
    expect(chips).toContain('Log set')
  })

  it('Voice I/O: push-to-talk mic button and text-to-speech toggle are present', async () => {
    await mount()
    const micBtn = host.querySelector('.voice-btn[aria-label="Push to talk"]')
    expect(micBtn).toBeTruthy()

    const ttsBtn = host.querySelector('.voice-btn[aria-label="Voice speech output"]')
    expect(ttsBtn).toBeTruthy()
  })

  it('Operator Mode: typing log set creates an Action Proposal requiring confirmation', async () => {
    await mount()
    const ta = host.querySelector('.composer textarea')
    expect(ta).toBeTruthy()

    await act(async () => {
      type(ta, 'log set 100kg 8 reps')
    })

    const sendBtn = host.querySelector('.composer .send')
    await act(async () => {
      sendBtn.dispatchEvent(new Event('click', { bubbles: true }))
    })

    const operatorCard = host.querySelector('.operator-card')
    expect(operatorCard).toBeTruthy()
    expect(operatorCard.textContent).toContain('Operator Mode · Confirmation Required')
    expect(operatorCard.textContent).toContain('Confirm & Apply')

    const confirmBtn = host.querySelector('.btn-confirm')
    await act(async () => {
      confirmBtn.dispatchEvent(new Event('click', { bubbles: true }))
    })

    expect(mocks.S.active.entries[0].sets[1].done).toBe(true)
    expect(mocks.S.active.entries[0].sets[1].w).toBe(100)
    expect(mocks.toast).toHaveBeenCalledWith(expect.stringContaining('Logged set'))
  })

  it('Operator Mode: rest timer intent triggers rest countdown upon confirmation', async () => {
    await mount()
    const ta = host.querySelector('.composer textarea')
    await act(async () => {
      type(ta, 'rest 90s')
    })

    const sendBtn = host.querySelector('.composer .send')
    await act(async () => {
      sendBtn.dispatchEvent(new Event('click', { bubbles: true }))
    })

    const confirmBtn = host.querySelector('.btn-confirm')
    expect(confirmBtn).toBeTruthy()

    await act(async () => {
      confirmBtn.dispatchEvent(new Event('click', { bubbles: true }))
    })

    expect(mocks.startRest).toHaveBeenCalledWith(90)
  })
})
