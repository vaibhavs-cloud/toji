import { TOJI_HERO_ART } from '../lib/toji-assets.js'
import InventoryWorm from './InventoryWorm.jsx'

export default function TojiHero({ quote = "Don't stop. Keep going.", author = "Toji Fushiguro" }) {
  return (
    <div
      className="toji-hero-card"
      style={{
        position: 'relative',
        width: '100%',
        height: '180px',
        borderRadius: 'var(--r-card, 14px)',
        overflow: 'hidden',
        marginBottom: '16px',
        backgroundColor: '#17181C',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.45)',
        transform: 'translate3d(0, 0, 0)',
      }}
    >
      {/* Background Master Composite Artwork */}
      <img
        src={TOJI_HERO_ART}
        alt="Toji Fushiguro - Heavenly Restriction"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center right',
          opacity: 0.92,
          transform: 'translate3d(0, 0, 0)',
        }}
        onError={e => {
          e.currentTarget.style.display = 'none'
        }}
      />

      {/* Dark gradient overlay on the left for crystal-clear readability */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(90deg, rgba(11, 11, 13, 0.95) 0%, rgba(11, 11, 13, 0.75) 50%, rgba(11, 11, 13, 0.2) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* Hero Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          height: '100%',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}
      >
        {/* Top Badges */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'serif',
                fontSize: '13px',
                fontWeight: 900,
                color: '#C1121F',
                letterSpacing: '0.2em',
                background: 'rgba(193, 18, 31, 0.12)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(193, 18, 31, 0.25)',
              }}
            >
              天与呪縛
            </span>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 600,
                color: 'rgba(244, 241, 234, 0.65)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Cursed Energy: 0
            </span>
          </div>

          {/* Interactive Inventory Worm Flair */}
          <InventoryWorm size={34} />
        </div>

        {/* Motivational Manga Quote */}
        <div style={{ maxWidth: '68%' }}>
          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              lineHeight: 1.35,
              color: '#F4F1EA',
              fontStyle: 'italic',
              textShadow: '0 2px 8px rgba(0,0,0,0.8)',
            }}
          >
            "{quote}"
          </div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#C1121F',
              letterSpacing: '0.1em',
              marginTop: '4px',
              textTransform: 'uppercase',
            }}
          >
            — {author}
          </div>
        </div>
      </div>
    </div>
  )
}
