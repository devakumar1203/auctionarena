<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>👥 Manage Users</h1><p>View and manage platform users</p></div>
    <div class="flex gap-md mb-lg">
      <div class="search-bar" style="flex:1"><input v-model="search" @input="debouncedSearch" placeholder="Search by name, email, PAN..." /></div>
      <select v-model="blockedFilter" @change="fetchUsers" style="width:auto">
        <option value="">All Users</option>
        <option value="true">Blocked</option>
        <option value="false">Active</option>
      </select>
    </div>
    <div v-if="loading" class="text-center"><p>Loading...</p></div>
    <div v-else class="table-container">
      <table>
        <thead><tr><th>Name</th><th>Email</th><th>Rating</th><th>Flags</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          <tr v-for="u in users" :key="u.id">
            <td><strong>{{ u.name }}</strong></td>
            <td class="text-muted">{{ u.email }}</td>
            <td>⭐ {{ u.rating }}</td>
            <td><span :class="u.numberOfFlags>=3?'text-danger':''">{{ u.numberOfFlags }}</span></td>
            <td>{{ u._count?.products || 0 }}</td>
            <td>
              <span class="badge" :class="u.isBlocked?'badge-danger':'badge-active'">{{ u.isBlocked ? 'Blocked' : 'Active' }}</span>
            </td>
            <td>
              <button class="btn btn-sm" :class="u.isBlocked?'btn-primary':'btn-danger'" @click="toggleBlock(u.id)">
                {{ u.isBlocked ? 'Unblock' : 'Block' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="pagination.totalPages > 1" class="pagination flex-center gap-sm mt-lg">
      <button class="btn btn-sm btn-outline" :disabled="page<=1" @click="page--;fetchUsers()">Prev</button>
      <span class="text-muted">{{ page }} / {{ pagination.totalPages }}</span>
      <button class="btn btn-sm btn-outline" :disabled="page>=pagination.totalPages" @click="page++;fetchUsers()">Next</button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'
const users = ref([]); const loading = ref(true); const search = ref(''); const blockedFilter = ref(''); const page = ref(1); const pagination = ref({})
let timeout = null
const debouncedSearch = () => { clearTimeout(timeout); timeout = setTimeout(()=>{ page.value=1; fetchUsers() }, 400) }
const fetchUsers = async () => {
  loading.value = true
  try { const { data } = await api.get('/admin/users', { params: { search: search.value, blocked: blockedFilter.value, page: page.value } }); users.value = data.users; pagination.value = data.pagination } catch(e){}
  loading.value = false
}
const toggleBlock = async (id) => {
  try { await api.post(`/admin/users/${id}/block`); fetchUsers() } catch(e){ alert(e.response?.data?.message||'Failed') }
}
onMounted(fetchUsers)
</script>
