<template>
    <div
      :class="[
        'px-4 py-2 rounded-xl max-w-[75%] shadow',
        isMine
          ? 'bg-[#dcf8c6] text-black self-end'
          : 'bg-white text-black self-start'
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
  