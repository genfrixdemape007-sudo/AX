import { useSiteSettings } from '../contexts/SettingsContext.jsx'
import { buildMessageLink } from '../services/settingsService'

// The final "send the order" step — used once, on the cart/checkout page. Individual
// product cards no longer have their own Message button; items are collected in the
// cart first and sent as a single message when the customer checks out.
export default function MessageToOrderButton({ text, className = '', full = false, children }) {
  const { settings } = useSiteSettings()
  const link = settings?.contact_url ? buildMessageLink(settings.contact_url, text) : null

  if (!link) {
    return null
  }

  return (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={`btn-primary ${full ? 'w-full' : ''} ${className}`}
    >
      <span aria-hidden="true">💬</span> {children || 'Message to Order'}
    </a>
  )
}
