import { useState } from 'react'
import { WORM_IDLE_ART, WORM_TAP_ART } from '../lib/toji-assets.js'

/**
 * InventoryWorm:
 * Chibi Inventory Curse flair with idle wiggle and tap reaction.
 */
export default function InventoryWorm({ size = 44, style = {} }) {
  const [tapped, setTapped] = useState(false)

  const handleTap = () => {
    setTapped(true)
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try { navigator.vibrate(20) } catch (e) {}
    }
    setTimeout(() => {
      setTapped(false)
    }, 350)
  }

  return (
    <div
      className={`inventory-worm-flair ${tapped ? 'worm-tapped' : 'worm-idle'}`}
      onClick={handleTap}
      title="Inventory Curse"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: 'translate3d(0, 0, 0)',
        transition: 'transform 167ms cubic-bezier(.32,.72,0,1)',
        userSelect: 'none',
        ...style,
      }}
    >
      <img
        src={tapped ? WORM_TAP_ART : WORM_IDLE_ART}
        alt="Inventory Curse"
        style={{
          width: `${size}px`,
          height: `${size}px`,
          objectFit: 'contain',
          transform: tapped ? 'translate3d(0, -6px, 0) scale(1.15) rotate(5deg)' : 'translate3d(0, 0, 0)',
          transition: 'transform 167ms cubic-bezier(.32,.72,0,1)',
          filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))',
        }}
        onError={e => {
          // Graceful fallback if image is missing
          e.currentTarget.style.display = 'none'
        }}
      />
    </div>
  )
}
