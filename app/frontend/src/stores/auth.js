import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref(localStorage.getItem('token') || null)
  const loading = ref(false)
  const error = ref(null)

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  const login = async (email, password) => {
    loading.value = true; error.value = null
    try {
      const { data } = await api.post('/auth/login', { email, password })
      token.value = data.token; user.value = data.user
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      connectSocket(data.token)
      return data.user
    } catch (e) {
      if (e.response?.data?.errors) {
        error.value = e.response.data.errors.map(err => err.message).join(', ')
      } else {
        error.value = e.response?.data?.message || 'Login failed'
      }
      throw e
    } finally { loading.value = false }
  }

  const register = async (formData) => {
    loading.value = true; error.value = null
    try {
      const { data } = await api.post('/auth/register', formData)
      // Don't log the user in — they need to verify their email first
      return data
    } catch (e) {
      if (e.response?.data?.errors) {
        error.value = e.response.data.errors.map(err => err.message).join(', ')
      } else {
        error.value = e.response?.data?.message || 'Registration failed'
      }
      throw e
    } finally { loading.value = false }
  }

  const logout = () => {
    token.value = null; user.value = null
    localStorage.removeItem('token'); localStorage.removeItem('user')
    disconnectSocket()
  }

  const fetchMe = async () => {
    try {
      const { data } = await api.get('/auth/me')
      user.value = data.user
      localStorage.setItem('user', JSON.stringify(data.user))
    } catch (e) { logout() }
  }

  // Reconnect socket on page reload if token exists
  if (token.value) connectSocket(token.value)

  return { user, token, loading, error, isAuthenticated, isAdmin, login, register, logout, fetchMe }
})
