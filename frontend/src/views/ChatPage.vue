<template>
  <div class="flex h-screen">
    <ChatSideBar
      :conversations="conversations"
      :activeConversationId="activeConversationId"
      @select="handleSelectConversation"
    />
    <ChatWindow
      v-if="activeConversation"
      :conversation="activeConversation"
      :messages="filteredMessages"
      :userId="currentUserId"
      @send="handleSendMessage"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import ChatSideBar from '../components/ChatSideBar.vue'
import ChatWindow from '../components/ChatWindow.vue'

// Fake data temporaire
const conversations = ref([
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
])
const messages = ref([
  { id: 'm1', conversationId: '1', senderId: '1', text: 'Salut !', timestamp: Date.now() },
  { id: 'm2', conversationId: '2', senderId: '2', text: 'Yo !', timestamp: Date.now() },
])

const filteredMessages = computed(() =>
  messages.value.filter((msg) => msg.conversationId === activeConversationId.value),
)

const currentUserId = 'me'
const activeConversationId = ref(null)

const activeConversation = computed(() =>
  conversations.value.find((c) => c.id === activeConversationId.value),
)

function handleSelectConversation(id) {
  activeConversationId.value = id
}

function handleSendMessage(text) {
  messages.value.push({
    id: Date.now().toString(),
    conversationId: activeConversationId.value,
    senderId: currentUserId,
    text,
    timestamp: Date.now(),
  })
}
</script>
