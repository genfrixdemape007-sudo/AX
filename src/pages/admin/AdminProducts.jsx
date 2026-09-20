import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { deleteProduct } from '../../services/productService'
import { deleteProductImage } from '../../services/storageService'
import { getPublicImageUrl, getCoverImagePath } from '../../services/storageService'
import { AvailabilityBadge } from '../../components/Badge'
import { Spinner } from '../../components/LoadingStates'
import { ErrorState } from '../../components/EmptyState'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

export default function AdminProducts() {
  const { categories } = useCategories()
  const { products, loading, error, refresh } = useProducts({ categories })
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    setDeleteError(null)
    try {
      await deleteProduct(pendingDelete.id)
      // Only remove images after the product row is gone, and only this product's images —
      // never touch another product's files.
      const paths = Array.isArray(pendingDelete.image_paths) && pendingDelete.image_paths.length > 0
        ? pendingDelete.image_paths
        : pendingDelete.image_path
        ? [pendingDelete.image_path]
        : []
      await Promise.all(paths.map((p) => deleteProductImage(p)))
      setPendingDelete(null)
      refresh()
    } catch (err) {
      console.error(err)
      setDeleteError('We couldn\u2019t delete this product. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold text-ink">Products</h1>
          <p className="font-body text-sm text-ink-soft">Manage everything in your price list.</p>
        </div>
        <Link to="/admin/products/new" className="btn-primary w-fit">
          + Add Product
        </Link>
      </div>

      {loading && <Spinner label="Loading products…" />}
      {!loading && error && <ErrorState message={error} onRetry={refresh} />}

      {!loading && !error && products.length === 0 && (
        <EmptyState
          title="No crochet pieces yet."
          message="Add your first product to get started."
          action={
            <Link to="/admin/products/new" className="btn-primary mt-2">
              + Add Product
            </Link>
          }
        />
      )}

      {!loading && !error && products.length > 0 && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink/5">
            {products.map((product) => {
              const imageUrl = getPublicImageUrl(getCoverImagePath(product))
              return (
                <div key={product.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-cozy bg-daisy/40">
                      {imageUrl && <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-body text-sm font-semibold text-ink">{product.name}</p>
                      <p className="font-body text-xs text-ink-soft">
                        {product.categories?.name || 'Uncategorized'} · ₱{product.price}
                      </p>
                      <p className="font-body text-[11px] text-ink-soft">
                        Updated {new Date(product.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:shrink-0">
                    <AvailabilityBadge status={product.availability} />
                    <Link to={`/admin/products/${product.id}/edit`} className="btn-secondary !px-4 !py-2 text-sm">
                      Edit
                    </Link>
                    <button
                      onClick={() => setPendingDelete(product)}
                      className="rounded-full border-2 border-transparent px-4 py-2 font-body text-sm font-semibold text-peach transition-colors hover:bg-peach/10"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this product?"
        message={
          deleteError ||
          `Are you sure you want to delete "${pendingDelete?.name}"? This cannot be undone.`
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => {
          setPendingDelete(null)
          setDeleteError(null)
        }}
      />
    </div>
  )
}
