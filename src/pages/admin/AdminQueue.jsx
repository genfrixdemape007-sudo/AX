import { useEffect, useState } from 'react'
import { fetchQueueItems, createQueueItem, updateQueueItem, deleteQueueItem } from '../../services/queueService'
import { Spinner } from '../../components/LoadingStates'
import EmptyState from '../../components/EmptyState'
import { ErrorState } from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const EMPTY = { customer: '', item: '', due_date: '', priority: 'normal', notes: '' }
const STATUS_CYCLE = { queued: 'in-progress', 'in-progress': 'completed', completed: 'queued' }
const STATUS_LABEL = { queued: 'Queued', 'in-progress': 'In Progress', completed: 'Completed' }
const STATUS_STYLE = {
  queued: 'bg-daisy/60 text-ink',
  'in-progress': 'bg-gold/20 text-gold',
  completed: 'bg-olive/20 text-olive',
}

export default function AdminQueue() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [pendingDelete, setPendingDelete] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setItems(await fetchQueueItems())
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load the queue right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.customer.trim() || !form.item.trim()) return
    setSaving(true)
    try {
      await createQueueItem({
        customer: form.customer.trim(),
        item: form.item.trim(),
        due_date: form.due_date || null,
        priority: form.priority,
        notes: form.notes.trim() || null,
      })
      setForm(EMPTY)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const cycleStatus = async (q) => {
    try {
      const updated = await updateQueueItem(q.id, { status: STATUS_CYCLE[q.status] })
      setItems((prev) => prev.map((it) => (it.id === q.id ? updated : it)))
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    try {
      await deleteQueueItem(pendingDelete.id)
      setPendingDelete(null)
      load()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">Queue</h1>
        <p className="font-body text-sm text-ink-soft">Track what's in progress and what's due soon.</p>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-[1.5fr,1.5fr,1fr,1fr,auto]">
        <input value={form.customer} onChange={(e) => setForm((f) => ({ ...f, customer: e.target.value }))} placeholder="Customer" className="input-field" required />
        <input value={form.item} onChange={(e) => setForm((f) => ({ ...f, item: e.target.value }))} placeholder="Item" className="input-field" required />
        <input type="date" value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} className="input-field" />
        <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="input-field">
          <option value="normal">Normal</option>
          <option value="high">High priority</option>
        </select>
        <button type="submit" disabled={saving} className="btn-primary">Add</button>
      </form>

      {loading && <Spinner label="Loading queue…" />}
      {!loading && error && <ErrorState message={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && <EmptyState title="Queue is empty." message="Add something above to start tracking it." />}

      {!loading && !error && items.length > 0 && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink/5">
            {items.map((q) => (
              <div key={q.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-body text-sm font-semibold text-ink">
                    {q.customer} — {q.item} {q.priority === 'high' && <span className="text-peach">★</span>}
                  </p>
                  <p className="font-body text-xs text-ink-soft">{q.due_date ? `Due ${q.due_date}` : 'No due date'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cycleStatus(q)} className={`rounded-full px-3 py-1 font-body text-xs font-bold ${STATUS_STYLE[q.status]}`}>
                    {STATUS_LABEL[q.status]}
                  </button>
                  <button onClick={() => setPendingDelete(q)} className="rounded-full px-3 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-daisy/40">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Remove from queue?"
        message={`This removes "${pendingDelete?.item}" for ${pendingDelete?.customer}.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
