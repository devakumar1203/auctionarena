<template>
  <div class="auth-page">
    <div class="auth-card fade-in check-email-card">
      <div class="icon-wrapper">
        <div class="envelope-icon">✉️</div>
      </div>
      <h2>Check Your Email</h2>
      <p class="text-secondary">
        We've sent a verification link to your email address. Please click the link in the email to verify your account.
      </p>
      <div class="info-box">
        <p>📌 <strong>Didn't receive the email?</strong></p>
        <ul>
          <li>Check your spam or junk folder</li>
          <li>Make sure you entered the correct email</li>
          <li>The email may take a few minutes to arrive</li>
        </ul>
      </div>
      <router-link to="/login" class="btn btn-primary btn-block" style="padding: 12px; margin-top: 24px;">
        Go to Login
      </router-link>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.auth-page {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  padding: 40px 24px;
}
.check-email-card {
  width: 100%; max-width: 460px;
  background: var(--bg-card); border: 1px solid var(--border);
  border-radius: var(--radius-lg); padding: 40px;
  text-align: center;
}
.icon-wrapper {
  margin-bottom: 20px;
}
.envelope-icon {
  font-size: 3.5rem;
  animation: bounce 2s infinite;
}
h2 {
  font-size: 1.4rem; font-weight: 700; letter-spacing: -0.02em;
  margin-bottom: 12px; color: var(--text-primary);
}
.info-box {
  background: var(--bg-surface); border: 1px solid var(--border);
  border-radius: var(--radius-sm); padding: 16px 20px;
  margin-top: 20px; text-align: left; font-size: 0.85rem;
  color: var(--text-secondary);
}
.info-box p { margin-bottom: 8px; }
.info-box ul { padding-left: 20px; margin: 0; }
.info-box li { margin-bottom: 4px; line-height: 1.6; }

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}
</style>
