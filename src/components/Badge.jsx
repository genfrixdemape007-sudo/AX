const AVAILABILITY_STYLES = {
  Available: 'bg-olive/20 text-ink',
  Limited: 'bg-clover/40 text-ink',
  'Made to Order': 'bg-blush/30 text-ink',
  'Sold Out': 'bg-ink/10 text-ink-soft',
}

export function AvailabilityBadge({ status }) {
  const style = AVAILABILITY_STYLES[status] || 'bg-daisy/60 text-ink'
  return (
    <span className={`rounded-full px-3 py-1 font-body text-xs font-semibold ${style}`}>{status}</span>
  )
}

export function FeatureBadge({ children, tone = 'peach' }) {
  const tones = {
    peach: 'bg-peach text-surface',
    olive: 'bg-olive text-surface',
  }
  return (
    <span className={`rounded-full px-2.5 py-1 font-body text-[11px] font-semibold ${tones[tone]}`}>
      {children}
    </span>
  )
}
