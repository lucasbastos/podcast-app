<template>
  <div class="w-full">
    <div v-if="podcast" class="max-w-2xl mx-auto mb-6">
      <!-- Back button -->
      <button 
        @click="goBackToHome"
        class="mb-4 flex items-center text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Home
      </button>
      
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden p-4 sm:p-6">
        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          <img 
            v-if="podcast.imageUrl" 
            :src="podcast.imageUrl" 
            :alt="podcast.title"
            class="w-24 h-24 sm:w-32 sm:h-32 object-cover rounded-lg flex-shrink-0"
            @error="$event.target.style.display = 'none'"
          />
          <div v-else class="w-24 h-24 sm:w-32 sm:h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center flex-shrink-0">
            <svg class="w-10 h-10 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
          </div>
          
          <div class="flex-1 text-center sm:text-left">
            <h2 class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{{ podcast.title }}</h2>
            <p v-if="podcast.author" class="text-sm text-gray-600 dark:text-gray-400">{{ podcast.author }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="isLoading" class="flex justify-center py-12">
      <LoadingSpinner />
    </div>
    
    <div v-else-if="episodes.length === 0" class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">No episodes found</p>
    </div>
    
    <div v-else>
      <!-- Search input -->
      <div class="mb-4">
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
            </svg>
          </div>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search episodes by title or content..."
            class="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <div v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button 
              @click="searchQuery = ''"
              class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 0116 0z" clip-rule="evenodd" />
                <path fill-rule="evenodd" d="M4.646 4.646a.5.5 0 01.708 0L10 11.293l4.646-4.647a.5.5 0 01.708.708l-4.647 4.646a.5.5 0 01-.708 0L10 11.707l-4.646 4.647a.5.5 0 01-.708-.708l4.647-4.646a.5.5 0 010 0z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      
      <!-- Episode count and pagination controls -->
      <div class="flex flex-col sm:flex-row justify-between items-center mb-4 gap-2">
        <div class="text-sm text-gray-600 dark:text-gray-400">
          <span v-if="searchQuery && filteredEpisodes.length !== episodes.length">
            Found {{ filteredEpisodes.length }} episodes matching "{{ searchQuery }}"
          </span>
          <span v-else>
            Showing {{ (currentPage - 1) * episodesPerPage + 1 }}-{{ Math.min(currentPage * episodesPerPage, filteredEpisodes.length) }} of {{ filteredEpisodes.length }} episodes
          </span>
        </div>
        
        <div class="flex items-center gap-2">
          <label for="episodesPerPage" class="text-sm text-gray-600 dark:text-gray-400">
            Episodes per page:
          </label>
          <select 
            id="episodesPerPage" 
            v-model="episodesPerPage"
            @change="currentPage = 1"
            class="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-md px-2 py-1 text-sm"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
          </select>
        </div>
      </div>
      
      <!-- No results message -->
      <div v-if="filteredEpisodes.length === 0" class="text-center py-12">
        <p class="text-gray-600 dark:text-gray-400">No episodes found matching "{{ searchQuery }}"</p>
        <button 
          @click="searchQuery = ''"
          class="mt-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
        >
          Clear search
        </button>
      </div>
      
      <!-- Episodes list -->
      <div v-else class="space-y-4">
        <div 
          v-for="episode in paginatedEpisodes" 
          :key="episode.guid || episode.id"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow p-4 cursor-pointer"
          @click="playEpisode(episode)"
        >
          <div class="flex gap-4">
            <div class="w-20 h-20 flex-shrink-0">
              <img 
                v-if="episode.itunesImage?.href" 
                :src="episode.itunesImage.href" 
                :alt="episode.title"
                class="w-full h-full object-cover rounded-lg"
                @error="$event.target.style.display = 'none'"
              />
              <img 
                v-else-if="episode.imageUrl" 
                :src="episode.imageUrl" 
                :alt="episode.title"
                class="w-full h-full object-cover rounded-lg"
                @error="$event.target.style.display = 'none'"
              />
              <img 
                v-else-if="podcast?.imageUrl" 
                :src="podcast.imageUrl" 
                :alt="episode.title"
                class="w-full h-full object-cover rounded-lg"
                @error="$event.target.style.display = 'none'"
              />
              <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center">
                <svg class="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
                </svg>
              </div>
            </div>
            
            <div class="flex-1">
              <div class="flex justify-between items-start">
                <div>
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
            </div>
          </div>
        </div>
      </div>
      
      <!-- Pagination controls -->
      <div v-if="totalPages > 1" class="mt-6 flex justify-center">
        <nav class="inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
          <!-- Previous page button -->
          <button
            @click="prevPage"
            :disabled="currentPage === 1"
            class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Previous</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
          
          <!-- Page numbers -->
          <template v-if="totalPages <= 7">
            <button
              v-for="page in totalPages"
              :key="page"
              @click="goToPage(page)"
              :class="[
                'relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium',
                currentPage === page 
                  ? 'z-10 bg-indigo-50 dark:bg-indigo-900 border-indigo-500 dark:border-indigo-500 text-indigo-600 dark:text-indigo-200' 
                  : 'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
              ]"
            >
              {{ page }}
            </button>
          </template>
          
          <!-- Next page button -->
          <button
            @click="nextPage"
            :disabled="currentPage === totalPages"
            class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span class="sr-only">Next</span>
            <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>
    </div>
  </div>
  <!-- Player Screen -->
  <PlayerScreen
    v-if="currentlyPlaying"
    :current-episode="currentlyPlaying"
    :is-playing="isPlaying"
    :current-time="currentTime"
    :duration="duration"
    :podcast-image="currentEpisodeImage"
    :has-previous="hasPreviousEpisode"
    :has-next="hasNextEpisode"
    @toggle-play="togglePlayPause"
    @seek="seek"
    @close="stopPlayback"
    @previous="playPreviousEpisode"
    @next="playNextEpisode"
  />
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import LoadingSpinner from './LoadingSpinner.vue';
import PlayerScreen from './PlayerScreen.vue';

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

