<template>
  <div class="flex h-screen">
    <!-- Header avec bouton de déconnexion -->
    <div class="absolute top-4 right-4 z-10">
      <button
        @click="handleLogout"
        class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
      >
        Déconnexion
      </button>
    </div>

    <!-- Indicateur de chargement -->
    <div
      v-if="loading"
      class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-20"
    >
      <div class="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
        <div class="flex items-center space-x-3">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span class="text-lg font-medium text-gray-900 dark:text-white"
            >Chargement des conversations...</span
          >
        </div>
      </div>
    </div>

    <!-- Message d'erreur -->
    <div v-if="error" class="absolute top-20 left-1/2 transform -translate-x-1/2 z-20">
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded shadow-lg">
        <div class="flex items-center">
          <svg class="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <span class="font-medium">{{ error }}</span>
          <button @click="error = ''" class="ml-4 text-red-500 hover:text-red-700">✕</button>
        </div>
      </div>
    </div>

    <ChatSideBar
      :conversations="conversations"
      :activeConversationId="activeConversationId"
      @select="handleSelectConversation"
      @add-conversation="handleAddConversation"
    />
    <ChatWindow
      v-if="activeConversation"
      :conversation="activeConversation"
      :messages="filteredMessages"
      :userId="currentUserId"
      @send="handleSendMessage"
    />
    <div v-else class="flex-1 flex items-center justify-center bg-gray-100 dark:bg-gray-900">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <svg class="h-16 w-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <p class="text-lg font-medium">Sélectionnez une conversation</p>
        <p class="text-sm">ou créez-en une nouvelle pour commencer</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ChatSideBar from '../components/ChatSideBar.vue'
import ChatWindow from '../components/ChatWindow.vue'
import { io } from 'socket.io-client'

const router = useRouter()
const authStore = useAuthStore()

const conversations = ref([])
const messages = ref([])
const loading = ref(false)
const error = ref('')

const currentUserId = computed(() => authStore.currentUser?.id || '')
const activeConversationId = ref('')

// SOCKET.IO : Initialisation
const socket = io('http://localhost:3001', {
  autoConnect: false,
})

onMounted(async () => {
  // Authentification socket.io après login
  const token = localStorage.getItem('token')
  if (token) {
    socket.connect()
    socket.emit('authenticate', token)
  }

  // Listener pour les nouveaux messages
  socket.on('new_message', (msg) => {
    const messageConversationId = msg.conversation_id || msg.group_id
    // Ajoute toujours, et l'affichage se fait via filteredMessages
    messages.value.push({
      id: msg.id,
      conversationId: messageConversationId,
      senderId: msg.user_id || msg.sender_id,
      text: msg.content,
      timestamp: new Date(msg.created_at).getTime(),
      username: msg.users?.username || 'Utilisateur',
      email: msg.users?.email,
    })
  })

  socket.on('joined_conversation', (conversationId) => {
    // Optionnel : tu peux mettre un toast ou autre ici
  })

  socket.on('error', (errorMsg) => {
    error.value = errorMsg
  })

  // Initial fetch
  await fetchConversations()
  if (activeConversationId.value) {
    await fetchMessages(activeConversationId.value)
    socket.emit('join_conversation', activeConversationId.value)
  }
})

// Watcher pour les changements de conversation
watch(
  activeConversationId,
  async (newId, oldId) => {
    if (newId && newId !== oldId) {
      await fetchMessages(newId)
      socket.emit('join_conversation', newId)
    }
  },
  { immediate: false },
)

const fetchConversations = async () => {
  try {
    loading.value = true
    error.value = ''
    const token = localStorage.getItem('token')
    if (!token) throw new Error("Token d'authentification manquant")

    const response = await fetch('http://localhost:3001/api/conversations', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)

    const data = await response.json()
    conversations.value = data.map((conv) => ({
      id: conv.id,
      name: conv.name || 'Conversation sans nom',
      isOnline: false,
      is_group: conv.is_group,
      created_at: conv.created_at,
      participants: conv.conversation_participants || [],
    }))

    // Sélectionner la première conversation par défaut
    if (conversations.value.length > 0 && !activeConversationId.value) {
      activeConversationId.value = conversations.value[0].id
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

const fetchMessages = async (conversationId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return
    const response = await fetch(
      `http://localhost:3001/api/conversations/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
    const data = await response.json()

    // Remplace tous les messages pour cette conversation
    // (évite les doublons quand tu reviens sur une conv)
    messages.value = messages.value.filter((msg) => msg.conversationId !== conversationId)

    const newMessages = data.map((msg) => ({
      id: msg.id,
      conversationId: conversationId,
      senderId: msg.user_id,
      text: msg.content,
      timestamp: new Date(msg.created_at).getTime(),
      username: msg.users?.username || 'Utilisateur',
      email: msg.users?.email,
    }))
    messages.value.push(...newMessages)
  } catch (err) {
    // Pas de notif ici, mais tu peux en ajouter si tu veux
  }
}

const activeConversation = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value),
)

const filteredMessages = computed(() =>
  messages.value.filter((msg) => msg.conversationId === activeConversationId.value),
)

function handleSelectConversation(id) {
  activeConversationId.value = id
  // fetchMessages sera appelé automatiquement par le watcher
}

async function handleAddConversation(conversationData) {
  try {
    const token = localStorage.getItem('token')
    if (!token) throw new Error("Token d'authentification manquant")

    const response = await fetch('http://localhost:3001/api/conversations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(conversationData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Erreur lors de la création')
    }

    await fetchConversations()
  } catch (err) {
    error.value = err.message
  }
}

// --- ENVOI DE MESSAGE EN TEMPS RÉEL UNIQUEMENT PAR SOCKET ---
function handleSendMessage(text) {
  if (!text || !activeConversationId.value) return
  socket.emit('send_message', {
    conversationId: activeConversationId.value,
    content: text,
    messageType: 'text',
  })
  // Ne pas ajouter localement ! Attendre le retour du serveur (temps réel propre)
}

function handleLogout() {
  authStore.logout()
  router.push('/auth')
}
</script>
