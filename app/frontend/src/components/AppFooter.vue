<template>
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Brand -->
        <div class="footer-brand">
          <div class="footer-logo">Auction Arena</div>
          <p class="footer-tagline">
            India's premier live auction platform for collectors, sellers, and enthusiasts.
          </p>
          <div class="footer-socials">
            <a href="#" class="social-btn" aria-label="Twitter">𝕏</a>
            <a href="#" class="social-btn" aria-label="LinkedIn">in</a>
            <a href="#" class="social-btn" aria-label="Instagram">ig</a>
          </div>
        </div>

        <!-- Platform links -->
        <div class="footer-col">
          <div class="footer-col-title">Platform</div>
          <router-link to="/" class="footer-link">Explore Auctions</router-link>
          <router-link to="/register" class="footer-link">Create Account</router-link>
          <router-link to="/login" class="footer-link">Sign In</router-link>
        </div>

        <!-- Seller links -->
        <div class="footer-col">
          <div class="footer-col-title">Sellers</div>
          <router-link to="/create-auction" class="footer-link">List an Item</router-link>
          <router-link to="/dashboard" class="footer-link">My Dashboard</router-link>
          <router-link to="/my-bids" class="footer-link">My Bids</router-link>
        </div>

        <!-- Support links -->
        <div class="footer-col">
          <div class="footer-col-title">Support</div>
          <a href="#" class="footer-link">Help Center</a>
          <a href="#" class="footer-link">Terms of Service</a>
          <a href="#" class="footer-link">Privacy Policy</a>
        </div>
      </div>

      <div class="footer-bottom">
        <span>© {{ year }} Auction Arena. All rights reserved.</span>
        <span class="footer-badge">
          <span class="live-dot"></span>
          Live Platform
        </span>
      </div>
    </div>
  </footer>
</template>

<script setup>
const year = new Date().getFullYear()
</script>

<style scoped>
.footer {
  background: var(--bg-surface);
  border-top: 1px solid var(--border);
  padding: 60px 0 0;
}
.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 48px;
  margin-bottom: 48px;
}
.footer-logo {
  font-size: 1.1rem; font-weight: 800;
  letter-spacing: -0.02em; color: var(--text-primary);
  margin-bottom: 12px;
}
.footer-tagline {
  font-size: 0.85rem; color: var(--text-secondary);
  line-height: 1.65; max-width: 260px; margin-bottom: 20px;
}
.footer-socials { display: flex; gap: 8px; }
.social-btn {
  width: 34px; height: 34px; border-radius: 50%;
  background: var(--bg-card); border: 1px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.78rem; font-weight: 700; color: var(--text-secondary);
  text-decoration: none; transition: var(--transition);
}
.social-btn:hover {
  border-color: var(--primary); color: var(--primary);
  background: rgba(249,115,22,0.05);
  transform: translateY(-2px);
}
.footer-col-title {
  font-size: 0.72rem; font-weight: 700; color: var(--text-primary);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px;
}
.footer-link {
  display: block; font-size: 0.85rem; color: var(--text-secondary);
  margin-bottom: 10px; text-decoration: none; transition: var(--transition);
}
.footer-link:hover { color: var(--primary); }

.footer-bottom {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 0; border-top: 1px solid var(--border);
  font-size: 0.78rem; color: var(--text-muted);
}
.footer-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 100px;
  background: var(--bg-card); border: 1px solid var(--border);
  font-size: 0.72rem; color: var(--text-secondary);
}
.live-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--success); box-shadow: 0 0 6px var(--success);
  animation: blink 2s ease-in-out infinite;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }

@media (max-width: 900px) {
  .footer-grid { grid-template-columns: 1fr 1fr; gap: 32px; }
  .footer-brand { grid-column: 1 / -1; }
}
@media (max-width: 480px) {
  .footer-grid { grid-template-columns: 1fr; }
  .footer-bottom { flex-direction: column; gap: 12px; text-align: center; }
}
</style>
