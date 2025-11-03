import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { account, teams } from '../../api/appwriteClient'
import type { Models } from 'appwrite'

export type AuthContextType = {
  user: Models.User<Models.Preferences> | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

const ADMINS_TEAM_ID = import.meta.env.VITE_APPWRITE_ADMINS_TEAM_ID as string | undefined

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  const computeIsAdmin = async (u: Models.User<Models.Preferences> | null) => {
    if (!u) return false
    try {
      if (ADMINS_TEAM_ID) {
        const memberships = await teams.listMemberships(ADMINS_TEAM_ID)
        const found = memberships.memberships.some((m) => m.userId === u.$id)
        if (found) return true
      }
    } catch {}
    // Fallback via preferences
    return (u.prefs as any)?.role === 'admin'
  }

  const refresh = async () => {
    setLoading(true)
    try {
      const u = await account.get()
      setUser(u)
      setIsAdmin(await computeIsAdmin(u))
    } catch {
      setUser(null)
      setIsAdmin(false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (email: string, password: string) => {
    // Ensure there is no active session that would block session creation
    try {
      await account.deleteSession('current')
    } catch {
      // ignore errors - if there is no session or deletion fails, we'll still attempt to create
    }

    await account.createEmailPasswordSession(email, password)
    await refresh()
  }

  const register = async (email: string, password: string, name?: string) => {
    await account.create('unique()', email, password, name)

    // Same resilience for register -> session creation
    try {
      await account.deleteSession('current')
    } catch {
      // ignore
    }

    await account.createEmailPasswordSession(email, password)
    await refresh()
  }

  const logout = async () => {
    try {
      await account.deleteSession('current')
    } finally {
      setUser(null)
      setIsAdmin(false)
    }
  }

  const value = useMemo<AuthContextType>(() => ({ user, loading, isAdmin, login, register, logout, refresh }), [user, loading, isAdmin])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
