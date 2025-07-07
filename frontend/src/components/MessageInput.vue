<template>
  <form
    @submit.prevent="send"
    class="flex items-center gap-2 bg-white dark:bg-[#2c2c2c] px-4 py-2 rounded-t"
  >
    <input
      v-model="text"
      type="text"
      placeholder="Type a message"
      class="flex-1 px-4 py-2 rounded-full border border-gray-300 dark:bg-[#2c2c2c] focus:outline-none text-sm bg-white dark:bg-[#2c2c2c] text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
    />
    <button
      type="submit"
      class="text-[#25D366] text-xl font-bold hover:text-green-600 disabled:text-gray-400"
      :disabled="!text.trim()"
    >
      📤
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
const text = ref('')
const emit = defineEmits(['send'])

function send() {
  if (!text.value.trim()) return
  emit('send', text.value)
  text.value = ''
}
</script>
