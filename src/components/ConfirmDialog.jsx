export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true">
      <div className="card w-full max-w-sm p-6">
        <h3 className="mb-2 font-heading text-lg font-semibold text-ink">{title}</h3>
        <p className="mb-6 font-body text-sm text-ink-soft">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-secondary flex-1">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-full bg-peach px-6 py-3 font-body font-semibold text-surface shadow-gentle transition-colors hover:bg-blush"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
