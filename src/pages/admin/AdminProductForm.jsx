import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCategories } from '../../hooks/useCategories'
import { createProduct, fetchProductById, updateProduct } from '../../services/productService'
import { deleteProductImage, uploadProductImage } from '../../services/storageService'
import ImageUploader from '../../components/ImageUploader'
import { Spinner } from '../../components/LoadingStates'

const AVAILABILITY_OPTIONS = ['Available', 'Limited', 'Sold Out', 'Made to Order']

const EMPTY_FORM = {
  name: '',
  price: '',
  short_description: '',
  description: '',
  category_id: '',
  types: '',
  size: '',
  availability: 'Available',
  note: '',
  featured: false,
  is_new: false,
  display_order: 0,
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const location = useLocation()
  const { categories } = useCategories()

  const prefill = !isEditing ? location.state : null
  const [form, setForm] = useState(
    prefill
      ? { ...EMPTY_FORM, price: prefill.prefillPrice ?? '', name: prefill.prefillName ?? '' }
      : EMPTY_FORM
  )
  const [imageSlots, setImageSlots] = useState([]) // { kind: 'existing', path } | { kind: 'new', file, previewUrl }
  const [loading, setLoading] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [imageError, setImageError] = useState(null)

  useEffect(() => {
    if (!isEditing) return
    let active = true
    fetchProductById(id)
      .then((product) => {
        if (!active || !product) return
        setForm({
          name: product.name || '',
          price: product.price ?? '',
          short_description: product.short_description || '',
          description: product.description || '',
          category_id: product.category_id || '',
          types: Array.isArray(product.types) ? product.types.join(', ') : '',
          size: product.size || '',
          availability: product.availability || 'Available',
          note: product.note || '',
          featured: Boolean(product.featured),
          is_new: Boolean(product.is_new),
          display_order: product.display_order ?? 0,
        })
        const existingPaths =
          Array.isArray(product.image_paths) && product.image_paths.length > 0
            ? product.image_paths
            : product.image_path
            ? [product.image_path]
            : []
        setImageSlots(existingPaths.map((path) => ({ kind: 'existing', path })))
      })
      .catch((err) => {
        console.error(err)
        setError('We couldn\u2019t load this product. Please try again.')
      })
      .finally(() => active && setLoading(false))
    return () => {
      active = false
    }
  }, [id, isEditing])

  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setImageError(null)
    setSaving(true)

    try {
      // Upload any newly-picked files first, in slot order. If any upload fails, we stop
      // here and never touch the product record.
      const originalPaths = imageSlots.filter((s) => s.kind === 'existing').map((s) => s.path)
      const finalPaths = []
      for (const slot of imageSlots) {
        if (slot.kind === 'existing') {
          finalPaths.push(slot.path)
        } else {
          finalPaths.push(await uploadProductImage(slot.file))
        }
      }

      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        short_description: form.short_description.trim() || null,
        description: form.description.trim() || null,
        category_id: form.category_id || null,
        image_path: finalPaths[0] || null,
        image_paths: finalPaths,
        types: form.types
          .split(',')
          .map((c) => c.trim())
          .filter(Boolean),
        size: form.size.trim() || null,
        availability: form.availability,
        note: form.note.trim() || null,
        featured: form.featured,
        is_new: form.is_new,
        display_order: Number(form.display_order) || 0,
      }

      if (isEditing) {
        await updateProduct(id, payload)
      } else {
        await createProduct(payload)
      }

      // Clean up any images that were removed or replaced, now that the save succeeded.
      const removed = originalPaths.filter((p) => !finalPaths.includes(p))
      await Promise.all(removed.map((p) => deleteProductImage(p)))

      navigate('/admin/products')
    } catch (err) {
      console.error(err)
      if (err.message?.toLowerCase().includes('image')) {
        setImageError(err.message)
      } else {
        setError('We couldn\u2019t save the product. Please try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading product…" />

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-ink">
        {isEditing ? 'Edit Product' : 'Add Product'}
      </h1>

      <form onSubmit={handleSubmit} className="card flex flex-col gap-5 p-6">
        <div>
          <label className="label-field" htmlFor="name">Product Name</label>
          <input
            id="name"
            required
            value={form.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Crochet Tulip"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field" htmlFor="price">Price (₱)</label>
            <input
              id="price"
              type="number"
              min="0"
              step="0.01"
              required
              value={form.price}
              onChange={(e) => updateField('price', e.target.value)}
              placeholder="150"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="category">Category</label>
            <select
              id="category"
              value={form.category_id}
              onChange={(e) => updateField('category_id', e.target.value)}
              className="input-field"
            >
              <option value="">Uncategorized</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="short_description">Short Description</label>
          <input
            id="short_description"
            value={form.short_description}
            onChange={(e) => updateField('short_description', e.target.value)}
            placeholder="A handmade crochet tulip available in different types."
            className="input-field"
          />
        </div>

        <div>
          <label className="label-field" htmlFor="description">Detailed Description (optional)</label>
          <textarea
            id="description"
            rows={4}
            value={form.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="input-field"
          />
        </div>

        <ImageUploader slots={imageSlots} onChange={setImageSlots} error={imageError} />

        <div>
          <label className="label-field" htmlFor="types">Available Types (comma-separated)</label>
          <input
            id="types"
            value={form.types}
            onChange={(e) => updateField('types', e.target.value)}
            placeholder="Small, Medium, Large"
            className="input-field"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-field" htmlFor="size">Size (optional)</label>
            <input
              id="size"
              value={form.size}
              onChange={(e) => updateField('size', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="availability">Availability</label>
            <select
              id="availability"
              value={form.availability}
              onChange={(e) => updateField('availability', e.target.value)}
              className="input-field"
            >
              {AVAILABILITY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="label-field" htmlFor="note">Note (optional)</label>
          <input
            id="note"
            value={form.note}
            onChange={(e) => updateField('note', e.target.value)}
            placeholder="Custom types may be requested."
            className="input-field"
          />
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => updateField('featured', e.target.checked)}
              className="h-4 w-4 rounded border-ink/20 text-peach focus:ring-peach"
            />
            Featured
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={form.is_new}
              onChange={(e) => updateField('is_new', e.target.checked)}
              className="h-4 w-4 rounded border-ink/20 text-peach focus:ring-peach"
            />
            New Product
          </label>
          <div className="flex items-center gap-2">
            <label className="font-body text-sm text-ink" htmlFor="display_order">Display Order</label>
            <input
              id="display_order"
              type="number"
              value={form.display_order}
              onChange={(e) => updateField('display_order', e.target.value)}
              className="input-field w-24"
            />
          </div>
        </div>

        {error && <p className="font-body text-sm text-peach">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1">
            {saving ? 'Saving…' : 'Save Product'}
          </button>
          <button type="button" onClick={() => navigate('/admin/products')} className="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
