import { createRouter, createWebHistory } from 'vue-router'
import ChatPage from '../views/ChatPage.vue'

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
    },
  ],
})

export default router
