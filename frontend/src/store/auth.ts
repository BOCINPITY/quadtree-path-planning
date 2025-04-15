import { defineStore } from 'pinia'
import { login } from '@/http/auth'
import type { User } from '@/@types'
export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem('auth_token') as string | null, // Restore token from localStorage
  }),
  actions: {
    async loginUser(email: string, password: string) {
      try {
        const data = await login(email, password)
        this.$patch({
          user: data.user,
          token: data.token,
        })
        localStorage.setItem('auth_token', data.token) // Persist token to localStorage
      } catch (error) {
        console.error('Failed to login:', error)
        throw error
      }
    },

    logoutUser() {
      this.$patch({
        user: null,
        token: null,
      })
      localStorage.removeItem('auth_token') // Remove token from localStorage
    },
  },
  getters: {
    isAuthenticated: (state) => !!state.token,
    getUser: (state) => state.user,
  },
  persist: true, // Enable persistence for the entire store
})
