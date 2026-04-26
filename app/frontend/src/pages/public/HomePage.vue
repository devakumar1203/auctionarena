<template>
  <div class="home-page">
    <!-- Mouse follower spotlight -->
    <div class="spotlight" :style="{ left: mouse.x + 'px', top: mouse.y + 'px' }"></div>

    <!-- Floating particles -->
    <div class="particles">
      <div v-for="p in particles" :key="p.id" class="particle" :style="p.style"></div>
    </div>

    <!-- ── HERO ── -->
    <section class="hero">
      <div class="orb orb-1"></div>
      <div class="orb orb-2"></div>
      <div class="orb orb-3"></div>
      <div class="grid-bg"></div>

      <!-- Floating auction items -->
      <div class="floating-items">
        <div class="fi fi-1">🏺</div>
        <div class="fi fi-2">💎</div>
        <div class="fi fi-3">🎨</div>
        <div class="fi fi-4">⌚</div>
        <div class="fi fi-5">📿</div>
        <div class="fi fi-6">🎭</div>
      </div>

      <div class="container">
        <div class="hero-content">
          <div class="hero-pill" :class="{ visible: mounted }">
            <span class="pill-dot"></span>
            Live auctions happening now
          </div>

          <h1 class="hero-title" :class="{ visible: mounted }">
            Bid. Win.<br>
            <span class="hero-gradient">Celebrate.</span>
          </h1>

          <p class="hero-subtitle" :class="{ visible: mounted }">
            India's premier real-time auction platform. Discover rare collectibles,
            vintage art, luxury watches and more — bid live against enthusiasts nationwide.
          </p>

          <div class="hero-actions" :class="{ visible: mounted }">
            <router-link to="/register" class="btn btn-primary btn-hero">
              Start Bidding
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </router-link>
            <router-link to="/#auctions" class="btn btn-outline btn-hero">Browse Auctions</router-link>
          </div>

          <div class="hero-stats" :class="{ visible: mounted }">
            <div class="stat-item">
              <div class="stat-num">500+</div>
              <div class="stat-lbl">Active Auctions</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-num">10K+</div>
              <div class="stat-lbl">Happy Bidders</div>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <div class="stat-num">₹2Cr+</div>
              <div class="stat-lbl">Items Sold</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Light beam -->
      <div class="light-beam"></div>
    </section>

    <!-- ── LIVE AUCTIONS ── -->
    <section id="auctions" class="auctions-section">
      <div class="container">
        <div class="section-header">
          <div>
            <h2 class="section-title">Live Auctions</h2>
            <p class="section-desc">Bid on exclusive items in real-time</p>
          </div>
          <div class="section-controls">
            <div class="search-bar">
              <input v-model="search" @input="debouncedSearch" placeholder="Search auctions..." />
            </div>
            <select v-model="sort" @change="fetchAuctions" class="sort-select">
              <option value="latest">Latest</option>
              <option value="ending_soon">Ending Soon</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
            </select>
          </div>
        </div>

        <div v-if="loading" class="text-center mt-lg">
          <div class="loader"></div>
        </div>
        <div v-else-if="!auctions.length" class="empty-state">
          <div class="emoji">🔨</div>
          <p>No auctions found. Check back soon!</p>
        </div>
        <div v-else class="grid grid-3">
          <AuctionCard v-for="a in auctions" :key="a.id" :auction="a" />
        </div>

        <div v-if="pagination.totalPages > 1" class="pagination flex-center gap-sm mt-lg">
          <button class="btn btn-outline btn-sm" :disabled="page <= 1" @click="page--; fetchAuctions()">← Prev</button>
          <span class="text-muted" style="font-size:0.8rem">{{ page }} / {{ pagination.totalPages }}</span>
          <button class="btn btn-outline btn-sm" :disabled="page >= pagination.totalPages" @click="page++; fetchAuctions()">Next →</button>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, reactive } from 'vue'
import api from '../../services/api'
import AuctionCard from '../../components/AuctionCard.vue'

const mounted = ref(false)
const auctions = ref([])
const loading = ref(true)
const search = ref('')
const sort = ref('latest')
const page = ref(1)
const pagination = ref({})
const mouse = reactive({ x: -400, y: -400 })

