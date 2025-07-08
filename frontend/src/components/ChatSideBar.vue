<template>
  <div class="w-1/4 h-full border-r bg-gray-100 dark:bg-[#2C2C2C] text-black dark:text-white">
    <div
      class="flex justify-between items-center px-4 py-3 border-b border-gray-300 dark:border-gray-600"
    >
      <h2 class="text-lg font-bold">Chats</h2>

      <button @click="toggleDarkMode" class="text-2xl" aria-label="Toggle Dark Mode">
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>
    </div>
    <div class="p-4 border-b border-gray-300 bg-gray-100 dark:bg-[#2C2C2C] dark:text-white">
      <div class="flex items-center space-x-2">
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher une conversation..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            class="absolute right-3 top-2.5 h-4 w-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <button
          @click="showModal = true"
          class="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          title="Nouvelle conversation"
        >
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </button>
      </div>
    </div>

    <div v-for="conv in filteredConversations" :key="conv.id">
      <button
        @click="$emit('select', conv.id)"
        :class="[
          'w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-[#333] flex items-center gap-3',
          conv.id === activeConversationId ? 'bg-white dark:bg-[#2a2a2a] font-bold' : '',
        ]"
      >
        <div class="relative">
          <div
            class="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center font-bold text-sm"
          >
            {{ conv.name[0] }}
          </div>
          <div
            class="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full border border-white dark:border-gray-700 transition-all duration-300"
            :class="[
              conv.isOnline ? 'bg-green-500' : 'bg-gray-400',
              conv.isOnline ? 'animate-pulse' : '',
            ]"
          ></div>
        </div>
        <div class="flex-1">
          <div class="font-medium">{{ conv.name }}</div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {{ conv.isOnline ? 'En ligne' : 'Hors ligne' }}
          </div>
        </div>
      </button>
    </div>

    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div class="bg-white dark:bg-gray-700 rounded-lg p-6 w-96 max-w-md mx-4" @click.stop>
        <h2 class="text-xl font-bold mb-4 text-gray-900 dark:text-white">Nouvelle conversation</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Adresse(s) email
          </label>
          <textarea
            v-model="emailInput"
            placeholder="Entrez une ou plusieurs adresses email séparées par des virgules..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
            rows="3"
          ></textarea>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Séparez les adresses par des virgules pour créer un groupe
          </p>

          <div v-if="emailInput.trim()" class="mt-2 space-y-1">
            <div
              v-for="email in emailInputList"
              :key="email"
              class="flex items-center space-x-2 text-xs"
            >
              <span class="flex-1 truncate">{{ email }}</span>
              <span v-if="isValidEmail(email)" class="text-green-600 dark:text-green-400">
                ✓ Valide
              </span>
              <span v-else class="text-red-600 dark:text-red-400"> ✗ Format invalide </span>
            </div>
          </div>

          <div v-if="isCheckingUsers" class="mt-2 text-xs text-blue-600 dark:text-blue-400">
            Vérification des utilisateurs...
          </div>

          <div v-if="userCheckResults.length > 0" class="mt-2 space-y-1">
            <div
              v-for="result in userCheckResults"
              :key="result.email"
              class="flex items-center space-x-2 text-xs"
            >
              <span class="flex-1 truncate">{{ result.email }}</span>
              <span v-if="result.exists" class="text-green-600 dark:text-green-400">
                ✓ {{ result.name }}
              </span>
              <span v-else class="text-red-600 dark:text-red-400"> ✗ Utilisateur introuvable </span>
            </div>
          </div>
        </div>

        <div class="mb-4" v-if="emailList.length > 1">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
            Nom du groupe (optionnel)
          </label>
          <input
            v-model="groupName"
            type="text"
            placeholder="Nom du groupe..."
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
          />
        </div>

        <div class="flex justify-end space-x-2">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
          >
            Annuler
          </button>
          <button
            @click="createConversation"
            :disabled="!isFormValid || hasUserErrors"
            class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {{ emailList.length > 1 ? 'Créer le groupe' : 'Créer la conversation' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

const props = defineProps({
  conversations: Array,
  activeConversationId: String,
})

const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

function toggleDarkMode() {
  const htmlEl = document.documentElement
  if (htmlEl.classList.contains('dark')) {
    htmlEl.classList.remove('dark')
    localStorage.theme = 'light'
    isDark.value = false
  } else {
    htmlEl.classList.add('dark')
    localStorage.theme = 'dark'
    isDark.value = true
  }
}

const searchQuery = ref('')

const showModal = ref(false)
const emailInput = ref('')
const groupName = ref('')

const isCheckingUsers = ref(false)
const userCheckResults = ref([])

const checkUserExists = async (email) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_BASE_URL}/api/users/search?email=${encodeURIComponent(email)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (response.ok) {
      const user = await response.json()
      return { exists: true, name: user.username, user }
    } else if (response.status === 404) {
      return { exists: false, name: null, user: null }
    } else {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error("Erreur lors de la vérification de l'utilisateur:", error)
    return { exists: false, name: null, user: null }
  }
}

const checkAllUsersAtOnce = async (emails) => {
  try {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token')
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/users/check`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ emails }),
    })

    if (response.ok) {
      const results = await response.json()
      return results.map((result) => ({
        email: result.email,
        exists: result.exists,
        name: result.user?.username || null,
        user: result.user,
      }))
    } else {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des utilisateurs:', error)
    return emails.map((email) => ({
      email,
      exists: false,
      name: null,
      user: null,
    }))
  }
}

const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.conversations || []
  }

  return (props.conversations || []).filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

const emailInputList = computed(() => {
  return emailInput.value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email)
})

const emailList = computed(() => {
  return emailInputList.value.filter((email) => isValidEmail(email))
})

const isFormValid = computed(() => {
  return emailList.value.length > 0
})

const hasUserErrors = computed(() => {
  return userCheckResults.value.some((result) => !result.exists)
})

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const checkAllUsers = async () => {
  if (emailList.value.length === 0) {
    userCheckResults.value = []
    return
  }

  isCheckingUsers.value = true
  userCheckResults.value = []

  try {
    console.log('Vérification des utilisateurs:', emailList.value)

    const results = await checkAllUsersAtOnce(emailList.value)

    console.log('Résultats:', results)
    userCheckResults.value = results
  } catch (error) {
    console.error('Erreur lors de la vérification des utilisateurs:', error)
    userCheckResults.value = emailList.value.map((email) => ({
      email,
      exists: false,
      name: null,
      user: null,
    }))
  } finally {
    isCheckingUsers.value = false
  }
}

watch(
  emailList,
  async (newEmailList, oldEmailList) => {
    console.log('Emails changés:', newEmailList)

    clearTimeout(checkUsersTimeout)
    checkUsersTimeout = setTimeout(async () => {
      await checkAllUsers()
    }, 800)
  },
  { immediate: false },
)

let checkUsersTimeout = null

const closeModal = () => {
  showModal.value = false
  emailInput.value = ''
  groupName.value = ''
  userCheckResults.value = []
  isCheckingUsers.value = false
  if (checkUsersTimeout) {
    clearTimeout(checkUsersTimeout)
  }
}

const createConversation = () => {
  if (!isFormValid.value || hasUserErrors.value) return

  const participants = userCheckResults.value
    .filter((result) => result.exists && result.user && result.user.id)
    .map((result) => result.user.id)

  const conversationData = {
    participants,
    name: emailList.value.length > 1 ? groupName.value : null,
    is_group: emailList.value.length > 1,
  }

  emit('add-conversation', conversationData)
  closeModal()
}

const emit = defineEmits(['select', 'add-conversation'])
</script>
