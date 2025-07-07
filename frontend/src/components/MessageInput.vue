<template>
    <form @submit.prevent="send" class="flex gap-2">
      <input
        v-model="text"
        type="text"
        placeholder="Écris un message"
        class="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none"
      />
      <button
        type="submit"
        class="bg-[#25D366] text-white px-4 py-2 rounded-full font-bold hover:bg-green-500"
        :disabled="!text.trim()"
      >
        Envoyer
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
  