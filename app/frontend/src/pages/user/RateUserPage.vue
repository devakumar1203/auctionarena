<template>
  <div class="rate-page-wrapper">
    <div class="container" style="padding:32px 24px;max-width:720px;margin:0 auto">

      <!-- Loading -->
      <div v-if="loading" class="text-center mt-lg">
        <div class="loader"></div>
        <p class="text-muted mt-md">Loading auction details...</p>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="empty-state">
        <div class="emoji">⚠️</div>
        <p>{{ error }}</p>
        <router-link to="/dashboard" class="btn btn-outline btn-sm mt-md">← Back to Dashboard</router-link>
      </div>

      <!-- Already Rated -->
      <div v-else-if="alreadyRated" class="rate-success-card card">
        <div class="success-icon">✅</div>
        <h2>Rating Already Submitted</h2>
        <p class="text-muted">You've already rated <strong>{{ targetUser?.name }}</strong> for this auction.</p>
        <div class="existing-rating-preview mt-lg" v-if="existingRating">
          <div class="preview-stars">
            <span v-for="i in 5" :key="i" class="star-display" :class="{ filled: i <= Math.round(existingRating.overallScore) }">★</span>
            <span class="score-text">{{ existingRating.overallScore.toFixed(1) }}</span>
          </div>
          <p class="preview-comment">"{{ existingRating.comment }}"</p>
        </div>
        <div class="flex gap-sm mt-lg" style="justify-content:center">
          <router-link :to="`/auction/${auctionId}`" class="btn btn-outline btn-sm">View Auction</router-link>
          <router-link to="/dashboard" class="btn btn-primary btn-sm">Dashboard</router-link>
        </div>
      </div>

      <!-- Submitted Success -->
      <div v-else-if="submitted" class="rate-success-card card">
        <div class="confetti-container">
          <div v-for="i in 20" :key="i" class="confetti-piece" :style="confettiStyle(i)"></div>
        </div>
        <div class="success-icon pulse">🎉</div>
        <h2>Rating Submitted!</h2>
        <p class="text-muted">Thank you for your feedback on <strong>{{ targetUser?.name }}</strong>.</p>
        <div class="trust-score-update mt-md">
          <span class="text-muted">Their updated trust score:</span>
          <span class="trust-score-badge">{{ newTrustScore }}</span>
        </div>
        <div class="flex gap-sm mt-lg" style="justify-content:center">
          <router-link :to="`/auction/${auctionId}`" class="btn btn-outline btn-sm">View Auction</router-link>
          <router-link to="/dashboard" class="btn btn-primary btn-sm">Dashboard</router-link>
        </div>
      </div>

      <!-- Rating Form -->
      <template v-else>
        <!-- Auction Summary -->
        <div class="auction-summary card mb-lg">
          <div class="summary-header">
            <div class="summary-badge" :class="role === 'buyer' ? 'buyer-badge' : 'seller-badge'">
              {{ role === 'buyer' ? '🛒 You are the Buyer' : '🏪 You are the Seller' }}
            </div>
            <h2 class="summary-title">Rate {{ role === 'buyer' ? 'Seller' : 'Buyer' }}</h2>
          </div>

          <div class="product-summary">
            <div class="product-thumb" v-if="auction?.product?.images?.length">
              <img :src="auction.product.images[0]" :alt="auction.product.name" />
            </div>
            <div class="product-details">
              <h3>{{ auction?.product?.name }}</h3>
              <p class="text-muted">{{ auction?.product?.category }}</p>
              <div class="final-price">
                <span class="price-label">Final Price</span>
                <span class="price-value">₹{{ fmt(auction?.bestPrice) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Target User Card -->
        <div class="target-user-card card mb-lg">
          <div class="target-header">
            <div class="target-avatar">{{ targetUser?.name?.[0] || '?' }}</div>
            <div>
              <h3>{{ targetUser?.name }}</h3>
              <div class="target-trust" v-if="targetUser?.ratingCount > 0">
                <span class="mini-stars">
                  <span v-for="i in 5" :key="i" class="star-display mini" :class="{ filled: i <= Math.round(targetUser.rating) }">★</span>
                </span>
                <span class="text-muted">{{ targetUser.rating }} ({{ targetUser.ratingCount }} reviews)</span>
              </div>
              <span v-else class="new-user-badge">🆕 New User</span>
            </div>
          </div>
        </div>

        <!-- Rating Form Card -->
        <div class="rating-form-card card">
          <h3 class="form-title">Your Rating</h3>

          <!-- Criteria 1 -->
          <div class="rating-criterion">
            <label class="criterion-label">{{ criteria1Label }}</label>
            <p class="criterion-desc">{{ criteria1Desc }}</p>
            <div class="star-input-row">
              <button v-for="i in 5" :key="'s1-'+i"
                class="star-btn" :class="{ active: score1 >= i, hover: hover1 >= i }"
                @mouseenter="hover1 = i" @mouseleave="hover1 = 0"
                @click="score1 = i">
                ★
              </button>
              <span class="score-label" v-if="score1">{{ score1Labels[score1 - 1] }}</span>
            </div>
          </div>

          <!-- Criteria 2 -->
          <div class="rating-criterion">
            <label class="criterion-label">{{ criteria2Label }}</label>
            <p class="criterion-desc">{{ criteria2Desc }}</p>
            <div class="star-input-row">
              <button v-for="i in 5" :key="'s2-'+i"
                class="star-btn" :class="{ active: score2 >= i, hover: hover2 >= i }"
                @mouseenter="hover2 = i" @mouseleave="hover2 = 0"
                @click="score2 = i">
                ★
              </button>
              <span class="score-label" v-if="score2">{{ score2Labels[score2 - 1] }}</span>
            </div>
          </div>

          <!-- Overall Preview -->
          <div v-if="score1 && score2" class="overall-preview">
            <span>Overall:</span>
            <span class="overall-score">{{ ((score1 + score2) / 2).toFixed(1) }}</span>
            <span class="overall-stars">
              <span v-for="i in 5" :key="'ov-'+i" class="star-display" :class="{ filled: i <= Math.round((score1 + score2) / 2) }">★</span>
            </span>
          </div>

          <!-- Comment -->
          <div class="rating-criterion">
            <label class="criterion-label">Review Comment <span class="required">*</span></label>
            <p class="criterion-desc">Share your experience (minimum 10 characters)</p>
            <textarea
              v-model="comment"
              rows="4"
              :placeholder="commentPlaceholder"
              class="review-textarea"
              maxlength="500"
            ></textarea>
            <div class="char-count" :class="{ warning: comment.length > 0 && comment.length < 10 }">
              {{ comment.length }}/500
              <span v-if="comment.length > 0 && comment.length < 10" class="char-warning">Minimum 10 characters</span>
            </div>
          </div>

          <!-- Submit -->
          <div v-if="submitError" class="alert-error mb-md">{{ submitError }}</div>
          <button
            class="btn btn-primary btn-block submit-rating-btn"
            :disabled="!canSubmit || submitting"
            @click="submitRating"
          >
            <span v-if="submitting" class="btn-spinner"></span>
            {{ submitting ? 'Submitting...' : '⭐ Submit Rating' }}
          </button>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const route = useRoute()
const auth = useAuthStore()
const auctionId = route.params.auctionId

const loading = ref(true)
const error = ref('')
const auction = ref(null)
const targetUser = ref(null)
const role = ref('') // 'buyer' or 'seller'
const alreadyRated = ref(false)
const existingRating = ref(null)

const score1 = ref(0)
const score2 = ref(0)
const hover1 = ref(0)
const hover2 = ref(0)
const comment = ref('')
const submitting = ref(false)
const submitError = ref('')
const submitted = ref(false)
const newTrustScore = ref(0)

const score1Labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']
const score2Labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent']

const criteria1Label = computed(() => role.value === 'buyer' ? 'Product Quality' : 'Communication')
const criteria1Desc = computed(() => role.value === 'buyer'
  ? 'How would you rate the quality of the product you received?'
  : 'How responsive and clear was the buyer during the transaction?')
const criteria2Label = computed(() => role.value === 'buyer' ? 'Description Accuracy' : 'Reliability')
const criteria2Desc = computed(() => role.value === 'buyer'
  ? 'Did the product match the description and images provided?'
  : 'Did the buyer follow through reliably on the purchase?')

const commentPlaceholder = computed(() => role.value === 'buyer'
  ? 'Tell others about your experience with this seller...'
  : 'Tell others about your experience with this buyer...')

const canSubmit = computed(() => score1.value > 0 && score2.value > 0 && comment.value.trim().length >= 10)

const fmt = (n) => Number(n).toLocaleString('en-IN')

const confettiStyle = (i) => ({
  left: `${Math.random() * 100}%`,
  animationDelay: `${Math.random() * 0.5}s`,
  animationDuration: `${1 + Math.random() * 1.5}s`,
  backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'][i % 8],
})

onMounted(async () => {
  try {
    const { data } = await api.get(`/auctions/${auctionId}/rating-status`)
    auction.value = data.auction
    targetUser.value = data.targetUser
    role.value = data.role
    alreadyRated.value = data.alreadyRated
    existingRating.value = data.existingRating
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to load auction details.'
  }
  loading.value = false
})

const submitRating = async () => {
  if (!canSubmit.value) return
  submitError.value = ''
  submitting.value = true
  try {
    const { data } = await api.post(`/auctions/${auctionId}/rate`, {
      score1: score1.value,
      score2: score2.value,
      comment: comment.value.trim(),
    })
    newTrustScore.value = data.trustScore
    submitted.value = true
  } catch (e) {
    submitError.value = e.response?.data?.message || 'Failed to submit rating.'
  }
  submitting.value = false
}
</script>

<style scoped>
.rate-page-wrapper {
  min-height: 80vh;
  background: linear-gradient(135deg, var(--bg-surface) 0%, var(--bg-primary) 100%);
  padding-bottom: 48px;
}

/* Auction Summary */
.summary-header {
  margin-bottom: 20px;
}
.summary-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 100px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 12px;
}
.buyer-badge {
  background: rgba(78, 205, 196, 0.12);
  color: #4ECDC4;
}
.seller-badge {
  background: rgba(255, 179, 0, 0.12);
  color: var(--warning);
}
.summary-title {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}

.product-summary {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: var(--bg-surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
}
.product-thumb {
  width: 80px;
  height: 80px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid var(--border);
}
.product-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.product-details h3 {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 4px;
}
.final-price {
  margin-top: 8px;
}
.price-label {
  display: block;
  font-size: 0.7rem;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.price-value {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--success);
}

/* Target User Card */
.target-user-card {
  padding: 20px !important;
}
.target-header {
  display: flex;
  align-items: center;
  gap: 14px;
}
.target-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
  flex-shrink: 0;
}
.target-trust {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}
.new-user-badge {
  display: inline-block;
  margin-top: 4px;
  padding: 3px 10px;
  border-radius: 100px;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(255, 179, 0, 0.12);
  color: var(--warning);
}

/* Star inputs */
.rating-criterion {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border);
}
.rating-criterion:last-of-type {
  border-bottom: none;
}
.criterion-label {
  font-size: 0.95rem;
  font-weight: 700;
  display: block;
  margin-bottom: 4px;
}
.criterion-desc {
  font-size: 0.8rem;
  color: var(--text-muted);
  margin-bottom: 12px;
}
.required {
  color: var(--danger);
}
.star-input-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.star-btn {
  background: none;
  border: none;
  font-size: 2rem;
  cursor: pointer;
  color: var(--border);
  transition: all 0.15s ease;
  padding: 2px 4px;
  line-height: 1;
}
.star-btn.active,
.star-btn.hover {
  color: #FFD700;
  transform: scale(1.15);
}
.star-btn:hover {
  transform: scale(1.25);
}
.score-label {
  margin-left: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 4px 10px;
  background: var(--bg-surface);
  border-radius: 100px;
  border: 1px solid var(--border);
}

