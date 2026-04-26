<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>🔨 Manage Auctions</h1><p>Review and manage all auctions</p></div>
    <div class="flex gap-md mb-lg">
      <select v-model="statusFilter" @change="fetchAuctions" style="width:auto">
        <option value="">All Status</option>
        <option value="ACTIVE">Active</option>
        <option value="COMPLETED">Completed</option>
        <option value="CANCELLED">Cancelled</option>
      </select>
    </div>
    <div v-if="loading" class="text-center"><p>Loading...</p></div>
    <div v-else class="table-container">
      <table>
        <thead><tr><th>Product</th><th>Seller</th><th>Type</th><th>Best Price</th><th>Bids</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="a in auctions" :key="a.id">
            <td><strong>{{ a.product?.name }}</strong></td>
            <td>{{ a.seller?.name }}</td>
            <td><span class="badge" style="background:rgba(0,210,255,0.12);color:var(--accent)">{{ a.type }}</span></td>
            <td style="font-weight:700">₹{{ Number(a.bestPrice).toLocaleString('en-IN') }}</td>
            <td>{{ a._count?.bids || 0 }}</td>
            <td><span class="badge" :class="a.status==='ACTIVE'?'badge-active':'badge-completed'">{{ a.status }}</span></td>
            <td><button v-if="a.status==='ACTIVE'" class="btn btn-danger btn-sm" @click="removeAuction(a.id)">Remove</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
const auctions = ref([]); const loading = ref(true); const statusFilter = ref('')
const fetchAuctions = async () => {
  loading.value = true
  try { const { data } = await api.get('/admin/auctions', { params: { status: statusFilter.value } }); auctions.value = data.auctions } catch(e){}
  loading.value = false
}
const removeAuction = async (id) => {
  if (!confirm('Remove this auction? This cannot be undone.')) return
  try { await api.delete(`/admin/auctions/${id}`); fetchAuctions() } catch(e){ alert(e.response?.data?.message||'Failed') }
}
onMounted(fetchAuctions)
</script>
