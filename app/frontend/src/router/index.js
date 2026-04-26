import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  // Public routes
  { path: '/', name: 'Home', component: () => import('../pages/public/HomePage.vue') },
  { path: '/login', name: 'Login', component: () => import('../pages/public/LoginPage.vue'), meta: { guest: true } },
  { path: '/register', name: 'Register', component: () => import('../pages/public/RegisterPage.vue'), meta: { guest: true } },
  { path: '/check-email', name: 'CheckEmail', component: () => import('../pages/public/CheckEmailPage.vue'), meta: { guest: true } },
  { path: '/verify-email', name: 'VerifyEmail', component: () => import('../pages/public/VerifyEmailPage.vue'), meta: { guest: true } },
  { path: '/forgot-password', name: 'ForgotPassword', component: () => import('../pages/public/ForgotPasswordPage.vue'), meta: { guest: true } },
  { path: '/reset-password', name: 'ResetPassword', component: () => import('../pages/public/ResetPasswordPage.vue'), meta: { guest: true } },
  { path: '/auction/:id', name: 'AuctionRoom', component: () => import('../pages/user/AuctionRoom.vue') },

  // User routes
  {
    path: '/dashboard',
    name: 'UserDashboard',
    component: () => import('../pages/user/UserDashboard.vue'),
    meta: { requiresAuth: true, role: 'USER' },
  },
  {
    path: '/create-auction',
    name: 'CreateAuction',
    component: () => import('../pages/user/CreateAuction.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/my-bids',
    name: 'MyBids',
    component: () => import('../pages/user/MyBids.vue'),
    meta: { requiresAuth: true },
  },
  {
    path: '/profile/:id?',
    name: 'Profile',
    component: () => import('../pages/user/ProfilePage.vue'),
  },

  // Admin routes
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('../pages/admin/AdminDashboard.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' },
  },
  {
    path: '/admin/users',
    name: 'ManageUsers',
    component: () => import('../pages/admin/ManageUsers.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' },
  },
  {
    path: '/admin/auctions',
    name: 'ManageAuctions',
    component: () => import('../pages/admin/ManageAuctions.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' },
  },
  {
    path: '/admin/flagged',
    name: 'FlaggedUsers',
    component: () => import('../pages/admin/FlaggedUsers.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' },
  },
  {
    path: '/admin/categories',
    name: 'ManageCategories',
    component: () => import('../pages/admin/ManageCategories.vue'),
    meta: { requiresAuth: true, role: 'ADMIN' },
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guards for role-based redirection
router.beforeEach((to, from, next) => {
  const auth = useAuthStore()

  // Redirect guests away from auth pages if already logged in
  if (to.meta.guest && auth.isAuthenticated) {
    return next(auth.isAdmin ? '/admin' : '/dashboard')
  }

  // Redirect to login if route requires auth
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return next('/login')
  }

  // Role-based access control
  if (to.meta.role === 'ADMIN' && !auth.isAdmin) {
    return next('/dashboard')
  }
  if (to.meta.role === 'USER' && auth.isAdmin) {
    return next('/admin')
  }

  next()
})

export default router
