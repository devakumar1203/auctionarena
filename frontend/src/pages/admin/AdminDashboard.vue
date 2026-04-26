<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>🛡️ Admin Dashboard</h1><p>Platform overview and management</p></div>
    <div class="grid grid-3 mb-lg">
      <div class="stat-card"><div class="stat-value">{{ stats.totalUsers }}</div><div class="stat-label">Total Users</div></div>
      <div class="stat-card"><div class="stat-value">{{ stats.activeAuctions }}</div><div class="stat-label">Active Auctions</div></div>
      <div class="stat-card"><div class="stat-value">{{ stats.completedAuctions }}</div><div class="stat-label">Completed Auctions</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--danger)">{{ stats.blockedUsers }}</div><div class="stat-label">Blocked Users</div></div>
      <div class="stat-card"><div class="stat-value" style="color:var(--warning)">{{ stats.flaggedUsers }}</div><div class="stat-label">Flagged Users</div></div>
      <div class="stat-card"><div class="stat-value">{{ stats.totalProducts }}</div><div class="stat-label">Total Products</div></div>
    </div>
    <div class="grid grid-3">
      <router-link to="/admin/users" class="card quick-link"><h3>👥 Manage Users</h3><p class="text-muted">View, block, and manage user accounts</p></router-link>
      <router-link to="/admin/auctions" class="card quick-link"><h3>🔨 Manage Auctions</h3><p class="text-muted">Review and remove auctions</p></router-link>
      <router-link to="/admin/flagged" class="card quick-link"><h3>🚩 Flagged Users</h3><p class="text-muted">Review flagged sellers and take action</p></router-link>
      <router-link to="/admin/categories" class="card quick-link"><h3>📁 Categories</h3><p class="text-muted">Add or remove product categories</p></router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
const stats = ref({ totalUsers:0, blockedUsers:0, activeAuctions:0, completedAuctions:0, totalProducts:0, flaggedUsers:0 })
onMounted(async () => { try { const { data } = await api.get('/admin/dashboard'); stats.value = data.stats } catch(e){ console.error(e) } })
</script>

<style scoped>
.quick-link { text-decoration:none; color:inherit; cursor:pointer; }
.quick-link:hover { transform:translateY(-2px); box-shadow: var(--shadow); border-color: var(--border-hover); }
.quick-link h3 { margin-bottom:8px; font-size: 0.95rem; }
.quick-link p { font-size: 0.8rem; }
</style>
