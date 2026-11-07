import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('distraction-blocker lib', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('gracefully handles non-mobile environment', async () => {
    vi.doMock('./mobile.js', () => ({
      MOBILE: false
    }))

    const mod = await import('./distraction-blocker.js')
    expect(await mod.isDistractionBlockingSupported()).toBe(false)
    expect(await mod.isUsagePermissionGranted()).toEqual({ granted: false, usageStats: false, overlay: false })
    expect(await mod.requestUsagePermission()).toBe(false)
    expect(await mod.requestOverlayPermission()).toBe(false)
    expect(await mod.startBlocking(90, ['com.instagram.android'])).toEqual({ active: false })
    expect(await mod.stopBlocking()).toBe(false)
    expect(await mod.getBlockerStatus()).toEqual({ active: false, remainingSeconds: 0, usagePermission: false, overlayPermission: false })
  })

  it('delegates to native DistractionBlocker plugin when available', async () => {
    const mockPlugin = {
      isUsagePermissionGranted: vi.fn().mockResolvedValue({ granted: true, usageStats: true, overlay: true }),
      requestUsagePermission: vi.fn().mockResolvedValue({ opened: true }),
      requestOverlayPermission: vi.fn().mockResolvedValue({ opened: true }),
      startBlocking: vi.fn().mockResolvedValue({ active: true, restSeconds: 60 }),
      stopBlocking: vi.fn().mockResolvedValue({ active: false }),
      getStatus: vi.fn().mockResolvedValue({ active: true, remainingSeconds: 45, usagePermission: true, overlayPermission: true })
    }

    vi.doMock('./mobile.js', () => ({
      MOBILE: true
    }))

    vi.doMock('@capacitor/core', () => ({
      registerPlugin: vi.fn((name) => {
        if (name === 'DistractionBlocker') return mockPlugin
        return null
      })
    }))

    const mod = await import('./distraction-blocker.js')
    expect(await mod.isDistractionBlockingSupported()).toBe(true)

    const perm = await mod.isUsagePermissionGranted()
    expect(perm).toEqual({ granted: true, usageStats: true, overlay: true })

    const req = await mod.requestUsagePermission()
    expect(req).toBe(true)
    expect(mockPlugin.requestUsagePermission).toHaveBeenCalled()

    const reqOverlay = await mod.requestOverlayPermission()
    expect(reqOverlay).toBe(true)
    expect(mockPlugin.requestOverlayPermission).toHaveBeenCalled()

    const start = await mod.startBlocking(60, ['com.twitter.android'])
    expect(start).toEqual({ active: true, restSeconds: 60 })
    expect(mockPlugin.startBlocking).toHaveBeenCalledWith({
      restSeconds: 60,
      blocklist: ['com.twitter.android']
    })

    const status = await mod.getBlockerStatus()
    expect(status).toEqual({ active: true, remainingSeconds: 45, usagePermission: true, overlayPermission: true })

    const stop = await mod.stopBlocking()
    expect(stop).toBe(true)
    expect(mockPlugin.stopBlocking).toHaveBeenCalled()
  })
})
