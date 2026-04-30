<template>
  <div class="container" style="padding:32px 24px">
    <div v-if="loading" class="text-center mt-lg"><p>Loading auction...</p></div>
    <div v-else-if="!auction" class="empty-state"><div class="emoji">❌</div><p>Auction not found.</p></div>
    <template v-else>
      <div class="auction-layout">
        <div class="auction-main">
          <div class="card mb-md">
            <!-- Product Images -->
            <div v-if="productImages.length" class="product-gallery mb-md">
              <div class="gallery-main">
                <img :src="selectedImage" :alt="auction.product?.name" />
              </div>
              <div v-if="productImages.length > 1" class="gallery-thumbs">
                <div v-for="(img, i) in productImages" :key="i"
                     class="gallery-thumb" :class="{ active: selectedImage === img }"
                     @click="selectedImage = img">
                  <img :src="img" :alt="'thumb-'+i" />
                </div>
              </div>
            </div>

            <div class="flex-between mb-sm">
              <span class="badge" :class="auction.status==='ACTIVE'?'badge-active':'badge-completed'">{{ auction.status }}</span>
              <span class="badge badge-info">{{ auction.type === 'TIME_BOUND' ? '⏰ Timed' : '🔓 Open' }}</span>
            </div>
            <h1 style="font-size:1.8rem;margin-bottom:8px">{{ auction.product?.name }}</h1>
            <p class="text-muted mb-md">{{ auction.product?.description }}</p>
            <div class="info-grid">
              <div><span class="info-label">Category</span><span class="category-tag">{{ auction.product?.category }}</span></div>
              <div><span class="info-label">Base Price</span><span>₹{{ fmt(auction.product?.basePrice) }}</span></div>
              <div><span class="info-label">Seller</span>
                <router-link :to="`/profile/${auction.seller?.id}`">{{ auction.seller?.name }} ⭐{{ auction.seller?.rating }}</router-link>
              </div>
              <div v-if="auction.type==='TIME_BOUND'"><span class="info-label">Ends</span><span :class="timeLeftColor">{{ timeLeft }}</span></div>
            </div>
          </div>

          <div class="card">
            <h3 class="mb-md">Bid History ({{ bids.length }})</h3>
            <div v-if="!bids.length" class="text-muted">No bids yet. Be the first!</div>
            <div v-for="b in bids" :key="b.id" class="bid-item" :class="{ winner: b.userId === auction.highestBuyerId }">
              <div class="flex-between">
                <div><strong>{{ b.user?.name }}</strong> <span v-if="b.status==='WITHDRAWN'" class="badge badge-danger">Withdrawn</span></div>
                <span class="bid-amount">₹{{ fmt(b.amount) }}</span>
              </div>
              <span class="text-muted" style="font-size:0.75rem">{{ new Date(b.createdAt).toLocaleString() }}</span>
            </div>
          </div>
        </div>

        <div class="auction-sidebar">
          <div class="card bid-panel">
            <div class="current-price">
              <span class="info-label">Current Highest Bid</span>
              <div class="big-price">₹{{ fmt(auction.bestPrice) }}</div>
              <span v-if="auction.highestBuyer" class="text-muted">by {{ auction.highestBuyer?.name }}</span>
            </div>

            <!-- Buyer bidding panel -->
            <div v-if="auction.status==='ACTIVE' && auth.isAuthenticated && auction.sellerId !== auth.user?.id">
              <div class="form-group">
                <label>Your Bid (₹)</label>
                <input v-model.number="bidAmount" type="number" :min="auction.bestPrice + 1" :placeholder="`Min ₹${fmt(auction.bestPrice + 1)}`" />
              </div>
              <button class="btn btn-primary btn-block" @click="placeBid" :disabled="bidding" style="padding:14px">
                {{ bidding ? 'Placing...' : '🔨 Place Bid' }}
              </button>
              <div v-if="bidError" class="alert-error mt-md" style="padding:10px;border-radius:8px;font-size:0.85rem">{{ bidError }}</div>

              <button v-if="auction.highestBuyerId === auth.user?.id" class="btn btn-danger btn-block mt-md btn-sm" @click="withdrawBid">
                Withdraw My Bid
              </button>
            </div>
            <!-- Seller controls -->
            <div v-else-if="auction.status==='ACTIVE' && auth.isAuthenticated && auction.sellerId === auth.user?.id" class="seller-controls mt-md">
              <div class="seller-info-msg">
                <p class="text-muted" style="font-size:0.85rem;text-align:center;margin-bottom:16px">You are the seller of this auction.</p>
              </div>
              <button
                v-if="auction.type === 'OPEN'"
                class="btn btn-danger btn-block end-auction-btn"
                @click="endAuction"
                :disabled="ending"
              >
                {{ ending ? 'Ending...' : '🛑 End Auction' }}
              </button>
              <p v-else class="text-muted" style="font-size:0.8rem;text-align:center">This timed auction will end automatically.</p>
            </div>
            <div v-else-if="auction.status==='COMPLETED'" class="completed-msg text-center mt-md">
              <div style="font-size:2rem">🏆</div>
              <p><strong>Auction Ended</strong></p>
              <p v-if="auction.highestBuyer" class="text-muted">Won by {{ auction.highestBuyer.name }}</p>
            </div>
            <div v-else-if="!auth.isAuthenticated" class="text-center mt-md">
              <router-link to="/login" class="btn btn-primary btn-block">Login to Bid</router-link>
            </div>
          </div>

            <div v-if="auction.status==='COMPLETED' && auth.isAuthenticated && auction.highestBuyerId===auth.user?.id" class="card mt-md rate-action-card">
              <div v-if="ratingStatus.buyerRated" class="rated-badge">
                <span class="rated-icon">✅</span>
                <span>You've rated the seller</span>
              </div>
              <router-link v-else :to="`/auction/${auction.id}/rate`" class="btn btn-primary btn-block rate-link-btn">
                ⭐ Rate Seller
              </router-link>
            </div>

            <div v-if="auction.status==='COMPLETED' && auth.isAuthenticated && auction.sellerId===auth.user?.id && auction.highestBuyerId" class="card mt-md rate-action-card">
              <div v-if="ratingStatus.sellerRated" class="rated-badge">
                <span class="rated-icon">✅</span>
                <span>You've rated the buyer</span>
              </div>
              <router-link v-else :to="`/auction/${auction.id}/rate`" class="btn btn-primary btn-block rate-link-btn">
                ⭐ Rate Buyer
              </router-link>
            </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'
