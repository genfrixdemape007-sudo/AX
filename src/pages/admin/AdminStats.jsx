import { useEffect, useState } from 'react'
import { fetchOrderStats } from '../../services/orderService'
import { Spinner } from '../../components/LoadingStates'
import { ErrorState } from '../../components/EmptyState'

export default function AdminStats() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setStats(await fetchOrderStats())
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load statistics right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`

  if (loading) return <Spinner label="Loading statistics…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  const maxMonth = Math.max(1, ...stats.byMonth.map(([, v]) => v))
  const maxItem = Math.max(1, ...stats.topItems.map((i) => i.qty))

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">Statistics</h1>
        <p className="font-body text-sm text-ink-soft">Revenue and order trends, from your Receipt Log.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">Total Orders</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-ink">{stats.totalOrders}</p>
        </div>
        <div className="card p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">Revenue (paid)</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-olive">{fmt(stats.revenue)}</p>
        </div>
        <div className="card p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">Outstanding</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-peach">{fmt(stats.outstanding)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Monthly Totals</h2>
          {stats.byMonth.length === 0 ? (
            <p className="font-body text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.byMonth.map(([month, total]) => (
                <div key={month} className="flex items-center gap-3">
                  <span className="w-16 shrink-0 font-body text-xs text-ink-soft">{month}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-daisy/40">
                    <div className="h-full rounded-full bg-blush-fade" style={{ width: `${(total / maxMonth) * 100}%` }} />
                  </div>
                  <span className="w-16 shrink-0 text-right font-body text-xs text-ink">{fmt(total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Best Sellers</h2>
          {stats.topItems.length === 0 ? (
            <p className="font-body text-sm text-ink-soft">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {stats.topItems.map((item) => (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="w-28 shrink-0 truncate font-body text-xs text-ink-soft">{item.name}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-daisy/40">
                    <div className="h-full rounded-full bg-peach" style={{ width: `${(item.qty / maxItem) * 100}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right font-body text-xs text-ink">×{item.qty}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