// Floating particles
const particles = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  style: {
    left: Math.random() * 100 + 'vw',
    top: Math.random() * 100 + 'vh',
    width: (Math.random() * 4 + 2) + 'px',
    height: (Math.random() * 4 + 2) + 'px',
    animationDuration: (Math.random() * 12 + 8) + 's',
    animationDelay: (Math.random() * 8) + 's',
    opacity: Math.random() * 0.4 + 0.1,
  }
}))

const onMouseMove = (e) => { mouse.x = e.clientX; mouse.y = e.clientY }

let searchTimeout = null
const debouncedSearch = () => {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { page.value = 1; fetchAuctions() }, 400)
}

const fetchAuctions = async () => {
  loading.value = true
  try {
    const { data } = await api.get('/auctions', { params: { search: search.value, sort: sort.value, page: page.value, limit: 12 } })
    auctions.value = data.auctions
    pagination.value = data.pagination
  } catch (e) { console.error(e) }
  loading.value = false
}

onMounted(() => {
  fetchAuctions()
  setTimeout(() => { mounted.value = true }, 100)
  window.addEventListener('mousemove', onMouseMove)
})
onUnmounted(() => { window.removeEventListener('mousemove', onMouseMove) })
</script>

<style scoped>
/* ── Spotlight mouse follower ── */
.spotlight {
  position: fixed; pointer-events: none; z-index: 0;
  width: 600px; height: 600px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 65%);
  transition: left 0.12s ease, top 0.12s ease;
  border-radius: 50%;
}

/* ── Floating particles ── */
.particles { position: fixed; inset: 0; pointer-events: none; z-index: 0; overflow: hidden; }
.particle {
  position: absolute; border-radius: 50%;
  background: var(--primary); opacity: 0.15;
  animation: floatParticle linear infinite;
}
@keyframes floatParticle {
  0% { transform: translateY(0) scale(1); }
  50% { transform: translateY(-60px) scale(1.3); }
  100% { transform: translateY(0) scale(1); }
}

/* ── Hero ── */
.hero {
  position: relative; overflow: hidden;
  padding: 110px 0 90px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-body);
}

/* Ambient orbs */
.orb {
  position: absolute; border-radius: 50%;
  filter: blur(90px); opacity: 0.18; pointer-events: none;
  animation: drift 22s ease-in-out infinite;
}
.orb-1 { width: 560px; height: 560px; background: var(--primary); top: -200px; left: -120px; }
.orb-2 { width: 440px; height: 440px; background: #FCD34D; top: 50px; right: -120px; animation-delay: -8s; animation-duration: 28s; }
.orb-3 { width: 320px; height: 320px; background: #FB923C; bottom: -80px; left: 45%; animation-delay: -15s; animation-duration: 20s; }

@keyframes drift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  25% { transform: translate(40px, -50px) scale(1.06); }
  50% { transform: translate(-25px, 25px) scale(0.94); }
  75% { transform: translate(50px, 35px) scale(1.03); }
}

/* Grid pattern */
.grid-bg {
  position: absolute; inset: 0; pointer-events: none;
  background-image:
    linear-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black 30%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 70% 60% at 50% 0%, black 30%, transparent 100%);
}

/* Light beam from centre */
.light-beam {
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 2px; height: 180px;
  background: linear-gradient(to top, var(--primary), transparent);
  filter: blur(1px);
  opacity: 0.5;
  animation: beamPulse 3s ease-in-out infinite;
}
.light-beam::before {
  content: '';
  position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 200px; height: 200px;
  background: radial-gradient(ellipse, rgba(249,115,22,0.18) 0%, transparent 70%);
  border-radius: 50%;
}
@keyframes beamPulse {
  0%, 100% { opacity: 0.4; height: 160px; }
  50% { opacity: 0.8; height: 210px; }
}

