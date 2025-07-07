import { createRouter, createWebHistory } from 'vue-router'
import ChatPage from '../views/ChatPage.vue'
import AuthPage from '../views/AuthPage.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/chat',
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/auth',
      name: 'auth',
      component: AuthPage,
      meta: { requiresGuest: true },
    },
  ],
})

// Garde de navigation
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()

  // Initialiser l'authentification si ce n'est pas déjà fait
  if (!authStore.isAuthenticated && localStorage.getItem('token')) {
    authStore.initAuth()
  }

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    // Rediriger vers la page d'authentification si l'utilisateur n'est pas connecté
    next('/auth')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // Rediriger vers le chat si l'utilisateur est déjà connecté
    next('/chat')
  } else {
    next()
  }
})

export default router
