import { create } from 'zustand'
import api from '@/lib/api'
import type { User } from '@/types'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, role?: string) => Promise<void>
  logout: () => void
  updateProfile: (data: Partial<User>) => Promise<void>
  initAuth: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,

  initAuth: () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      set({ token, user: JSON.parse(user), isAuthenticated: true })
    }
  },

  login: async (email, password) => {
    set({ isLoading: true })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      set({ user: data.user, token: data.token, isAuthenticated: true })
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
      set({ user: data.user, token: data.token, isAuthenticated: true })
    } finally {
      set({ isLoading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null, isAuthenticated: false })
    window.location.href = '/login'
  },

  updateProfile: async (data) => {
    const { data: res } = await api.put('/auth/profile', data)
    localStorage.setItem('user', JSON.stringify(res.user))
    set({ user: res.user })
  },
}))
