
import {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react'

import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = async (authUser) => {
    if (!authUser) {
      setUser(null)
      setProfile(null)
      return
    }

    setUser(authUser)

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authUser.id)
      .maybeSingle()

    if (error) {
      console.error('Profile error:', error.message)
      setProfile(null)
      return
    }

    setProfile(data)
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      const { data } = await supabase.auth.getSession()

      if (mounted) {
        await loadProfile(data.session?.user ?? null)
        setLoading(false)
      }
    }

    initializeAuth()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'INITIAL_SESSION') return

        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          return
        }

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          setUser(session?.user ?? null)
          setProfile(null)

          if (session?.user) {
            setTimeout(() => {
              loadProfile(session.user)
            }, 0)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error

    await loadProfile(data.user)

    return data
  }

  const register = async (fullName, email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        }
      }
    })

    if (error) throw error

    return data
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) throw error

    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        login,
        register,
        logout,
        refreshProfile: () => loadProfile(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
