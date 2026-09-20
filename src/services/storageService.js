import { supabase, PRODUCT_IMAGES_BUCKET } from '../lib/supabase'
import { compressImageFile } from '../lib/imageCompression'

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

export function validateImageFile(file) {
  if (!file) return 'Please choose an image file.'
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Please upload a JPG, PNG, WEBP, or GIF image.'
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return 'Image is too large. Please upload a file under 5MB.'
  }
  return null
}

export function getPublicImageUrl(imagePath) {
  if (!imagePath) return null
  const { data } = supabase.storage.from(PRODUCT_IMAGES_BUCKET).getPublicUrl(imagePath)
  return data?.publicUrl ?? null
}

// A product's "cover" photo — the first of up to 4 images. Falls back to the
// legacy single image_path for any product that hasn't been re-saved since
// the multi-image migration.
export function getCoverImagePath(product) {
  if (!product) return null
  if (Array.isArray(product.image_paths) && product.image_paths.length > 0) {
    return product.image_paths[0]
  }
  return product.image_path || null
}

export const MAX_PRODUCT_IMAGES = 4

// Uploads a file and returns its storage path. Throws on validation or upload failure
// so the caller never saves a record pointing at a broken/missing image.
// `folder` groups files within the bucket (e.g. "products" or "branding").
export async function uploadProductImage(file, folder = 'products') {
  const validationError = validateImageFile(file)
  if (validationError) throw new Error(validationError)

  const compressed = await compressImageFile(file)

  const fileExt = compressed.name.split('.').pop()
  const fileName = `${crypto.randomUUID()}.${fileExt}`
  const filePath = `${folder}/${fileName}`

  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).upload(filePath, compressed, {
    cacheControl: '3600',
    upsert: false,
  })

  if (error) throw new Error('The image could not be uploaded. Please try again.')
  return filePath
}

// Deletes an image path from storage. Safe to call with a path that's no longer referenced
// by any other product — callers are responsible for only calling this on genuinely orphaned images.
export async function deleteProductImage(imagePath) {
  if (!imagePath) return
  const { error } = await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([imagePath])
  if (error) {
    // Non-fatal: log but don't block the rest of the flow (e.g. product deletion already succeeded).
    console.error('Could not delete storage image:', error.message)
  }
}
