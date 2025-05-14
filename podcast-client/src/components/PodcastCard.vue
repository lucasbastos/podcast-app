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
  <div class="podcast-card flex flex-col sm:flex-row items-center gap-3 sm:gap-4 p-3 hover:bg-gray-50 dark:hover:bg-gray-750 rounded-lg">
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
    
    <div class="flex-1 text-center sm:text-left">
      <h3 class="text-base sm:text-lg font-medium text-gray-800 dark:text-white line-clamp-1">{{ podcast.title }}</h3>
      <p v-if="podcast.author" class="text-xs sm:text-sm text-gray-600 dark:text-gray-400 line-clamp-1">{{ podcast.author }}</p>
    </div>
    
    <div class="flex gap-2 mt-2 sm:mt-0">
      <button 
        @click="handleViewEpisodes"
        class="text-indigo-600 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
        title="View episodes"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
          <path fill-rule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clip-rule="evenodd" />
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

@media (max-width: 640px) {
  .podcast-card:hover {
    transform: none;
  }
}
</style>
