<template>
  <div class="w-1/4 h-full bg-[#f7f8fa] border-r border-gray-300 overflow-y-auto">
    <div v-for="conv in conversations" :key="conv.id">
      <button
        @click="$emit('select', conv.id)"
        :class="[
          'w-full text-left px-4 py-3 hover:bg-gray-200',
          conv.id === activeConversationId ? 'bg-white font-bold text-black' : 'text-gray-800',
        ]"
      >
        {{ conv.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
defineProps({
  conversations: Array,
  activeConversationId: String,
})
defineEmits(['select'])
</script>
