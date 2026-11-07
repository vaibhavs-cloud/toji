// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import Muscles from './Muscles.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

const mocks = vi.hoisted(() => {
  const state = { S: null }
  state.snapshot = () => ({ S: state.S, user: null, update: mut => { const next = structuredClone(state.S); mut(next); state.S = next } })
  return state
})
vi.mock('../store/useStore.js', () => {
  const useStore = selector => selector ? selector(mocks.snapshot()) : mocks.snapshot()
  useStore.getState = mocks.snapshot
  return { useStore }
})

const mounted = []
function render() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  mounted.push(root)
  act(() => {
    root.render(
      <MemoryRouter>
        <Muscles />
      </MemoryRouter>
    )
  })
  return host
}

beforeEach(() => {
  mocks.S = {
    unit: 'kg', lang: 'en', body: 'male', routines: [], workouts: [], customEx: [], exWeights: {},
    equipProfiles: [], activeEquipId: null, equipFilterOn: false, favEx: [],
  }
  document.body.innerHTML = ''
})

afterEach(() => {
  act(() => { mounted.splice(0).forEach(root => root.unmount()) })
})

describe('Muscles view recovery & volume overview', () => {
  it('renders the explore header and recovery intelligence', () => {
    const host = render()
    expect(host.textContent).toContain('Explore muscles')
    expect(host.textContent).toContain('7-day recovery volume decay')
    expect(host.querySelector('.bodymap')).toBeTruthy()
    // By default with no workouts, undertrained warning banner surfaces
    expect(host.textContent).toContain('undertrained muscle groups')
    expect(host.textContent).toContain('Not medical advice')
  })
})
