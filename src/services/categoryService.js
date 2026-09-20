import { supabase } from '../lib/supabase'

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('id, name, icon, display_order, created_at, updated_at')
    .order('display_order', { ascending: true })
    .order('name', { ascending: true })

  if (error) throw error
  return data
}

export async function createCategory({ name, icon = null, display_order = 0 }) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ name, icon, display_order })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id, updates) {
  const { data, error } = await supabase
    .from('categories')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// Deleting a category safely detaches its products first (category_id -> null) so that
// no product is ever left pointing at a category row that no longer exists.
export async function deleteCategory(id) {
  const { error: detachError } = await supabase
    .from('products')
    .update({ category_id: null })
    .eq('category_id', id)
  if (detachError) throw detachError

  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

export async function reorderCategories(orderedItems) {
  // orderedItems: [{ id, display_order }, ...]
  const updates = orderedItems.map(({ id, display_order }) =>
    supabase.from('categories').update({ display_order }).eq('id', id)
  )
  const results = await Promise.all(updates)
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}
