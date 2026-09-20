// Renders the uploaded business logo when one is set in Settings, otherwise falls back to a
// CSS wordmark using the brand's heading typeface and colors.
export default function Logo({ size = 'md', className = '', imageUrl = null, businessName = 'AXKN07 Crochet' }) {
  // Height (not a fixed box) so a wide wordmark logo scales naturally instead of being
  // cropped into a square/circle. object-contain keeps the whole mark visible either way.
  const heights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-14',
  }

  const [first, ...rest] = businessName.split(' ')

  if (imageUrl) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src={imageUrl}
          alt={businessName}
          className={`${heights[size]} w-auto object-contain`}
        />
      </div>
    )
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-full bg-blush-fade text-surface shadow-gentle"
        aria-hidden="true"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </span>
      <span className={`font-heading font-semibold leading-none text-ink ${textSizes[size]}`}>
        {first} <span className="text-peach">{rest.join(' ')}</span>
      </span>
    </div>
  )
}      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      </span>
      <span className={`font-heading font-semibold leading-none text-ink ${textSizes[size]}`}>
        {first} <span className="text-peach">{rest.join(' ')}</span>
      </span>
    </div>
  )
}
