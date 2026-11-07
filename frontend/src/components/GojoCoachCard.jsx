import { useState } from 'react'
import { GOJO_MASCOT_1, GOJO_MASCOT_2, getContextualQuote } from '../lib/toji-assets.js'

export default function GojoCoachCard({ muscleGroup = 'default', style = {} }) {
  const [quoteIdx, setQuoteIdx] = useState(0)
  const [mascotToggle, setMascotToggle] = useState(false)

  const activeQuote = getContextualQuote(muscleGroup, quoteIdx)

  const nextQuote = () => {
    setQuoteIdx(i => i + 1)
    setMascotToggle(t => !t)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(25) } catch (e) {}
    }
  }

  return (
    <div
      className="gojo-coach-card"
      onClick={nextQuote}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        backgroundColor: '#17181C',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 'var(--r-card, 14px)',
        cursor: 'pointer',
        userSelect: 'none',
        margin: '14px 0',
        transform: 'translate3d(0, 0, 0)',
        transition: 'background-color 167ms cubic-bezier(.32,.72,0,1)',
        ...style,
      }}
    >
      {/* Speech Bubble on Left/Center */}
      <div
        style={{
          flex: 1,
          position: 'relative',
          background: '#1E1F24',
          border: '1px solid rgba(255, 255, 255, 0.09)',
          borderRadius: '12px',
          padding: '10px 14px',
        }}
      >
        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.4,
            fontWeight: 600,
            color: '#F4F1EA',
            fontStyle: 'italic',
          }}
        >
          "{activeQuote.quote}"
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '4px',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: '#C1121F',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            — {activeQuote.speaker}
          </span>
          <span
            style={{
              fontSize: '10px',
              color: 'rgba(244, 241, 234, 0.45)',
            }}
          >
            tap for wisdom
          </span>
        </div>
      </div>

      {/* Chibi Gojo Mascot Mascot on Right */}
      <div
        style={{
          flexShrink: 0,
          width: '54px',
          height: '54px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <img
          src={mascotToggle ? GOJO_MASCOT_2 : GOJO_MASCOT_1}
          alt="Gojo Satoru"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            transform: 'translate3d(0, 0, 0)',
            transition: 'transform 167ms',
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.5))',
          }}
          onError={e => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    </div>
  )
}
