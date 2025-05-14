<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentEpisode: {
    type: Object,
    required: true
  },
  isPlaying: {
    type: Boolean,
    default: false
  },
  currentTime: {
    type: Number,
    default: 0
  },
  duration: {
    type: Number,
    default: 0
  },
  podcastImage: {
    type: String,
    default: null
  },
  hasPrevious: {
    type: Boolean,
    default: false
  },
  hasNext: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['toggle-play', 'seek', 'close', 'previous', 'next']);

// Format time in MM:SS format
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Calculate progress percentage
const progressPercentage = computed(() => {
  if (!props.duration) return 0;
  return (props.currentTime / props.duration) * 100;
});

// Handle progress bar click
function handleProgressClick(event) {
  const progressBar = event.currentTarget;
  const rect = progressBar.getBoundingClientRect();
  const clickPosition = event.clientX - rect.left;
  const percentage = clickPosition / rect.width;
  
  // Calculate new time based on percentage
  const newTime = props.duration * percentage;
  
  // Emit seek event with absolute time
  emit('seek', newTime);
}

// Handle player controls
function togglePlay() {
  emit('toggle-play');
}

function seekBackward() {
  emit('seek', -10); // Seek 10 seconds backward
}

function seekForward() {
  emit('seek', 10); // Seek 10 seconds forward
}

function close() {
  emit('close');
}

function playPrevious() {
  emit('previous');
}

function playNext() {
  emit('next');
}
</script>

<template>
  <div class="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-3xl w-full max-h-full overflow-auto">
      <!-- Header with close button -->
      <div class="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white truncate">
          Now Playing
        </h2>
        <button 
          @click="close"
          class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <!-- Episode info -->
      <div class="p-6">
        <div class="flex flex-col md:flex-row gap-6 mb-6">
          <div class="w-full md:w-1/3 flex justify-center">
            <img 
              v-if="currentEpisode.itunesImage?.href"
              :src="currentEpisode.itunesImage.href" 
              :alt="currentEpisode.title"
              class="w-48 h-48 rounded-lg shadow-md object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <img 
              v-else-if="currentEpisode.imageUrl" 
              :src="currentEpisode.imageUrl" 
              :alt="currentEpisode.title"
              class="w-48 h-48 rounded-lg shadow-md object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <img 
              v-else-if="podcastImage" 
              :src="podcastImage" 
              :alt="currentEpisode.title"
              class="w-48 h-48 rounded-lg shadow-md object-cover"
              @error="$event.target.style.display = 'none'"
            />
            <div v-else class="w-48 h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center">
              <svg class="w-12 h-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
              </svg>
            </div>
          </div>
          
          <div class="w-full md:w-2/3">
            <h2 class="text-xl font-semibold mb-2 text-gray-800 dark:text-white">{{ currentEpisode.title }}</h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {{ currentEpisode.podcastTitle || currentEpisode.author }}
            </p>
            
            <div class="prose dark:prose-invert max-w-none text-sm mb-4" v-if="currentEpisode.contentSnippet">
              <p>{{ currentEpisode.contentSnippet }}</p>
            </div>
            
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <p v-if="currentEpisode.pubDate">
                Published on: {{ new Date(currentEpisode.pubDate).toLocaleDateString() }}
              </p>
              <p v-else-if="currentEpisode.date">
                Published on: {{ new Date(currentEpisode.date).toLocaleDateString() }}
              </p>
            </div>
          </div>
        </div>
        
        <!-- Progress bar -->
        <div class="mb-4">
          <div 
            class="w-full bg-gray-300 dark:bg-gray-600 rounded-full h-2 cursor-pointer"
            @click="handleProgressClick"
          >
            <div 
              class="bg-indigo-600 h-2 rounded-full" 
              :style="{ width: `${progressPercentage}%` }"
            ></div>
          </div>
          <div class="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
            <span>{{ formatTime(currentTime) }}</span>
            <span>{{ formatTime(duration) }}</span>
          </div>
        </div>
        
        <!-- Player controls -->
        <div class="flex items-center justify-center gap-4">
          <button 
            @click="playPrevious"
            :disabled="!hasPrevious"
            class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Previous episode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
          
          <button 
            @click="seekBackward"
            class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            title="Rewind 10 seconds"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
            </svg>
          </button>
          
          <button 
            @click="togglePlay"
            class="bg-indigo-600 text-white rounded-full p-4 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            :title="isPlaying ? 'Pause' : 'Play'"
          >
            <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          <button 
            @click="seekForward"
            class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none"
            title="Forward 10 seconds"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
            </svg>
          </button>
          
          <button 
            @click="playNext"
            :disabled="!hasNext"
            class="text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            title="Next episode"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.prose {
  max-height: 150px;
  overflow-y: auto;
}
</style>