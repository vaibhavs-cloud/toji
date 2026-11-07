import { getMuscleArt } from '../lib/toji-assets.js'

export default function TojiMangaStage({ exercise, setsInfo = '', style = {} }) {
  const artUrl = getMuscleArt(exercise)

  return (
    <div
      className="toji-manga-stage-wrap"
      style={{
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
        alignItems: 'stretch',
        ...style,
      }}
    >
      {/* 2. Left Margin: Vertical crimson calligraphy 領域展開 (.workout-kanji-pillar) */}
      <div
        className="workout-kanji-pillar"
        title="領域展開 · Domain Expansion"
      >
        領域展開
      </div>

      {/* 3. Upper Art Stage: .workout-art-stage (20px radius, hairline border, dynamic art, gradient) */}
      <div className="workout-art-stage">
        <img
          src={artUrl}
          alt={exercise?.n || exercise?.name || 'Workout Muscle Stage'}
          className="stage-img"
          onError={e => {
            e.currentTarget.style.display = 'none'
          }}
        />

        <div className="stage-overlay" />

        <div className="stage-meta">
          <div className="stage-title">
            {exercise?.n || exercise?.name || 'Current Exercise'}
          </div>
          {setsInfo && (
            <div className="stage-sub">
              {setsInfo}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
