<template>
  <div :class="['flex flex-col', isMine ? 'items-end' : 'items-start']">
    <div
      :class="[
        'px-4 py-2 rounded-2xl text-sm max-w-[75%] relative shadow-sm',
        isMine
          ? 'bg-[#d9fdd3] text-black self-end'
          : 'bg-white text-black self-start dark:bg-gray-700 dark:text-white',
      ]"
    >
      <p class="pr-8">{{ message.text }}</p>
      <span class="absolute bottom-1 right-2 text-[10px] text-gray-500 dark:text-black">
        {{ formattedTime }}
      </span>
    </div>

    <div class="h-5"></div>
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
