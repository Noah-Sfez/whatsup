<template>
  <div class="w-1/4 h-full bg-[#f7f8fa] border-r border-gray-300 flex flex-col">
    <!-- En-tête avec recherche et bouton + -->
    <div class="p-4 border-b border-gray-300 bg-white">
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

    <!-- Liste des conversations -->
    <div class="flex-1 overflow-y-auto">
      <div v-for="conv in filteredConversations" :key="conv.id">
        <button
          @click="$emit('select', conv.id)"
          :class="[
            'w-full text-left px-4 py-3 hover:bg-gray-200',
            conv.id === activeConversationId ? 'bg-white font-bold text-black' : 'text-gray-800',
          ]"
        >
          {{ conv.name }}
        </button>
      </div>

      <!-- Message quand aucune conversation ne correspond à la recherche -->
      <div
        v-if="filteredConversations.length === 0 && searchQuery"
        class="p-4 text-gray-500 text-center"
      >
        Aucune conversation trouvée
      </div>
    </div>

    <!-- Modal pour créer une nouvelle conversation -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click="closeModal"
    >
      <div class="bg-white rounded-lg p-6 w-96 max-w-md mx-4" @click.stop>
        <h2 class="text-xl font-bold mb-4">Nouvelle conversation</h2>

        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2"> Adresse(s) email </label>
          <textarea
            v-model="emailInput"
            placeholder="Entrez une ou plusieurs adresses email séparées par des virgules..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows="3"
          ></textarea>
          <p class="text-xs text-gray-500 mt-1">
            Séparez les adresses par des virgules pour créer un groupe
          </p>
        </div>

        <div class="mb-4" v-if="emailList.length > 1">
          <label class="block text-sm font-medium text-gray-700 mb-2">
            Nom du groupe (optionnel)
          </label>
          <input
            v-model="groupName"
            type="text"
            placeholder="Nom du groupe..."
            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div class="flex justify-end space-x-2">
          <button
            @click="closeModal"
            class="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Annuler
          </button>
          <button
            @click="createConversation"
            :disabled="!isFormValid"
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
import { ref, computed } from 'vue'

const props = defineProps({
  conversations: Array,
  activeConversationId: String,
})

// État pour la recherche
const searchQuery = ref('')

// État pour le modal
const showModal = ref(false)
const emailInput = ref('')
const groupName = ref('')

// Conversations filtrées en fonction de la recherche
const filteredConversations = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.conversations || []
  }

  return (props.conversations || []).filter((conv) =>
    conv.name.toLowerCase().includes(searchQuery.value.toLowerCase()),
  )
})

// Liste des emails validés
const emailList = computed(() => {
  return emailInput.value
    .split(',')
    .map((email) => email.trim())
    .filter((email) => email && isValidEmail(email))
})

// Validation du formulaire
const isFormValid = computed(() => {
  return emailList.value.length > 0
})

// Fonction pour valider un email
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Fermer le modal
const closeModal = () => {
  showModal.value = false
  emailInput.value = ''
  groupName.value = ''
}

// Créer la conversation
const createConversation = () => {
  if (!isFormValid.value) return

  const conversationData = {
    emails: emailList.value,
    isGroup: emailList.value.length > 1,
    groupName: emailList.value.length > 1 ? groupName.value : null,
  }

  emit('add-conversation', conversationData)
  closeModal()
}

const emit = defineEmits(['select', 'add-conversation'])
</script>
