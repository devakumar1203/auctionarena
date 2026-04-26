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
            <div class="pstat-val">⭐ {{ profile.rating }}</div>
            <div class="pstat-lbl">Rating ({{ profile.ratingCount }})</div>
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

        <!-- Actions Card -->
        <div class="card">
          <h3 class="card-section-title">{{ isOwnProfile ? 'Favourite Categories' : 'Actions' }}</h3>

          <div v-if="isOwnProfile && profile.favoriteCategories?.length" class="tag-list">
            <span v-for="cat in profile.favoriteCategories" :key="cat" class="category-tag">{{ cat }}</span>
          </div>
          <p v-else-if="isOwnProfile" class="text-muted" style="font-size:0.85rem">No favourite categories set yet.</p>

          <div v-if="!isOwnProfile" class="flex gap-sm mt-md">
            <button class="btn btn-danger btn-sm" @click="showFlagModal = true">🚩 Flag User</button>
          </div>
        </div>
      </div>

      <!-- Flag Modal -->
      <div v-if="showFlagModal" class="modal-overlay" @click.self="showFlagModal = false">
        <div class="modal card">
          <h3 class="mb-md">Flag {{ profile.name }}</h3>
          <div class="form-group"><label>Reason</label><textarea v-model="flagReason" rows="3" placeholder="Explain why..." required></textarea></div>
          <div class="flex gap-sm" style="justify-content:flex-end">
            <button class="btn btn-outline btn-sm" @click="showFlagModal = false">Cancel</button>
            <button class="btn btn-danger btn-sm" @click="submitFlag">Submit Flag</button>
          </div>
        </div>
      </div>

      <!-- Comments Section -->
      <div class="card">
        <h3 class="card-section-title">Comments ({{ comments.length }})</h3>
        <div v-if="auth.isAuthenticated && !isOwnProfile" class="flex gap-sm mb-lg">
          <input v-model="newComment" placeholder="Write a comment..." style="flex:1" />
          <button class="btn btn-primary btn-sm" @click="submitComment">Post</button>
        </div>
        <div v-if="!comments.length" class="text-muted" style="font-size:0.85rem">No comments yet.</div>
        <div v-for="c in comments" :key="c.id" class="comment-item">
          <div class="flex-between">
            <strong style="font-size:0.85rem">{{ c.author?.name }}</strong>
            <span class="text-muted" style="font-size:0.75rem">{{ new Date(c.createdAt).toLocaleDateString() }}</span>
          </div>
          <p style="margin-top:4px;color:var(--text-secondary);font-size:0.85rem">{{ c.content }}</p>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import api from '../../services/api'

const route = useRoute()
const auth = useAuthStore()
const profile = ref(null)
const comments = ref([])
const loading = ref(true)
const showFlagModal = ref(false)
const flagReason = ref('')
const newComment = ref('')

const userId = () => route.params.id || auth.user?.id
const isOwnProfile = computed(() => auth.isAuthenticated && auth.user?.id === profile.value?.id)

const maskEmail = (e) => { if (!e) return ''; const [u, d] = e.split('@'); return u[0] + '***@' + d }
const maskPhone = (p) => { if (!p) return ''; return p.slice(0, 3) + '****' + p.slice(-3) }
const maskPan = (p) => { if (!p) return ''; return p.slice(0, 3) + '****' + p.slice(-3) }

onMounted(async () => {
  try {
    const [u, c] = await Promise.all([
      api.get(`/users/profile/${userId()}`),
      api.get(`/users/${userId()}/comments`),
    ])
    profile.value = u.data.user
    comments.value = c.data.comments
  } catch (e) { console.error(e) }
  loading.value = false
})

const submitFlag = async () => {
  try {
    await api.post(`/users/${profile.value.id}/flag`, { reason: flagReason.value })
    alert('User flagged.')
    showFlagModal.value = false
  } catch (e) { alert(e.response?.data?.message || 'Failed') }
}

const submitComment = async () => {
  if (!newComment.value.trim()) return
  try {
    const { data } = await api.post(`/users/${profile.value.id}/comments`, { content: newComment.value })
    comments.value.unshift(data.comment)
    newComment.value = ''
  } catch (e) { alert(e.response?.data?.message || 'Failed') }
}
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

.card-section-title { font-size: 0.95rem; font-weight: 700; margin-bottom: 16px; }

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

.comment-item { padding: 12px 0; border-bottom: 1px solid var(--border); }
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

@media (max-width: 768px) {
  .profile-stats { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 500px) {
  .profile-stats { grid-template-columns: repeat(2, 1fr); }
}
</style>
