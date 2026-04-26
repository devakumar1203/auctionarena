<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <!-- Form state -->
      <div v-if="!success">
        <div class="auth-header">
          <h2>Set New Password</h2>
          <p class="text-muted">Create a strong password for your account</p>
        </div>

        <div v-if="error" class="alert alert-error">{{ error }}</div>

        <div v-if="!tokenValid" class="invalid-token">
          <div class="status-icon">⚠️</div>
          <p class="text-secondary">Invalid or missing reset token. Please request a new password reset.</p>
          <router-link to="/forgot-password" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 16px;">
            Request New Reset
          </router-link>
        </div>

        <form v-else @submit.prevent="handleReset">
          <div class="form-group">
            <label>New Password</label>
            <input v-model="password" type="password" placeholder="Min 8 characters" required />

            <!-- Password Strength -->
            <div class="pw-strength">
              <div class="strength-bar">
                <div :class="['strength-fill', strengthColor]" :style="{ width: strengthPercent + '%' }"></div>
              </div>
              <ul class="strength-reqs">
                <li :class="{ met: reqs.length }">8+ characters</li>
                <li :class="{ met: reqs.uppercase }">Uppercase</li>
                <li :class="{ met: reqs.lowercase }">Lowercase</li>
                <li :class="{ met: reqs.number }">Number</li>
                <li :class="{ met: reqs.special }">Special char</li>
              </ul>
            </div>
          </div>

          <div class="form-group">
            <label>Confirm Password</label>
            <input v-model="confirmPassword" type="password" :class="{ 'input-error': confirmError }" placeholder="Re-enter password" required />
            <span v-if="confirmError" class="field-error-text">{{ confirmError }}</span>
          </div>

          <button type="submit" class="btn btn-primary btn-block" :disabled="loading" style="padding: 12px">
            {{ loading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>
      </div>

      <!-- Success state -->
      <div v-else class="success-state">
        <div class="status-icon">✅</div>
        <h2>Password Reset!</h2>
        <p class="text-secondary">Your password has been changed successfully. You can now log in with your new password.</p>
        <router-link to="/login" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 24px;">
          Go to Login
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import api from '../../services/api'

const route = useRoute()
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const confirmError = ref('')
const success = ref(false)
const tokenValid = ref(false)
const token = ref('')

onMounted(() => {
  token.value = route.query.token || ''
  tokenValid.value = !!token.value
})

const reqs = computed(() => {
  const p = password.value
  return {
    length: p.length >= 8,
    uppercase: /[A-Z]/.test(p),
    lowercase: /[a-z]/.test(p),
    number: /[0-9]/.test(p),
    special: /[^A-Za-z0-9]/.test(p)
  }
})

const strengthPercent = computed(() => {
  let s = 0; const r = reqs.value
  if (r.length) s += 20; if (r.uppercase) s += 20
  if (r.lowercase) s += 20; if (r.number) s += 20; if (r.special) s += 20
  return s
})

const strengthColor = computed(() => {
  const s = strengthPercent.value
  if (s <= 40) return 'bg-danger'
  if (s <= 80) return 'bg-warning'
  return 'bg-success'
})

const handleReset = async () => {
  confirmError.value = ''
  error.value = ''

  if (strengthPercent.value < 100) {
    error.value = 'Password does not meet all strength requirements'
    return
  }

  if (password.value !== confirmPassword.value) {
    confirmError.value = 'Passwords do not match'
    return
  }

  loading.value = true
  try {
    await api.post('/auth/reset-password', { token: token.value, password: password.value })
    success.value = true
  } catch (e) {
    error.value = e.response?.data?.message || 'Password reset failed. The link may have expired.'
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
  width: 100%; max-width: 440px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px;
}
.auth-header { margin-bottom: 32px; }
.auth-header h2 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }

/* Validation */
.input-error { border-color: var(--danger) !important; }
.field-error-text { color: var(--danger); font-size: 0.75rem; margin-top: 4px; display: block; }

/* Password Strength */
.pw-strength { margin-top: 10px; }
.strength-bar { height: 4px; background: var(--border); border-radius: 4px; overflow: hidden; margin-bottom: 8px; }
.strength-fill { height: 100%; transition: all 0.3s ease; border-radius: 4px; }
.bg-danger { background: var(--danger); }
.bg-warning { background: var(--warning); }
.bg-success { background: var(--success); }
.strength-reqs { list-style: none; display: flex; flex-wrap: wrap; gap: 4px 12px; }
.strength-reqs li { font-size: 0.7rem; color: var(--text-muted); transition: color 0.2s; }
.strength-reqs li.met { color: var(--success); }
.strength-reqs li::before { content: '✓ '; }

.success-state { text-align: center; }
.status-icon { font-size: 3.5rem; margin-bottom: 16px; }
.success-state h2 {
  font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em;
  margin-bottom: 8px; color: var(--text-primary);
}

.invalid-token { text-align: center; padding: 20px 0; }
</style>
