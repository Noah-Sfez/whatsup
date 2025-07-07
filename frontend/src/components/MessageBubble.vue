<template>
    <div
      :class="[
        'px-4 py-2 rounded-lg max-w-xs',
        isMine ? 'bg-blue-500 text-white self-end' : 'bg-white border self-start'
      ]"
    >
      {{ message.text }}
    </div>
  </template>
  
  <script setup>
  defineProps({
    message: Object,
    isMine: Boolean
  })
  </script>
  