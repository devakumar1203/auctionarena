<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <h2>Create an account</h2>
        <p class="text-muted">Join Auction Arena and start bidding</p>
      </div>

      <div v-if="globalError" class="alert alert-error">{{ globalError }}</div>

      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label>Full Name</label>
          <input v-model="form.name" :class="{ 'input-error': fieldErrors.name }" placeholder="John Doe" required />
          <span v-if="fieldErrors.name" class="field-error-text">{{ fieldErrors.name }}</span>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input v-model="form.email" type="email" :class="{ 'input-error': fieldErrors.email }" placeholder="you@example.com" required />
          <span v-if="fieldErrors.email" class="field-error-text">{{ fieldErrors.email }}</span>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>PAN Number</label>
            <input v-model="form.pan" :class="{ 'input-error': fieldErrors.pan }" placeholder="ABCDE1234F" maxlength="10" required />
            <span v-if="fieldErrors.pan" class="field-error-text">{{ fieldErrors.pan }}</span>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input v-model="form.phoneNumber" :class="{ 'input-error': fieldErrors.phoneNumber }" placeholder="9876543210" required />
            <span v-if="fieldErrors.phoneNumber" class="field-error-text">{{ fieldErrors.phoneNumber }}</span>
          </div>
        </div>

        <div class="form-group">
          <label>Password</label>
          <input v-model="form.password" type="password" :class="{ 'input-error': fieldErrors.password }" placeholder="Min 8 characters" required />
          <span v-if="fieldErrors.password" class="field-error-text">{{ fieldErrors.password }}</span>

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
          <input v-model="confirmPassword" type="password" :class="{ 'input-error': fieldErrors.confirmPassword }" placeholder="Re-enter password" required />
          <span v-if="fieldErrors.confirmPassword" class="field-error-text">{{ fieldErrors.confirmPassword }}</span>
        </div>

        <button type="submit" class="btn btn-primary btn-block" :disabled="auth.loading" style="padding:12px">
          {{ auth.loading ? 'Creating account...' : 'Create account' }}
        </button>
      </form>
      <p class="auth-footer">Already have an account? <router-link to="/login">Sign in</router-link></p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const form = reactive({ name: '', email: '', pan: '', phoneNumber: '', password: '' })
const confirmPassword = ref('')
const globalError = ref('')
const fieldErrors = reactive({ name: '', email: '', pan: '', phoneNumber: '', password: '', confirmPassword: '' })

const reqs = computed(() => {
  const p = form.password
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

const validateForm = () => {
  let valid = true
  Object.keys(fieldErrors).forEach(k => fieldErrors[k] = '')
  globalError.value = ''

  if (form.pan && form.pan.length !== 10) { fieldErrors.pan = 'PAN must be exactly 10 characters'; valid = false }
  if (form.phoneNumber && !/^\d{10}$/.test(form.phoneNumber)) { fieldErrors.phoneNumber = 'Phone number must be exactly 10 digits'; valid = false }
  if (strengthPercent.value < 100) { fieldErrors.password = 'Password does not meet all strength requirements'; valid = false }
  if (form.password !== confirmPassword.value) { fieldErrors.confirmPassword = 'Passwords do not match'; valid = false }
  return valid
}

const handleRegister = async () => {
  if (!validateForm()) return
  try {
    await auth.register(form)
    // Redirect to check-email page — user must verify before logging in
    router.push('/check-email')
  } catch (e) {
    if (e.response?.data?.errors) {
      e.response.data.errors.forEach(err => {
        if (fieldErrors[err.field] !== undefined) fieldErrors[err.field] = err.message
        else globalError.value = err.message
      })
    } else {
      globalError.value = e.response?.data?.message || 'Registration failed'
    }
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.auth-card {
  width: 100%; max-width: 460px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px;
}
.auth-header { margin-bottom: 32px; }
.auth-header h2 { font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

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

.auth-footer {
  text-align: center; margin-top: 24px; font-size: 0.85rem;
  color: var(--text-muted);
}
.auth-footer a { color: var(--text-primary); font-weight: 500; }
.auth-footer a:hover { text-decoration: underline; }

@media (max-width: 500px) {
  .form-row { grid-template-columns: 1fr; }
}
</style>
