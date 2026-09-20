import { Link } from 'react-router-dom'
import { useSiteSettings } from '../../contexts/SettingsContext.jsx'
import { Spinner } from '../../components/LoadingStates'
import PaymentInfo from '../../components/PaymentInfo'

const STEPS = [
  { number: '01', title: 'Browse', text: 'Explore the price list — filter by category or search for something specific.' },
  { number: '02', title: 'Add to Cart', text: 'Pick a type if there\u2019s one you like, choose a quantity, and add it to your cart.' },
  { number: '03', title: 'Review Your Order', text: 'Open your cart to double-check items, quantities, and the total.' },
  { number: '04', title: 'Send & Pay', text: 'Tap "Send Order via Messenger," then pay using the QR code below.' },
]

export default function Home() {
  const { settings, loading } = useSiteSettings()

  if (loading) return <Spinner label="Loading…" />

  const businessName = settings?.business_name || 'AXKN07 Crochet'
  const welcomeMessage =
    settings?.welcome_message ||
    'Browse our handmade crochet pieces, check their prices, and find something special for yourself or someone you love.'

  return (
    <div>
      <section className="hero-dark">
        {/* Organic blob accents, echoing the moodboard's collage shapes */}
        <div className="blob pointer-events-none absolute -right-16 -top-20 h-72 w-72 bg-surface/5 sm:h-96 sm:w-96" aria-hidden="true" />
        <div className="blob pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 bg-peach/20 blur-sm sm:h-80 sm:w-80" aria-hidden="true" />
        <div className="blob pointer-events-none absolute right-10 bottom-6 h-24 w-24 border border-gold/30 sm:h-32 sm:w-32" aria-hidden="true" />

        <div className="relative mx-auto flex max-w-3xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full border border-surface/20 bg-surface/10 text-3xl backdrop-blur" aria-hidden="true">
            🧶
          </span>
          <h1 className="font-heading text-3xl font-semibold text-surface sm:text-5xl">
            Welcome to {businessName}
          </h1>
          {settings?.tagline && (
            <p className="mt-3 font-body text-base font-semibold uppercase tracking-wide text-gold">{settings.tagline}</p>
          )}
          <p className="mt-4 max-w-xl font-body text-base text-surface/80 sm:text-lg">{welcomeMessage}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/prices" className="btn-primary !px-8 !py-4 text-base">
              View Price List
            </Link>
            <Link to="/cart" className="btn-dark !px-8 !py-4 text-base">
              Go to Cart
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6">
        <h2 className="mb-8 text-center font-heading text-2xl font-semibold text-ink">
          How to Use This Price List
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.number} className="card card-hover flex flex-col gap-2 p-5">
              <span className="font-heading text-3xl font-semibold text-clover">{step.number}</span>
              <h3 className="font-heading text-lg font-semibold text-ink">{step.title}</h3>
              <p className="font-body text-sm text-ink-soft">{step.text}</p>
            </div>
          ))}
        </div>

        {settings?.tutorial_content && (
          <p className="mx-auto mt-8 max-w-2xl text-center font-body text-sm text-ink-soft">
            {settings.tutorial_content}
          </p>
        )}

        <div className="mt-10 flex justify-center">
          <Link to="/prices" className="btn-primary !px-8 !py-4 text-base">
            View Price List
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 pb-14 sm:px-6">
        <PaymentInfo />
      </section>
    </div>
  )
}
