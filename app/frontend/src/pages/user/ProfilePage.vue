<template>
  <div class="container" style="padding:32px 24px">
    <div v-if="loading" class="text-center mt-lg"><div class="loader"></div></div>
    <div v-else-if="!profile" class="empty-state"><div class="emoji">👤</div><p>User not found.</p></div>
    <template v-else>
      <!-- Profile Header Card -->
      <div class="profile-header card mb-lg">
        <div class="profile-top">
          <div class="profile-avatar">{{ profile.name?.[0] || 'U' }}</div>
          <div class="profile-info">
            <div class="profile-name-row">
              <h1>{{ profile.name }}</h1>
              <span class="badge" :class="profile.role === 'ADMIN' ? 'badge-danger' : 'badge-active'">{{ profile.role }}</span>
              <span v-if="profile.isBlocked" class="badge badge-danger">Blocked</span>
            </div>
            <p class="text-muted" style="font-size:0.85rem">Member since {{ new Date(profile.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'long', day:'numeric' }) }}</p>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="profile-stats">
          <div class="pstat">
            <div class="pstat-val">
              <template v-if="profile.ratingCount === 0">
                <span class="new-user-badge-inline">🆕 New</span>
              </template>
              <template v-else>
                <span class="trust-score-display">
                  <span class="trust-stars">
                    <span v-for="i in 5" :key="i" class="star-icon" :class="{ filled: i <= Math.round(profile.rating) }">★</span>
                  </span>
                  <span class="trust-number">{{ profile.rating }}</span>
                </span>
              </template>
            </div>
            <div class="pstat-lbl">
              <template v-if="profile.ratingCount === 0">New User</template>
              <template v-else-if="profile.ratingCount < 5">Trust Score ({{ profile.ratingCount }} reviews)</template>
              <template v-else>Trust Score ({{ profile.ratingCount }})</template>
            </div>
          </div>
          <div class="pstat">
            <div class="pstat-val">{{ profile._count?.products || 0 }}</div>
            <div class="pstat-lbl">Products Listed</div>
          </div>
          <div class="pstat">
            <div class="pstat-val">{{ profile._count?.auctions || 0 }}</div>
            <div class="pstat-lbl">Auctions Created</div>
          </div>
          <div class="pstat">
            <div class="pstat-val">{{ profile._count?.bids || 0 }}</div>
            <div class="pstat-lbl">Bids Placed</div>
          </div>
          <div class="pstat">
            <div class="pstat-val">{{ profile._count?.wonAuctions || 0 }}</div>
            <div class="pstat-lbl">Auctions Won</div>
          </div>
          <div class="pstat">
            <div class="pstat-val" :class="profile.numberOfFlags >= 3 ? 'text-danger' : ''">{{ profile.numberOfFlags }}</div>
            <div class="pstat-lbl">Flags</div>
          </div>
        </div>
      </div>

      <!-- Details Grid -->
      <div class="grid grid-2 mb-lg">
        <!-- Personal Details -->
        <div class="card">
          <h3 class="card-section-title">Personal Details</h3>
          <div class="detail-list">
            <div class="detail-item">
              <span class="detail-label">Full Name</span>
              <span class="detail-value">{{ profile.name }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email</span>
              <span class="detail-value">{{ maskEmail(profile.email) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Phone</span>
              <span class="detail-value">{{ isOwnProfile ? profile.phoneNumber : maskPhone(profile.phoneNumber) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">PAN</span>
              <span class="detail-value">{{ isOwnProfile ? profile.pan : maskPan(profile.pan) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Account Status</span>
              <span class="detail-value">
                <span class="badge" :class="profile.isBlocked ? 'badge-danger' : 'badge-active'">
                  {{ profile.isBlocked ? 'Blocked' : 'Active' }}
                </span>
              </span>
            </div>
          </div>
        </div>

        <!-- Actions / Category Alerts Card -->
        <div class="card">
          <template v-if="isOwnProfile">
            <h3 class="card-section-title">🔔 Category Alerts</h3>
            <p class="sub-desc">Get notified when new auctions appear in your chosen categories.</p>

            <div v-if="catsLoading" class="text-muted" style="font-size:0.85rem">Loading categories...</div>
            <div v-else class="cat-sub-list">
              <div v-for="cat in allCategories" :key="cat" class="cat-sub-item">
                <span class="cat-sub-name">{{ cat }}</span>
                <button
                  class="cat-sub-toggle"
                  :class="{ active: isSubscribed(cat), toggling: togglingCat === cat }"
                  @click="toggleSubscription(cat)"
                  :disabled="togglingCat === cat"
                >
                  <span class="toggle-track">
                    <span class="toggle-thumb"></span>
                  </span>
                  <span class="toggle-label">{{ isSubscribed(cat) ? 'On' : 'Off' }}</span>
                </button>
              </div>
              <div v-if="!allCategories.length" class="text-muted" style="font-size:0.85rem">No categories available yet.</div>
            </div>
          </template>
        </div>
      </div>

      <!-- Ratings & Reviews Section -->
      <div class="reviews-container card mb-lg">
        <div class="reviews-header">
          <h3 class="reviews-title">⭐ Ratings & Reviews ({{ ratings.length }})</h3>
        </div>

        <div class="reviews-content">
          <div v-if="ratingsLoading" class="text-muted" style="font-size:0.85rem;padding:16px">Loading reviews...</div>
          <div v-else-if="!ratings.length" class="empty-reviews">
            <div class="empty-icon">⭐</div>
            <p v-if="profile.ratingCount === 0" class="text-muted">No reviews yet — this is a new user.</p>
            <p v-else class="text-muted">No reviews to display.</p>
          </div>
          <div v-else>
            <div v-for="r in ratings" :key="r.id" class="review-item">
              <div class="review-header">
                <div class="review-author">
                  <div class="review-avatar">{{ r.author?.name?.[0] || '?' }}</div>
                  <div>
                    <strong>{{ r.author?.name }}</strong>
                    <span class="review-type-badge" :class="r.type === 'BUYER_TO_SELLER' ? 'buyer-type' : 'seller-type'">
                      {{ r.type === 'BUYER_TO_SELLER' ? 'Buyer → Seller' : 'Seller → Buyer' }}
                    </span>
                  </div>
                </div>
                <span class="review-date">{{ new Date(r.createdAt).toLocaleDateString('en-IN', { year:'numeric', month:'short', day:'numeric' }) }}</span>
              </div>
              <div class="review-stars">
                <span v-for="i in 5" :key="i" class="star-icon" :class="{ filled: i <= Math.round(r.overallScore) }">★</span>
                <span class="review-score">{{ r.overallScore.toFixed(1) }}</span>
              </div>
              <div class="review-scores-detail">
                <span>{{ r.type === 'BUYER_TO_SELLER' ? 'Product Quality' : 'Communication' }}: {{ r.score1 }}/5</span>
                <span>{{ r.type === 'BUYER_TO_SELLER' ? 'Description Accuracy' : 'Reliability' }}: {{ r.score2 }}/5</span>
              </div>
              <p class="review-comment">"{{ r.comment }}"</p>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import { useNotificationStore } from '../../stores/notification'
import api from '../../services/api'

const route = useRoute()
const auth = useAuthStore()
const notifStore = useNotificationStore()
const profile = ref(null)
const ratings = ref([])
const ratingsLoading = ref(true)
const loading = ref(true)

const allCategories = ref([])
const catsLoading = ref(true)
const togglingCat = ref(null)

const userId = () => route.params.id || auth.user?.id
const isOwnProfile = computed(() => auth.isAuthenticated && auth.user?.id === profile.value?.id)

const maskEmail = (e) => { if (!e) return ''; const [u, d] = e.split('@'); return u[0] + '***@' + d }
const maskPhone = (p) => { if (!p) return ''; return p.slice(0, 3) + '****' + p.slice(-3) }
const maskPan = (p) => { if (!p) return ''; return p.slice(0, 3) + '****' + p.slice(-3) }

const isSubscribed = (cat) => notifStore.subscribedCategories.includes(cat)

const toggleSubscription = async (cat) => {
  togglingCat.value = cat
  try {
    if (isSubscribed(cat)) {
      await notifStore.unsubscribeFromCategory(cat)
    } else {
      await notifStore.subscribeToCategory(cat)
    }
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to update subscription')
  }
  togglingCat.value = null
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/users/profile/${userId()}`)
    profile.value = data.user
  } catch (e) { console.error(e) }
  loading.value = false

  // Load ratings/reviews
  try {
    const { data } = await api.get(`/users/${userId()}/ratings`)
    ratings.value = data.ratings
  } catch (e) { console.error(e) }
  ratingsLoading.value = false

  // Load categories and subscriptions for own profile
  if (auth.isAuthenticated && isOwnProfile.value) {
    try {
      const [catsRes] = await Promise.all([
        api.get('/products/categories'),
        notifStore.fetchSubscriptions(),
      ])
      allCategories.value = catsRes.data.categories || []
    } catch (e) { console.error(e) }
    catsLoading.value = false
  } else {
    catsLoading.value = false
  }
})

</script>

<style scoped>
.profile-top { display: flex; gap: 20px; align-items: center; margin-bottom: 24px; }
.profile-avatar {
  width: 72px; height: 72px; border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  display: flex; align-items: center; justify-content: center;
  font-size: 1.6rem; font-weight: 700; color: #fff;
  flex-shrink: 0;
}
.profile-name-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.profile-name-row h1 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; }
.profile-stats {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 1px;
  background: var(--border); border-radius: var(--radius);
  overflow: hidden; border: 1px solid var(--border);
}
.pstat {
  background: var(--bg-card); text-align: center; padding: 16px 8px;
}
.pstat-val { font-size: 1.1rem; font-weight: 700; letter-spacing: -0.02em; }
.pstat-lbl { font-size: 0.7rem; color: var(--text-muted); margin-top: 2px; }

/* Trust Score Display */
.trust-score-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.trust-stars {
  display: flex;
  gap: 1px;
}
.star-icon {
  color: var(--border);
  font-size: 0.85rem;
}
.star-icon.filled {
  color: #FFD700;
}
.trust-number {
  font-size: 1.1rem;
  font-weight: 700;
  color: #FFD700;
}
.new-user-badge-inline {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 179, 0, 0.12);
  color: var(--warning);
}

.card-section-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 16px; }

.sub-desc { font-size: 0.8rem; color: var(--text-muted); margin-bottom: 16px; margin-top: -8px; }

.detail-list { display: flex; flex-direction: column; gap: 0; }
.detail-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 0; border-bottom: 1px solid var(--border);
}
.detail-item:last-child { border-bottom: none; }
.detail-label { font-size: 0.8rem; color: var(--text-muted); }
.detail-value { font-size: 0.85rem; font-weight: 500; }

.tag-list { display: flex; flex-wrap: wrap; gap: 6px; }
.category-tag {
  background: var(--bg-surface); border: 1px solid var(--border);
  color: var(--text-secondary); padding: 4px 12px; border-radius: 100px;
  font-size: 0.78rem; font-weight: 500;
}

/* Category Subscription Toggle List */
.cat-sub-list { display: flex; flex-direction: column; gap: 0; }
.cat-sub-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 0; border-bottom: 1px solid var(--border);
}
.cat-sub-item:last-child { border-bottom: none; }
.cat-sub-name { font-size: 0.85rem; font-weight: 500; color: var(--text-primary); }

.cat-sub-toggle {
  display: flex; align-items: center; gap: 8px;
  background: none; border: none; cursor: pointer; padding: 4px;
}
.cat-sub-toggle:disabled { opacity: 0.5; cursor: not-allowed; }
.toggle-track {
  width: 36px; height: 20px; border-radius: 10px;
  background: var(--border); position: relative;
  transition: background 0.25s ease;
}
.cat-sub-toggle.active .toggle-track { background: var(--primary); }
.toggle-thumb {
  position: absolute; top: 2px; left: 2px;
  width: 16px; height: 16px; border-radius: 50%;
  background: #fff; transition: transform 0.25s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}
.cat-sub-toggle.active .toggle-thumb { transform: translateX(16px); }
.toggle-label { font-size: 0.75rem; font-weight: 500; color: var(--text-muted); min-width: 22px; }
.cat-sub-toggle.active .toggle-label { color: var(--primary); }

.modal-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px); display: flex; align-items: center;
  justify-content: center; z-index: 500;
}
.modal { width: 100%; max-width: 460px; }
.loader {
  width: 32px; height: 32px; border: 3px solid var(--border);
  border-top-color: var(--primary); border-radius: 50%;
  animation: spin 0.6s linear infinite; margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Reviews Section */
.reviews-container {
  padding: 0 !important;
  overflow: hidden;
}
.reviews-header {
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-surface);
}
.reviews-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
}
.reviews-content {
  padding: 20px 24px;
}

/* Reviews */
.empty-reviews {
  text-align: center;
  padding: 32px 16px;
}
.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 8px;
  opacity: 0.4;
}
.review-item {
  padding: 16px 0;
  border-bottom: 1px solid var(--border);
}
.review-item:last-child {
  border-bottom: none;
}
.review-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}
.review-author {
  display: flex;
  align-items: center;
  gap: 10px;
}
.review-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.review-type-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 8px;
  border-radius: 100px;
  font-size: 0.65rem;
  font-weight: 600;
}
.buyer-type {
  background: rgba(78, 205, 196, 0.12);
  color: #4ECDC4;
}
.seller-type {
  background: rgba(255, 179, 0, 0.12);
  color: var(--warning);
}
.review-date {
  font-size: 0.75rem;
  color: var(--text-muted);
}
.review-stars {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 6px;
}
.review-score {
  margin-left: 8px;
  font-size: 0.85rem;
  font-weight: 700;
  color: #FFD700;
}
.review-scores-detail {
  display: flex;
  gap: 16px;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.review-comment {
  font-size: 0.85rem;
  color: var(--text-secondary);
  font-style: italic;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .profile-stats { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 500px) {
  .profile-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
