export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft" aria-hidden="true">
        🔍
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        className="input-field pl-11"
      />
    </div>
  )
}
