<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
    <div class="bg-white dark:bg-gray-800 shadow-md rounded-xl p-8 w-full max-w-md">
      <h2 class="text-2xl font-bold mb-6 text-center text-gray-900 dark:text-gray-100">
        {{ isLogin ? 'Login to WhatsUp' : 'Create your account' }}
      </h2>

      <form @submit.prevent="handleSubmit" class="space-y-4">
        <div v-if="!isLogin">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Username</label
          >
          <input
            v-model="form.username"
            type="text"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Email</label
          >
          <input
            v-model="form.email"
            type="email"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >Password</label
          >
          <input
            v-model="form.password"
            type="password"
            class="w-full border border-gray-300 dark:border-gray-600 rounded-md px-4 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          />
        </div>

        <button
          type="submit"
          class="w-full bg-[#25D366] hover:bg-[#1ebe57] text-white font-semibold py-2 rounded-md transition"
        >
          {{ isLogin ? 'Login' : 'Sign Up' }}
        </button>
      </form>

      <p class="text-center text-sm mt-4 text-gray-700 dark:text-gray-300">
        {{ isLogin ? "Don't have an account?" : 'Already registered?' }}
        <button @click="isLogin = !isLogin" class="text-[#25D366] font-semibold ml-1">
          {{ isLogin ? 'Sign up' : 'Log in' }}
        </button>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const isLogin = ref(true)

const form = ref({
  username: '',
  email: '',
  password: '',
})

function handleSubmit() {
  if (isLogin.value) {
    console.log('Logging in with', form.value)
    // TODO : call login API
  } else {
    console.log('Registering with', form.value)
    // TODO : call register API
  }
}
</script>
