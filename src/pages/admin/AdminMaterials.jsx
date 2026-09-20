import { useState } from 'react'
import { useMaterials } from '../../hooks/useMaterials'
import { createMaterial, deleteMaterial, updateMaterial } from '../../services/materialService'
import { Spinner } from '../../components/LoadingStates'
import { ErrorState } from '../../components/EmptyState'
import EmptyState from '../../components/EmptyState'
import ConfirmDialog from '../../components/ConfirmDialog'

const EMPTY = { name: '', cost_per_unit: '', unit: 'pc', notes: '' }

export default function AdminMaterials() {
  const { materials, loading, error, refresh } = useMaterials()
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const resetForm = () => {
    setForm(EMPTY)
    setEditingId(null)
  }

  const startEdit = (m) => {
    setEditingId(m.id)
    setForm({ name: m.name, cost_per_unit: m.cost_per_unit, unit: m.unit, notes: m.notes || '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    setFormError(null)
    try {
      const payload = {
        name: form.name.trim(),
        cost_per_unit: Number(form.cost_per_unit) || 0,
        unit: form.unit.trim() || 'pc',
        notes: form.notes.trim() || null,
      }
      if (editingId) await updateMaterial(editingId, payload)
      else await createMaterial(payload)
      resetForm()
      refresh()
    } catch (err) {
      console.error(err)
      setFormError('We couldn\u2019t save that material. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    try {
      await deleteMaterial(pendingDelete.id)
      setPendingDelete(null)
      refresh()
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">Materials</h1>
        <p className="font-body text-sm text-ink-soft">Yarn and supply costs used by the Calculator.</p>
      </div>

      <form onSubmit={handleSubmit} className="card mb-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-[2fr,1fr,1fr,2fr,auto]">
        <input
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          placeholder="Material name (e.g. Cotton yarn)"
          className="input-field"
          required
        />
        <input
          type="number"
          min="0"
          step="0.01"
          value={form.cost_per_unit}
          onChange={(e) => setForm((f) => ({ ...f, cost_per_unit: e.target.value }))}
          placeholder="Cost"
          className="input-field"
          required
        />
        <input
          value={form.unit}
          onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
          placeholder="Unit (skein, g, pc)"
          className="input-field"
        />
        <input
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Notes (optional)"
          className="input-field"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={saving} className="btn-primary flex-1 sm:flex-none">
            {editingId ? 'Save' : 'Add'}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="btn-secondary flex-1 sm:flex-none">
              Cancel
            </button>
          )}
        </div>
        {formError && <p className="col-span-full font-body text-sm text-peach">{formError}</p>}
      </form>

      {loading && <Spinner label="Loading materials…" />}
      {!loading && error && <ErrorState message={error} onRetry={refresh} />}
      {!loading && !error && materials.length === 0 && (
        <EmptyState title="No materials yet." message="Add your yarn and supply costs above to use them in the Calculator." />
      )}

      {!loading && !error && materials.length > 0 && (
        <div className="card overflow-hidden">
          <div className="divide-y divide-ink/5">
            {materials.map((m) => (
              <div key={m.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-body text-sm font-semibold text-ink">{m.name}</p>
                  <p className="font-body text-xs text-ink-soft">
                    ₱{Number(m.cost_per_unit).toFixed(2)} / {m.unit}
                    {m.notes ? ` · ${m.notes}` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(m)} className="rounded-full px-4 py-2 font-body text-sm font-semibold text-peach hover:bg-peach/10">
                    Edit
                  </button>
                  <button onClick={() => setPendingDelete(m)} className="rounded-full px-4 py-2 font-body text-sm font-semibold text-ink-soft hover:bg-daisy/40">
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
        title="Delete material?"
        message={`This will remove "${pendingDelete?.name}" from your materials list.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
