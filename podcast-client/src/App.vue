<script setup>
import { ref, onMounted } from 'vue';
import PodcastSearch from './components/PodcastSearch.vue';
import PodcastList from './components/PodcastList.vue';
import EpisodeList from './components/EpisodeList.vue';
import PlayerScreen from './components/PlayerScreen.vue';
import AuthScreen from './components/AuthScreen.vue';
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
  
  if (audio.value) {
    audio.value.src = episode.enclosure.url;
    audio.value.load();
    isPlaying.value = true;
    audio.value.play();
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
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
    <!-- Loading Screen -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
    </div>
    
    <!-- Auth Screen -->
    <AuthScreen 
      v-else-if="!isAuthenticated" 
      @auth-success="handleAuthSuccess" 
    />
    
    <!-- Main App -->
    <div v-else class="container mx-auto px-4 py-6">
      <!-- Header -->
      <header class="flex justify-between items-center mb-6">
        <div>
          <h1 class="text-2xl font-bold">🎙️ Podcast App</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Your personal podcast player</p>
        </div>
        
        <button 
          @click="handleLogout"
          class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          Logout
        </button>
      </header>
      
      <!-- Error Message -->
      <div 
        v-if="errorMessage" 
        class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
      >
        <span class="block sm:inline">{{ errorMessage }}</span>
        <span 
          class="absolute top-0 bottom-0 right-0 px-4 py-3" 
          @click="errorMessage = ''"
        >
          <svg class="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
            <title>Close</title>
            <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
          </svg>
        </span>
      </div>
      
      <!-- Main Content -->
      <main>
        <!-- Player Screen (if episode is selected) -->
        <div v-if="currentEpisode">
          <PlayerScreen 
            :current-episode="currentEpisode"
            :is-playing="isPlaying"
            :current-time="currentTime"
            :duration="duration"
            :podcast-image="currentPodcast?.imageUrl"
            @toggle-play="togglePlay"
            @seek="handleSeek"
            @back="currentEpisode = null"
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
          <PodcastSearch @search="handleSearch" />
          
          <PodcastList 
            :podcasts="podcasts"
            @podcast-select="handlePodcastSelect"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style>
body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #111827;
    color: #f3f4f6;
  }
}
</style>
