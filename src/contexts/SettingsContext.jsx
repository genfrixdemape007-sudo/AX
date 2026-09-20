import { createContext, useContext } from 'react'
import { useSettings as useSettingsFetch } from '../hooks/useSettings'

const SettingsContext = createContext(undefined)

export function SettingsProvider({ children }) {
  const value = useSettingsFetch()
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSiteSettings() {
  const context = useContext(SettingsContext)
  if (context === undefined) {
    throw new Error('useSiteSettings must be used within a SettingsProvider')
  }
  return context
}
