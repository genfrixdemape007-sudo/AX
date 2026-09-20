import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart, MAX_QTY_PER_LINE } from '../../contexts/CartContext.jsx'
import { useSiteSettings } from '../../contexts/SettingsContext.jsx'
import { getPublicImageUrl } from '../../services/storageService'
import { buildOrderText } from '../../services/settingsService'
import { saveNodeAsImage } from '../../lib/exportImage'
import MessageToOrderButton from '../../components/MessageToOrderButton'
import ReceiptTemplate from '../../components/ReceiptTemplate'
import EmptyState from '../../components/EmptyState'
import PaymentInfo from '../../components/PaymentInfo'

function formatAmount(num) {
  return Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

export default function Cart() {
  const { items, updateQty, removeItem, subtotal, clearCart } = useCart()
  const { settings } = useSiteSettings()
  const [customerName, setCustomerName] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [toast, setToast] = useState(null)
  const cardRef = useRef(null)

  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2200)
  }

  const orderText = buildOrderText({ items, subtotal, customerName, customerNote })

  // A client-side-only "receipt" preview — no order record is created here, this is
  // purely what the customer sees/downloads before messaging it in.
  const previewOrder = {
    customer: customerName || 'You',
    order_date: new Date().toISOString().slice(0, 10),
    items: items.map((it) => ({ name: it.name, qty: it.qty, price: it.price, type: it.type })),
    subtotal,
    total: subtotal,
    notes: customerNote || null,
  }

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(orderText)
      showToast('Order copied as text 📋')
    } catch {
      showToast("Couldn't copy — try selecting the text manually")
    }
  }

  const handleSaveImage = async () => {
    try {
      const ok = await saveNodeAsImage(cardRef.current, `order-${Date.now()}.png`)
      if (ok) showToast('Order image saved 🖼️')
    } catch (err) {
      console.error('Order PNG export failed:', err)
      showToast("Couldn't save the image — try Copy as Text instead")
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <EmptyState
          icon="🛒"
          title="Your cart is empty"
          message="Browse the price list and add a few pieces you'd like to order."
          action={
            <Link to="/prices" className="btn-primary mt-2">
              Browse Price List
            </Link>
          }
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-10">
      <h1 className="mb-6 text-center font-heading text-2xl font-semibold text-ink sm:text-3xl">
        Your Order 🛒
      </h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Editable line items */}
        <div className="flex flex-col gap-3">
          {items.map((it) => {
            const imageUrl = getPublicImageUrl(it.image_path)
            return (
              <div key={it.key} className="card flex items-center gap-3 p-3">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-cozy bg-daisy/40">
                  {imageUrl ? (
                    <img src={imageUrl} alt={it.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl">🧶</div>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-heading text-sm font-semibold text-ink">{it.name}</div>
                  {it.type && <div className="font-body text-xs text-ink-soft">Type: {it.type}</div>}
                  <div className="font-body text-sm font-semibold text-peach">₱{formatAmount(it.price)}</div>
                </div>

                <div className="flex items-center gap-2 rounded-full border-2 border-peach/30 px-2 py-1">
                  <button
                    type="button"
                    onClick={() => updateQty(it.key, it.qty - 1)}
                    className="font-heading text-ink-soft hover:text-ink"
                    aria-label={`Decrease quantity of ${it.name}`}
                  >
                    −
                  </button>
                  <span className="w-4 text-center font-body text-sm font-semibold text-ink">{it.qty}</span>
                  <button
                    type="button"
                    onClick={() => updateQty(it.key, Math.min(MAX_QTY_PER_LINE, it.qty + 1))}
                    disabled={it.qty >= MAX_QTY_PER_LINE}
                    className="font-heading text-ink-soft hover:text-ink disabled:opacity-30"
                    aria-label={`Increase quantity of ${it.name}`}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(it.key)}
                  className="ml-1 font-body text-lg text-ink-soft hover:text-peach"
                  aria-label={`Remove ${it.name}`}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            )
          })}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="input-field !py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Note (optional)"
              value={customerNote}
              onChange={(e) => setCustomerNote(e.target.value)}
              className="input-field !py-2 text-sm"
            />
          </div>

          <button type="button" onClick={clearCart} className="self-start font-body text-xs text-ink-soft hover:text-peach">
            Clear cart
          </button>
        </div>

        {/* Preview + actions */}
        <div className="flex flex-col items-center gap-4">
          <ReceiptTemplate ref={cardRef} order={previewOrder} settings={settings} preview />

          <div className="flex w-full max-w-sm flex-col gap-2">
            <div className="flex gap-2">
              <button type="button" onClick={handleCopyText} className="btn-secondary flex-1 !px-4 !py-2 text-sm">
                📋 Copy as Text
              </button>
              <button type="button" onClick={handleSaveImage} className="btn-secondary flex-1 !px-4 !py-2 text-sm">
                🖼️ Save as Image
              </button>
            </div>

            <MessageToOrderButton text={orderText} full>
              Send Order via Messenger
            </MessageToOrderButton>

            {!settings?.contact_url && (
              <p className="text-center font-body text-xs text-ink-soft">
                Messaging isn't set up yet — you can still copy the order as text or save it as an image to send yourself.
              </p>
            )}

            <div className="mt-2">
              <PaymentInfo />
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 rounded-full bg-ink px-4 py-2 font-body text-sm text-surface shadow-soft">
          {toast}
        </div>
      )}
    </div>
  )
}
