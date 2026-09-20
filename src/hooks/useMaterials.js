import { useCallback, useEffect, useState } from 'react'
import { fetchMaterials } from '../services/materialService'

export function useMaterials() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchMaterials()
      setMaterials(data)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load materials right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { materials, loading, error, refresh: load }
}
