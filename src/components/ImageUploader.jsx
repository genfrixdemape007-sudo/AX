import { useRef, useState } from 'react'
import { getPublicImageUrl, validateImageFile, MAX_PRODUCT_IMAGES } from '../services/storageService'

// Each slot is either { kind: 'existing', path } for an already-uploaded image, or
// { kind: 'new', file, previewUrl } for one picked in this session but not yet uploaded.
// The parent (AdminProductForm) owns the array and gets a flat onChange(slots) callback —
// this component doesn't touch Supabase directly, so the form stays in control of when
// uploads actually happen (on Save).
export default function ImageUploader({ slots, onChange, error }) {
  const inputRef = useRef(null)
  const [localError, setLocalError] = useState(null)

  const canAddMore = slots.length < MAX_PRODUCT_IMAGES

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return

    const room = MAX_PRODUCT_IMAGES - slots.length
    const toAdd = files.slice(0, room)
    const next = [...slots]

    for (const file of toAdd) {
      const validationError = validateImageFile(file)
      if (validationError) {
        setLocalError(validationError)
        continue
      }
      setLocalError(null)
      next.push({ kind: 'new', file, previewUrl: URL.createObjectURL(file) })
    }

    onChange(next)
    e.target.value = ''
  }

  const removeAt = (i) => {
    const next = slots.filter((_, idx) => idx !== i)
    onChange(next)
  }

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= slots.length) return
    const next = [...slots]
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <div>
      <label className="label-field">
        Product Photos <span className="font-normal text-ink-soft">({slots.length}/{MAX_PRODUCT_IMAGES})</span>
      </label>

      <div className="flex flex-wrap gap-3">
        {slots.map((slot, i) => {
          const displayUrl = slot.kind === 'new' ? slot.previewUrl : getPublicImageUrl(slot.path)
          return (
            <div key={i} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-cozy border-2 border-ink/10 bg-surface-soft">
              {displayUrl && <img src={displayUrl} alt="" className="h-full w-full object-cover" />}
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded-full bg-peach px-2 py-0.5 font-body text-[10px] font-bold text-surface">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-surface hover:bg-ink"
                aria-label="Remove photo"
              >
                ✕
              </button>
              <div className="absolute bottom-1 left-1 flex gap-1">
                {i > 0 && (
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-surface hover:bg-ink"
                    aria-label="Move earlier"
                  >
                    ‹
                  </button>
                )}
                {i < slots.length - 1 && (
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-surface hover:bg-ink"
                    aria-label="Move later"
                  >
                    ›
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {canAddMore && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex h-24 w-24 shrink-0 flex-col items-center justify-center gap-1 rounded-cozy border-2 border-dashed border-ink/15 bg-surface-soft text-ink-soft hover:border-peach hover:text-peach"
          >
            <span className="text-xl" aria-hidden="true">+</span>
            <span className="font-body text-[11px]">Add photo</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFiles}
      />
      <p className="mt-1.5 font-body text-xs text-ink-soft">
        Up to {MAX_PRODUCT_IMAGES} photos. JPG, PNG, WEBP, or GIF. Max 5MB each. First photo is the cover shown on cards.
      </p>
      {(localError || error) && <p className="mt-2 font-body text-sm text-peach">{localError || error}</p>}
    </div>
  )
}
