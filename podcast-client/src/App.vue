<script setup>
import { ref, onMounted, computed } from 'vue';
import PodcastSearch from './components/PodcastSearch.vue';
import PodcastList from './components/PodcastList.vue';
import EpisodeList from './components/EpisodeList.vue';
import PlayerScreen from './components/PlayerScreen.vue';
import AuthScreen from './components/AuthScreen.vue';
import AdminTools from './components/AdminTools.vue';
import authStore from './store/auth';

// Authentication state
const isAuthenticated = ref(authStore.isAuthenticated.value);
const isLoading = ref(true);

// App state
const podcasts = ref([]);
const episodes = ref([]);
const currentEpisode = ref(null);
const isPlaying = ref(false);
const currentTime = ref(0);
const duration = ref(0);
const showEpisodes = ref(false);
const currentPodcast = ref(null);
const errorMessage = ref('');
const audio = ref(null);
const isLoadingEpisodes = ref(false);
const isAdmin = ref(true); // You might want to control this with actual authentication
const currentEpisodeIndex = ref(-1);

// Computed properties
const isPlayerScreenVisible = computed(() => {
  return currentEpisode.value && !showEpisodes.value;
});

const hasPreviousEpisode = computed(() => {
  return currentEpisodeIndex.value > 0;
});

const hasNextEpisode = computed(() => {
  return currentEpisodeIndex.value < episodes.value.length - 1;
});

// Show player screen
function showPlayerScreen() {
  showEpisodes.value = false;
}

// Play previous episode
function playPreviousEpisode() {
  if (hasPreviousEpisode.value) {
    handleEpisodeSelect(episodes.value[currentEpisodeIndex.value - 1]);
  }
}

// Play next episode
function playNextEpisode() {
  if (hasNextEpisode.value) {
    handleEpisodeSelect(episodes.value[currentEpisodeIndex.value + 1]);
  }
}

