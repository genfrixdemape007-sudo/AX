import { supabase } from '../lib/supabase'

// The app expects exactly one site_settings row to exist (created by the migration script).
export async function fetchSettings() {
  const { data, error } = await supabase.from('site_settings').select('*').limit(1).maybeSingle()
  if (error) throw error
  return data
}

export async function updateSettings(id, updates) {
  const { data, error } = await supabase
    .from('site_settings')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Builds a "Message to Order" link for a given pre-filled text. Supports Messenger-style URLs,
// which accept the pre-filled text as a query param recognized by m.me links, and fall back to
// just opening the URL for anything else (WhatsApp wa.me links, plain contact pages, etc.).
export function buildMessageLink(contactUrl, text) {
  if (!contactUrl) return null

  try {
    const url = new URL(contactUrl)
    if (url.hostname.includes('m.me') || url.hostname.includes('messenger.com')) {
      url.searchParams.set('text', text)
      return url.toString()
    }
    if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp.com')) {
      url.searchParams.set('text', text)
      return url.toString()
    }
    return contactUrl
  } catch {
    return contactUrl
  }
}

// Builds the pre-filled order message from the cart's line items. Used for both the
// Messenger/WhatsApp link above and the "Copy as Text" action on the cart page.
export function buildOrderText({ items, subtotal, customerName, customerNote }) {
  const lines = []
  lines.push("Hi! I'd like to order:")
  lines.push('')
  items.forEach((it) => {
    const typePart = it.type ? ` (${it.type})` : ''
    lines.push(`- ${it.name}${typePart} x${it.qty} — ₱${formatAmount(it.qty * it.price)}`)
  })
  lines.push('')
  lines.push(`Total: ₱${formatAmount(subtotal)}`)
  if (customerName) lines.push(`Name: ${customerName}`)
  if (customerNote) lines.push(`Note: ${customerNote}`)
  return lines.join('\n')
}

function formatAmount(num) {
  return Number(num).toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}
