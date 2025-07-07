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
</style>

<template>
  <div class="flex flex-col flex-1 bg-[#eae6df] dark:bg-[#2c2c2c]">
    <div class="p-4 flex items-center gap-3 bg-[#075e54] dark:bg-[#054d44] text-white border-b">
      <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
        {{ conversation.name[0] }}
      </div>
      <div class="flex flex-col leading-tight">
        <span class="font-semibold text-sm">{{ conversation.name }}</span>
        <span class="text-xs text-white/70">online</span>
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
