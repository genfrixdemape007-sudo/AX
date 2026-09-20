export default function EmptyState({ icon = '🧶', title, message, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-stitch border border-dashed border-peach/30 bg-surface-soft px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        {icon}
      </span>
      <h3 className="font-heading text-xl font-semibold text-ink">{title}</h3>
      {message && <p className="max-w-sm font-body text-sm text-ink-soft">{message}</p>}
      {action}
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-stitch border border-peach/30 bg-surface-soft px-6 py-16 text-center">
      <span className="text-4xl" aria-hidden="true">
        💔
      </span>
      <p className="max-w-sm font-body text-sm text-ink-soft">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-2">
          Try again
        </button>
      )}
    </div>
  )
}
