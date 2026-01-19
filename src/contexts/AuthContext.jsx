import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    let subscription = null
    
    // Set a shorter timeout to prevent long loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout, setting loading to false')
        setLoading(false)
      }
    }, 3000) // 3 second timeout

    try {
      // Get initial session
      supabase.auth.getSession()
        .then(({ data: { session }, error }) => {
          if (!mounted) return
          if (error) {
            console.error('Error getting session:', error)
          }
          setSession(session)
          setUser(session?.user ?? null)
          setLoading(false)
          clearTimeout(timeoutId)
        })
        .catch((error) => {
          if (!mounted) return
          console.error('Error initializing auth:', error)
          setLoading(false)
          clearTimeout(timeoutId)
        })

      // Listen for auth changes
      const {
        data: { subscription: authSubscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        clearTimeout(timeoutId)
      })
      
      subscription = authSubscription
    } catch (error) {
      console.error('Error setting up auth:', error)
      if (mounted) {
        setLoading(false)
        clearTimeout(timeoutId)
      }
    }

    return () => {
      mounted = false
      clearTimeout(timeoutId)
      if (subscription) {
        subscription.unsubscribe()
      }
    }
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
      },
    })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signIn,
    signInWithGoogle,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
