<template>
  <div v-if="message.isSystem" class="flex justify-center mb-4">
    <div
      class="bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full text-xs"
    >
      {{ message.text }}
    </div>
  </div>

  <div v-else :class="['flex flex-col mb-4', isMine ? 'items-end' : 'items-start']">
    <div
      :class="[
        'px-4 py-2 rounded-2xl text-sm max-w-[75%] relative shadow-sm',
        isMine
          ? 'bg-green-500 text-white self-end rounded-br-md'
          : 'bg-gray-200 text-black self-start dark:bg-gray-600 dark:text-white rounded-bl-md',
      ]"
    >
      <div v-if="!isMine && message.username" class="text-xs font-semibold mb-1 opacity-75">
        {{ message.username }}
      </div>

      <p class="pr-8">{{ message.text }}</p>

      <span
        :class="[
          'absolute bottom-1 right-2 text-[10px]',
          isMine ? 'text-green-100' : 'text-gray-500 dark:text-gray-400',
        ]"
      >
        {{ formattedTime }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  message: Object,
  isMine: Boolean,
})

const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>
