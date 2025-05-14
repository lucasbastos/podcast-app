<script setup>
import { ref } from 'vue';
import LoginForm from './LoginForm.vue';
import RegisterForm from './RegisterForm.vue';

const showLogin = ref(true);

const emit = defineEmits(['auth-success']);

function handleLoginSuccess() {
  emit('auth-success');
}

function handleRegisterSuccess() {
  emit('auth-success');
}

function switchToRegister() {
  showLogin.value = false;
}

function switchToLogin() {
  showLogin.value = true;
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-gray-900">
    <div class="w-full max-w-md">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          🎙️ Podcast App
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Your personal podcast player
        </p>
      </div>
      
      <transition name="fade" mode="out-in">
        <LoginForm 
          v-if="showLogin" 
          @login-success="handleLoginSuccess" 
          @switch-to-register="switchToRegister" 
        />
        <RegisterForm 
          v-else 
          @register-success="handleRegisterSuccess" 
          @switch-to-login="switchToLogin" 
        />
      </transition>
    </div>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>