/* Star display */
.star-display {
  color: var(--border);
  font-size: 1rem;
}
.star-display.filled {
  color: #FFD700;
}
.star-display.mini {
  font-size: 0.85rem;
}

/* Overall preview */
.overall-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.08), rgba(255, 215, 0, 0.02));
  border: 1px solid rgba(255, 215, 0, 0.2);
  border-radius: var(--radius);
  margin-bottom: 24px;
  font-size: 0.9rem;
  font-weight: 500;
}
.overall-score {
  font-size: 1.3rem;
  font-weight: 800;
  color: #FFD700;
}

/* Textarea */
.review-textarea {
  width: 100%;
  resize: vertical;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 14px;
  font-size: 0.9rem;
  background: var(--bg-surface);
  color: var(--text-primary);
  font-family: inherit;
  transition: border-color 0.2s ease;
}
.review-textarea:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(var(--primary-rgb, 99, 102, 241), 0.1);
}
.char-count {
  text-align: right;
  font-size: 0.75rem;
  color: var(--text-muted);
  margin-top: 6px;
}
.char-count.warning {
  color: var(--danger);
}
.char-warning {
  margin-left: 8px;
  font-weight: 600;
}

/* Submit button */
.submit-rating-btn {
  padding: 16px !important;
  font-size: 1rem !important;
  font-weight: 700 !important;
  letter-spacing: -0.01em;
  margin-top: 8px;
}
.submit-rating-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

