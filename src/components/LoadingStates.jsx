export function ProductCardSkeleton() {
  return (
    <div className="card overflow-hidden">
      <div className="skeleton h-48 w-full" />
      <div className="space-y-3 p-4">
        <div className="skeleton h-4 w-3/4 rounded-full" />
        <div className="skeleton h-3 w-1/2 rounded-full" />
        <div className="skeleton h-6 w-1/3 rounded-full" />
      </div>
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function Spinner({ label = 'Loading\u2026' }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-ink-soft">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-daisy border-t-peach" />
      <p className="font-body text-sm">{label}</p>
    </div>
  )
}
