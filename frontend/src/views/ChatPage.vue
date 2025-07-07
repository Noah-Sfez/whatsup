<template>
    <div class="flex h-screen">
      <ChatSidebar
        :conversations="conversations"
        :activeConversationId="activeConversationId"
        @select="handleSelectConversation"
      />
      <ChatWindow
        v-if="activeConversation"
        :conversation="activeConversation"
        :messages="messages"
        :userId="currentUserId"
        @send="handleSendMessage"
      />
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import ChatSidebar from '@/components/ChatSidebar.vue'
  import ChatWindow from '@/components/ChatWindow.vue'
  
  // Fake data temporaire
  const conversations = ref([
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ])
  const messages = ref([
    { id: 'm1', senderId: '1', text: 'Salut !', timestamp: Date.now() },
    { id: 'm2', senderId: 'me', text: 'Yo !', timestamp: Date.now() },
  ])
  
  const currentUserId = 'me'
  const activeConversationId = ref(null)
  
  const activeConversation = computed(() =>
    conversations.value.find(c => c.id === activeConversationId.value)
  )
  
  function handleSelectConversation(id) {
    activeConversationId.value = id
  }
  
  function handleSendMessage(text) {
    messages.value.push({
      id: Date.now().toString(),
      senderId: currentUserId,
      text,
      timestamp: Date.now(),
    })
  }
  </script>
  