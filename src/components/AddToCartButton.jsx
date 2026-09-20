import { useState } from 'react'
import { useCart } from '../contexts/CartContext.jsx'

export default function AddToCartButton({ product, qty = 1, type = null, className = '', full = false }) {
  const { addToCart } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const handleClick = () => {
    addToCart(product, qty, type)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`btn-primary ${full ? 'w-full' : ''} ${className}`}
    >
      <span aria-hidden="true">{justAdded ? '✓' : '🛒'}</span> {justAdded ? 'Added!' : 'Add to Cart'}
    </button>
  )
}
