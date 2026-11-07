import { useEffect, useState } from 'react'
import { BLACK_FLASH_FRAME, BLACK_FLASH_LOGO } from '../lib/toji-assets.js'

/**
 * Audio synthesizer for Black Flash impact frame
 * Bass-heavy sawtooth drop + resonant transient pulse
 */
function playBlackFlashSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {})
    }

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(32, ctx.currentTime + 0.6)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(450, ctx.currentTime)
    filter.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 0.6)

    gain.gain.setValueAtTime(0.7, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.65)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.7)
  } catch (err) {
    // Graceful offline audio silence fallback
  }
}

/**
 * BlackFlash component:
 * Triggers full-screen radial shockwave + screen flash 0.12s on new PR milestone.
 */
export default function BlackFlash({ milestone = 'PR BROKEN', value = '', onDismiss }) {
  const [stage, setStage] = useState('flash') // 'flash' (0.12s) -> 'impact' -> 'fade'

  useEffect(() => {
    // 1. Audio and Haptics
    playBlackFlashSound()
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([40, 60, 40])
      } catch (e) {}
    }

    // 2. High-speed screen inversion flash (0.12s)
    const flashTimer = setTimeout(() => {
      setStage('impact')
    }, 120)

    // 3. Auto settle and dismiss
    const dismissTimer = setTimeout(() => {
      if (onDismiss) onDismiss()
    }, 1800)

    return () => {
      clearTimeout(flashTimer)
      clearTimeout(dismissTimer)
    }
  }, [onDismiss])

  return (
    <div
      className="black-flash-overlay"
      onClick={onDismiss}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: stage === 'flash' ? '#F4F1EA' : 'rgba(11, 11, 13, 0.96)',
        filter: stage === 'flash' ? 'invert(1)' : 'none',
        transition: 'background-color 167ms cubic-bezier(.32,.72,0,1)',
        transform: 'translate3d(0, 0, 0)',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* Radial shockwave impact frame asset */}
      <img
        src={BLACK_FLASH_FRAME}
        alt="Black Flash Impact"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: stage === 'flash' ? 0.3 : 0.85,
          transform: 'translate3d(0, 0, 0) scale(1.05)',
          animation: 'blackFlashShockwave 400ms cubic-bezier(0.1, 0.9, 0.2, 1) forwards',
          pointerEvents: 'none',
        }}
        onError={e => {
          e.currentTarget.style.display = 'none'
        }}
      />

      {/* Speed lines & energy particles (SVG fallback / overlay) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, transparent 35%, rgba(193, 18, 31, 0.3) 75%, #0B0B0D 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Main Black Flash Logo & Kanji */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '0 24px',
          textAlign: 'center',
          transform: 'translate3d(0, 0, 0)',
        }}
      >
        <img
          src={BLACK_FLASH_LOGO}
          alt="BLACK FLASH"
          style={{
            maxWidth: '320px',
            width: '80vw',
            height: 'auto',
            filter: 'drop-shadow(0 0 24px rgba(193, 18, 31, 0.8))',
          }}
          onError={e => {
            // SVG fallback if webp is unavailable
            e.currentTarget.style.display = 'none'
          }}
        />

        <div
          style={{
            fontFamily: 'serif',
            fontSize: '44px',
            fontWeight: 900,
            letterSpacing: '0.3em',
            color: '#C1121F',
            textShadow: '0 0 20px rgba(193, 18, 31, 0.9)',
            margin: '4px 0',
          }}
        >
          黒閃
        </div>

        {value && (
          <div
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#F4F1EA',
              letterSpacing: '0.08em',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            {value}
          </div>
        )}

        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgba(244, 241, 234, 0.7)',
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            marginTop: 4,
          }}
        >
          {milestone}
        </div>
      </div>
    </div>
  )
}
