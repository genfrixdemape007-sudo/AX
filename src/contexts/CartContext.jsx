import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import { getCoverImagePath } from '../services/storageService'

const CartContext = createContext(undefined)
const STORAGE_KEY = 'axkn07_cart'
export const MAX_QTY_PER_LINE = 50

// A cart line is keyed by product id + chosen type, so the same product picked in two
// different types shows up as two separate lines instead of merging into one.
function lineKey(productId, type) {
  return `${productId}::${type || ''}`
}

function loadCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // Storage can fail (private browsing, quota) — the cart still works for this
      // session, it just won't survive a refresh. Not worth surfacing to the customer.
    }
  }, [items])

  const addToCart = useCallback((product, qty = 1, type = null) => {
    setItems((prev) => {
      const key = lineKey(product.id, type)
      const existing = prev.find((it) => it.key === key)
      if (existing) {
        return prev.map((it) =>
          it.key === key ? { ...it, qty: Math.min(MAX_QTY_PER_LINE, it.qty + qty) } : it
        )
      }
      return [
        ...prev,
        {
          key,
          productId: product.id,
          name: product.name,
          price: Number(product.price) || 0,
          image_path: getCoverImagePath(product),
          type: type || null,
          qty: Math.min(MAX_QTY_PER_LINE, qty),
        },
      ]
    })
  }, [])

  const updateQty = useCallback((key, qty) => {
    setItems((prev) =>
      qty <= 0
        ? prev.filter((it) => it.key !== key)
        : prev.map((it) => (it.key === key ? { ...it, qty: Math.min(MAX_QTY_PER_LINE, qty) } : it))
    )
  }, [])

  const removeItem = useCallback((key) => {
    setItems((prev) => prev.filter((it) => it.key !== key))
  }, [])

  const clearCart = useCallback(() => setItems([]), [])

  const itemCount = useMemo(() => items.reduce((sum, it) => sum + it.qty, 0), [items])
  const subtotal = useMemo(() => items.reduce((sum, it) => sum + it.qty * it.price, 0), [items])

  const value = { items, addToCart, updateQty, removeItem, clearCart, itemCount, subtotal }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
