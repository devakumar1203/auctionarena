<template>
  <div id="auction-app">
    <Navbar v-if="showNav" />
    <main class="main-content">
      <router-view />
    </main>
    <AppFooter v-if="showNav" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import Navbar from './components/Navbar.vue'
import AppFooter from './components/AppFooter.vue'

const route = useRoute()
const showNav = computed(() => !['Login', 'Register'].includes(route.name))
</script>

<style scoped>
#auction-app { min-height: 100vh; display: flex; flex-direction: column; }
.main-content { flex: 1; }
</style>
