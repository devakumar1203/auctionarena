<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>🚩 Flagged Users</h1><p>Review users who have been flagged by the community</p></div>
    <div v-if="loading" class="text-center"><p>Loading...</p></div>
    <div v-else-if="!flaggedUsers.length" class="empty-state"><div class="emoji">✅</div><p>No flagged users. All clear!</p></div>
    <div v-else class="grid grid-2">
      <div v-for="u in flaggedUsers" :key="u.id" class="card">
        <div class="flex-between mb-md">
          <div>
            <h3>{{ u.name }}</h3>
            <p class="text-muted" style="font-size:0.85rem">{{ u.email }}</p>
          </div>
          <div class="text-center">
            <div class="flag-count" :class="u.numberOfFlags>=3?'critical':''">{{ u.numberOfFlags }}</div>
            <span class="text-muted" style="font-size:0.7rem">FLAGS</span>
          </div>
        </div>
        <div class="flex-between mb-md">
          <span>Rating: ⭐ {{ u.rating }}</span>
          <span class="badge" :class="u.isBlocked?'badge-danger':'badge-active'">{{ u.isBlocked?'Blocked':'Active' }}</span>
        </div>

        <div class="flag-list mb-md">
          <h4 style="font-size:0.85rem;margin-bottom:8px">Flag Reasons:</h4>
          <div v-for="f in u.flagsReceived" :key="f.id" class="flag-item">
            <div class="flex-between">
              <span style="font-size:0.85rem">{{ f.reason }}</span>
              <span class="badge" :class="f.reviewed?'badge-completed':'badge-danger'" style="font-size:0.7rem">{{ f.reviewed?'Reviewed':'Pending' }}</span>
            </div>
            <span class="text-muted" style="font-size:0.75rem">By {{ f.author?.name }} · {{ new Date(f.createdAt).toLocaleDateString() }}</span>
          </div>
        </div>

        <div v-if="u.commentsReceived?.length" class="mb-md">
          <h4 style="font-size:0.85rem;margin-bottom:8px">Recent Comments:</h4>
          <div v-for="c in u.commentsReceived" :key="c.id" class="text-muted" style="font-size:0.8rem;margin-bottom:4px">
            "{{ c.content }}" — {{ c.author?.name }}
          </div>
        </div>

        <div class="flex gap-sm">
          <button class="btn btn-sm" :class="u.isBlocked?'btn-primary':'btn-danger'" @click="toggleBlock(u.id)">
            {{ u.isBlocked ? '✅ Unblock' : '🚫 Block User' }}
          </button>
          <button v-for="f in u.flagsReceived.filter(x=>!x.reviewed)" :key="f.id" class="btn btn-outline btn-sm" @click="reviewFlag(f.id)">
            Mark Reviewed
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
const flaggedUsers = ref([]); const loading = ref(true)
const fetchData = async () => { try { const { data } = await api.get('/admin/flagged-users'); flaggedUsers.value = data.flaggedUsers } catch(e){} loading.value = false }
const toggleBlock = async (id) => { try { await api.post(`/admin/users/${id}/block`); fetchData() } catch(e){ alert('Failed') } }
const reviewFlag = async (id) => { try { await api.put(`/admin/flags/${id}/review`); fetchData() } catch(e){ alert('Failed') } }
onMounted(fetchData)
</script>

<style scoped>
.flag-count { font-size:1.8rem; font-weight:700; color:var(--warning); letter-spacing:-0.03em; }
.flag-count.critical { color:var(--danger); }
.flag-list { max-height:200px; overflow-y:auto; }
.flag-item { padding:8px 0; border-bottom:1px solid var(--border); }
</style>
