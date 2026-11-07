import { useEffect, useState, useRef } from 'react'
import { DOMAIN_RING_ART } from '../lib/toji-assets.js'

/**
 * Web Audio Heartbeat Synthesizer
 */
function playHeartbeat() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})

    const now = ctx.currentTime
    // Lub
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(65, now)
    osc1.frequency.exponentialRampToValueAtTime(35, now + 0.12)
    gain1.gain.setValueAtTime(0.35, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.15)

    // Dub
    const osc2 = ctx.createOscillator()
    const gain2 = ctx.createGain()
    osc2.type = 'sine'
    osc2.frequency.setValueAtTime(75, now + 0.18)
    osc2.frequency.exponentialRampToValueAtTime(40, now + 0.32)
    gain2.gain.setValueAtTime(0.28, now + 0.18)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)
    osc2.connect(gain2)
    gain2.connect(ctx.destination)
    osc2.start(now + 0.18)
    osc2.stop(now + 0.36)
  } catch (err) {}
}

/**
 * DomainTimer component:
 * Domain Expansion Rest Mode with spinning concentric Enso ring and 90s countdown.
 */
export default function DomainTimer({ initialSeconds = 90, onFinish, onDismiss }) {
  const [remaining, setRemaining] = useState(initialSeconds)
  const endsAtRef = useRef(Date.now() + initialSeconds * 1000)

  // Epoch timestamp anchored interval
  useEffect(() => {
    endsAtRef.current = Date.now() + initialSeconds * 1000
    setRemaining(initialSeconds)

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((endsAtRef.current - Date.now()) / 1000))
      setRemaining(diff)

      // Heartbeat pulse every 10s or during final 5s countdown
      if (diff > 0 && (diff % 10 === 0 || diff <= 5)) {
        playHeartbeat()
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(30) } catch (e) {}
        }
      }

      if (diff <= 0) {
        clearInterval(interval)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate([80, 50, 80]) } catch (e) {}
        }
        if (onFinish) onFinish()
      }
    }, 250)

    return () => clearInterval(interval)
  }, [initialSeconds, onFinish])

  const adjustTime = (delta) => {
    const next = Math.max(0, remaining + delta)
    endsAtRef.current = Date.now() + next * 1000
    setRemaining(next)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60
  const formattedTime = `${mins}:${secs.toString().padStart(2, '0')}`

  return (
    <div
      className="domain-timer-modal"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99990,
        backgroundColor: 'rgba(11, 11, 13, 0.94)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        transform: 'translate3d(0, 0, 0)',
        backdropFilter: 'blur(8px)',
      }}
    >
      {/* Top Banner / Calligraphy */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 24,
          color: '#C1121F',
          letterSpacing: '0.25em',
        }}
      >
        <span style={{ fontSize: '20px', fontFamily: 'serif', fontWeight: 900 }}>領域展開</span>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'rgba(244, 241, 234, 0.7)', letterSpacing: '0.15em' }}>
          DOMAIN REST
        </span>
      </div>

      {/* Enso Ring & Countdown Container */}
      <div
        style={{
          position: 'relative',
          width: '240px',
          height: '240px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Spinning Concentric Enso Ring (20s linear cycle) */}
        <img
          src={DOMAIN_RING_ART}
          alt="Domain Ring"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            animation: 'domainRingSpin 20s linear infinite',
            transform: 'translate3d(0, 0, 0)',
            opacity: 0.85,
            filter: 'drop-shadow(0 0 16px rgba(193, 18, 31, 0.4))',
          }}
          onError={e => {
            // SVG Enso fallback
            e.currentTarget.style.display = 'none'
          }}
        />

        {/* Fallback SVG Ring if WebP fails */}
        <svg
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            animation: 'domainRingSpin 20s linear infinite',
            pointerEvents: 'none',
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(193, 18, 31, 0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Central Display */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 2,
          }}
        >
          <span
            style={{
              fontSize: '48px',
              fontWeight: 800,
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
              color: '#F4F1EA',
              textShadow: '0 2px 12px rgba(0,0,0,0.8)',
            }}
          >
            {formattedTime}
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.2em',
              color: '#C1121F',
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            RECOVERY
          </span>
        </div>
      </div>

      {/* Adjusters: -15s and +30s buttons */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginTop: 28,
        }}
      >
        <button
          onClick={() => adjustTime(-15)}
          style={{
            background: '#17181C',
            color: '#F4F1EA',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '999px',
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transform: 'translate3d(0, 0, 0)',
            transition: 'background-color 167ms',
          }}
        >
          -15s
        </button>
        <button
          onClick={() => adjustTime(30)}
          style={{
            background: '#C1121F',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: '999px',
            padding: '10px 24px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: 'pointer',
            transform: 'translate3d(0, 0, 0)',
            boxShadow: '0 4px 16px rgba(193, 18, 31, 0.4)',
            transition: 'background-color 167ms',
          }}
        >
          +30s
        </button>
      </div>

      {/* Dismiss / Close CTA */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          style={{
            marginTop: 24,
            background: 'none',
            border: 'none',
            color: 'rgba(244, 241, 234, 0.6)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 16px',
          }}
        >
          Skip Rest
        </button>
      )}
    </div>
  )
}
