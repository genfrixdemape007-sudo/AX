import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useSiteSettings } from '../contexts/SettingsContext.jsx'
import { getPublicImageUrl } from '../services/storageService'
import Logo from './Logo'

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/admin/products', label: 'Products', icon: '🧶' },
  { to: '/admin/categories', label: 'Categories', icon: '🗂️' },
  { to: '/admin/calculator', label: 'Calculator', icon: '🧮' },
  { to: '/admin/materials', label: 'Materials', icon: '🧵' },
  { to: '/admin/orders', label: 'Orders', icon: '🛒' },
  { to: '/admin/receipts', label: 'Receipt Log', icon: '🧾' },
  { to: '/admin/queue', label: 'Queue', icon: '📋' },
  { to: '/admin/stats', label: 'Statistics', icon: '📊' },
  { to: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminSidebar({ onNavigate }) {
  const { signOut } = useAuth()
  const { settings } = useSiteSettings()
  const logoUrl = getPublicImageUrl(settings?.logo_path)

  return (
    <div className="hero-dark flex h-full flex-col p-5">
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {logoUrl ? (
            <img src={logoUrl} alt={settings?.business_name} className="h-9 w-9 rounded-full object-cover shadow-gentle" />
          ) : (
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface/10 text-surface" aria-hidden="true">
              🧶
            </span>
          )}
          <span className="font-heading text-lg font-semibold text-surface">
            {settings?.business_name || 'AXKN07 Crochet'}
          </span>
        </div>
        <p className="mt-1 font-body text-xs font-semibold uppercase tracking-wide text-gold/80">Pricing Studio · Admin</p>
      </div>

      <nav className="relative flex flex-1 flex-col gap-1">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-cozy px-4 py-3 font-body text-sm font-semibold transition-colors ${
                isActive ? 'bg-surface text-peach shadow-gentle' : 'text-surface/70 hover:bg-surface/10 hover:text-surface'
              }`
            }
          >
            <span aria-hidden="true">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={signOut}
        className="relative mt-4 flex items-center gap-3 rounded-cozy px-4 py-3 font-body text-sm font-semibold text-surface/70 transition-colors hover:bg-surface/10 hover:text-surface"
      >
        <span aria-hidden="true">🚪</span> Log Out
      </button>
    </div>
  )
}
