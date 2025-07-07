<style>
.bg-whatsapp {
  background-image: url('../assets/fondLightmode.png');
  background-size: 40%;
  background-repeat: repeat;
}

.dark .bg-whatsapp {
  background-image: url('../assets/fondDarkmode.png');
  background-size: 40%;
  background-repeat: repeat;
}

/* Animation pour l'indicateur de statut en ligne */
.online-indicator {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Transition pour les changements de statut */
.status-transition {
  transition: all 0.3s ease;
}
</style>

<template>
  <div class="flex flex-col flex-1 bg-[#eae6df] dark:bg-[#2c2c2c]">
    <div class="p-4 flex items-center gap-3 bg-[#075e54] dark:bg-[#054d44] text-white border-b">
      <div class="relative">
        <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
          {{ conversation.name[0] }}
        </div>
        <div
          class="absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white status-transition"
          :class="conversation.isOnline ? 'bg-green-500 online-indicator' : 'bg-gray-400'"
        ></div>
      </div>
      <div class="flex flex-col leading-tight">
        <span class="font-semibold text-sm">{{ conversation.name }}</span>
        <span class="text-xs text-white/70">
          {{ conversation.isOnline ? 'En ligne' : 'Hors ligne' }}
        </span>
      </div>
    </div>

    <!-- Messages -->
    <div class="flex-1 overflow-y-auto p-4 space-y-2 bg-whatsapp">
      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :isMine="msg.senderId === userId"
      />
    </div>

    <!-- Input -->
    <div class="p-4 bg-white border-t dark:border-color-[#222222] dark:bg-[#2c2c2c]">
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
