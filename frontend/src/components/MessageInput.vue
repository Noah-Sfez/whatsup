<template>
    <form @submit.prevent="send">
      <div class="flex">
        <input
          v-model="text"
          type="text"
          placeholder="Écrire un message"
          class="flex-1 border rounded-l px-4 py-2 focus:outline-none"
        />
        <button
          type="submit"
          class="bg-blue-500 text-white px-4 rounded-r"
          :disabled="!text.trim()"
        >
          Envoyer
        </button>
      </div>
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
  