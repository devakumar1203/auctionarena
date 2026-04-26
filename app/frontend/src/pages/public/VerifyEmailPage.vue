<template>
  <div class="auth-page">
    <div class="auth-card fade-in verify-card">
      <!-- Loading state -->
      <div v-if="loading" class="status-content">
        <div class="spinner"></div>
        <h2>Verifying your email...</h2>
        <p class="text-secondary">Please wait while we verify your account.</p>
      </div>

      <!-- Success state -->
      <div v-else-if="success" class="status-content">
        <div class="status-icon success-icon">✅</div>
        <h2>Email Verified!</h2>
        <p class="text-secondary">Your email has been verified successfully. You can now log in to your account.</p>
        <router-link to="/login" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 24px;">
          Go to Login
        </router-link>
      </div>

      <!-- Error state -->
      <div v-else class="status-content">
        <div class="status-icon error-icon">❌</div>
        <h2>Verification Failed</h2>
        <p class="text-secondary">{{ errorMessage }}</p>
        <router-link to="/login" class="btn btn-secondary btn-block" style="padding: 12px; margin-top: 24px;">
          Go to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const loading = ref(true)
const success = ref(false)
const errorMessage = ref('')

onMounted(async () => {
  const token = route.query.token
  if (!token) {
    loading.value = false
    errorMessage.value = 'No verification token found. Please check the link in your email.'
    return
  }

  try {
    const { data } = await api.get(`/auth/verify-email?token=${token}`)
    success.value = true
  } catch (e) {
    errorMessage.value = e.response?.data?.message || 'Verification failed. The link may have expired or is invalid.'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.verify-card {
  width: 100%; max-width: 460px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px;
  text-align: center;
}
.status-content { animation: fadeIn 0.4s ease; }
.status-icon { font-size: 3.5rem; margin-bottom: 16px; }
h2 {
  font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em;
  margin-bottom: 8px; color: var(--text-primary);
}

/* Spinner */
.spinner {
  width: 48px; height: 48px; margin: 0 auto 20px;
  border: 3px solid var(--border);
  border-top: 3px solid var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
</style>
