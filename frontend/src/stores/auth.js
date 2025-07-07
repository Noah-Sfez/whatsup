import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

const API_BASE_URL = 'http://localhost:3001/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref('')

  // Computed
  const isAuthenticated = computed(() => !!token.value)
  const currentUser = computed(() => user.value)

  // Actions
  const login = async (email, password) => {
    try {
      error.value = ''
      loading.value = true

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      token.value = data.token
      user.value = data.user

      // Sauvegarder le token dans localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const register = async (username, email, password) => {
    try {
      error.value = ''
      loading.value = true

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed')
      }

      token.value = data.token
      user.value = data.user

      // Sauvegarder le token dans localStorage
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      return { success: true }
    } catch (err) {
      error.value = err.message
      return { success: false, error: err.message }
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    return { success: true }
  }

  const initAuth = () => {
    // Récupérer les données depuis localStorage au démarrage
    const savedToken = localStorage.getItem('token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)
    }
  }

  const clearError = () => {
    error.value = ''
  }

  // Utilitaire pour les requêtes authentifiées
  const authenticatedFetch = async (url, options = {}) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    }

    if (token.value) {
      headers.Authorization = `Bearer ${token.value}`
    }

    return fetch(url, {
      ...options,
      headers,
    })
  }

  return {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
    initAuth,
    clearError,
    authenticatedFetch,
  }
})
