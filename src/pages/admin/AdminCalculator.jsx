import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMaterials } from '../../hooks/useMaterials'
import { useSettings } from '../../hooks/useSettings'
import { Spinner } from '../../components/LoadingStates'

export default function AdminCalculator() {
  const { materials, loading } = useMaterials()
  const { settings } = useSettings()
  const navigate = useNavigate()

  const [chosen, setChosen] = useState([]) // { matId, name, qty, unitCost }
  const [matId, setMatId] = useState('')
  const [matQty, setMatQty] = useState('')
  const [otherMaterials, setOtherMaterials] = useState('')
  const [hours, setHours] = useState('')
  const [rate, setRate] = useState('')
  const [mode, setMode] = useState('margin') // 'margin' | 'markup'
  const [profitVal, setProfitVal] = useState('')
  const [extra, setExtra] = useState('')

  // Seed rate/margin from site settings once loaded, only if the user hasn't typed yet.
  useEffect(() => {
    if (settings && rate === '') setRate(String(settings.default_hourly_rate ?? 60))
    if (settings && profitVal === '') setProfitVal(String(settings.default_margin_pct ?? 35))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings])

  const addMaterial = () => {
    const mat = materials.find((m) => m.id === matId)
    const qty = parseFloat(matQty) || 0
    if (!mat || qty <= 0) return
    setChosen((prev) => [...prev, { matId: mat.id, name: mat.name, qty, unitCost: Number(mat.cost_per_unit) }])
    setMatQty('')
  }

  const removeMaterial = (i) => setChosen((prev) => prev.filter((_, idx) => idx !== i))

  const result = useMemo(() => {
    const matFromList = chosen.reduce((s, c) => s + c.qty * c.unitCost, 0)
    const other = parseFloat(otherMaterials) || 0
    const h = parseFloat(hours) || 0
    const r = parseFloat(rate) || 0
    const ex = parseFloat(extra) || 0
    const pv = parseFloat(profitVal) || 0

    const materialsCost = matFromList + other
    const laborCost = h * r
    const baseCost = materialsCost + laborCost + ex

    let profit, price
    if (mode === 'margin') {
      const m = Math.min(pv, 95) / 100
      price = m < 1 ? baseCost / (1 - m) : baseCost * 2
      profit = price - baseCost
    } else {
      profit = pv
      price = baseCost + profit
    }
    return { materialsCost, laborCost, extra: ex, profit, price, hours: h, rate: r }
  }, [chosen, otherMaterials, hours, rate, extra, profitVal, mode])

  const fmt = (n) => `₱${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const sendToProductForm = () => {
    const name = chosen.length ? chosen.map((c) => c.name).join(' + ') : ''
    navigate('/admin/products/new', { state: { prefillPrice: Number(result.price.toFixed(2)), prefillName: name } })
  }

  if (loading) return <Spinner label="Loading calculator…" />

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-semibold text-ink">Calculator</h1>
        <p className="font-body text-sm text-ink-soft">Cost-plus pricing: materials + labor + margin.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[3fr,2fr]">
        <div className="card flex flex-col gap-5 p-5">
          <div>
            <label className="label-field">Materials from your list</label>
            <div className="flex gap-2">
              <select value={matId} onChange={(e) => setMatId(e.target.value)} className="input-field flex-1">
                <option value="">
                  {materials.length ? 'Choose a material…' : 'No materials saved yet — add some in Materials'}
                </option>
                {materials.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} — ₱{Number(m.cost_per_unit).toFixed(2)}/{m.unit}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="0"
                step="0.01"
                value={matQty}
                onChange={(e) => setMatQty(e.target.value)}
                placeholder="Qty"
                className="input-field w-24"
              />
              <button type="button" onClick={addMaterial} className="btn-secondary shrink-0">
                Add
              </button>
            </div>
            {chosen.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {chosen.map((c, i) => (
                  <span key={i} className="chip">
                    {c.name} × {c.qty} = {fmt(c.qty * c.unitCost)}
                    <button type="button" onClick={() => removeMaterial(i)} className="ml-2 text-ink-soft hover:text-peach">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="label-field" htmlFor="otherMaterials">Other material costs (not in your list)</label>
            <input id="otherMaterials" type="number" min="0" step="0.01" value={otherMaterials} onChange={(e) => setOtherMaterials(e.target.value)} className="input-field" placeholder="0" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label-field" htmlFor="hours">Hours worked</label>
              <input id="hours" type="number" min="0" step="0.25" value={hours} onChange={(e) => setHours(e.target.value)} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="label-field" htmlFor="rate">Hourly rate (₱)</label>
              <input id="rate" type="number" min="0" step="1" value={rate} onChange={(e) => setRate(e.target.value)} className="input-field" />
            </div>
          </div>

          <div>
            <label className="label-field" htmlFor="extra">Extra costs (packaging, shipping, etc.)</label>
            <input id="extra" type="number" min="0" step="0.01" value={extra} onChange={(e) => setExtra(e.target.value)} className="input-field" placeholder="0" />
          </div>

          <div>
            <div className="mb-2 flex gap-2">
              <button type="button" onClick={() => setMode('margin')} className={`chip ${mode === 'margin' ? 'chip-active' : ''}`}>
                Margin %
              </button>
              <button type="button" onClick={() => setMode('markup')} className={`chip ${mode === 'markup' ? 'chip-active' : ''}`}>
                Flat markup ₱
              </button>
            </div>
            <label className="label-field" htmlFor="profitVal">
              {mode === 'margin' ? 'Desired margin (%)' : 'Flat markup (₱)'}
            </label>
            <input id="profitVal" type="number" min="0" step="1" value={profitVal} onChange={(e) => setProfitVal(e.target.value)} className="input-field" />
          </div>
        </div>

        <div className="card flex flex-col gap-4 p-5">
          <p className="font-body text-xs font-semibold uppercase tracking-wide text-ink-soft">Suggested Price</p>
          <p className="font-heading text-4xl font-semibold text-peach">{fmt(result.price)}</p>

          <div className="space-y-1.5 border-t border-ink/10 pt-4 font-body text-sm">
            <div className="flex justify-between"><span className="text-ink-soft">Materials</span><span className="text-ink">{fmt(result.materialsCost)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Labor ({result.hours}h × {fmt(result.rate)})</span><span className="text-ink">{fmt(result.laborCost)}</span></div>
            <div className="flex justify-between"><span className="text-ink-soft">Extra costs</span><span className="text-ink">{fmt(result.extra)}</span></div>
            <div className="flex justify-between font-semibold"><span className="text-ink-soft">Profit</span><span className="text-olive">{fmt(result.profit)}</span></div>
          </div>

          <button type="button" onClick={sendToProductForm} className="btn-primary mt-2">
            Send to New Product →
          </button>
          <p className="font-body text-xs text-ink-soft">Opens Add Product with this price pre-filled so you can finish the listing.</p>
        </div>
      </div>
    </div>
  )
}
