<template>
  <div class="auction-card card" @click="$router.push(`/auction/${auction.id}`)">
    <!-- Product Image -->
    <div class="card-image" v-if="imageUrl">
      <img :src="imageUrl" :alt="auction.product?.name" loading="lazy" />
    </div>
    <div class="card-image card-image-empty" v-else>
      <span>🔨</span>
    </div>

    <div class="card-body">
      <div class="card-badges">
        <span class="badge" :class="auction.status === 'ACTIVE' ? 'badge-active' : 'badge-completed'">
          {{ auction.status }}
        </span>
        <span class="badge badge-info">
          {{ auction.type === 'TIME_BOUND' ? 'Timed' : 'Open' }}
        </span>
      </div>
      <h3 class="card-title">{{ auction.product?.name }}</h3>
      <p class="card-desc">{{ auction.product?.description?.slice(0, 80) }}...</p>
      <div class="card-meta">
        <span class="category-tag">{{ auction.product?.category }}</span>
      </div>
      <div class="card-divider"></div>
      <div class="card-price">
        <div>
          <span class="price-label">Current Bid</span>
          <span class="price-value">₹{{ formatPrice(auction.bestPrice) }}</span>
        </div>
        <div v-if="auction.type === 'TIME_BOUND' && auction.endTime && auction.status === 'ACTIVE'">
          <span class="price-label">Ends in</span>
          <span class="countdown-value">{{ timeLeft }}</span>
        </div>
      </div>
      <div class="card-footer">
        <span class="text-muted" style="font-size:0.75rem">{{ auction.seller?.name || 'Unknown' }}</span>
        <span class="bid-count">{{ auction._count?.bids || 0 }} bids</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({ auction: Object })

const imageUrl = computed(() => {
  const images = props.auction.product?.images
  if (images && images.length > 0) return images[0]
  return null
})

const timeLeft = ref('')
let timer = null

const formatPrice = (p) => Number(p).toLocaleString('en-IN')

const calcTimeLeft = () => {
  if (!props.auction.endTime) return
  const diff = new Date(props.auction.endTime) - new Date()
  if (diff <= 0) { timeLeft.value = 'Ended'; return }
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  timeLeft.value = `${h}h ${m}m ${s}s`
}

onMounted(() => { calcTimeLeft(); timer = setInterval(calcTimeLeft, 1000) })
onUnmounted(() => clearInterval(timer))
</script>

<style scoped>
.auction-card {
  cursor: pointer; position: relative; overflow: hidden;
  padding: 0; transition: var(--transition);
}
.auction-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow);
}
.card-image {
  width: 100%; aspect-ratio: 4 / 3; overflow: hidden;
  background: var(--bg-surface);
  display: flex; align-items: center; justify-content: center;
}
.card-image img {
  width: 100%; height: 100%; object-fit: cover; object-position: center;
  display: block;
  transition: transform 0.3s ease;
}
.auction-card:hover .card-image img { transform: scale(1.05); }
.card-image-empty {
  display: flex; align-items: center; justify-content: center;
  font-size: 2.5rem; opacity: 0.3;
}
.card-body { padding: 16px; }
.card-badges { display: flex; gap: 6px; margin-bottom: 10px; }
.card-title { font-size: 1rem; font-weight: 600; margin-bottom: 6px; letter-spacing: -0.01em; }
.card-desc { color: var(--text-muted); font-size: 0.8rem; margin-bottom: 12px; line-height: 1.5; }
.card-meta { margin-bottom: 14px; }
.category-tag {
  background: var(--bg-surface); border: 1px solid var(--border);
  color: var(--text-secondary); padding: 3px 10px; border-radius: 100px;
  font-size: 0.72rem; font-weight: 500;
}
.card-divider { height: 1px; background: var(--border); margin-bottom: 14px; }
.card-price { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 12px; }
.price-label {
  display: block; font-size: 0.68rem; color: var(--text-muted);
  text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 2px;
}
.price-value { font-size: 1.2rem; font-weight: 700; color: var(--success); letter-spacing: -0.02em; }
.countdown-value { font-size: 0.85rem; font-weight: 600; color: var(--warning); }
.card-footer {
  display: flex; justify-content: space-between; align-items: center;
  padding-top: 10px; border-top: 1px solid var(--border);
}
.bid-count { color: var(--text-secondary); font-weight: 500; font-size: 0.8rem; }
</style>
