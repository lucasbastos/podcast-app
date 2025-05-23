<template>
  <div class="admin-tools">
    <h2>Admin Tools</h2>
    
    <div class="tool-section">
      <h3>Missing Episodes</h3>
      <button @click="importMissingEpisodes" :disabled="isImporting">
        {{ isImporting ? 'Importing...' : 'Import Missing Episodes' }}
      </button>
      
      <button @click="updateEpisodeNumbers" :disabled="isUpdating">
        {{ isUpdating ? 'Updating...' : 'Fix Episode Numbers' }}
      </button>
      
      <div v-if="importResult" :class="['result', importResult.success ? 'success' : 'error']">
        {{ importResult.message }}
      </div>
      
      <div v-if="updateResult" :class="['result', updateResult.success ? 'success' : 'error']">
        {{ updateResult.message }}
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const isImporting = ref(false);
const importResult = ref(null);
const isUpdating = ref(false);
const updateResult = ref(null);

async function importMissingEpisodes() {
  try {
    isImporting.value = true;
    importResult.value = null;
    
    const response = await fetch('http://localhost:3001/api/missing-episodes/import', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      importResult.value = {
        success: true,
        message: data.message
      };
    } else {
      importResult.value = {
        success: false,
        message: data.error || 'Failed to import missing episodes'
      };
    }
  } catch (error) {
    console.error('Import error:', error);
    importResult.value = {
      success: false,
      message: 'Error importing episodes: ' + error.message
    };
  } finally {
    isImporting.value = false;
  }
}

async function updateEpisodeNumbers() {
  try {
    isUpdating.value = true;
    updateResult.value = null;
    const apiUrl = import.meta.env.VITE_API_URL || 'https://podcast-api.up.railway.app/api';
    
    const response = await fetch(`${apiUrl}/missing-episodes/update-episode-numbers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (response.ok) {
      updateResult.value = {
        success: true,
        message: data.message
      };
    } else {
      updateResult.value = {
        success: false,
        message: data.error || 'Failed to update episode numbers'
      };
    }
  } catch (error) {
    console.error('Update error:', error);
    updateResult.value = {
      success: false,
      message: 'Error updating episode numbers: ' + error.message
    };
  } finally {
    isUpdating.value = false;
  }
}
</script>

<style scoped>
.admin-tools {
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 1rem;
}

.tool-section {
  margin-bottom: 1rem;
}

button {
  margin-right: 0.5rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #4a5568;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:disabled {
  background-color: #a0aec0;
  cursor: not-allowed;
}

.result {
  margin-top: 0.5rem;
  padding: 0.5rem;
  border-radius: 4px;
}

.success {
  background-color: #c6f6d5;
  color: #2f855a;
}

.error {
  background-color: #fed7d7;
  color: #c53030;
}
</style>
