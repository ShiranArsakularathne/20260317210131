import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import axios from 'axios'

interface User {
  id: number
  username: string
  email: string
  full_name: string
  is_admin: boolean
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  rfidLogin: (rfidTag: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null })
        try {
          const formData = new FormData()
          formData.append('username', username)
          formData.append('password', password)
          
          const response = await axios.post('/api/auth/token', formData)
          const { access_token } = response.data
          
          // Get user info
          const userResponse = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` }
          })
          
          set({
            user: userResponse.data,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          // Set default axios header
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'Login failed',
            isAuthenticated: false
          })
        }
      },

      rfidLogin: async (rfidTag: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await axios.post('/api/auth/rfid-login', { rfid_tag: rfidTag })
          const { access_token } = response.data
          
          // Get user info
          const userResponse = await axios.get('/api/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` }
          })
          
          set({
            user: userResponse.data,
            token: access_token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          })
          
          axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.response?.data?.detail || 'RFID login failed',
            isAuthenticated: false
          })
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null
        })
        delete axios.defaults.headers.common['Authorization']
      },

      clearError: () => {
        set({ error: null })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)