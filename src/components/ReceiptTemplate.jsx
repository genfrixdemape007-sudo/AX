import { forwardRef } from 'react'
import { getPublicImageUrl } from '../services/storageService'

const STATUS_STYLES = {
  paid: 'bg-olive/20 text-olive',
  partial: 'bg-gold/20 text-gold',
  unpaid: 'bg-peach/15 text-peach',
}
const STATUS_LABEL = { paid: 'Paid', partial: 'Partial', unpaid: 'Pending' }

function fmt(currency, n) {
  return `${currency || '₱'}${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function niceDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// `order` shape: { order_no?, order_date, due_date?, customer, contact?, items, subtotal,
//   discount_amount?, fees?, total, total_paid?, balance?, status?, notes? }
// `settings` shape: site_settings row (business_name, tagline, logo_path, payment_qr_path,
//   how_to_pay_text, receipt_footer_text, contact fields).
// `preview` = true hides order #/status/balance (used by Cart, which has no DB record).
const ReceiptTemplate = forwardRef(function ReceiptTemplate({ order, settings, preview = false }, ref) {
  const currency = '₱'
  const logoUrl = getPublicImageUrl(settings?.logo_path)
  const qrUrl = getPublicImageUrl(settings?.payment_qr_path)
  const status = order.status || 'unpaid'

  return (
    <div ref={ref} className="mx-auto w-full max-w-sm rounded-stitch border border-ink/10 bg-surface p-6 shadow-soft" id="receipt-print-area">
      {!preview && (
        <div className="mb-2 flex justify-center">
          <span className={`rounded-full px-3 py-1 font-body text-xs font-bold ${STATUS_STYLES[status]}`}>
            {STATUS_LABEL[status]}
          </span>
        </div>
      )}

      <div className="flex flex-col items-center text-center">
        {logoUrl ? (
          <img src={logoUrl} alt="" className="h-14 w-14 rounded-full object-cover shadow-gentle" />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-daisy/60 text-2xl">🧶</span>
        )}
        <h2 className="mt-2 font-heading text-xl font-semibold text-ink">{settings?.business_name || 'AXKN07 Crochet'}</h2>
        {settings?.tagline && <p className="font-body text-xs text-ink-soft">{settings.tagline}</p>}
        {settings?.contact_url && <p className="mt-0.5 font-body text-[11px] text-ink-soft">{settings.contact_url}</p>}
      </div>

      <div className="stitch-divider my-4" />

      <div className="space-y-1 font-body text-sm">
        {!preview && order.order_no && (
          <div className="flex justify-between"><span className="text-ink-soft">Order #</span><b className="text-ink">{order.order_no}</b></div>
        )}
        <div className="flex justify-between"><span className="text-ink-soft">Date</span><b className="text-ink">{niceDate(order.order_date) || 'Today'}</b></div>
        {order.due_date && (
          <div className="flex justify-between"><span className="text-ink-soft">Due</span><b className="text-ink">{niceDate(order.due_date)}</b></div>
        )}
        <div className="flex justify-between"><span className="text-ink-soft">Customer</span><b className="text-ink">{order.customer || 'Walk-in'}</b></div>
        {order.contact && (
          <div className="flex justify-between"><span className="text-ink-soft">Contact</span><b className="text-ink">{order.contact}</b></div>
        )}
      </div>

      <div className="stitch-divider my-4" />

      <div className="space-y-1.5 font-body text-sm">
        {(order.items || []).map((it, i) => (
          <div key={i} className="flex justify-between gap-3">
            <span className="text-ink">
              {it.name} {it.type ? <span className="text-ink-soft">({it.type})</span> : null}{' '}
              <span className="text-ink-soft">×{it.qty}</span>
            </span>
            <span className="shrink-0 text-ink">{fmt(currency, it.qty * it.price)}</span>
          </div>
        ))}
      </div>

      <div className="stitch-divider my-4" />

      <div className="space-y-1.5 font-body text-sm">
        <div className="flex justify-between"><span className="text-ink-soft">Subtotal</span><span className="text-ink">{fmt(currency, order.subtotal)}</span></div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between"><span className="text-ink-soft">Discount</span><span className="text-olive">− {fmt(currency, order.discount_amount)}</span></div>
        )}
        {(order.fees || []).map((f, i) => (
          <div key={i} className="flex justify-between"><span className="text-ink-soft">{f.label || 'Fee'}</span><span className="text-ink">+ {fmt(currency, f.amount)}</span></div>
        ))}
        <div className="flex justify-between border-t border-ink/10 pt-1.5 font-heading text-base font-semibold text-ink">
          <span>Total</span><span>{fmt(currency, order.total)}</span>
        </div>
        {!preview && (
          <>
            <div className="flex justify-between"><span className="text-ink-soft">Amount paid</span><span className="text-ink">{fmt(currency, order.total_paid)}</span></div>
            <div className={`flex justify-between font-semibold ${order.balance <= 0 ? 'text-olive' : 'text-peach'}`}>
              <span>{order.balance <= 0 ? 'Balance' : 'Balance due'}</span><span>{fmt(currency, order.balance)}</span>
            </div>
          </>
        )}
      </div>

      {order.notes && (
        <>
          <div className="stitch-divider my-4" />
          <p className="font-body text-xs text-ink-soft">{order.notes}</p>
        </>
      )}

      {qrUrl && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <img src={qrUrl} alt="Payment QR" className="h-28 w-28 rounded-cozy border border-ink/10 object-cover" />
          <span className="font-body text-[11px] text-ink-soft">Scan to pay</span>
        </div>
      )}

      <div className="mt-4 text-center">
        <p className="font-body text-xs text-ink-soft">{settings?.receipt_footer_text || 'Thank you so much for supporting a small business! 🌸'}</p>
        <p className="mt-1 font-body text-[10px] text-ink-soft/60">
          {preview ? 'Order summary — awaiting confirmation' : 'AXKN07 Crochet Pricing Studio'}
        </p>
      </div>
    </div>
  )
})

export default ReceiptTemplate