// Check authentication on mount
onMounted(async () => {
  try {
    if (authStore.token.value) {
      await authStore.getCurrentUser();
      isAuthenticated.value = authStore.isAuthenticated.value;
      
      // If authenticated, load subscriptions
      if (isAuthenticated.value) {
        await loadUserSubscriptions();
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
  } finally {
    isLoading.value = false;
  }
  
  // Initialize audio element
  audio.value = new Audio();
  
  // Set up audio event listeners
  audio.value.addEventListener('timeupdate', handleTimeUpdate);
  audio.value.addEventListener('loadedmetadata', handleLoadedMetadata);
  audio.value.addEventListener('ended', handleAudioEnded);
  audio.value.addEventListener('error', handleAudioError);
});

// Handle successful authentication
function handleAuthSuccess() {
  isAuthenticated.value = true;
  loadUserSubscriptions();
}

// Load user's podcast subscriptions
async function loadUserSubscriptions() {
  try {
    const response = await fetch('http://localhost:3001/api/subscriptions', {
      headers: {
        ...authStore.getAuthHeader()
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to load subscriptions');
    }
    
    const data = await response.json();
    podcasts.value = data;
  } catch (error) {
    console.error('Error loading subscriptions:', error);
    errorMessage.value = 'Failed to load your subscriptions';
  }
}

// Handle podcast search
async function handleSearch(url) {
  try {
    errorMessage.value = '';
    
    const response = await fetch(`http://localhost:3001/api/podcast?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch podcast');
    }
    
    const data = await response.json();
    
    // Check if already subscribed
    const isAlreadySubscribed = podcasts.value.some(podcast => podcast.url === url);
    
    if (!isAlreadySubscribed) {
      // Subscribe to the podcast
      await subscribeToPodcast({
        url,
        title: data.title,
        description: data.description,
        imageUrl: data.image?.url || data.itunes?.image,
        author: data.itunes?.author || data.creator
      });
    }
    
    // Load episodes
    await loadEpisodes(url, data.title, data.image?.url || data.itunes?.image);
  } catch (error) {
    console.error('Search error:', error);
    errorMessage.value = 'Failed to load podcast. Please check the URL and try again.';
  }
}

// Subscribe to a podcast
async function subscribeToPodcast(podcastData) {
  try {
    const response = await fetch('http://localhost:3001/api/subscriptions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...authStore.getAuthHeader()
      },
      body: JSON.stringify(podcastData)
    });
    
    if (!response.ok) {
      const data = await response.json();
      // If already subscribed, don't show error
      if (response.status === 409) {
        return;
      }
      throw new Error(data.error || 'Failed to subscribe');
    }
    
    const newSubscription = await response.json();
    podcasts.value.push(newSubscription);
  } catch (error) {
    console.error('Subscribe error:', error);
    errorMessage.value = error.message || 'Failed to subscribe to podcast';
  }
}

// Load episodes for a podcast
async function loadEpisodes(url, podcastTitle, podcastImage) {
  try {
    isLoadingEpisodes.value = true;
    const response = await fetch(`http://localhost:3001/api/podcast/episodes?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch episodes');
    }
    
    const data = await response.json();
    episodes.value = data;
    showEpisodes.value = true;
    currentPodcast.value = { 
      title: podcastTitle, 
      imageUrl: podcastImage, 
      url 
    };
  } catch (error) {
    console.error('Load episodes error:', error);
    errorMessage.value = 'Failed to load episodes';
  } finally {
    isLoadingEpisodes.value = false;
  }
}

// Handle podcast selection
function handlePodcastSelect(podcast) {
  loadEpisodes(podcast.url, podcast.title, podcast.imageUrl);
}

// Handle episode selection
function handleEpisodeSelect(episode) {
  currentEpisode.value = episode;
  currentEpisodeIndex.value = episodes.value.findIndex(ep => 
    ep.link === episode.link || ep.title === episode.title
  );
  
  // Start playing the episode
  if (audio.value) {
    audio.value.src = episode.enclosure.url;
    audio.value.load();
    audio.value.play()
      .then(() => {
        isPlaying.value = true;
      })
      .catch(error => {
        console.error('Error playing audio:', error);
        isPlaying.value = false;
      });
  }
}

// Handle back button
function handleBack() {
  showEpisodes.value = false;
  currentPodcast.value = null;
  episodes.value = [];
}

// Audio event handlers
function handleTimeUpdate() {
  if (audio.value) {
    currentTime.value = audio.value.currentTime;
  }
}

function handleLoadedMetadata() {
  if (audio.value) {
    duration.value = audio.value.duration;
  }
}

function handleAudioEnded() {
  isPlaying.value = false;
  currentTime.value = 0;
}

function handleAudioError() {
  console.error('Audio playback error');
  errorMessage.value = 'Failed to play episode';
  isPlaying.value = false;
}

// Player controls
function togglePlay() {
  if (!audio.value) return;
  
  if (isPlaying.value) {
    audio.value.pause();
  } else {
    audio.value.play();
  }
  
  isPlaying.value = !isPlaying.value;
}

function handleSeek(time) {
  if (!audio.value) return;
  
  const newTime = audio.value.currentTime + time;
  audio.value.currentTime = Math.max(0, Math.min(newTime, audio.value.duration));
}

// Handle logout
function handleLogout() {
  authStore.logout();
  isAuthenticated.value = false;
  podcasts.value = [];
  episodes.value = [];
  currentEpisode.value = null;
  showEpisodes.value = false;
  currentPodcast.value = null;
  
  if (audio.value) {
    audio.value.pause();
    audio.value.src = '';
  }
  
  isPlaying.value = false;
}
</script>

<template>
  <div class="min-h-screen bg-dark text-text-primary flex flex-col">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </div>
    
    <!-- Auth Screen -->
    <AuthScreen 
      v-else-if="!isAuthenticated" 
      @auth-success="handleAuthSuccess" 
    />
    
    <!-- Main App -->
    <div v-else class="flex flex-col h-full min-h-screen">
      <!-- Header -->
      <header class="sticky top-0 z-10 bg-dark px-4 py-3 border-b border-border flex justify-between items-center">
        <div>
          <h1 class="text-xl font-bold text-text-primary">🎙️ Podcast App</h1>
        </div>
        
        <button 
          @click="handleLogout"
          class="p-2 text-text-secondary hover:text-primary focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>
      
      <!-- Main Content -->
      <main class="flex-grow px-4 py-4 overflow-y-auto">
        <!-- Player Screen (if episode is selected) -->
        <div v-if="currentEpisode" class="h-full">
          <PlayerScreen 
            :current-episode="currentEpisode"
            :is-playing="isPlaying"
            :current-time="currentTime"
            :duration="duration"
            :podcast-image="currentPodcast?.imageUrl"
            :has-previous="hasPreviousEpisode"
            :has-next="hasNextEpisode"
            @toggle-play="togglePlay"
            @seek="handleSeek"
            @back="currentEpisode = null"
            @previous="playPreviousEpisode"
            @next="playNextEpisode"
          />
        </div>
        
        <!-- Episode List (if podcast is selected) -->
        <div v-else-if="showEpisodes">
          <EpisodeList 
            :podcast="currentPodcast"
            :episodes="episodes"
            :isLoading="isLoadingEpisodes"
            @episode-select="handleEpisodeSelect"
            @back="handleBack"
          />
        </div>
        
        <!-- Podcast List and Search (Home Page) -->
        <div v-else>
          <AdminTools v-if="isAdmin" />
          <PodcastSearch @search="handleSearch" />
          
          <PodcastList 
            :podcasts="podcasts"
            @podcast-select="handlePodcastSelect"
          />
        </div>
      </main>
      
      <!-- Mini Player (if episode is playing but not in player screen) -->
      <div 
        v-if="currentEpisode && !isPlayerScreenVisible"
        class="fixed bottom-0 left-0 right-0 bg-dark-lightest border-t border-border p-3 flex items-center"
        @click="showPlayerScreen"
      >
        <img 
          :src="currentPodcast?.imageUrl || 'https://via.placeholder.com/300x300?text=No+Image'" 
          :alt="currentEpisode.title"
          class="w-10 h-10 rounded-md mr-3"
        />
        <div class="flex-grow mr-3 overflow-hidden">
          <h4 class="text-sm font-medium text-text-primary truncate">{{ currentEpisode.title }}</h4>
          <div class="w-full bg-dark-lighter h-1 rounded-full mt-1">
            <div 
              class="bg-primary h-1 rounded-full" 
              :style="{ width: `${(currentTime / duration) * 100}%` }"
            ></div>
          </div>
        </div>
        <button 
          @click.stop="togglePlay"
          class="p-2 rounded-full bg-primary text-light"
        >
          <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<style>
body {
  font-family: 'Inter', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #121212;
  color: #f3f4f6;
  margin: 0;
  padding: 0;
  overscroll-behavior: none;
}

/* Mobile optimizations */
html, body, #app {
  height: 100%;
  overflow-x: hidden;
}

button {
  -webkit-tap-highlight-color: transparent;
}

/* For iOS devices */
@supports (-webkit-touch-callout: none) {
  .min-h-screen {
    min-height: -webkit-fill-available;
  }
}
</style>
