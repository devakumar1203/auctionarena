<template>
  <div class="auth-page">
    <div class="auth-card fade-in">
      <div class="auth-header">
        <h2>Welcome back</h2>
        <p class="text-muted">Sign in to your Auction Arena account</p>
      </div>
      <div v-if="auth.error" class="alert alert-error">{{ auth.error }}</div>
      <form @submit.prevent="handleLogin">
        <div class="form-group">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="form-group">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="Enter your password" required />
        </div>
        <button type="submit" class="btn btn-primary btn-block" :disabled="auth.loading" style="padding:12px">
          {{ auth.loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>
      <p class="auth-footer">
        Don't have an account? <router-link to="/register">Create one</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')

const handleLogin = async () => {
  try {
    const user = await auth.login(email.value, password.value)
    router.push(user.role === 'ADMIN' ? '/admin' : '/dashboard')
  } catch (e) { /* error is set in store */ }
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
</style>
