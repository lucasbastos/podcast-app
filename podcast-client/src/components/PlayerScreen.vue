<script setup>
import { computed, ref } from 'vue';

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

const emit = defineEmits(['toggle-play', 'seek', 'back', 'previous', 'next']);

// Touch handling for swipe gestures
const touchStartX = ref(0);
const touchEndX = ref(0);
const isSwiping = ref(false);

function handleTouchStart(event) {
  touchStartX.value = event.touches[0].clientX;
  isSwiping.value = true;
}

function handleTouchEnd(event) {
  touchEndX.value = event.changedTouches[0].clientX;
  if (isSwiping.value) {
    const deltaX = touchEndX.value - touchStartX.value;
    if (deltaX > 50) {
      playPrevious();
    } else if (deltaX < -50) {
      playNext();
    }
  }
  isSwiping.value = false;
}

// Format time in MM:SS format
function formatTime(seconds) {
  if (isNaN(seconds) || seconds === Infinity) return '00:00';
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Format date
function formatDate(dateString) {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Format duration
function formatDuration(duration) {
  if (!duration) return '';
  
  // If it's already in HH:MM:SS format
  if (typeof duration === 'string' && duration.includes(':')) return duration;
  
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
  emit('seek', -15); // Seek 15 seconds backward
}

function seekForward() {
  emit('seek', 15); // Seek 15 seconds forward
}

function back() {
  emit('back');
}

function playPrevious() {
  emit('previous');
}

function playNext() {
  emit('next');
}
</script>

<template>
  <div class="player-screen flex flex-col h-full">
    <!-- Back button and episode title -->
    <div class="flex items-center mb-4">
      <button 
        @click="back" 
        class="mr-3 p-2 bg-dark-lighter rounded-full hover:bg-primary transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div class="overflow-hidden">
        <h2 class="text-lg font-semibold text-text-primary truncate">
          Now Playing
        </h2>
      </div>
    </div>
    
    <!-- Player content -->
    <div class="flex-grow flex flex-col bg-dark-lightest rounded-xl p-4 shadow-lg overflow-hidden">
      <!-- Podcast image -->
      <div class="flex justify-center mb-6 mt-2">
        <div class="w-48 h-48 sm:w-64 sm:h-64 rounded-xl overflow-hidden shadow-lg">
          <img 
            :src="podcastImage || 'https://via.placeholder.com/300x300?text=No+Image'" 
            :alt="currentEpisode.title"
            class="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <!-- Episode info -->
      <div class="mb-6 text-center">
        <h3 class="text-lg font-bold text-text-primary mb-1">{{ currentEpisode.title }}</h3>
        <p class="text-sm text-text-secondary">
          {{ formatDate(currentEpisode.isoDate || currentEpisode.pubDate) }}
          <span v-if="currentEpisode.duration" class="ml-2">· {{ formatDuration(currentEpisode.duration) }}</span>
        </p>
      </div>
      
      <!-- Progress bar -->
      <div class="mb-4 px-2">
        <div 
          class="relative h-2 bg-dark-lighter rounded-full overflow-hidden cursor-pointer"
          @click="handleProgressClick"
        >
          <div 
            class="absolute top-0 left-0 h-full bg-primary"
            :style="{ width: `${progressPercentage}%` }"
          ></div>
        </div>
        <div class="flex justify-between mt-2 text-xs text-text-secondary">
          <span>{{ formatTime(currentTime) }}</span>
          <span>{{ formatTime(duration) }}</span>
        </div>
      </div>
      
      <!-- Controls -->
      <div class="flex justify-center items-center space-x-4 sm:space-x-6 mb-4 mt-auto">
        <!-- Previous episode -->
        <button 
          @click="playPrevious"
          :disabled="!hasPrevious"
          class="p-2 rounded-full hover:bg-dark-lighter focus:outline-none transition-colors disabled:opacity-30"
          title="Previous episode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        </button>
        
        <!-- Rewind 15s -->
        <button 
          @click="seekBackward"
          class="p-2 rounded-full hover:bg-dark-lighter focus:outline-none transition-colors"
          title="Rewind 15 seconds"
        >
          <div class="relative h-7 w-7">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l-3 3m9-10a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="absolute bottom-1 right-1 text-xs font-bold">-15</div>
          </div>
        </button>
        
        <!-- Play/Pause -->
        <button 
          @click="togglePlay"
          class="bg-primary text-light rounded-full p-4 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary-light transition-colors"
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
        
        <!-- Forward 15s -->
        <button 
          @click="seekForward"
          class="p-2 rounded-full hover:bg-dark-lighter focus:outline-none transition-colors"
          title="Forward 15 seconds"
        >
          <div class="relative h-7 w-7">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m-9-10a9 9 0 1118 0 9 9 0 01-18 0z" />
            </svg>
            <div class="absolute bottom-1 right-1 text-xs font-bold">+15</div>
          </div>
        </button>
        
        <!-- Next episode -->
        <button 
          @click="playNext"
          :disabled="!hasNext"
          class="p-2 rounded-full hover:bg-dark-lighter focus:outline-none transition-colors disabled:opacity-30"
          title="Next episode"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
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
