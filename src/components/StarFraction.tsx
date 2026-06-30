export default function StarFraction({
  rating,
  size = 12,
  className,
}: {
  rating: number | null
  size?: number
  className?: string
}) {
  const pct = ((rating ?? 0) / 5) * 100
  return (
    <span
      className={className}
      style={{ position: 'relative', display: 'inline-block', fontSize: size, letterSpacing: size / 6, lineHeight: 1 }}
      aria-label={rating ? `${rating} out of 5 stars` : 'unrated'}
    >
      <span style={{ color: '#ddccab' }}>★★★★★</span>
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          color: '#bd8a2c',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          width: `${pct}%`,
        }}
      >
        ★★★★★
      </span>
    </span>
  )
}
