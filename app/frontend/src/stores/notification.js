import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../services/api'

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref([])
  const unreadCount = ref(0)

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

  return { notifications, unreadCount, fetchNotifications, markAsRead }
})