import { getSocket } from '../../services/socket'

const route = useRoute()
const auth = useAuthStore()
const auction = ref(null)
const bids = ref([])
const loading = ref(true)
const bidAmount = ref(null)
const bidding = ref(false)
const bidError = ref('')
const ending = ref(false)
const timeLeft = ref('')
const timeLeftColor = ref('')
const selectedImage = ref('')
const ratingStatus = reactive({ buyerRated: false, sellerRated: false })
let timer = null

const productImages = computed(() => auction.value?.product?.images || [])

const fmt = (n) => Number(n).toLocaleString('en-IN')

const fetchAuction = async () => {
  try {
    const { data } = await api.get(`/auctions/${route.params.id}`)
    auction.value = data.auction
    bids.value = data.auction.bids || []
    const imgs = data.auction.product?.images || []
    if (imgs.length) selectedImage.value = imgs[0]
  } catch (e) { console.error(e) }
  loading.value = false
}

const fetchRatingStatus = async () => {
  if (!auth.isAuthenticated || !auction.value || auction.value.status !== 'COMPLETED') return
  try {
    const { data } = await api.get(`/auctions/${auction.value.id}/rating-status`)
    if (data.alreadyRated) {
      if (data.role === 'buyer') ratingStatus.buyerRated = true
      if (data.role === 'seller') ratingStatus.sellerRated = true
    }
  } catch (e) { /* Not a participant or other issue, ignore */ }
}

const placeBid = () => {
  bidError.value = ''
  if (!bidAmount.value || bidAmount.value <= auction.value.bestPrice) {
    bidError.value = `Bid must be greater than ₹${fmt(auction.value.bestPrice)}`; return
  }
  bidding.value = true
  const socket = getSocket()
  if (socket) {
    socket.emit('place_bid', { auctionId: auction.value.id, amount: bidAmount.value })
    setTimeout(() => { bidding.value = false }, 1000)
  } else { bidError.value = 'Connection lost. Please refresh.'; bidding.value = false }
}

const endAuction = async () => {
  if (!confirm('Are you sure you want to end this auction? This cannot be undone.')) return
  ending.value = true
  try {
    const { data } = await api.post(`/auctions/${auction.value.id}/end`)
    auction.value.status = 'COMPLETED'
    alert(data.message)
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to end auction')
  }
  ending.value = false
}

