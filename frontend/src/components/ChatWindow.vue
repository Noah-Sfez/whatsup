<template>
    <div class="flex flex-col flex-1">
      <!-- Header -->
      <div class="p-4 border-b font-semibold bg-white">
        {{ conversation.name }}
      </div>
  
      <!-- Messages -->
      <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
        <MessageBubble
          v-for="msg in messages"
          :key="msg.id"
          :message="msg"
          :isMine="msg.senderId === userId"
        />
      </div>
  
      <!-- Input -->
      <div class="p-4 border-t bg-white">
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
  