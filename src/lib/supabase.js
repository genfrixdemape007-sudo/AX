import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Surface a clear message during local dev / build instead of a cryptic runtime error.
  // This never throws in production so the customer-facing app can still render an error state.
  console.error(
    'Missing Supabase environment variables. Check that VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_ANON_KEY are set in your .env file (see .env.example).'
  )
}

// This is the public "anon" key only. It is safe to expose in frontend code because
// every table it can touch is protected by Row Level Security policies in Supabase.
// The service-role key must NEVER be used here or anywhere in frontend code.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

export const PRODUCT_IMAGES_BUCKET = 'product-images'
