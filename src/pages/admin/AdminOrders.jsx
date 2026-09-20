import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts } from '../../hooks/useProducts'
import { useCategories } from '../../hooks/useCategories'
import { useSettings } from '../../hooks/useSettings'
import { createOrder, calcOrderTotals } from '../../services/orderService'
import { saveNodeAsImage } from '../../lib/exportImage'
import ReceiptTemplate from '../../components/ReceiptTemplate'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

const BLANK_ORDER = {
  customer: '',
  contact: '',
  order_date: todayISO(),
  due_date: '',
  items: [],
  discount_type: 'none',
  discount_value: 0,
  fees: [],
  downpayment: 0,
  received: 0,
  notes: '',
}

export default function AdminOrders() {
  const { categories } = useCategories()
  const { products } = useProducts({ categories })
  const { settings } = useSettings()
  const navigate = useNavigate()
  const receiptRef = useRef(null)

  const [order, setOrder] = useState(BLANK_ORDER)
  const [productId, setProductId] = useState('')
  const [customName, setCustomName] = useState('')
  const [customQty, setCustomQty] = useState(1)
  const [customPrice, setCustomPrice] = useState('')
  const [feeLabel, setFeeLabel] = useState('')
  const [feeAmount, setFeeAmount] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [savedOrder, setSavedOrder] = useState(null)

  const totals = useMemo(() => calcOrderTotals(order, settings), [order, settings])

  const addFromCatalog = () => {
    const product = products.find((p) => p.id === productId)
    if (!product) return
    setOrder((o) => ({ ...o, items: [...o.items, { name: product.name, qty: 1, price: Number(product.price) }] }))
    setProductId('')
  }

  const addCustomItem = () => {
    if (!customName.trim() || !customPrice) return
    setOrder((o) => ({
      ...o,
      items: [...o.items, { name: customName.trim(), qty: Number(customQty) || 1, price: Number(customPrice) }],
    }))
    setCustomName('')
    setCustomQty(1)
    setCustomPrice('')
  }

  const updateItemQty = (i, qty) => {
    setOrder((o) => ({ ...o, items: o.items.map((it, idx) => (idx === i ? { ...it, qty: Math.max(1, qty) } : it)) }))
  }

  const removeItem = (i) => setOrder((o) => ({ ...o, items: o.items.filter((_, idx) => idx !== i) }))

  const addFee = () => {
    if (!feeAmount) return
    setOrder((o) => ({ ...o, fees: [...o.fees, { label: feeLabel.trim() || 'Fee', amount: Number(feeAmount) }] }))
    setFeeLabel('')
    setFeeAmount('')
  }
  const removeFee = (i) => setOrder((o) => ({ ...o, fees: o.fees.filter((_, idx) => idx !== i) }))

  const handleSave = async () => {
    if (!order.customer.trim() || order.items.length === 0) {
      setError('Add a customer name and at least one item first.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const saved = await createOrder(order, settings)
      setSavedOrder(saved)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t save this order. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const startNewOrder = () => {
    setSavedOrder(null)
    setOrder(BLANK_ORDER)
  }

  const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  if (savedOrder) {
    return (
      <div>
        <div className="mb-6 flex items-center justify-between">
          <h1 className="font-heading text-2xl font-semibold text-ink">Receipt — {savedOrder.order_no}</h1>
          <button onClick={startNewOrder} className="btn-secondary">+ New Order</button>
        </div>
        <ReceiptTemplate ref={receiptRef} order={savedOrder} settings={settings} />
        <div className="mx-auto mt-4 flex max-w-sm gap-3">
          <button
            onClick={() => saveNodeAsImage(receiptRef.current, `${savedOrder.order_no}.png`)}
            className="btn-secondary flex-1"
          >
            Save as Image
          </button>
          <button onClick={() => navigate('/admin/receipts')} className="btn-primary flex-1">
            View Receipt Log
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">New Order</h1>
        <p className="font-body text-sm text-ink-soft">Build an order and generate a receipt.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="flex flex-col gap-5">
          <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="customer">Customer name</label>
              <input id="customer" value={order.customer} onChange={(e) => setOrder((o) => ({ ...o, customer: e.target.value }))} className="input-field" required />
            </div>
            <div>
              <label className="label-field" htmlFor="contact">Contact (optional)</label>
              <input id="contact" value={order.contact} onChange={(e) => setOrder((o) => ({ ...o, contact: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-field" htmlFor="order_date">Order date</label>
              <input id="order_date" type="date" value={order.order_date} onChange={(e) => setOrder((o) => ({ ...o, order_date: e.target.value }))} className="input-field" />
            </div>
            <div>
              <label className="label-field" htmlFor="due_date">Due date (optional)</label>
              <input id="due_date" type="date" value={order.due_date} onChange={(e) => setOrder((o) => ({ ...o, due_date: e.target.value }))} className="input-field" />
            </div>
          </div>

          <div className="card p-5">
            <label className="label-field">Add from Products</label>
            <div className="flex gap-2">
              <select value={productId} onChange={(e) => setProductId(e.target.value)} className="input-field flex-1">
                <option value="">Choose a product…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — ₱{p.price}</option>
                ))}
              </select>
              <button type="button" onClick={addFromCatalog} className="btn-secondary shrink-0">Add</button>
            </div>

            <label className="label-field mt-4">Or add a custom item</label>
            <div className="flex flex-wrap gap-2">
              <input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Item name" className="input-field flex-1" />
              <input type="number" min="1" value={customQty} onChange={(e) => setCustomQty(e.target.value)} placeholder="Qty" className="input-field w-20" />
              <input type="number" min="0" step="0.01" value={customPrice} onChange={(e) => setCustomPrice(e.target.value)} placeholder="Price" className="input-field w-28" />
              <button type="button" onClick={addCustomItem} className="btn-secondary shrink-0">Add</button>
            </div>

            {order.items.length > 0 && (
              <div className="mt-4 divide-y divide-ink/5 border-t border-ink/5">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 py-2">
                    <span className="font-body text-sm text-ink">{it.name}</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        value={it.qty}
                        onChange={(e) => updateItemQty(i, Number(e.target.value))}
                        className="input-field w-16 !py-1"
                      />
                      <span className="w-20 text-right font-body text-sm text-ink">{fmt(it.qty * it.price)}</span>
                      <button onClick={() => removeItem(i)} className="text-ink-soft hover:text-peach">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
            <div>
              <label className="label-field" htmlFor="discount_type">Discount</label>
              <select
                id="discount_type"
                value={order.discount_type}
                onChange={(e) => setOrder((o) => ({ ...o, discount_type: e.target.value }))}
                className="input-field"
              >
                <option value="none">None</option>
                <option value="percent">Percent (%)</option>
                <option value="flat">Flat amount</option>
                <option value="bulk">Bulk rule (from Settings)</option>
              </select>
            </div>
            {order.discount_type !== 'none' && order.discount_type !== 'bulk' && (
              <div>
                <label className="label-field" htmlFor="discount_value">
                  {order.discount_type === 'percent' ? 'Discount %' : 'Discount amount'}
                </label>
                <input
                  id="discount_value"
                  type="number"
                  min="0"
                  value={order.discount_value}
                  onChange={(e) => setOrder((o) => ({ ...o, discount_value: Number(e.target.value) }))}
                  className="input-field"
                />
              </div>
            )}

            <div className="col-span-full">
              <label className="label-field">Fees (shipping, rush, etc.)</label>
              <div className="flex flex-wrap gap-2">
                <input value={feeLabel} onChange={(e) => setFeeLabel(e.target.value)} placeholder="Label" className="input-field flex-1" />
                <input type="number" min="0" step="0.01" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} placeholder="Amount" className="input-field w-28" />
                <button type="button" onClick={addFee} className="btn-secondary shrink-0">Add</button>
              </div>
              {order.fees.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {order.fees.map((f, i) => (
                    <span key={i} className="chip">
                      {f.label}: {fmt(f.amount)}
                      <button onClick={() => removeFee(i)} className="ml-2 text-ink-soft hover:text-peach">✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="label-field" htmlFor="downpayment">Downpayment received</label>
              <input
                id="downpayment"
                type="number"
                min="0"
                step="0.01"
                value={order.downpayment}
                onChange={(e) => setOrder((o) => ({ ...o, downpayment: Number(e.target.value) }))}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="received">Full amount received (if paid in full)</label>
              <input
                id="received"
                type="number"
                min="0"
                step="0.01"
                value={order.received}
                onChange={(e) => setOrder((o) => ({ ...o, received: Number(e.target.value) }))}
                className="input-field"
              />
            </div>

            <div className="col-span-full">
              <label className="label-field" htmlFor="notes">Notes (optional)</label>
              <input id="notes" value={order.notes} onChange={(e) => setOrder((o) => ({ ...o, notes: e.target.value }))} className="input-field" />
            </div>
          </div>

          {error && <p className="font-body text-sm text-peach">{error}</p>}

          <button onClick={handleSave} disabled={saving} className="btn-primary">
            {saving ? 'Saving…' : 'Save Order & Generate Receipt'}
          </button>
        </div>

        <div>
          <p className="mb-2 font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">Live Preview</p>
          <ReceiptTemplate
            order={{ ...order, ...totals, discount_amount: totals.discountAmount, total_paid: totals.totalPaid, fees_total: totals.feesTotal }}
            settings={settings}
          />
        </div>
      </div>
    </div>
  )
}
