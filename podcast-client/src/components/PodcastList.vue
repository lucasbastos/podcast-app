<script setup>
import { computed } from 'vue';

const props = defineProps({
  podcasts: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['podcast-select']);

const hasPodcasts = computed(() => props.podcasts && props.podcasts.length > 0);

function handlePodcastClick(podcast) {
  emit('podcast-select', podcast);
}
</script>

<template>
  <div class="mt-8">
    <h2 class="text-xl font-semibold mb-4">Your Subscriptions</h2>
    
    <div v-if="!hasPodcasts" class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
      <p class="text-gray-600 dark:text-gray-400">
        You don't have any podcast subscriptions yet. Search for a podcast to get started!
      </p>
    </div>
    
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <div 
        v-for="podcast in podcasts" 
        :key="podcast._id || podcast.id"
        @click="handlePodcastClick(podcast)"
        class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-300"
      >
        <div class="h-48 overflow-hidden">
          <img 
            :src="podcast.imageUrl" 
            :alt="podcast.title"
            class="w-full h-full object-cover"
            onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'"
          />
        </div>
        
        <div class="p-4">
          <h3 class="font-semibold text-lg mb-1 truncate">{{ podcast.title }}</h3>
          <p v-if="podcast.author" class="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {{ podcast.author }}
          </p>
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ podcast.description || 'No description available' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
