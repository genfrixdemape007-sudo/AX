import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const checkAdminStatus = useCallback(async (userId) => {
    if (!userId) {
      setIsAdmin(false)
      return
    }
    // This SELECT only tells us whether a row is visible to *this* user under RLS —
    // the real enforcement happens in the database policies on products/categories/settings,
    // not here. This check only drives the UI (showing/hiding admin screens).
    const { data, error } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    if (error) {
      console.error('Could not verify admin status:', error.message)
      setIsAdmin(false)
      return
    }
    setIsAdmin(Boolean(data))
  }, [])

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return
      setSession(initialSession)
      await checkAdminStatus(initialSession?.user?.id)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!isMounted) return
      setSession(newSession)
      await checkAdminStatus(newSession?.user?.id)
    })

    return () => {
      isMounted = false
      listener?.subscription?.unsubscribe()
    }
  }, [checkAdminStatus])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setIsAdmin(false)
  }

  const value = {
    session,
    user: session?.user ?? null,
    isAdmin,
    loading,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
}
