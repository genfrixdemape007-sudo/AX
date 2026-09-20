import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import AdminSidebar from '../components/AdminSidebar'

export default function AdminLayout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-bg">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-ink/5 lg:block">
        <div className="sticky top-0 h-screen">
          <AdminSidebar />
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="flex flex-1 flex-col">
        <div className="hero-dark flex items-center justify-between px-4 py-3 lg:hidden">
          <span className="font-heading font-semibold text-surface">Admin</span>
          <button
            onClick={() => setMenuOpen(true)}
            className="relative rounded-full p-2 text-surface/80 hover:bg-surface/10"
            aria-label="Open menu"
          >
            ☰
          </button>
        </div>

        {menuOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="hero-dark w-72 shadow-soft">
              <div className="flex justify-end p-3">
                <button
                  onClick={() => setMenuOpen(false)}
                  className="rounded-full p-2 text-surface/80 hover:bg-surface/10"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>
              <AdminSidebar onNavigate={() => setMenuOpen(false)} />
            </div>
            <div className="flex-1 bg-ink/30" onClick={() => setMenuOpen(false)} />
          </div>
        )}

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
