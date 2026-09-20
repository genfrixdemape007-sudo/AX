import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProducts } from '../services/productService'

export function useProducts({ categoryId = null, searchTerm = '', categories = [], sortBy = 'default' } = {}) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const categoryMatchIds = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length === 0) return []
    const term = searchTerm.trim().toLowerCase()
    return categories.filter((c) => c.name.toLowerCase().includes(term)).map((c) => c.id)
  }, [searchTerm, categories])

  const matchIdsKey = categoryMatchIds.join(',')

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProducts({ categoryId, searchTerm, categoryMatchIds, sortBy })
      setProducts(data)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load the price list right now. Please try again.')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId, searchTerm, matchIdsKey, sortBy])

  useEffect(() => {
    load()
  }, [load])

  return { products, loading, error, refresh: load }
}
