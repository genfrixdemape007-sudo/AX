import { supabase } from '../lib/supabase'

const ORDER_COLUMNS = `
  id, order_no, customer, contact, order_date, due_date, items, discount_type, discount_value,
  fees, downpayment, received, notes, subtotal, discount_amount, fees_total, total, total_paid,
  balance, status, created_at, updated_at
`

// Same math as the standalone Pricing Studio's calcOrderTotals — ported 1:1 so orders
// generated here behave identically (bulk discount rule, partial/paid status, etc.).
export function calcOrderTotals(order, settings) {
  const items = order.items || []
  const fees = order.fees || []
  const subtotal = items.reduce((s, it) => s + it.qty * it.price, 0)
  const totalQty = items.reduce((s, it) => s + it.qty, 0)

  let discountAmount = 0
  if (order.discount_type === 'percent') discountAmount = subtotal * ((order.discount_value || 0) / 100)
  else if (order.discount_type === 'flat') discountAmount = order.discount_value || 0
  else if (order.discount_type === 'bulk') {
    const bulkQty = settings?.bulk_discount_qty ?? 5
    const bulkPct = settings?.bulk_discount_pct ?? 10
    discountAmount = totalQty >= bulkQty ? subtotal * (bulkPct / 100) : 0
  }
  discountAmount = Math.min(discountAmount, subtotal)

  const feesTotal = fees.reduce((s, f) => s + (f.amount || 0), 0)
  const total = Math.max(0, subtotal - discountAmount + feesTotal)
  const totalPaid = (order.received || 0) > 0 ? order.received : order.downpayment || 0
  const balance = Math.max(0, total - totalPaid)

  let status = 'unpaid'
  if (totalPaid >= total && total > 0) status = 'paid'
  else if (totalPaid > 0) status = 'partial'

  return { subtotal, discountAmount, feesTotal, total, totalPaid, balance, status, totalQty }
}

export async function fetchOrders({ searchTerm = '', limit = 200 } = {}) {
  let query = supabase.from('orders').select(ORDER_COLUMNS).order('created_at', { ascending: false }).limit(limit)
  if (searchTerm.trim()) {
    const term = searchTerm.trim().replace(/[%,()]/g, '')
    query = query.or(`customer.ilike.%${term}%,order_no.ilike.%${term}%`)
  }
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchOrderById(id) {
  const { data, error } = await supabase.from('orders').select(ORDER_COLUMNS).eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function createOrder(order, settings) {
  const totals = calcOrderTotals(order, settings)
  const payload = {
    customer: order.customer,
    contact: order.contact || null,
    order_date: order.order_date,
    due_date: order.due_date || null,
    items: order.items,
    discount_type: order.discount_type,
    discount_value: order.discount_value || 0,
    fees: order.fees,
    downpayment: order.downpayment || 0,
    received: order.received || 0,
    notes: order.notes || null,
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmount,
    fees_total: totals.feesTotal,
    total: totals.total,
    total_paid: totals.totalPaid,
    balance: totals.balance,
    status: totals.status,
  }
  const { data, error } = await supabase.from('orders').insert(payload).select(ORDER_COLUMNS).single()
  if (error) throw error
  return data
}

export async function updateOrder(id, order, settings) {
  const totals = calcOrderTotals(order, settings)
  const payload = {
    customer: order.customer,
    contact: order.contact || null,
    order_date: order.order_date,
    due_date: order.due_date || null,
    items: order.items,
    discount_type: order.discount_type,
    discount_value: order.discount_value || 0,
    fees: order.fees,
    downpayment: order.downpayment || 0,
    received: order.received || 0,
    notes: order.notes || null,
    subtotal: totals.subtotal,
    discount_amount: totals.discountAmount,
    fees_total: totals.feesTotal,
    total: totals.total,
    total_paid: totals.totalPaid,
    balance: totals.balance,
    status: totals.status,
    updated_at: new Date().toISOString(),
  }
  const { data, error } = await supabase.from('orders').update(payload).eq('id', id).select(ORDER_COLUMNS).single()
  if (error) throw error
  return data
}

export async function deleteOrder(id) {
  const { error } = await supabase.from('orders').delete().eq('id', id)
  if (error) throw error
}

// Dashboard/Statistics helpers -------------------------------------------------

export async function fetchOrderStats() {
  const { data, error } = await supabase.from('orders').select('total, total_paid, status, created_at, items')
  if (error) throw error

  const revenue = data.reduce((s, o) => s + (o.status === 'paid' ? Number(o.total) : 0), 0)
  const outstanding = data.reduce((s, o) => s + (Number(o.total) - Number(o.total_paid || 0) > 0 ? Number(o.total) - Number(o.total_paid || 0) : 0), 0)

  const byMonth = {}
  data.forEach((o) => {
    const month = (o.created_at || '').slice(0, 7)
    if (!month) return
    byMonth[month] = (byMonth[month] || 0) + Number(o.total)
  })

  const bestSellers = {}
  data.forEach((o) => {
    ;(o.items || []).forEach((it) => {
      bestSellers[it.name] = (bestSellers[it.name] || 0) + it.qty
    })
  })
  const topItems = Object.entries(bestSellers)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }))

  return {
    totalOrders: data.length,
    revenue,
    outstanding,
    byMonth: Object.entries(byMonth).sort(([a], [b]) => a.localeCompare(b)),
    topItems,
  }
}
