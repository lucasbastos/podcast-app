<script setup>
import { ref, onMounted } from 'vue';
import PodcastCard from './PodcastCard.vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  subscriptions: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['unsubscribe', 'view-episodes']);

function handleUnsubscribe(subscriptionId) {
  emit('unsubscribe', subscriptionId);
}

function handleViewEpisodes(subscription) {
  emit('view-episodes', subscription);
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Your Subscriptions</h2>
    
    <div v-if="isLoading" class="py-8">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="subscriptions.length === 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      <p class="text-gray-600 dark:text-gray-400">You don't have any podcast subscriptions yet</p>
      <p class="text-gray-500 dark:text-gray-500 text-sm mt-2">Search for a podcast above to get started</p>
    </div>
    
    <div v-else class="space-y-3">
      <div 
        v-for="subscription in subscriptions" 
        :key="subscription.id"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden"
      >
        <PodcastCard 
          :podcast="subscription" 
          @remove="handleUnsubscribe(subscription.id)" 
        />
      </div>
    </div>
  </div>
</template>