/* Floating emoji items */
.floating-items { position: absolute; inset: 0; pointer-events: none; }
.fi {
  position: absolute; font-size: 1.8rem; opacity: 0.15;
  filter: grayscale(0.3);
  animation: floatItem ease-in-out infinite;
}
.fi-1 { top: 15%; left: 5%;  animation-duration: 7s;  animation-delay: 0s;   }
.fi-2 { top: 70%; left: 8%;  animation-duration: 9s;  animation-delay: -2s;  }
.fi-3 { top: 25%; right: 7%; animation-duration: 8s;  animation-delay: -1s;  }
.fi-4 { top: 65%; right: 5%; animation-duration: 10s; animation-delay: -3s;  }
.fi-5 { top: 45%; left: 2%;  animation-duration: 6s;  animation-delay: -4s;  }
.fi-6 { top: 50%; right: 3%; animation-duration: 11s; animation-delay: -5s;  }

@keyframes floatItem {
  0%, 100% { transform: translateY(0) rotate(-5deg) scale(1); }
  50% { transform: translateY(-22px) rotate(5deg) scale(1.1); }
}

/* Hero content */
.hero-content {
  position: relative; z-index: 1;
  text-align: center; max-width: 760px; margin: 0 auto;
}

/* Entrance animations */
.hero-pill, .hero-title, .hero-subtitle, .hero-actions, .hero-stats {
  opacity: 0; transform: translateY(28px);
  transition: opacity 0.85s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.85s cubic-bezier(0.16, 1, 0.3, 1);
}
.hero-pill.visible   { opacity: 1; transform: translateY(0); transition-delay: 0.1s; }
.hero-title.visible  { opacity: 1; transform: translateY(0); transition-delay: 0.25s; }
.hero-subtitle.visible { opacity: 1; transform: translateY(0); transition-delay: 0.4s; }
.hero-actions.visible { opacity: 1; transform: translateY(0); transition-delay: 0.55s; }
.hero-stats.visible  { opacity: 1; transform: translateY(0); transition-delay: 0.7s; }

.hero-pill {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 6px 16px; border-radius: 100px;
  background: var(--bg-surface); border: 1px solid var(--border);
  font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 32px;
}
.pill-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 8px var(--success);
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

.hero-title {
  font-size: 5rem; font-weight: 800; line-height: 1.05;
  letter-spacing: -0.05em; margin-bottom: 24px; color: var(--text-primary);
}
.hero-gradient {
  background: linear-gradient(135deg, var(--primary), #FBBF24);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-subtitle {
  font-size: 1.1rem; color: var(--text-secondary);
  line-height: 1.75; margin-bottom: 40px;
  max-width: 580px; margin-left: auto; margin-right: auto;
}
.hero-actions {
  display: flex; gap: 12px; justify-content: center; margin-bottom: 56px;
}
.btn-hero {
  padding: 14px 32px; font-size: 0.95rem;
  border-radius: 100px; font-weight: 600;
}
.btn-hero svg { transition: transform 0.2s ease; }
.btn-hero:hover svg { transform: translateX(4px); }

/* Stats */
.hero-stats {
  display: flex; justify-content: center; align-items: center; gap: 32px;
}
.stat-item { text-align: center; }
.stat-num {
  font-size: 1.75rem; font-weight: 800; color: var(--primary);
  letter-spacing: -0.03em;
}
.stat-lbl { font-size: 0.78rem; color: var(--text-muted); margin-top: 2px; }
.stat-divider { width: 1px; height: 36px; background: var(--border); }

/* ── Auctions Section ── */
.auctions-section { padding: 80px 0 100px; background: var(--bg-body); }
.section-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  margin-bottom: 40px; gap: 24px; flex-wrap: wrap;
}
.section-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); }
.section-desc { color: var(--text-secondary); font-size: 0.9rem; margin-top: 6px; }
.section-controls { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.sort-select { width: auto; min-width: 170px; }
.loader {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top-color: var(--primary); border-radius: 50%;
  animation: spin 0.6s linear infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }
.pagination button:disabled { opacity: 0.4; cursor: not-allowed; }

/* ── Responsive ── */
@media (max-width: 768px) {
  .hero { padding: 70px 0 60px; }
  .hero-title { font-size: 3rem; }
  .hero-actions { flex-direction: column; align-items: center; }
  .hero-stats { gap: 20px; }
  .section-header { flex-direction: column; }
  .floating-items { display: none; }
}
@media (max-width: 480px) {
  .hero-title { font-size: 2.4rem; }
}
</style>
