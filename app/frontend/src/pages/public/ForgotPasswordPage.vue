<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <!-- Form state -->
      <div v-if="!submitted">
        <div class="auth-header">
          <h2>Forgot Password</h2>
          <p class="text-muted">Enter your email and we'll send you a link to reset your password</p>
        </div>
        <div v-if="error" class="alert alert-error">{{ error }}</div>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Email</label>
            <input v-model="email" type="email" placeholder="you@example.com" required />
          </div>
          <button type="submit" class="btn btn-primary btn-block" :disabled="loading" style="padding: 12px">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>
        <p class="auth-footer">
          Remember your password? <router-link to="/login">Sign in</router-link>
        </p>
      </div>

      <!-- Success state -->
      <div v-else class="success-state">
        <div class="status-icon">📧</div>
        <h2>Check Your Email</h2>
        <p class="text-secondary">
          If an account with <strong>{{ email }}</strong> exists, we've sent a password reset link. Please check your inbox.
        </p>
        <div class="info-box">
          <p>The link will expire in <strong>1 hour</strong>.</p>
        </div>
        <router-link to="/login" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 24px;">
          Back to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '../../services/api'

const email = ref('')
const loading = ref(false)
const error = ref('')
const submitted = ref(false)

const handleSubmit = async () => {
  loading.value = true
  error.value = ''
  try {
    await api.post('/auth/forgot-password', { email: email.value })
    submitted.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.auth-card {
  width: 100%; max-width: 400px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px;
}
.auth-header { margin-bottom: 32px; }
.auth-header h2 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
.auth-footer {
  text-align: center; margin-top: 24px; font-size: 0.85rem;
  color: var(--text-muted);
}
.auth-footer a { color: var(--text-primary); font-weight: 500; }
.auth-footer a:hover { text-decoration: underline; }

.success-state { text-align: center; }
.status-icon { font-size: 3.5rem; margin-bottom: 16px; }
.success-state h2 {
  font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em;
  margin-bottom: 8px; color: var(--text-primary);
}
.info-box {
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 12px 16px;
  margin-top: 16px; font-size: 0.85rem;
  color: var(--text-secondary);
}
.info-box p { margin: 0; }
</style>
