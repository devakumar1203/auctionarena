<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>My Bids</h1><p>Track all your bidding activity</p></div>
    <div v-if="loading" class="text-center"><p>Loading...</p></div>
    <div v-else-if="!bids.length" class="empty-state"><div class="emoji">🔨</div><p>You haven't placed any bids yet.</p></div>
    <div v-else class="table-container">
      <table>
        <thead><tr><th>Product</th><th>My Bid</th><th>Current Best</th><th>Status</th><th>Bid Status</th><th>Action</th></tr></thead>
        <tbody>
          <tr v-for="b in bids" :key="b.id">
            <td><router-link :to="`/auction/${b.auctionRoom?.id}`" style="font-weight:600">{{ b.auctionRoom?.product?.name }}</router-link></td>
            <td style="font-weight:700">₹{{ fmt(b.amount) }}</td>
            <td>₹{{ fmt(b.auctionRoom?.bestPrice) }}</td>
            <td><span class="badge" :class="b.auctionRoom?.status==='ACTIVE'?'badge-active':'badge-completed'">{{ b.auctionRoom?.status }}</span></td>
            <td>
              <span v-if="b.status==='WITHDRAWN'" class="badge badge-danger">Withdrawn</span>
              <span v-else-if="b.auctionRoom?.highestBuyer?.id===b.userId" class="badge badge-active">Winning</span>
              <span v-else class="badge" style="background:rgba(255,179,0,0.12);color:var(--warning)">Outbid</span>
            </td>
            <td><router-link :to="`/auction/${b.auctionRoom?.id}`" class="btn btn-outline btn-sm">View</router-link></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
const bids = ref([]); const loading = ref(true)
const fmt = (n) => Number(n).toLocaleString('en-IN')
onMounted(async () => { try { const { data } = await api.get('/auctions/my-bids'); bids.value = data.bids } catch(e){} loading.value = false })
</script>