const withdrawBid = async () => {
  if (!confirm('Warning: Withdrawing will flag your account. Continue?')) return
  try {
    const { data } = await api.post(`/auctions/${auction.value.id}/bid/withdraw`)
    alert(data.message)
    fetchAuction()
  } catch (e) { alert(e.response?.data?.message || 'Failed') }
}

const calcTimeLeft = () => {
  if (!auction.value?.endTime) return
  const diff = new Date(auction.value.endTime) - new Date()
  if (diff <= 0) { timeLeft.value = 'Ended'; timeLeftColor.value = 'text-danger'; return }
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
  timeLeft.value = `${h}h ${m}m ${s}s`
  timeLeftColor.value = diff < 3600000 ? 'text-danger' : 'text-warning'
}

onMounted(() => {
  fetchAuction().then(() => {
    fetchRatingStatus()
    const socket = getSocket()
    if (socket && auction.value) {
      socket.emit('join_auction', auction.value.id)
      socket.on('bid_update', (data) => {
        if (data.auctionId === auction.value.id) {
          auction.value.bestPrice = data.newHighestBid
          auction.value.highestBuyerId = data.highestBuyerId
          bids.value.unshift(data.bid)
          bidAmount.value = null
        }
      })
      socket.on('auction_ended', (data) => {
        if (data.auctionId === auction.value.id) { auction.value.status = 'COMPLETED' }
      })
      socket.on('bid_error', (data) => { bidError.value = data.message; bidding.value = false })
    }
    calcTimeLeft(); timer = setInterval(calcTimeLeft, 1000)
  })
})

onUnmounted(() => {
  clearInterval(timer)
  const socket = getSocket()
  if (socket && auction.value) socket.emit('leave_auction', auction.value.id)
})
</script>

<style scoped>
.auction-layout { display: grid; grid-template-columns: 1fr 380px; gap: 24px; }
.info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
.info-label { display: block; font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
.category-tag { background: var(--bg-elevated); border: 1px solid var(--border); color: var(--text-secondary); padding: 3px 10px; border-radius: 100px; font-size: 0.75rem; }
.bid-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
.bid-item.winner { border-left: 2px solid var(--success); padding-left: 12px; }
.bid-amount { font-weight: 700; color: var(--success); }
.current-price { text-align: center; padding: 24px 0; border-bottom: 1px solid var(--border); margin-bottom: 20px; }
.big-price { font-size: 2rem; font-weight: 700; color: var(--success); margin: 8px 0; letter-spacing: -0.03em; }
.bid-panel { position: sticky; top: 72px; }
.alert-error { background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2); color: var(--danger); }

/* Product Gallery */
.product-gallery { border-radius: var(--radius); overflow: hidden; }
.gallery-main {
  width: 100%; height: 320px; overflow: hidden;
  background: var(--bg-surface); border-radius: var(--radius);
  border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center; padding: 16px;
}
.gallery-main img { width: 100%; height: 100%; object-fit: contain; border-radius: 8px; }
.gallery-thumbs { display: flex; gap: 8px; margin-top: 8px; }
.gallery-thumb {
  width: 64px; height: 64px; border-radius: var(--radius-sm);
  overflow: hidden; cursor: pointer; border: 2px solid transparent;
  transition: var(--transition); opacity: 0.6;
}
.gallery-thumb.active, .gallery-thumb:hover { border-color: var(--primary); opacity: 1; }
.gallery-thumb img { width: 100%; height: 100%; object-fit: cover; }

@media (max-width: 900px) { .auction-layout { grid-template-columns: 1fr; } }

/* End Auction Button */
.end-auction-btn {
  padding: 14px !important;
  font-size: 0.95rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em;
}
.end-auction-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Rate Action Cards */
.rate-action-card {
  text-align: center;
  padding: 20px !important;
}
.rate-link-btn {
  display: block;
  padding: 14px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  text-decoration: none;
  border-radius: var(--radius) !important;
  background: linear-gradient(135deg, #FFD700, #FFA500) !important;
  color: #1a1a2e !important;
  border: none !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
}
.rate-link-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(255, 215, 0, 0.45);
}
.rated-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background: rgba(16, 185, 129, 0.08);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: var(--radius);
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--success);
}
.rated-icon {
  font-size: 1.2rem;
}
</style>
