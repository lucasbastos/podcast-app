<script setup>
import { ref } from 'vue';
import authStore from '../store/auth';

const email = ref('');
const password = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const emit = defineEmits(['login-success', 'switch-to-register']);

async function handleLogin() {
  if (!email.value || !password.value) {
    errorMessage.value = 'Please enter both email and password';
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    await authStore.login(email.value, password.value);
    
    // Clear form
    email.value = '';
    password.value = '';
    
    // Emit success event
    emit('login-success');
  } catch (error) {
    console.error('Login error:', error);
    errorMessage.value = error.message || 'Login failed';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Log in to your account</h2>
    
    <form @submit.prevent="handleLogin" class="space-y-4">
      <!-- Email Field -->
      <div>
        <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="email"
          v-model="email"
          type="email"
          autocomplete="email"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="your@email.com"
        />
      </div>
      
      <!-- Password Field -->
      <div>
        <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="••••••••"
        />
      </div>
      
      <!-- Error Message -->
      <div v-if="errorMessage" class="text-red-500 text-sm">
        {{ errorMessage }}
      </div>
      
      <!-- Submit Button -->
      <div>
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium 
                 text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                 focus:ring-indigo-500 disabled:opacity-50"
        >
          <span v-if="isLoading">Logging in...</span>
          <span v-else>Log in</span>
        </button>
      </div>
      
      <!-- Register Link -->
      <div class="text-center mt-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?
          <button 
            type="button"
            @click="emit('switch-to-register')" 
            class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Register
          </button>
        </p>
      </div>
    </form>
  </div>
</template>
