import { useEffect, useState } from 'react'
import { useSiteSettings } from '../../contexts/SettingsContext.jsx'
import { updateSettings } from '../../services/settingsService'
import { uploadProductImage, deleteProductImage, getPublicImageUrl } from '../../services/storageService'
import { Spinner } from '../../components/LoadingStates'
import { ErrorState } from '../../components/EmptyState'

const EMPTY_FORM = {
  business_name: '',
  tagline: '',
  contact_url: '',
  welcome_message: '',
  tutorial_content: '',
  price_disclaimer: '',
  how_to_pay_text: '',
  made_to_order_note: '',
  limited_stock_note: '',
  default_hourly_rate: 60,
  default_margin_pct: 35,
  bulk_discount_qty: 5,
  bulk_discount_pct: 10,
  receipt_footer_text: '',
}

export default function AdminSettings() {
  const { settings, loading, error, refresh } = useSiteSettings()
  const [form, setForm] = useState(EMPTY_FORM)
  const [logoFile, setLogoFile] = useState(null)
  const [qrFile, setQrFile] = useState(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!settings) return
    setForm({
      business_name: settings.business_name || '',
      tagline: settings.tagline || '',
      contact_url: settings.contact_url || '',
      welcome_message: settings.welcome_message || '',
      tutorial_content: settings.tutorial_content || '',
      price_disclaimer: settings.price_disclaimer || '',
      how_to_pay_text: settings.how_to_pay_text || '',
      made_to_order_note: settings.made_to_order_note || '',
      limited_stock_note: settings.limited_stock_note || '',
      default_hourly_rate: settings.default_hourly_rate ?? 60,
      default_margin_pct: settings.default_margin_pct ?? 35,
      bulk_discount_qty: settings.bulk_discount_qty ?? 5,
      bulk_discount_pct: settings.bulk_discount_pct ?? 10,
      receipt_footer_text: settings.receipt_footer_text || '',
    })
  }, [settings])

  const updateField = (field, value) => {
    setSaved(false)
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)
    setSaved(false)
    try {
      let logo_path = settings?.logo_path || null
      if (logoFile) {
        logo_path = await uploadProductImage(logoFile, 'branding')
        if (settings?.logo_path) {
          await deleteProductImage(settings.logo_path)
        }
      }

      let payment_qr_path = settings?.payment_qr_path || null
      if (qrFile) {
        payment_qr_path = await uploadProductImage(qrFile, 'branding')
        if (settings?.payment_qr_path) {
          await deleteProductImage(settings.payment_qr_path)
        }
      }

      await updateSettings(settings.id, { ...form, logo_path, payment_qr_path })
      await refresh()
      setLogoFile(null)
      setQrFile(null)
      setSaved(true)
    } catch (err) {
      console.error(err)
      setSaveError('We couldn\u2019t save your settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner label="Loading settings…" />
  if (error) return <ErrorState message={error} onRetry={refresh} />

  const logoUrl = logoFile ? URL.createObjectURL(logoFile) : getPublicImageUrl(settings?.logo_path)

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 font-heading text-2xl font-semibold text-ink">Settings</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <section className="card flex flex-col gap-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Business</h2>
          <div>
            <label className="label-field" htmlFor="business_name">Business Name</label>
            <input
              id="business_name"
              value={form.business_name}
              onChange={(e) => updateField('business_name', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="tagline">Tagline</label>
            <input
              id="tagline"
              value={form.tagline}
              onChange={(e) => updateField('tagline', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="contact_url">Contact URL (e.g. Facebook Messenger link)</label>
            <input
              id="contact_url"
              type="url"
              value={form.contact_url}
              onChange={(e) => updateField('contact_url', e.target.value)}
              placeholder="https://m.me/yourpage"
              className="input-field"
            />
            <p className="mt-1 font-body text-xs text-ink-soft">
              This powers every "Message to Order" button across the site.
            </p>
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Customer Welcome</h2>
          <div>
            <label className="label-field" htmlFor="welcome_message">Welcome Message</label>
            <textarea
              id="welcome_message"
              rows={3}
              value={form.welcome_message}
              onChange={(e) => updateField('welcome_message', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="tutorial_content">Tutorial Instructions</label>
            <textarea
              id="tutorial_content"
              rows={3}
              value={form.tutorial_content}
              onChange={(e) => updateField('tutorial_content', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="price_disclaimer">Price Disclaimer</label>
            <textarea
              id="price_disclaimer"
              rows={2}
              value={form.price_disclaimer}
              onChange={(e) => updateField('price_disclaimer', e.target.value)}
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field" htmlFor="made_to_order_note">Made to Order note</label>
            <input
              id="made_to_order_note"
              value={form.made_to_order_note}
              onChange={(e) => updateField('made_to_order_note', e.target.value)}
              placeholder="Made to order — please allow 3–5 days before shipping."
              className="input-field"
            />
            <p className="mt-1 font-body text-xs text-ink-soft">
              Shown under products marked "Made to Order." Leave blank to hide.
            </p>
          </div>
          <div>
            <label className="label-field" htmlFor="limited_stock_note">Limited stock note</label>
            <input
              id="limited_stock_note"
              value={form.limited_stock_note}
              onChange={(e) => updateField('limited_stock_note', e.target.value)}
              placeholder="Limited stock — order soon before it's gone."
              className="input-field"
            />
            <p className="mt-1 font-body text-xs text-ink-soft">
              Shown under products marked "Limited." Leave blank to hide.
            </p>
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">How to Pay</h2>
          <div>
            <label className="label-field" htmlFor="how_to_pay_text">Payment Instructions</label>
            <textarea
              id="how_to_pay_text"
              rows={3}
              value={form.how_to_pay_text}
              onChange={(e) => updateField('how_to_pay_text', e.target.value)}
              placeholder="Pay via GCash or Maya using the QR code below…"
              className="input-field"
            />
          </div>
          <div>
            <label className="label-field">Payment QR Code (GCash / Maya)</label>
            <div className="flex items-center gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-cozy border-2 border-dashed border-ink/10 bg-surface-soft">
                {qrFile ? (
                  <img src={URL.createObjectURL(qrFile)} alt="Payment QR preview" className="h-full w-full object-contain" />
                ) : getPublicImageUrl(settings?.payment_qr_path) ? (
                  <img
                    src={getPublicImageUrl(settings.payment_qr_path)}
                    alt="Payment QR code"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-2xl" aria-hidden="true">💳</span>
                )}
              </div>
              <label className="btn-secondary cursor-pointer !px-4 !py-2 text-sm">
                Upload QR Image
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => setQrFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
            <p className="mt-1 font-body text-xs text-ink-soft">
              This appears alongside your payment instructions on the site.
            </p>
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Branding</h2>
          <div>
            <label className="label-field">Logo</label>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-cozy border-2 border-dashed border-ink/10 bg-surface-soft">
                {logoUrl ? (
                  <img src={logoUrl} alt="Business logo" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl" aria-hidden="true">🌷</span>
                )}
              </div>
              <label className="btn-secondary cursor-pointer !px-4 !py-2 text-sm">
                Upload Logo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        </section>

        <section className="card flex flex-col gap-4 p-6">
          <h2 className="font-heading text-lg font-semibold text-ink">Calculator &amp; Receipt Defaults</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="default_hourly_rate">Default hourly rate (₱)</label>
              <input
                id="default_hourly_rate"
                type="number"
                min="0"
                value={form.default_hourly_rate}
                onChange={(e) => updateField('default_hourly_rate', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="default_margin_pct">Default margin (%)</label>
              <input
                id="default_margin_pct"
                type="number"
                min="0"
                max="95"
                value={form.default_margin_pct}
                onChange={(e) => updateField('default_margin_pct', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="bulk_discount_qty">Bulk discount at (qty)</label>
              <input
                id="bulk_discount_qty"
                type="number"
                min="1"
                value={form.bulk_discount_qty}
                onChange={(e) => updateField('bulk_discount_qty', e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="label-field" htmlFor="bulk_discount_pct">Bulk discount (%)</label>
              <input
                id="bulk_discount_pct"
                type="number"
                min="0"
                max="100"
                value={form.bulk_discount_pct}
                onChange={(e) => updateField('bulk_discount_pct', e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          <div>
            <label className="label-field" htmlFor="receipt_footer_text">Receipt footer message</label>
            <input
              id="receipt_footer_text"
              value={form.receipt_footer_text}
              onChange={(e) => updateField('receipt_footer_text', e.target.value)}
              className="input-field"
            />
          </div>
        </section>

        {saveError && <p className="font-body text-sm text-peach">{saveError}</p>}
        {saved && <p className="font-body text-sm text-olive">Settings saved.</p>}

        <button type="submit" disabled={saving} className="btn-primary w-fit">
          {saving ? 'Saving…' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}
