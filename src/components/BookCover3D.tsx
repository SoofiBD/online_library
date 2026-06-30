'use client'

import { coverOf } from '@/lib/theme/covers'

const SIZES = {
  grid: { w: 124, h: 184, tz: 9, spine: 18, pad: '16px 12px 13px 16px', title: 13.5, author: 10.5, rotate: -13, rule: 26 },
  detail: { w: 198, h: 294, tz: 15, spine: 30, pad: '26px 22px 22px 26px', title: 21, author: 14, rotate: -17, rule: 40 },
  form: { w: 154, h: 228, tz: 11, spine: 22, pad: '20px 16px 16px 20px', title: 16, author: 11.5, rotate: -15, rule: 30 },
} as const

export default function BookCover3D({
  colorKey,
  title,
  author,
  size = 'grid',
  image,
  spineLabel = false,
  className,
}: {
  colorKey?: string | null
  title: string
  author?: string | null
  size?: keyof typeof SIZES
  image?: string | null
  spineLabel?: boolean
  className?: string
}) {
  const c = coverOf(colorKey)
  const s = SIZES[size]
  return (
    <div className={className} style={{ perspective: 1100, width: s.w, height: s.h, margin: '0 auto' }}>
      <div
        className="bc3d"
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          transformStyle: 'preserve-3d',
          transform: `rotateY(${s.rotate}deg)`,
          transition: 'transform .6s cubic-bezier(.2,.75,.2,1)',
        }}
      >
        {/* spine */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            height: '100%',
            width: s.spine,
            background: c.spine,
            transformOrigin: 'left center',
            transform: 'rotateY(90deg)',
            borderRadius: '3px 0 0 3px',
            boxShadow: 'inset -3px 0 6px rgba(0,0,0,.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {spineLabel && (
            <span
              style={{
                writingMode: 'vertical-rl',
                fontFamily: 'var(--font-spectral), serif',
                fontSize: 11,
                letterSpacing: 1,
                color: c.foil,
                opacity: 0.8,
                transform: 'rotate(180deg)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxHeight: s.h - 40,
              }}
            >
              {title}
            </span>
          )}
        </div>
        {/* cover face */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transform: `translateZ(${s.tz}px)`,
            background: image ? '#1a1410' : c.bg,
            borderRadius: '2px 6px 6px 2px',
            boxShadow:
              'inset 5px 0 9px rgba(255,255,255,.07), inset -2px 0 5px rgba(0,0,0,.25), 0 18px 26px rgba(40,25,12,.32)',
            padding: image ? 0 : s.pad,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt={title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div
                style={{
                  fontFamily: 'var(--font-spectral), serif',
                  fontWeight: 600,
                  fontSize: s.title,
                  lineHeight: 1.2,
                  color: c.foil,
                  display: '-webkit-box',
                  WebkitLineClamp: 4,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                <div style={{ width: s.rule, height: 1.5, background: c.foil, opacity: 0.55, marginBottom: 7 }} />
                <div
                  style={{
                    fontFamily: 'var(--font-spectral), serif',
                    fontStyle: 'italic',
                    fontSize: s.author,
                    color: c.foil,
                    opacity: 0.82,
                    lineHeight: 1.2,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {author || 'Unknown'}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
