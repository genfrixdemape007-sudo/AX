import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchProductStats, fetchRecentlyUpdatedProducts } from '../../services/productService'
import { useCategories } from '../../hooks/useCategories'
import { getPublicImageUrl, getCoverImagePath } from '../../services/storageService'
import { AvailabilityBadge } from '../../components/Badge'
import { Spinner } from '../../components/LoadingStates'
import { ErrorState } from '../../components/EmptyState'

export default function AdminDashboard() {
  const { categories } = useCategories()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const [statsData, recentData] = await Promise.all([
        fetchProductStats(),
        fetchRecentlyUpdatedProducts(5),
      ])
      setStats(statsData)
      setRecent(recentData)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load the dashboard right now.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <Spinner label="Loading dashboard…" />
  if (error) return <ErrorState message={error} onRetry={load} />

  const cards = [
    { label: 'Total Products', value: stats.total, icon: '🧶' },
    { label: 'Available Products', value: stats.available, icon: '✅' },
    { label: 'Sold Out Products', value: stats.soldOut, icon: '💤' },
    { label: 'Categories', value: categories.length, icon: '🗂️' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="font-body text-sm text-ink-soft">A quick look at your shop.</p>
        </div>
        <Link to="/admin/products" className="btn-primary w-fit">
          + Add Product
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card card-hover p-5">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-daisy/60 text-xl" aria-hidden="true">
              {card.icon}
            </span>
            <p className="mt-3 font-heading text-2xl font-semibold text-ink">{card.value}</p>
            <p className="font-body text-xs font-semibold text-ink-soft">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="card mt-6 p-5">
        <h2 className="mb-4 font-heading text-lg font-semibold text-ink">Recently Updated Products</h2>
        {recent.length === 0 ? (
          <p className="font-body text-sm text-ink-soft">No products yet. Add your first one!</p>
        ) : (
          <div className="flex flex-col divide-y divide-ink/5">
            {recent.map((product) => {
              const imageUrl = getPublicImageUrl(getCoverImagePath(product))
              return (
                <div key={product.id} className="flex items-center gap-3 py-3">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-cozy bg-daisy/40">
                    {imageUrl && <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-sm font-semibold text-ink">{product.name}</p>
                    <p className="font-body text-xs text-ink-soft">₱{product.price}</p>
                  </div>
                  <AvailabilityBadge status={product.availability} />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
