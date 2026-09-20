import { useCallback, useEffect, useState } from 'react'
import { fetchSettings } from '../services/settingsService'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchSettings()
      setSettings(data)
    } catch (err) {
      console.error(err)
      setError('We couldn\u2019t load site settings right now.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { settings, loading, error, refresh: load }
}