// Add emit for back navigation
const emit = defineEmits(['back']);

// Search functionality
const searchQuery = ref('');
const filteredEpisodes = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.episodes;
  }
  
  const query = searchQuery.value.toLowerCase();
  return props.episodes.filter(episode => {
    return (
      (episode.title && episode.title.toLowerCase().includes(query)) ||
      (episode.contentSnippet && episode.contentSnippet.toLowerCase().includes(query))
    );
  });
});

// Reset to first page when search query changes
watch(searchQuery, () => {
  currentPage.value = 1;
});

// Pagination state
const currentPage = ref(1);
const episodesPerPage = ref(10);

// Compute paginated episodes
const paginatedEpisodes = computed(() => {
  const startIndex = (currentPage.value - 1) * episodesPerPage.value;
  const endIndex = startIndex + episodesPerPage.value;
  return filteredEpisodes.value.slice(startIndex, endIndex);
});

// Compute total pages
const totalPages = computed(() => {
  return Math.ceil(filteredEpisodes.value.length / episodesPerPage.value);
});

// Pagination controls
function goToPage(page) {
  currentPage.value = page;
  // Scroll to top of the list when changing pages
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Function to go back to home
function goBackToHome() {
  emit('back');
}

// Audio player state
const audio = ref(null);
const isPlaying = ref(false);
const currentlyPlaying = ref(null);
const currentTime = ref(0);
const duration = ref(0);

// Compute the current episode index in the filtered episodes
const currentEpisodeIndex = computed(() => {
  if (!currentlyPlaying.value || !filteredEpisodes.value.length) return -1;
  
  const index = filteredEpisodes.value.findIndex(episode => {
    const currentGuid = currentlyPlaying.value.guid;
    const currentId = currentlyPlaying.value.id;
    const episodeGuid = episode.guid;
    const episodeId = episode.id;
    
    return (currentGuid && episodeGuid && currentGuid === episodeGuid) || 
           (currentId && episodeId && currentId === episodeId);
  });
  
  return index;
});

// Compute if there's a previous episode available
const hasPreviousEpisode = computed(() => {
  return currentEpisodeIndex.value > 0;
});

// Compute if there's a next episode available
const hasNextEpisode = computed(() => {
  return currentEpisodeIndex.value >= 0 && currentEpisodeIndex.value < filteredEpisodes.value.length - 1;
});

// Initialize audio element
onMounted(() => {
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
      // Auto-play next episode when current one ends
      if (hasNextEpisode.value) {
        playNextEpisode();
      }
    });
    
    audio.value.addEventListener('play', () => {
      isPlaying.value = true;
    });
    
    audio.value.addEventListener('pause', () => {
      isPlaying.value = false;
    });
  }
});

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
  
  console.log('Playing episode:', episode.title);
  
  // If it's the same episode, toggle play/pause
  if (currentlyPlaying.value && 
      (currentlyPlaying.value.guid === episode.guid || 
       currentlyPlaying.value.id === episode.id)) {
    console.log('Same episode, toggling play/pause');
    togglePlayPause();
    return;
  }
  
  // Set new episode
  console.log('Setting new episode');
  currentlyPlaying.value = episode;
  
  // Get the audio URL
  const audioUrl = episode.enclosure?.url || episode.audio || '';
  console.log('Audio URL:', audioUrl);
  
  if (!audioUrl) {
    console.error('No audio URL found for episode');
    return;
  }
  
  // Set the audio source and play
  audio.value.src = audioUrl;
  audio.value.play()
    .catch(err => console.error('Error playing audio:', err));
}

