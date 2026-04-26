<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>My Dashboard</h1><p>Welcome back, {{ auth.user?.name }}!</p></div>

    <div class="grid grid-4 mb-lg">
      <div class="stat-card"><div class="stat-value">{{ myAuctions.filter(a=>a.status==='ACTIVE').length }}</div><div class="stat-label">Active Listings</div></div>
      <div class="stat-card"><div class="stat-value">{{ myAuctions.filter(a=>a.status==='COMPLETED').length }}</div><div class="stat-label">Completed</div></div>
      <div class="stat-card"><div class="stat-value">{{ myBidsCount }}</div><div class="stat-label">My Bids</div></div>
      <div class="stat-card"><div class="stat-value">⭐ {{ auth.user?.rating || 0 }}</div><div class="stat-label">My Rating</div></div>
    </div>

    <div class="flex-between mb-md">
      <h2 style="font-size:1.3rem">My Auctions</h2>
      <router-link to="/create-auction" class="btn btn-primary btn-sm">+ Create Auction</router-link>
    </div>

    <div v-if="loading" class="text-center"><p>Loading...</p></div>
    <div v-else-if="!myAuctions.length" class="empty-state"><div class="emoji">📦</div><p>No auctions yet. Create your first listing!</p></div>
    <div v-else class="grid grid-3">
      <div v-for="a in myAuctions" :key="a.id" class="card" @click="$router.push(`/auction/${a.id}`)" style="cursor:pointer">
        <div class="flex-between mb-sm">
          <span class="badge" :class="a.status==='ACTIVE'?'badge-active':'badge-completed'">{{ a.status }}</span>
          <span class="text-muted" style="font-size:0.8rem">{{ a._count?.bids || 0 }} bids</span>
        </div>
        <h3 style="font-size:1rem;margin-bottom:8px">{{ a.product?.name }}</h3>
        <div class="flex-between">
          <span class="text-muted">Best Price</span>
          <span style="font-weight:700;color:var(--success)">₹{{ Number(a.bestPrice).toLocaleString('en-IN') }}</span>
        </div>
        <button v-if="a.status==='ACTIVE' && a.type==='OPEN'" class="btn btn-danger btn-sm btn-block mt-md" @click.stop="endAuction(a.id)">End Auction</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const auth = useAuthStore()
const myAuctions = ref([])
const myBidsCount = ref(0)
const loading = ref(true)

const fetchData = async () => {
  try {
    const [auctionsRes, bidsRes] = await Promise.all([api.get('/auctions/my'), api.get('/auctions/my-bids')])
    myAuctions.value = auctionsRes.data.auctions
    myBidsCount.value = bidsRes.data.bids.length
  } catch (e) { console.error(e) }
  loading.value = false
}

const endAuction = async (id) => {
  if (!confirm('Are you sure you want to end this auction?')) return
  try {
    await api.post(`/auctions/${id}/end`)
    fetchData()
  } catch (e) { alert(e.response?.data?.message || 'Failed to end auction') }
}

onMounted(fetchData)
</script>
