// Toji Rest Guard: Distraction Blocking Native Plugin Bridge (Phase 3)
// Forest-style rest timer overlay and background distractor interception.
// Local-first, offline architecture. Zero unicode emojis.
import { MOBILE } from './mobile.js'

let pluginP = null
const blockerPlugin = () => pluginP || (pluginP = (async () => {
  if (!MOBILE) return null
  const { registerPlugin } = await import('@capacitor/core')
  return { DistractionBlocker: registerPlugin('DistractionBlocker') }
})().catch(() => null))

/**
 * Checks if distraction blocking is supported in the current environment.
 * @returns {Promise<boolean>}
 */
export async function isDistractionBlockingSupported() {
  const p = await blockerPlugin()
  return !!p?.DistractionBlocker
}

/**
 * Checks if PACKAGE_USAGE_STATS permission has been granted by the user.
 * @returns {Promise<{ granted: boolean, usageStats: boolean, overlay: boolean }>}
 */
export async function isUsagePermissionGranted() {
  const p = await blockerPlugin()
  if (!p) return { granted: false, usageStats: false, overlay: false }
  try {
    const res = await p.DistractionBlocker.isUsagePermissionGranted()
    return {
      granted: !!res?.granted,
      usageStats: !!res?.usageStats,
      overlay: !!res?.overlay
    }
  } catch {
    return { granted: false, usageStats: false, overlay: false }
  }
}

/**
 * Directs user to the system Usage Access Settings screen.
 * @returns {Promise<boolean>}
 */
export async function requestUsagePermission() {
  const p = await blockerPlugin()
  if (!p) return false
  try {
    const res = await p.DistractionBlocker.requestUsagePermission()
    return !!res?.opened
  } catch {
    return false
  }
}

/**
 * Directs user to system Overlay / Display over other apps settings screen.
 * @returns {Promise<boolean>}
 */
export async function requestOverlayPermission() {
  const p = await blockerPlugin()
  if (!p) return false
  try {
    const res = await p.DistractionBlocker.requestOverlayPermission()
    return !!res?.opened
  } catch {
    return false
  }
}

/**
 * Starts distraction blocking for the rest timer duration.
 * @param {number} restSeconds Duration in seconds of the rest interval
 * @param {string[]} [blocklist] Optional list of package names or tokens (e.g. ['*'] for all)
 * @returns {Promise<{ active: boolean, restSeconds?: number }>}
 */
export async function startBlocking(restSeconds, blocklist = []) {
  const p = await blockerPlugin()
  if (!p) return { active: false }
  try {
    const res = await p.DistractionBlocker.startBlocking({
      restSeconds: Math.max(1, Math.round(restSeconds || 60)),
      blocklist: Array.isArray(blocklist) ? blocklist : []
    })
    return {
      active: !!res?.active,
      restSeconds: res?.restSeconds
    }
  } catch {
    return { active: false }
  }
}

/**
 * Disarms and stops the distraction blocker service.
 * @returns {Promise<boolean>}
 */
export async function stopBlocking() {
  const p = await blockerPlugin()
  if (!p) return false
  try {
    const res = await p.DistractionBlocker.stopBlocking()
    return res?.active === false
  } catch {
    return false
  }
}

/**
 * Gets live status of distraction blocker.
 * @returns {Promise<{ active: boolean, remainingSeconds: number, usagePermission: boolean, overlayPermission: boolean }>}
 */
export async function getBlockerStatus() {
  const p = await blockerPlugin()
  if (!p) return { active: false, remainingSeconds: 0, usagePermission: false, overlayPermission: false }
  try {
    const res = await p.DistractionBlocker.getStatus()
    return {
      active: !!res?.active,
      remainingSeconds: Number(res?.remainingSeconds || 0),
      usagePermission: !!res?.usagePermission,
      overlayPermission: !!res?.overlayPermission
    }
  } catch {
    return { active: false, remainingSeconds: 0, usagePermission: false, overlayPermission: false }
  }
}