// Get the current episode's image
const currentEpisodeImage = computed(() => {
  if (!currentlyPlaying.value) return null;
  
  // Try to get episode-specific image first, prioritizing itunesImage
  return currentlyPlaying.value.itunesImage?.href || 
         currentlyPlaying.value.imageUrl || 
         props.podcast?.imageUrl;
});

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

// Seek forward or backward or to a specific time
function seek(value) {
  if (!audio.value) return;
  
  // If value is a number, it's a relative seek (e.g., +10 or -10 seconds)
  if (typeof value === 'number') {
    audio.value.currentTime += value;
  } 
  // If value is an object with a target property, it's a click event on the timeline
  else if (typeof value === 'object' && value.target) {
    const seekBar = value.target;
    const percent = value.offsetX / seekBar.offsetWidth;
    audio.value.currentTime = percent * audio.value.duration;
  }
  // Otherwise, it's an absolute time value
  else {
    audio.value.currentTime = value;
  }
}

// Play previous episode
function playPreviousEpisode() {
  if (hasPreviousEpisode.value) {
    const previousIndex = currentEpisodeIndex.value - 1;
    const previousEpisode = filteredEpisodes.value[previousIndex];
    
    // Update pagination to show the page containing the previous episode
    const pageOfPreviousEpisode = Math.ceil((previousIndex + 1) / episodesPerPage.value);
    if (pageOfPreviousEpisode !== currentPage.value) {
      currentPage.value = pageOfPreviousEpisode;
    }
    
    // Play the previous episode
    if (audio.value) {
      // Stop current playback
      audio.value.pause();
      
      // Set new episode
      currentlyPlaying.value = previousEpisode;
      
      // Get the audio URL
      const audioUrl = previousEpisode.enclosure?.url || previousEpisode.audio || '';
      
      if (!audioUrl) {
        console.error('No audio URL found for episode');
        return;
      }
      
      // Set the audio source and play
      audio.value.src = audioUrl;
      audio.value.play()
        .catch(err => console.error('Error playing audio:', err));
    }
  }
}

// Play next episode
function playNextEpisode() {
  if (hasNextEpisode.value) {
    const nextIndex = currentEpisodeIndex.value + 1;
    
    if (nextIndex < filteredEpisodes.value.length) {
      const nextEpisode = filteredEpisodes.value[nextIndex];
      
      // Update pagination to show the page containing the next episode
      const pageOfNextEpisode = Math.ceil((nextIndex + 1) / episodesPerPage.value);
      if (pageOfNextEpisode !== currentPage.value) {
        currentPage.value = pageOfNextEpisode;
      }
      
      // Play the next episode
      if (audio.value) {
        // Stop current playback
        audio.value.pause();
        
        // Set new episode
        currentlyPlaying.value = nextEpisode;
        
        // Get the audio URL
        const audioUrl = nextEpisode.enclosure?.url || nextEpisode.audio || '';
        
        if (!audioUrl) {
          console.error('No audio URL found for episode');
          return;
        }
        
        // Set the audio source and play
        audio.value.src = audioUrl;
        audio.value.play()
          .catch(err => console.error('Error playing audio:', err));
      }
    }
  }
}

// Stop playing and clear current episode
function stopPlayback() {
  if (!audio.value) return;
  
  audio.value.pause();
  audio.value.currentTime = 0;
  currentlyPlaying.value = null;
}


</script>
