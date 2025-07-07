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

// États pour les conversations et messages
const conversations = ref([])
const messages = ref([])
const loading = ref(false)
const error = ref('')

const currentUserId = computed(() => authStore.currentUser?.id || '')
const activeConversationId = ref('')

// SOCKET.IO : Initialisation
const socket = io('http://localhost:3001')

// Auth à la connexion socket
onMounted(() => {
  const token = localStorage.getItem('token')
  if (token) {
    socket.emit('authenticate', token)
  }

  socket.on('new_message', (msg) => {
    // Ajouter le message seulement s'il est pour la conversation affichée
    if (msg.conversation_id === activeConversationId.value) {
      messages.value.push({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.user_id,
        text: msg.content,
        timestamp: new Date(msg.created_at).getTime(),
        username: msg.users?.username || "Utilisateur",
        email: msg.users?.email,
      })
    }
  })
})


// Fonction pour récupérer les conversations depuis l'API
const fetchConversations = async () => {
  try {
    loading.value = true
    error.value = ''

    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error("Token d'authentification manquant")
    }

    const response = await fetch('http://localhost:3001/api/conversations', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    conversations.value = data.map((conv) => ({
      id: conv.id,
      name: conv.name || 'Conversation sans nom',
      isOnline: false,
      is_group: conv.is_group,
      created_at: conv.created_at,
      participants: conv.conversation_participants || [],
    }))

    // Sélectionner la première conversation si elle existe
    if (conversations.value.length > 0 && !activeConversationId.value) {
      activeConversationId.value = conversations.value[0].id
    }
  } catch (err) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

// Fonction pour récupérer les messages d'une conversation
const fetchMessages = async (conversationId) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    const response = await fetch(
      `http://localhost:3001/api/groups/${conversationId}/messages`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()

    // Remplacer les messages existants pour cette conversation
    messages.value = messages.value.filter((msg) => msg.conversationId !== conversationId)

    // Ajouter les nouveaux messages
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
    // Tu peux mettre une notif ici si tu veux
  }
}

const activeConversation = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value),
)

const filteredMessages = computed(() =>
  messages.value.filter((msg) => msg.conversationId === activeConversationId.value),
)

onMounted(async () => {
  await fetchConversations()
  if (activeConversationId.value) {
    await fetchMessages(activeConversationId.value)
  }
})

function handleSelectConversation(id) {
  activeConversationId.value = id
  fetchMessages(id)
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

    const newConversation = await response.json()
    await fetchConversations()
  } catch (err) {
    error.value = err.message
  }
}

// --- ENVOI DE MESSAGE ---

async function handleSendMessage(text) {
  try {
    const token = localStorage.getItem('token')
    if (!token) return

    // REST : sauvegarder en base
    const response = await fetch(
      `http://localhost:3001/api/conversations/${activeConversationId.value}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: text,
        }),
      },
    )

    if (!response.ok) {
      const errData = await response.json()
      throw new Error(errData.error || `HTTP error! status: ${response.status}`)
    }

    // Envoie aussi en temps réel avec le socket
    socket.emit('send_message', {
      groupId: activeConversationId.value,
      content: text,
      messageType: "text"
    })

    // Option : tu peux enlever l'ajout direct ci-dessous pour ne pas dupliquer avec le socket :
    // const newMessage = await response.json()
    // messages.value.push({
    //   id: newMessage.id,
    //   conversationId: activeConversationId.value,
    //   senderId: newMessage.user_id,
    //   text: newMessage.content,
    //   timestamp: new Date(newMessage.created_at).getTime(),
    //   username: newMessage.users?.username || 'Vous',
    //   email: newMessage.users?.email,
    // })
  } catch (err) {
    // Tu peux afficher une notif d'erreur ici
  }
}

function handleLogout() {
  authStore.logout()
  router.push('/auth')
}
</script>
