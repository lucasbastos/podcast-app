<script setup>
const props = defineProps({
  podcast: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['remove', 'view-episodes']);

function handleRemove() {
  emit('remove');
}

function handleViewEpisodes() {
  emit('view-episodes');
}

function handleImageError(event) {
  // Replace broken image with placeholder
  event.target.style.display = 'none';
  const parent = event.target.parentNode;
  
  // Create placeholder element
  const placeholder = document.createElement('div');
  placeholder.className = 'w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center flex-shrink-0';
  placeholder.innerHTML = '<svg class="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path></svg>';
  
  parent.insertBefore(placeholder, event.target);
}
</script>

<template>
  <div class="podcast-card flex items-center gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">
    <img 
      v-if="podcast.imageUrl" 
      :src="podcast.imageUrl" 
      :alt="podcast.title"
      class="w-16 h-16 object-cover rounded-lg flex-shrink-0"
      @error="handleImageError"
    />
    <div v-else class="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex justify-center items-center flex-shrink-0">
      <svg class="w-6 h-6 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"></path>
      </svg>
    </div>
    
    <div class="flex-1 min-w-0">
      <h3 class="font-medium text-gray-800 dark:text-white truncate">{{ podcast.title }}</h3>
      <p v-if="podcast.author" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ podcast.author }}</p>
      <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
        {{ podcast.description || 'No description available' }}
      </p>
    </div>
    
    <div class="flex flex-col gap-2">
      <button 
        @click="handleViewEpisodes"
        class="text-indigo-500 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
        title="View episodes"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M7 4a1 1 0 011-1h4a1 1 0 010 2H8a1 1 0 01-1-1zM5 8a1 1 0 011-1h8a1 1 0 010 2H6a1 1 0 01-1-1zM4 12a1 1 0 011-1h10a1 1 0 010 2H5a1 1 0 01-1-1z" />
        </svg>
      </button>
      
      <button 
        @click="handleRemove"
        class="text-red-500 hover:text-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 rounded-full p-1"
        title="Remove subscription"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.podcast-card {
  transition: transform 0.2s, box-shadow 0.2s;
}

.podcast-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
</style>
