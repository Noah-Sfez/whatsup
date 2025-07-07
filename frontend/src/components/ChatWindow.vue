<template>
    <div class="flex flex-col flex-1 bg-[#f0f0f0]">
      <!-- Header -->
      <div class="p-4 bg-[#075e54] text-white font-semibold">
        {{ conversation.name }}
      </div>
  
      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2">
        <MessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :isMine="msg.senderId === userId"
        />
      </div>
  
      <!-- Input -->
      <div class="p-4 bg-white border-t border-gray-300">
        <MessageInput @send="$emit('send', $event)" />
      </div>
    </div>
  </template>
  
  <script setup>
  import MessageBubble from './MessageBubble.vue'
  import MessageInput from './MessageInput.vue'
  
  defineProps({
    conversation: Object,
    messages: Array,
    userId: String,
  })
  defineEmits(['send'])
  </script>
  