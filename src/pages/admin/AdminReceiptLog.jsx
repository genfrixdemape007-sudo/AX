import { useEffect, useRef, useState } from 'react'
import { fetchOrders, deleteOrder, updateOrder } from '../../services/orderService'
import { useSettings } from '../../hooks/useSettings'
import { saveNodeAsImage } from '../../lib/exportImage'
import ReceiptTemplate from '../../components/ReceiptTemplate'
import { Spinner } from '../../components/LoadingStates'
import EmptyState from '../../components/EmptyState'
import { ErrorState } from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const STATUS_PILL = {
  paid: 'bg-olive/20 text-olive',
  partial: 'bg-gold/20 text-gold',
  unpaid: 'bg-peach/15 text-peach',
}

export default function AdminReceiptLog() {
  const { settings } = useSettings()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const receiptRef = useRef(null)

  const load = async (term = search) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOrders({ searchTerm: term })
      setOrders(data)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load the receipt log right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    load(search)
  }

  const markPaid = async (order) => {
    try {
      const updated = await updateOrder(order.id, { ...order, received: order.total }, settings)
      setOrders((prev) => prev.map((o) => (o.id === order.id ? updated : o)))
      if (viewing?.id === order.id) setViewing(updated)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteOrder(pendingDelete.id)
      setPendingDelete(null)
      setViewing(null)
      load()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">Receipt Log</h1>
        <p className="font-body text-sm text-ink-soft">Every order you've saved, with its receipt.</p>
      </div>

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by customer or order #" className="input-field flex-1" />
        <button type="submit" className="btn-secondary shrink-0">Search</button>
      </form>

      {loading && <Spinner label="Loading receipts…" />}
      {!loading && error && <ErrorState message={error} onRetry={() => load()} />}
      {!loading && !error && orders.length === 0 && (
        <EmptyState title="No orders yet." message="Orders you save from the Orders page will show up here." />
      )}

      {!loading && !error && orders.length > 0 && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink/5">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-body text-sm font-semibold text-ink">{o.order_no} · {o.customer}</p>
                  <p className="font-body text-xs text-ink-soft">{o.order_date} · {fmt(o.total)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-3 py-1 font-body text-xs font-bold ${STATUS_PILL[o.status]}`}>{o.status}</span>
                  {o.status !== 'paid' && (
                    <button onClick={() => markPaid(o)} className="rounded-full px-3 py-2 font-body text-xs font-semibold text-olive hover:bg-olive/10">
                      Mark Paid
                    </button>
                  )}
                  <button onClick={() => setViewing(o)} className="rounded-full px-3 py-2 font-body text-xs font-semibold text-peach hover:bg-peach/10">
                    View
                  </button>
                  <button onClick={() => setPendingDelete(o)} className="rounded-full px-3 py-2 font-body text-xs font-semibold text-ink-soft hover:bg-daisy/40">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-ink/40 p-4">
          <div className="card w-full max-w-sm p-4">
            <button onClick={() => setViewing(null)} className="mb-3 font-body text-sm font-semibold text-ink-soft hover:text-ink">
              ← Close
            </button>
            <ReceiptTemplate ref={receiptRef} order={viewing} settings={settings} />
            <button
              onClick={() => saveNodeAsImage(receiptRef.current, `${viewing.order_no}.png`)}
              className="btn-secondary mt-4 w-full"
            >
              Save as Image
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this order?"
        message={`This permanently removes ${pendingDelete?.order_no} from your records.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
