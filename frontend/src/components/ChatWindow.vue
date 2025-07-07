<template>
  <div class="flex flex-col flex-1 bg-[#eae6df]">
    <!-- ✅ Nouveau header fusionné style WhatsApp -->
    <div class="p-4 flex items-center gap-3 bg-[#075e54] text-white border-b">
      <div class="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold">
        {{ conversation.name[0] }}
      </div>
      <div class="flex flex-col leading-tight">
        <span class="font-semibold text-sm">{{ conversation.name }}</span>
        <span class="text-xs text-white/70">Online</span>
      </div>
    </div>

    <!-- 💬 Messages -->
    <div class="flex-1 overflow-y-auto p-4">
      <MessageBubble
        v-for="msg in messages"
        :key="msg.id"
        :message="msg"
        :isMine="msg.senderId === userId"
      />
    </div>

    <!-- ⌨️ Input -->
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
