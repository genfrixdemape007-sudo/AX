import { useCallback, useEffect, useState } from 'react'
import { fetchCategories } from '../services/categoryService'

export function useCategories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load categories right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { categories, loading, error, refresh: load }
}
