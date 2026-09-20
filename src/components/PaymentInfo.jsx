import { useSiteSettings } from '../contexts/SettingsContext.jsx'
import { getPublicImageUrl } from '../services/storageService'

export default function PaymentInfo() {
  const { settings } = useSiteSettings()
  const qrUrl = getPublicImageUrl(settings?.payment_qr_path)

  if (!settings?.how_to_pay_text && !qrUrl) return null

  return (
    <div className="card flex flex-col items-center gap-4 p-6 text-center sm:flex-row sm:items-start sm:text-left">
      {qrUrl && (
        <div className="w-32 shrink-0 overflow-hidden rounded-cozy border-2 border-peach/20 bg-surface-soft p-2">
          <img src={qrUrl} alt="GCash / Maya payment QR code" className="h-full w-full object-contain" />
        </div>
      )}
      <div>
        <h3 className="font-heading text-lg font-semibold text-ink">How to Pay 💳</h3>
        {settings?.how_to_pay_text && (
          <p className="mt-1 font-body text-sm text-ink-soft">{settings.how_to_pay_text}</p>
        )}
      </div>
    </div>
  )
}
