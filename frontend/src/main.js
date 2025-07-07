import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'

const app = createApp(App)

app.use(createPinia())

// Initialiser l'authentification
const authStore = useAuthStore()
authStore.initAuth()

app.use(router)

app.mount('#app')
