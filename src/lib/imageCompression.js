// Resizes and re-encodes an image in the browser before upload, so a 4000×3000 phone photo
// doesn't turn into a slow-loading price list. Animated GIFs are left untouched — canvas
// re-encoding would flatten them to a single frame.
const MAX_DIMENSION = 1600
const JPEG_QUALITY = 0.82

export async function compressImageFile(file) {
  if (!file || file.type === 'image/gif') return file

  try {
    const bitmap = await createImageBitmap(file)
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))

    // Already small enough and not huge on disk — don't bother re-encoding.
    if (scale === 1 && file.size < 400 * 1024) {
      bitmap.close?.()
      return file
    }

    const width = Math.round(bitmap.width * scale)
    const height = Math.round(bitmap.height * scale)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    ctx.drawImage(bitmap, 0, 0, width, height)
    bitmap.close?.()

    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, JPEG_QUALITY))
    if (!blob) return file

    // Only use the compressed version if it's actually smaller — otherwise keep the original.
    if (blob.size >= file.size) return file

    const newName = file.name.replace(/\.(png|jpe?g|webp)$/i, outputType === 'image/png' ? '.png' : '.jpg')
    return new File([blob], newName || file.name, { type: outputType })
  } catch (err) {
    // If compression fails for any reason (unsupported format, browser quirk), fall back
    // to uploading the original file rather than blocking the whole flow.
    console.error('Image compression skipped:', err)
    return file
  }
}
