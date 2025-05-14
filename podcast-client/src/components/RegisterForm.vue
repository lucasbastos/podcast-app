<script setup>
import { ref } from 'vue';
import authStore from '../store/auth';

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const errorMessage = ref('');
const isLoading = ref(false);

const emit = defineEmits(['register-success', 'switch-to-login']);

async function handleRegister() {
  // Validate form
  if (!username.value || !email.value || !password.value) {
    errorMessage.value = 'Please fill in all fields';
    return;
  }
  
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match';
    return;
  }
  
  if (password.value.length < 6) {
    errorMessage.value = 'Password must be at least 6 characters';
    return;
  }
  
  try {
    isLoading.value = true;
    errorMessage.value = '';
    
    await authStore.register(username.value, email.value, password.value);
    
    // Clear form
    username.value = '';
    email.value = '';
    password.value = '';
    confirmPassword.value = '';
    
    // Emit success event
    emit('register-success');
  } catch (error) {
    console.error('Registration error:', error);
    errorMessage.value = error.message || 'Registration failed';
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Create an account</h2>
    
    <form @submit.prevent="handleRegister" class="space-y-4">
      <!-- Username Field -->
      <div>
        <label for="username" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username
        </label>
        <input
          id="username"
          v-model="username"
          type="text"
          autocomplete="username"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="johndoe"
        />
      </div>
      
      <!-- Email Field -->
      <div>
        <label for="register-email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email
        </label>
        <input
          id="register-email"
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
        <label for="register-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password
        </label>
        <input
          id="register-password"
          v-model="password"
          type="password"
          autocomplete="new-password"
          required
          class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 
                 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
          placeholder="••••••••"
        />
      </div>
      
      <!-- Confirm Password Field -->
      <div>
        <label for="confirm-password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Confirm Password
        </label>
        <input
          id="confirm-password"
          v-model="confirmPassword"
          type="password"
          autocomplete="new-password"
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
          <span v-if="isLoading">Creating account...</span>
          <span v-else>Register</span>
        </button>
      </div>
      
      <!-- Login Link -->
      <div class="text-center mt-4">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Already have an account?
          <button 
            type="button"
            @click="emit('switch-to-login')" 
            class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Log in
          </button>
        </p>
      </div>
    </form>
  </div>
</template>