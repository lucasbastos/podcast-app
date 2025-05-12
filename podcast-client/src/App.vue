<script setup>
import { ref, onMounted } from 'vue';
import PodcastSearch from './components/PodcastSearch.vue';
import SubscriptionList from './components/SubscriptionList.vue';
import LoadingSpinner from './components/LoadingSpinner.vue';
import EpisodeList from './components/EpisodeList.vue';

const API_URL = 'http://localhost:3001/api';
const subscriptions = ref([]);
const isLoading = ref(false);
const searchResult = ref(null);
const showSearchResult = ref(false);
const subscriptionsLoading = ref(false);
const errorMessage = ref('');
const episodes = ref([]);
const episodesLoading = ref(false);
const selectedPodcast = ref(null);
const showEpisodes = ref(false);

// Fetch all subscriptions
async function fetchSubscriptions() {
  try {
    subscriptionsLoading.value = true;
    const response = await fetch(`${API_URL}/subscriptions`);
    const data = await response.json();
    subscriptions.value = data;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    errorMessage.value = 'Failed to load your subscriptions';
  } finally {
    subscriptionsLoading.value = false;
  }
}

// Search for a podcast by RSS URL
async function handleSearch(url) {
  try {
    isLoading.value = true;
    errorMessage.value = '';
    searchResult.value = null;
    showSearchResult.value = false;
    
    const response = await fetch(`${API_URL}/podcast?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch podcast');
    }
    
    const data = await response.json();
    
    // Map the response to our app's format
    searchResult.value = {
      url: url,
      title: data.title,
      description: data.description,
      author: data.creator || data.itunes?.author,
      imageUrl: data.image?.url || data.itunes?.image
    };
    
    showSearchResult.value = true;
  } catch (error) {
    console.error('Search error:', error);
    errorMessage.value = error.message || 'Failed to fetch podcast data';
  } finally {
    isLoading.value = false;
  }
}

// Subscribe to a podcast
async function handleSubscribe() {
  if (!searchResult.value) return;
  
  try {
    isLoading.value = true;
    const response = await fetch(`${API_URL}/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(searchResult.value),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to subscribe');
    }
    
    // Refresh subscriptions
    await fetchSubscriptions();
    
    // Clear search result
    searchResult.value = null;
    showSearchResult.value = false;
  } catch (error) {
    console.error('Subscription error:', error);
    errorMessage.value = error.message || 'Failed to subscribe to podcast';
  } finally {
    isLoading.value = false;
  }
}

// Unsubscribe from a podcast
async function handleUnsubscribe(id) {
  try {
    const response = await fetch(`${API_URL}/subscriptions/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to unsubscribe');
    }
    
    // Update local state
    subscriptions.value = subscriptions.value.filter(s => s.id !== id);
  } catch (error) {
    console.error('Unsubscribe error:', error);
    errorMessage.value = error.message || 'Failed to unsubscribe from podcast';
  }
}

// Fetch episodes for a podcast
async function fetchEpisodes(podcast) {
  try {
    episodesLoading.value = true;
    errorMessage.value = '';
    episodes.value = [];
    selectedPodcast.value = podcast;
    showEpisodes.value = true;
    
    const response = await fetch(`${API_URL}/podcast/episodes?url=${encodeURIComponent(podcast.url)}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch episodes');
    }
    
    const data = await response.json();
    episodes.value = data;
  } catch (error) {
    console.error('Error fetching episodes:', error);
    errorMessage.value = error.message || 'Failed to load podcast episodes';
  } finally {
    episodesLoading.value = false;
  }
}

// View episodes for a subscription
function viewEpisodes(subscription) {
  fetchEpisodes(subscription);
}

// Back to subscriptions
function backToSubscriptions() {
  showEpisodes.value = false;
  selectedPodcast.value = null;
}

// Load subscriptions on component mount
onMounted(() => {
  fetchSubscriptions();
});
</script>

<template>
  <div class="min-h-screen bg-gray-100 dark:bg-gray-900 py-8 px-4">
    <header class="max-w-2xl mx-auto mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
        🎙️ Podcast App
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        Search, subscribe, and listen to your favorite podcasts
      </p>
    </header>
    
    <main class="max-w-4xl mx-auto">
      <!-- Search Component -->
      <PodcastSearch @search="handleSearch" />
      
      <!-- Error message -->
      <div 
        v-if="errorMessage" 
        class="max-w-2xl mx-auto bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 p-4 rounded-lg mb-6"
      >
        <p class="text-red-700 dark:text-red-400">{{ errorMessage }}</p>
      </div>
      
      <!-- Search result -->
      <div 
        v-if="showSearchResult && searchResult" 
        class="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-8"
      >
        <h2 class="text-xl font-semibold text-gray-800 dark:text-white mb-4">Search Result</h2>
        
        <div class="flex items-start gap-4 mb-4">
          <img 
            v-if="searchResult.imageUrl" 
            :src="searchResult.imageUrl" 
            :alt="searchResult.title"
            class="w-24 h-24 object-cover rounded-lg"
            @error="$event.target.style.display = 'none'"
          />
          <div v-else class="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center">
            <svg class="w-8 h-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
            </svg>
          </div>
          
          <div class="flex-1">
            <h3 class="font-medium text-lg text-gray-800 dark:text-white">{{ searchResult.title }}</h3>
            <p v-if="searchResult.author" class="text-sm text-gray-500 dark:text-gray-400">{{ searchResult.author }}</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-3">
              {{ searchResult.description || 'No description available' }}
            </p>
          </div>
        </div>
        
        <div class="flex justify-end">
          <button
            @click="handleSubscribe"
            :disabled="isLoading"
            class="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <span v-if="isLoading">Processing...</span>
            <span v-else>Subscribe</span>
          </button>
        </div>
      </div>
      
      <!-- Search loading -->
      <div v-if="isLoading && !showSearchResult" class="max-w-2xl mx-auto py-8">
        <LoadingSpinner />
      </div>
      
      <!-- Subscriptions List -->
      <SubscriptionList 
        :subscriptions="subscriptions" 
        :isLoading="subscriptionsLoading" 
        @unsubscribe="handleUnsubscribe"
      />
    </main>
    
    <footer class="max-w-2xl mx-auto text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
      <p>© {{ new Date().getFullYear() }} Podcast App</p>
    </footer>
  </div>
</template>
