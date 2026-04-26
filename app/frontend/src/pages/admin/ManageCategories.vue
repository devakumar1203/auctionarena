<template>
  <div class="container" style="padding:32px 24px">
    <div class="flex-between mb-lg">
      <div class="page-header mb-0">
        <h1>📁 Manage Categories</h1>
        <p>Add or remove product categories</p>
      </div>
      <button class="btn btn-secondary" @click="$router.push('/admin/dashboard')">Back to Dashboard</button>
    </div>

    <div class="card mb-lg" style="max-width: 500px">
      <h3 class="mb-sm">Add New Category</h3>
      <form @submit.prevent="addCategory" class="flex-row">
        <input v-model="newCategory" type="text" placeholder="e.g., Electronics" class="flex-1" required />
        <button type="submit" class="btn btn-primary" :disabled="adding">
          {{ adding ? 'Adding...' : 'Add' }}
        </button>
      </form>
      <div v-if="error" class="text-danger mt-sm text-sm">{{ error }}</div>
      <div v-if="success" class="text-success mt-sm text-sm">{{ success }}</div>
    </div>

    <div class="card">
      <div v-if="loading" class="text-center py-md">Loading categories...</div>
      <div v-else-if="categories.length === 0" class="text-center py-md text-muted">No categories found.</div>
      <table class="table" v-else>
        <thead>
          <tr>
            <th>Name</th>
            <th class="text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="cat in categories" :key="cat.id">
            <td style="font-weight: 500;">{{ cat.name }}</td>
            <td class="text-right">
              <button class="btn btn-danger btn-sm" @click="deleteCategory(cat.id, cat.name)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import api from '../../services/api'

const categories = ref([])
const loading = ref(true)
const newCategory = ref('')
const adding = ref(false)
const error = ref('')
const success = ref('')

const fetchCategories = async () => {
  loading.value = true
  try {
    // The backend endpoint returns { categories: [...names], fullCategories: [...objects] }
    const { data } = await api.get('/products/categories')
    categories.value = data.fullCategories || []
  } catch (e) {
    console.error('Failed to fetch categories', e)
  }
  loading.value = false
}

const addCategory = async () => {
  if (!newCategory.value.trim()) return
  adding.value = true
  error.value = ''
  success.value = ''
  try {
    await api.post('/admin/categories', { name: newCategory.value })
    success.value = 'Category added successfully.'
    newCategory.value = ''
    fetchCategories()
    setTimeout(() => { success.value = '' }, 3000)
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to add category.'
  }
  adding.value = false
}

const deleteCategory = async (id, name) => {
  if (!confirm(`Are you sure you want to delete the category "${name}"? Existing products in this category will not be altered, but the category will disappear from the creation list.`)) return
  try {
    await api.delete(`/admin/categories/${id}`)
    fetchCategories()
  } catch (e) {
    alert(e.response?.data?.message || 'Failed to delete category.')
  }
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.flex-row { display: flex; gap: 8px; }
.flex-1 { flex: 1; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { padding: 12px; border-bottom: 1px solid var(--border); text-align: left; }
.table th { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.05em; }
.text-right { text-align: right !important; }
.btn-sm { padding: 6px 12px; font-size: 0.75rem; }
.text-danger { color: var(--danger); }
.text-success { color: var(--success); }
.text-sm { font-size: 0.8rem; }
</style>
