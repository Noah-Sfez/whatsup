<template>
  <div class="w-1/4 h-full border-r bg-gray-100 dark:bg-[#2C2C2C] text-black dark:text-white">
    <!-- Toggle mode jour/nuit -->
    <div
      class="flex justify-between items-center px-4 py-3 border-b border-gray-300 dark:border-gray-600"
    >
      <h2 class="text-lg font-bold">Chats</h2>

      <button @click="toggleDarkMode" class="text-2xl" aria-label="Toggle Dark Mode">
        <span v-if="isDark">🌙</span>
        <span v-else>☀️</span>
      </button>
    </div>

    <!-- Liste des conversations -->
    <div v-for="conv in conversations" :key="conv.id">
      <button
        @click="$emit('select', conv.id)"
        :class="[
          'w-full text-left px-4 py-3 hover:bg-gray-200 dark:hover:bg-[#333]',
          conv.id === activeConversationId ? 'bg-white dark:bg-[#2a2a2a] font-bold' : '',
        ]"
      >
        {{ conv.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

defineProps({
  conversations: Array,
  activeConversationId: String,
})
defineEmits(['select'])

const isDark = ref(false)

onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark')
})

function toggleDarkMode() {
  const htmlEl = document.documentElement
  if (htmlEl.classList.contains('dark')) {
    htmlEl.classList.remove('dark')
    localStorage.theme = 'light'
  } else {
    htmlEl.classList.add('dark')
    localStorage.theme = 'dark'
  }
}
</script>
