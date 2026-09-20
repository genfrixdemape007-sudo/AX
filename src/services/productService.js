import { supabase } from '../lib/supabase'

const PRODUCT_COLUMNS = `
  id, name, price, short_description, description, category_id, image_path, image_paths,
  types, size, availability, note, featured, is_new, display_order, created_at, updated_at,
  categories ( id, name )
`

// Public + admin: fetch products for the price list. Pass a limit for pagination-friendly loads.
// `categoryMatchIds` lets callers include products whose *category name* matches the search term
// (PostgREST can't OR a text search against a joined table's columns directly, so the caller
// resolves matching category ids first and passes them in here).
// sortBy options: 'default' (display order), 'newest', 'price_asc', 'price_desc', 'featured'
export async function fetchProducts({
  categoryId = null,
  searchTerm = '',
  categoryMatchIds = [],
  sortBy = 'default',
  limit = 200,
  offset = 0,
} = {}) {
  let query = supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .range(offset, offset + limit - 1)

  switch (sortBy) {
    case 'newest':
      query = query.order('created_at', { ascending: false })
      break
    case 'price_asc':
      query = query.order('price', { ascending: true })
      break
    case 'price_desc':
      query = query.order('price', { ascending: false })
      break
    case 'featured':
      query = query
        .order('featured', { ascending: false })
        .order('display_order', { ascending: true })
      break
    default:
      query = query.order('display_order', { ascending: true }).order('created_at', { ascending: false })
  }

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  if (searchTerm && searchTerm.trim().length > 0) {
    const term = searchTerm.trim().replace(/[%,()]/g, '')
    const clauses = [
      `name.ilike.%${term}%`,
      `short_description.ilike.%${term}%`,
      `description.ilike.%${term}%`,
    ]
    if (categoryMatchIds.length > 0) {
      clauses.push(`category_id.in.(${categoryMatchIds.join(',')})`)
    }
    query = query.or(clauses.join(','))
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchProductById(id) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data
}

// Admin dashboard summary counts.
export async function fetchProductStats() {
  const { count: total, error: totalError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
  if (totalError) throw totalError

  const { count: available, error: availableError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('availability', 'Available')
  if (availableError) throw availableError

  const { count: soldOut, error: soldOutError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('availability', 'Sold Out')
  if (soldOutError) throw soldOutError

  return { total: total ?? 0, available: available ?? 0, soldOut: soldOut ?? 0 }
}

export async function fetchRecentlyUpdatedProducts(limit = 5) {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_COLUMNS)
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// --- Admin-only writes below. RLS enforces this server-side; these calls will fail for
// non-admin sessions no matter what the frontend sends. ---

export async function createProduct(product) {
  const { data, error } = await supabase.from('products').insert(product).select(PRODUCT_COLUMNS).single()
  if (error) throw error
  return data
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(PRODUCT_COLUMNS)
    .single()
  if (error) throw error
  return data
}

export async function deleteProduct(id) {
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
}
