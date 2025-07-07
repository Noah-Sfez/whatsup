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
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import ChatSideBar from '../components/ChatSideBar.vue'
import ChatWindow from '../components/ChatWindow.vue'

const router = useRouter()
const authStore = useAuthStore()

// Fake data temporaire
const conversations = ref([
  { id: '1', name: 'Alice', isOnline: true },
  { id: '2', name: 'Bob', isOnline: false },
])

const messages = ref([
  { id: 'm1', conversationId: '1', senderId: '1', text: 'Salut !', timestamp: Date.now() },
  { id: 'm2', conversationId: '2', senderId: '2', text: 'Yo !', timestamp: Date.now() },
])

const currentUserId = computed(() => authStore.currentUser?.id || '1')
const activeConversationId = ref('1')

// Simuler le changement de statut en ligne
function simulateOnlineStatus() {
  setInterval(() => {
    conversations.value.forEach((conv) => {
      // Simuler un changement de statut aléatoire (20% de chance de changer)
      if (Math.random() < 0.2) {
        conv.isOnline = !conv.isOnline
      }
    })
  }, 5000) // Changer toutes les 5 secondes
}

const activeConversation = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value),
)

const filteredMessages = computed(() =>
  messages.value.filter((msg) => msg.conversationId === activeConversationId.value),
)

onMounted(() => {
  activeConversationId.value = conversations.value[0]?.id
  simulateOnlineStatus()

  // Optionnel : écouter les changements de statut en ligne via Socket.IO
  // si vous voulez implémenter cela avec des vrais utilisateurs
  // initSocketListeners()
})

// Fonction pour initialiser les listeners Socket.IO (optionnel)
function initSocketListeners() {
  // Cette fonction peut être utilisée pour écouter les changements de statut
  // en temps réel depuis le serveur Socket.IO
  // socket.on('user_online', (userId) => {
  //   const conversation = conversations.value.find(c => c.userId === userId)
  //   if (conversation) {
  //     conversation.isOnline = true
  //   }
  // })
  // socket.on('user_offline', (userId) => {
  //   const conversation = conversations.value.find(c => c.userId === userId)
  //   if (conversation) {
  //     conversation.isOnline = false
  //   }
  // })
}

function handleSelectConversation(id) {
  activeConversationId.value = id
}

function handleAddConversation(conversationData) {
  console.log('Création de conversation:', conversationData)

  // Générer un nouvel ID pour la conversation
  const newId = Date.now().toString()

  // Créer le nom de la conversation en utilisant les noms vérifiés
  let conversationName
  if (conversationData.isGroup) {
    // Pour un groupe, utiliser le nom du groupe ou "Groupe" + noms d'utilisateurs
    if (conversationData.groupName) {
      conversationName = conversationData.groupName
    } else {
      const userNames = conversationData.emails.map(
        (email) => conversationData.userNames[email] || email,
      )
      conversationName = `Groupe (${userNames.slice(0, 2).join(', ')}${userNames.length > 2 ? '...' : ''})`
    }
  } else {
    // Pour une conversation individuelle, utiliser le nom de l'utilisateur ou l'email
    const email = conversationData.emails[0]
    conversationName = conversationData.userNames[email] || email
  }

  // Ajouter la nouvelle conversation
  const newConversation = {
    id: newId,
    name: conversationName,
    isGroup: conversationData.isGroup,
    emails: conversationData.emails,
    groupName: conversationData.groupName,
    userNames: conversationData.userNames,
  }

  conversations.value.push(newConversation)

  // Sélectionner automatiquement la nouvelle conversation
  activeConversationId.value = newId

  // Optionnel : ajouter un message de bienvenue
  const welcomeMessage = conversationData.isGroup
    ? `Groupe créé avec ${Object.values(conversationData.userNames).join(', ')}`
    : `Conversation créée avec ${conversationName}`

  messages.value.push({
    id: Date.now().toString() + '_welcome',
    conversationId: newId,
    senderId: 'system',
    text: welcomeMessage,
    timestamp: Date.now(),
    isSystem: true,
  })
}

function handleSendMessage(text) {
  messages.value.push({
    id: Date.now().toString(),
    conversationId: activeConversationId.value,
    senderId: currentUserId.value,
    text,
    timestamp: Date.now(),
  })
}

function handleLogout() {
  authStore.logout()
  router.push('/auth')
}
</script>
