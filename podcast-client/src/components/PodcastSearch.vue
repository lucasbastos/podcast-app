<script setup>
import { ref } from 'vue';

const searchUrl = ref('');
const isLoading = ref(false);
const error = ref('');

const emit = defineEmits(['search']);

async function handleSearch() {
  if (!searchUrl.value) {
    error.value = 'Please enter a podcast RSS feed URL';
    return;
  }
  
  try {
    isLoading.value = true;
    error.value = '';
    console.log('Emitting search event with URL:', searchUrl.value); // Add debugging
    emit('search', searchUrl.value);
    
    // Clear the search field if search is successful
    searchUrl.value = '';
  } catch (err) {
    console.error('Search error:', err);
    error.value = 'An error occurred during search';
  } finally {
    isLoading.value = false;
  }
}

// Example RSS feeds for quick testing
const exampleFeeds = [
  { 
    name: 'The Daily', 
    url: 'https://feeds.simplecast.com/54nAGcIl' 
  },
  { 
    name: 'TED Talks Daily', 
    url: 'https://feeds.megaphone.fm/GPM6651524293' 
  },
  { 
    name: 'Stuff You Should Know', 
    url: 'https://feeds.megaphone.fm/stuffyoushouldknow' 
  }
];

function setExampleFeed(url) {
  searchUrl.value = url;
}
</script>

<template>
  <div class="w-full max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
    <h2 class="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-3 sm:mb-4">Search for podcasts</h2>
    
    <form @submit.prevent="handleSearch" class="mb-3 sm:mb-4">
      <div class="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div class="flex-1">
          <input
            v-model="searchUrl"
            type="text"
            placeholder="Enter podcast RSS feed URL"
            class="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white px-3 py-2 text-sm sm:text-base"
          />
        </div>
        <button
          type="submit"
          :disabled="isLoading"
          class="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 text-sm sm:text-base"
        >
          <span v-if="isLoading">Searching...</span>
          <span v-else>Search</span>
        </button>
      </div>
      
      <p v-if="error" class="mt-2 text-xs sm:text-sm text-red-600 dark:text-red-400">{{ error }}</p>
    </form>
  </div>
</template>
