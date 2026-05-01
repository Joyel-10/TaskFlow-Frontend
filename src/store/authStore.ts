import { create } from 'zustand'
import api from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  isInitialized: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isInitialized: false,

  initAuth: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({ token, user, isAuthenticated: true, isInitialized: true })
      } catch {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        set({ isInitialized: true })
      }
    } else {
      set({ isInitialized: true })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      set({ user: data.user, token: data.token, isAuthenticated: true, isInitialized: true })
    } finally {
      set({ isLoading: false })
    }
  },

  register: async (name, email, password, role) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/register', { name, email, password, role })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      document.cookie = `token=${data.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`
      set({ user: data.user, token: data.token, isAuthenticated: true, isInitialized: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    document.cookie = 'token=; path=/; max-age=0'
    set({ user: null, token: null, isAuthenticated: false, isInitialized: true })
    window.location.href = '/login'
  },

  updateProfile: async (data) => {
    const { data: res } = await api.put('/auth/profile', data)
    localStorage.setItem('user', JSON.stringify(res.user))
    set({ user: res.user })
  },
}))