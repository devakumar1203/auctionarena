<template>
  <div class="container" style="padding:32px 24px">
    <div class="page-header"><h1>Create Auction</h1><p>List your product and start receiving bids</p></div>
    <div class="card" style="max-width:700px">
      <div v-if="error" class="alert-error mb-md">{{ error }}</div>
      <form @submit.prevent="handleSubmit">
        <h3 class="mb-md">Product Details</h3>
        <div class="form-group"><label>Product Name</label><input v-model="form.name" placeholder="e.g. Vintage Rolex Watch" required /></div>
        <div class="form-group"><label>Description</label><textarea v-model="form.description" rows="4" placeholder="Describe your product..." required></textarea></div>
        <div class="form-row">
          <div class="form-group"><label>Category</label>
            <select v-model="form.category" required>
              <option value="" disabled>Select category</option>
              <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
          <div class="form-group"><label>Base Price (₹)</label><input v-model.number="form.basePrice" type="number" min="1" placeholder="10000" required /></div>
        </div>
        <!-- Image Upload -->
        <div class="form-group">
          <label>Product Images (up to 4)</label>
          <div class="upload-area" @click="$refs.fileInput.click()" @dragover.prevent @drop.prevent="onDrop">
            <input ref="fileInput" type="file" accept="image/*" multiple @change="onFilesSelected" style="display:none" />
            <div class="upload-placeholder">
              <div class="upload-icon">📷</div>
              <p>Click or drag images here</p>
              <span class="text-muted" style="font-size:0.75rem">JPEG, PNG, WebP — max 5MB each</span>
            </div>
          </div>
          <div v-if="previews.length" class="image-previews">
            <div v-for="(p, i) in previews" :key="i" class="preview-item">
              <img :src="p" alt="preview" />
              <button type="button" class="preview-remove" @click="removeImage(i)">×</button>
            </div>
          </div>
        </div>

        <h3 class="mb-md mt-lg">Auction Settings</h3>
        <div class="form-group"><label>Auction Type</label>
          <select v-model="form.type" required>
            <option value="TIME_BOUND">⏰ Time-Bound (Ends at specific time)</option>
            <option value="OPEN">🔓 Open (You end it manually)</option>
          </select>
        </div>
        <div v-if="form.type==='TIME_BOUND'" class="form-group"><label>End Date & Time</label><input v-model="form.endTime" type="datetime-local" :min="minDate" required /></div>

        <button type="submit" class="btn btn-primary btn-block mt-md" :disabled="submitting" style="padding:14px">
          {{ submitting ? 'Creating...' : '🚀 Create Auction' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../../services/api'

const router = useRouter()
const form = reactive({ name: '', description: '', category: '', basePrice: null, type: 'TIME_BOUND', endTime: '' })
const categories = ref(['Electronics', 'Art', 'Collectibles', 'Vehicles', 'Furniture', 'Fashion', 'Sports', 'Books'])
const submitting = ref(false)
const error = ref('')
const imageFiles = ref([])
const previews = ref([])

const minDate = computed(() => { const d = new Date(); d.setMinutes(d.getMinutes() + 30); return d.toISOString().slice(0, 16) })

const onFilesSelected = (e) => {
  addFiles(Array.from(e.target.files))
}

const onDrop = (e) => {
  addFiles(Array.from(e.dataTransfer.files))
}

const addFiles = (files) => {
  const remaining = 4 - imageFiles.value.length
  const toAdd = files.filter(f => f.type.startsWith('image/')).slice(0, remaining)
  for (const file of toAdd) {
    imageFiles.value.push(file)
    const reader = new FileReader()
    reader.onload = (e) => previews.value.push(e.target.result)
    reader.readAsDataURL(file)
  }
}

const removeImage = (i) => {
  imageFiles.value.splice(i, 1)
  previews.value.splice(i, 1)
}

const handleSubmit = async () => {
  error.value = ''
  submitting.value = true

  try {
    // Use FormData for file uploads
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('description', form.description)
    formData.append('category', form.category)
    formData.append('basePrice', form.basePrice)
    for (const file of imageFiles.value) {
      formData.append('images', file)
    }

    const { data: prodData } = await api.post('/products', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    await api.post('/auctions', {
      productId: prodData.product.id,
      type: form.type,
      endTime: form.type === 'TIME_BOUND' ? form.endTime : undefined,
    })
    router.push('/dashboard')
  } catch (e) {
    error.value = e.response?.data?.message || 'Failed to create auction'
  }
  submitting.value = false
}

onMounted(async () => {
  try {
    const { data } = await api.get('/products/categories')
    if (data.categories.length) categories.value = [...new Set([...categories.value, ...data.categories])]
  } catch (e) {}
})
</script>

<style scoped>
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.alert-error {
  background: rgba(239,68,68,0.08); border: 1px solid rgba(239,68,68,0.2);
  color: var(--danger); padding: 12px; border-radius: var(--radius-sm);
}

/* Upload area */
.upload-area {
  border: 2px dashed var(--border); border-radius: var(--radius);
  padding: 32px; text-align: center; cursor: pointer;
  transition: var(--transition);
}
.upload-area:hover { border-color: var(--primary); background: rgba(249,115,22,0.03); }
.upload-icon { font-size: 2rem; margin-bottom: 8px; }
.upload-area p { font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 4px; }

/* Image previews */
.image-previews { display: flex; gap: 12px; margin-top: 12px; flex-wrap: wrap; }
.preview-item {
  position: relative; width: 100px; height: 100px;
  border-radius: var(--radius-sm); overflow: hidden;
  border: 1px solid var(--border);
}
.preview-item img { width: 100%; height: 100%; object-fit: cover; }
.preview-remove {
  position: absolute; top: 4px; right: 4px;
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(0,0,0,0.6); color: #fff;
  border: none; cursor: pointer; font-size: 0.8rem;
  display: flex; align-items: center; justify-content: center;
  transition: var(--transition);
}
.preview-remove:hover { background: var(--danger); }

@media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
</style>
