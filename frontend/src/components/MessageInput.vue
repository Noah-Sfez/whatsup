<template>
  <form
    @submit.prevent="send"
    class="flex items-center gap-2 bg-white px-4 py-2 rounded-t border-t"
  >
    <input
      v-model="text"
      type="text"
      placeholder="Type a message"
      class="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none text-sm"
    />
    <button
      type="submit"
      class="text-[#25D366] text-xl font-bold hover:text-green-600"
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
