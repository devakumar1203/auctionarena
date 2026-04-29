import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'
import { getSocket } from '../services/socket'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)
  const subscribedCategories = ref([])
  let listenerAttached = false

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/users/notifications')
      notifications.value = data.notifications
      unreadCount.value = data.notifications.filter(n => !n.read).length
    } catch (e) { console.error('Fetch notifications error:', e) }
  }

  const markAsRead = async (id) => {
    try {
      await api.put(`/users/notifications/${id}/read`)
      const n = notifications.value.find(x => x.id === id)
      if (n) { n.read = true; unreadCount.value = Math.max(0, unreadCount.value - 1) }
    } catch (e) { console.error('Mark read error:', e) }
  }

  const fetchSubscriptions = async () => {
    try {
      const { data } = await api.get('/users/category-subscriptions')
      subscribedCategories.value = data.categories || []
    } catch (e) { console.error('Fetch subscriptions error:', e) }
  }

  const subscribeToCategory = async (category) => {
    try {
      await api.post('/users/category-subscriptions', { category })
      subscribedCategories.value.push(category)
    } catch (e) { console.error('Subscribe error:', e); throw e }
  }

  const unsubscribeFromCategory = async (category) => {
    try {
      await api.delete(`/users/category-subscriptions/${encodeURIComponent(category)}`)
      subscribedCategories.value = subscribedCategories.value.filter(c => c !== category)
    } catch (e) { console.error('Unsubscribe error:', e); throw e }
  }

  const attachSocketListener = (socket) => {
    socket.off('new_notification')
    socket.on('new_notification', (notification) => {
      console.log('🔔 Received real-time notification:', notification)
      notifications.value.unshift({
        id: 'rt-' + Date.now().toString(),
        ...notification,
        read: false,
      })
      unreadCount.value++
    })
    listenerAttached = true
    console.log('✅ Notification listener attached')
  }

  const setupRealtimeListener = () => {
    const socket = getSocket()
    if (socket) {
      attachSocketListener(socket)
      // Re-attach on reconnect
      socket.off('connect', () => {})
      socket.on('connect', () => {
        console.log('Socket reconnected, re-attaching notification listener')
        attachSocketListener(socket)
      })
    } else {
      // Retry after a short delay if socket isn't ready yet
      console.log('Socket not ready, retrying in 1s...')
      setTimeout(() => {
        const s = getSocket()
        if (s) attachSocketListener(s)
      }, 1000)
    }
  }

  return {
    notifications, unreadCount, subscribedCategories,
    fetchNotifications, markAsRead,
    fetchSubscriptions, subscribeToCategory, unsubscribeFromCategory,
    setupRealtimeListener,
  }
})
