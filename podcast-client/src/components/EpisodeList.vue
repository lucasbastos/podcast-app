<template>
  <div class="w-full max-w-2xl mx-auto">
    <div v-if="isLoading" class="py-8">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="episodes.length === 0" class="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 text-center">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      <p class="text-gray-600 dark:text-gray-400">No episodes found for this podcast</p>
    </div>
    
    <div v-else>
      <h3 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">
        Episodes
        <span v-if="podcast" class="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">
          ({{ podcast.title }})
        </span>
      </h3>
      
      <div class="space-y-3">
        <div 
          v-for="episode in episodes" 
          :key="episode.guid || episode.id"
          class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-4"
        >
          <div class="flex flex-col">
            <div class="flex items-center gap-3 mb-2">
              <button 
                @click="playEpisode(episode)"
                class="bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                title="Play episode"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
              </button>
              <div class="flex-1">
                <h4 class="font-medium text-gray-800 dark:text-white">{{ episode.title }}</h4>
                <div class="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                  <span v-if="episode.pubDate">
                    {{ formatDate(episode.pubDate) }}
                  </span>
                  <span v-if="episode.duration" class="flex items-center">
                    <span class="mx-1">•</span>
                    {{ formatDuration(episode.duration) }}
                  </span>
                </div>
              </div>
            </div>
            
            <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-2" v-if="episode.contentSnippet">
              {{ episode.contentSnippet }}
            </p>
            
            <div v-if="currentlyPlaying?.guid === episode.guid || currentlyPlaying?.id === episode.id" class="mt-3">
              <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                <div class="flex items-center justify-between mb-2">
                  <div class="text-sm font-medium text-gray-700 dark:text-gray-300">Now Playing</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(currentTime) }} / {{ formatTime(duration) }}</div>
                </div>
                <div class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-1.5 mb-2">
                  <div 
                    class="bg-indigo-600 h-1.5 rounded-full" 
                    :style="{ width: `${(currentTime / duration) * 100}%` }"
                  ></div>
                </div>
                <div class="flex justify-center space-x-4">
                  <button 
                    @click="seek(-10)"
                    class="text-gray-700 dark:text-gray-300 focus:outline-none"
                    title="Rewind 10 seconds"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                    </svg>
                  </button>
                  <button 
                    @click="togglePlayPause"
                    class="text-gray-700 dark:text-gray-300 focus:outline-none"
                    :title="isPlaying ? 'Pause' : 'Play'"
                  >
                    <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </button>
                  <button 
                    @click="seek(10)"
                    class="text-gray-700 dark:text-gray-300 focus:outline-none"
                    title="Forward 10 seconds"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';

const props = defineProps({
  podcast: {
    type: Object,
    default: null
  },
  episodes: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  }
});

// Audio player state
const audio = ref(null);
const isPlaying = ref(false);
const currentlyPlaying = ref(null);
const currentTime = ref(0);
const duration = ref(0);

// Initialize audio element
if (typeof window !== 'undefined') {
  audio.value = new Audio();
  
  // Audio event listeners
  audio.value.addEventListener('timeupdate', () => {
    currentTime.value = audio.value.currentTime;
  });
  
  audio.value.addEventListener('loadedmetadata', () => {
    duration.value = audio.value.duration;
  });
  
  audio.value.addEventListener('ended', () => {
    isPlaying.value = false;
  });
  
  audio.value.addEventListener('play', () => {
    isPlaying.value = true;
  });
  
  audio.value.addEventListener('pause', () => {
    isPlaying.value = false;
  });
}

// Clean up event listeners
onUnmounted(() => {
  if (audio.value) {
    audio.value.pause();
    audio.value.src = '';
  }
});

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Format time for display (mm:ss)
function formatTime(seconds) {
  if (!seconds || isNaN(seconds)) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format duration string
function formatDuration(durationString) {
  // Handle different duration formats
  if (!durationString) return '';
  
  // If duration is in seconds
  if (!isNaN(durationString)) {
    return formatTime(parseInt(durationString));
  }
  
  // If duration is in HH:MM:SS format
  const parts = durationString.split(':');
  if (parts.length === 3) {
    return `${parts[0]}:${parts[1]}:${parts[2]}`;
  } else if (parts.length === 2) {
    return durationString;
  }
  
  return durationString;
}

// Play an episode
function playEpisode(episode) {
  if (!audio.value) return;
  
  // If it's the same episode, toggle play/pause
  if (currentlyPlaying.value && 
      (currentlyPlaying.value.guid === episode.guid || 
       currentlyPlaying.value.id === episode.id)) {
    togglePlayPause();
    return;
  }
  
  // Set new episode
  currentlyPlaying.value = episode;
  audio.value.src = episode.enclosure?.url || episode.audio || '';
  audio.value.play()
    .catch(err => console.error('Error playing audio:', err));
}

// Toggle play/pause
function togglePlayPause() {
  if (!audio.value) return;
  
  if (isPlaying.value) {
    audio.value.pause();
  } else {
    audio.value.play()
      .catch(err => console.error('Error playing audio:', err));
  }
}

// Seek forward or backward
function seek(seconds) {
  if (!audio.value) return;
  
  audio.value.currentTime += seconds;
}
</script>
