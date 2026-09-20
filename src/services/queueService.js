import { supabase } from '../lib/supabase'

export async function fetchQueueItems() {
  const { data, error } = await supabase
    .from('queue_items')
    .select('id, customer, item, due_date, priority, status, notes, created_at, updated_at')
    .order('due_date', { ascending: true, nullsFirst: false })
  if (error) throw error
  return data
}

export async function createQueueItem(item) {
  const { data, error } = await supabase.from('queue_items').insert(item).select().single()
  if (error) throw error
  return data
}

export async function updateQueueItem(id, updates) {
  const { data, error } = await supabase
    .from('queue_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteQueueItem(id) {
  const { error } = await supabase.from('queue_items').delete().eq('id', id)
  if (error) throw error
}
