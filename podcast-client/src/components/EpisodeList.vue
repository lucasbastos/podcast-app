<template>
  <div class="episode-list">
    <!-- Back button and podcast info -->
    <div class="flex items-center mb-6">
      <button 
        @click="$emit('back')" 
        class="mr-4 p-2 bg-dark-lighter rounded-full hover:bg-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div class="flex items-center">
        <img 
          v-if="podcast?.imageUrl" 
          :src="podcast.imageUrl" 
          :alt="podcast?.title" 
          class="w-12 h-12 rounded-lg mr-4 object-cover"
        />
        <div>
          <h2 class="text-xl font-semibold text-text-primary">{{ podcast?.title }}</h2>
          <p class="text-sm text-text-secondary">Episodes</p>
        </div>
      </div>
    </div>
    
    <!-- Loading state -->
    <div v-if="isLoading" class="flex justify-center items-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      <span class="ml-3 text-text-primary">Loading episodes...</span>
    </div>
    
    <!-- Episodes list -->
    <div v-else-if="episodes && episodes.length > 0" class="space-y-4">
      <div class="mb-4 p-3 bg-dark-lighter rounded-lg">
        <p class="text-text-secondary text-sm">
          Showing {{ episodes.length }} episodes, sorted by publish date (newest first)
          <span v-if="countMissingEpisodes() > 0" class="ml-2">
            (including {{ countMissingEpisodes() }} archived episodes)
          </span>
        </p>
      </div>
      
      <div v-for="episode in episodes" :key="episode.link || episode.title" 
           class="bg-dark-lightest border border-border rounded-xl p-4 hover:bg-dark-lighter transition-colors duration-200 cursor-pointer"
           @click="$emit('episode-select', episode)">
        <div class="flex">
          <div class="flex-shrink-0 w-20 h-20 mr-4">
            <img :src="episode.imageUrl || podcast?.imageUrl" alt="Episode cover" 
                 class="w-full h-full object-cover rounded-lg shadow-md">
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center flex-wrap">
              <h3 class="text-lg font-medium text-text-primary mr-2 truncate">
                {{ episode.title }}
              </h3>
              <div class="flex space-x-2 mt-1">
                <span v-if="episode.isMissingEpisode" 
                      class="text-xs bg-accent text-dark px-2 py-0.5 rounded-full">
                  Archived
                </span>
                <span v-if="episode.episodeNumber" 
                      class="text-xs bg-primary-light text-dark px-2 py-0.5 rounded-full">
                  #{{ episode.episodeNumber }}
                </span>
              </div>
            </div>
            <p class="text-sm text-text-secondary mt-1">
              {{ formatDate(episode.isoDate || episode.pubDate) }}
              <span v-if="episode.duration" class="ml-2">· {{ formatDuration(episode.duration) }}</span>
            </p>
            <p v-if="episode.contentSnippet || episode.content" class="text-sm mt-2 line-clamp-2 text-text-secondary opacity-80">
              {{ episode.contentSnippet || stripHtml(episode.content).substring(0, 150) + '...' }}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- No episodes state -->
    <div v-else class="bg-dark-lightest border border-border rounded-xl p-6 text-center">
      <p class="text-text-primary">No episodes found.</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  podcast: Object,
  episodes: Array,
  isLoading: Boolean
});

defineEmits(['episode-select', 'back']);

function countMissingEpisodes() {
  if (!props.episodes) return 0;
  return props.episodes.filter(episode => episode.isMissingEpisode).length;
}

function formatDate(dateString) {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

function formatDuration(duration) {
  // Handle different duration formats
  if (!duration) return '';
  
  // If it's already in HH:MM:SS format
  if (duration.includes(':')) return duration;
  
  // If it's in seconds
  const seconds = parseInt(duration, 10);
  if (isNaN(seconds)) return duration;
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

function stripHtml(html) {
  if (!html) return '';
  return html.replace(/<[^>]*>?/gm, '');
}
</script>

<style scoped>
/* Use Tailwind's line-clamp utility */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
