<template>
  <nav class="navbar">
    <div class="navbar-inner container flex-between">
      <router-link to="/" class="logo">
        <span class="logo-text">Auction Arena</span>
      </router-link>

      <div class="nav-links hide-mobile">
        <router-link to="/" class="nav-link">Explore</router-link>
        <template v-if="auth.isAuthenticated && !auth.isAdmin">
          <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          <router-link to="/my-bids" class="nav-link">My Bids</router-link>
          <router-link to="/create-auction" class="nav-link">Sell</router-link>
        </template>
        <template v-if="auth.isAdmin">
          <router-link to="/admin" class="nav-link">Dashboard</router-link>
          <router-link to="/admin/users" class="nav-link">Users</router-link>
          <router-link to="/admin/auctions" class="nav-link">Auctions</router-link>
          <router-link to="/admin/flagged" class="nav-link">Flagged</router-link>
        </template>
      </div>

      <div class="nav-actions flex gap-sm">
        <template v-if="auth.isAuthenticated">
          <div class="notif-btn" @click="showNotifs = !showNotifs">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span v-if="notifStore.unreadCount" class="notif-badge">{{ notifStore.unreadCount }}</span>
          </div>
          <div v-if="showNotifs" class="notif-dropdown">
            <div class="notif-header flex-between">
              <strong>Notifications</strong>
              <span class="text-muted" style="font-size:0.75rem">{{ notifStore.unreadCount }} unread</span>
            </div>
            <div v-if="!notifStore.notifications.length" class="notif-empty">No notifications</div>
            <div v-for="n in notifStore.notifications.slice(0,8)" :key="n.id"
                 class="notif-item" :class="{ unread: !n.read }"
                 @click="notifStore.markAsRead(n.id)">
              <div class="notif-title">{{ n.title }}</div>
              <div class="notif-msg">{{ n.message }}</div>
            </div>
          </div>
          <div class="user-menu" @click="showMenu = !showMenu">
            <div class="avatar">{{ auth.user?.name?.[0] || 'U' }}</div>
            <div v-if="showMenu" class="dropdown">
              <div class="dropdown-header">
                <strong>{{ auth.user?.name }}</strong>
                <span class="badge" :class="auth.isAdmin ? 'badge-danger' : 'badge-active'">
                  {{ auth.user?.role }}
                </span>
              </div>
              <router-link v-if="!auth.isAdmin" :to="`/profile/${auth.user?.id}`" class="dropdown-item">Profile</router-link>
              <div class="dropdown-item danger" @click="handleLogout">Logout</div>
            </div>
          </div>
        </template>
        <template v-else>
          <router-link to="/login" class="nav-link">Login</router-link>
          <router-link to="/register" class="btn btn-primary btn-sm">Get Started</router-link>
        </template>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useNotificationStore } from '../stores/notification'

const auth = useAuthStore()
const notifStore = useNotificationStore()
const router = useRouter()
const showMenu = ref(false)
const showNotifs = ref(false)

const handleLogout = () => {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  if (auth.isAuthenticated) notifStore.fetchNotifications()
})
</script>

<style scoped>
.navbar {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  position: sticky; top: 0; z-index: 100;
}
.navbar-inner { height: 56px; }
.logo {
  display: flex; align-items: center; gap: 8px;
  font-weight: 700; font-size: 1.05rem; color: var(--text-primary);
  letter-spacing: -0.02em;
}
.logo-text { color: var(--text-primary); }
.nav-links { display: flex; gap: 2px; }
.nav-link {
  padding: 6px 14px; border-radius: var(--radius-sm);
  color: var(--text-muted); font-weight: 400; font-size: 0.85rem;
  transition: var(--transition);
}
.nav-link:hover { color: var(--text-primary); }
.nav-link.router-link-active { color: var(--text-primary); }
.nav-actions { align-items: center; }
.notif-btn {
  position: relative; cursor: pointer; padding: 6px;
  color: var(--text-muted); transition: var(--transition);
  display: flex; align-items: center; justify-content: center;
  border-radius: var(--radius-sm);
}
.notif-btn:hover { color: var(--text-primary); background: var(--bg-elevated); }
.notif-badge {
  position: absolute; top: 0; right: 0;
  background: var(--danger); color: #fff; font-size: 0.6rem;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700;
}
.notif-dropdown {
  position: absolute; top: 52px; right: 60px; width: 320px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg);
  max-height: 380px; overflow-y: auto; z-index: 200;
}
.notif-header { padding: 14px 16px; border-bottom: 1px solid var(--border); }
.notif-empty { padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem; }
.notif-item {
  padding: 12px 16px; border-bottom: 1px solid var(--border);
  cursor: pointer; transition: var(--transition);
}
.notif-item:hover { background: var(--bg-card-hover); }
.notif-item.unread { border-left: 2px solid var(--primary); }
.notif-title { font-weight: 500; font-size: 0.8rem; }
.notif-msg { color: var(--text-muted); font-size: 0.75rem; margin-top: 2px; }
.avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: var(--bg-elevated); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 0.8rem; cursor: pointer;
  color: var(--text-secondary); transition: var(--transition);
}
.avatar:hover { border-color: var(--border-hover); }
.user-menu { position: relative; }
.dropdown {
  position: absolute; top: 44px; right: 0; width: 200px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius); box-shadow: var(--shadow-lg); z-index: 200;
}
.dropdown-header {
  padding: 14px 16px; border-bottom: 1px solid var(--border);
  display: flex; justify-content: space-between; align-items: center;
}
.dropdown-item {
  padding: 10px 16px; display: block; color: var(--text-secondary);
  font-size: 0.85rem; cursor: pointer; transition: var(--transition);
}
.dropdown-item:hover { background: var(--bg-card-hover); color: var(--text-primary); }
.dropdown-item.danger { color: var(--danger); }
</style>
