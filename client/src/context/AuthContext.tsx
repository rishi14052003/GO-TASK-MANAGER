import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { api } from '../services/api'
import type { User, LoginRequest, RegisterRequest } from '../types/user'

type AuthState = {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
}

type AuthContextValue = AuthState & {
  login: (payload: LoginRequest) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

type AuthProviderProps = {
  children: ReactNode
}

const AUTH_STORAGE_KEY = 'gotaskpro_auth'

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as { user: User; token: string }
        setUser(parsed.user)
        setToken(parsed.token)
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const persist = useCallback((nextUser: User, nextToken: string) => {
    setUser(nextUser)
    setToken(nextToken)
    window.localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: nextUser, token: nextToken }),
    )
  }, [])

  const clear = useCallback(() => {
    setUser(null)
    setToken(null)
    window.localStorage.removeItem(AUTH_STORAGE_KEY)
  }, [])

  const login = useCallback(
    async (payload: LoginRequest) => {
      setError(null)
      setIsLoading(true)
      try {
        const { user: loggedInUser, token: jwt } = await api.login(payload)
        persist(loggedInUser, jwt)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Unable to login. Please try again.'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [persist],
  )

  const register = useCallback(
    async (payload: RegisterRequest) => {
      setError(null)
      setIsLoading(true)
      try {
        await api.register(payload)
        // Do not persist auth on register; user must log in explicitly
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Unable to create account. Please try again.'
        setError(message)
        throw err
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const logout = useCallback(() => {
    clear()
  }, [clear])

  const value: AuthContextValue = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(user && token),
      isLoading,
      error,
      login,
      register,
      logout,
    }),
    [user, token, isLoading, error, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

