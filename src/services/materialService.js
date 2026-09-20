import { supabase } from '../lib/supabase'

export async function fetchMaterials() {
  const { data, error } = await supabase
    .from('materials')
    .select('id, name, cost_per_unit, unit, notes, created_at, updated_at')
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function createMaterial({ name, cost_per_unit, unit, notes = null }) {
  const { data, error } = await supabase
    .from('materials')
    .insert({ name, cost_per_unit, unit, notes })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateMaterial(id, updates) {
  const { data, error } = await supabase
    .from('materials')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteMaterial(id) {
  const { error } = await supabase.from('materials').delete().eq('id', id)
  if (error) throw error
}