.alert-error {
  background: rgba(239,68,68,0.08);
  border: 1px solid rgba(239,68,68,0.2);
  color: var(--danger);
  padding: 12px 16px;
  border-radius: var(--radius);
  font-size: 0.85rem;
}

/* Rating Form Card */
.rating-form-card {
  padding: 28px !important;
}
.form-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

/* Success State */
.rate-success-card {
  text-align: center;
  padding: 48px 32px !important;
  position: relative;
  overflow: hidden;
}
.success-icon {
  font-size: 3.5rem;
  margin-bottom: 16px;
}
.success-icon.pulse {
  animation: pulse-scale 0.6s ease;
}
@keyframes pulse-scale {
  0% { transform: scale(0); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}
.rate-success-card h2 {
  font-size: 1.5rem;
  font-weight: 800;
  letter-spacing: -0.03em;
}
.trust-score-update {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 0.9rem;
}
.trust-score-badge {
  font-size: 1.4rem;
  font-weight: 800;
  color: #FFD700;
  background: rgba(255, 215, 0, 0.1);
  padding: 4px 14px;
  border-radius: 100px;
  border: 1px solid rgba(255, 215, 0, 0.25);
}

.existing-rating-preview {
  padding: 16px 24px;
  background: var(--bg-surface);
  border-radius: var(--radius);
  border: 1px solid var(--border);
  display: inline-block;
}
.preview-stars {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-bottom: 8px;
}
.score-text {
  margin-left: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  color: #FFD700;
}
.preview-comment {
  font-style: italic;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

/* Confetti */
.confetti-container {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 100%;
  pointer-events: none;
  overflow: hidden;
}
.confetti-piece {
  position: absolute;
  top: -10px;
  width: 8px;
  height: 8px;
  border-radius: 2px;
  animation: confetti-fall 2s ease-out forwards;
}
@keyframes confetti-fall {
  0% { transform: translateY(0) rotate(0deg); opacity: 1; }
  100% { transform: translateY(400px) rotate(720deg); opacity: 0; }
}

.loader {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
  margin: 0 auto;
}
@keyframes spin { to { transform: rotate(360deg); } }

@media (max-width: 600px) {
  .product-summary {
    flex-direction: column;
    align-items: flex-start;
  }
  .star-btn {
    font-size: 1.6rem;
  }
}
</style>
