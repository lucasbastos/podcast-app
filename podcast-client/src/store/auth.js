import { ref, computed } from 'vue';

// Create a reactive store
const user = ref(null);
const token = ref(localStorage.getItem('token') || null);
const isAuthenticated = computed(() => !!token.value);
const isLoading = ref(false);
const error = ref(null);

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || 'https://podcast-api.up.railway.app/api';

// Login user
async function login(email, password) {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save token and user data
    token.value = data.token;
    user.value = data.user;
    
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    
    return data;
  } catch (err) {
    error.value = err.message;
    throw err;
  } finally {
    isLoading.value = false;
  }
}

// Register user
async function register(username, email, password) {
  try {
    isLoading.value = true;
    error.value = null;
    
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, email, password }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Save token and user data
    token.value = data.token;
    user.value = data.user;
    
    // Store token in localStorage
    localStorage.setItem('token', data.token);
    
    return data;
  } catch (err) {
    error.value = err.message;
    throw err;
  } finally {
    isLoading.value = false;
  }
}

// Logout user
function logout() {
  token.value = null;
  user.value = null;
  localStorage.removeItem('token');
}

// Get current user
async function getCurrentUser() {
  if (!token.value) return null;
  
  try {
    isLoading.value = true;
    
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token.value}`,
      },
    });
    
    if (!response.ok) {
      throw new Error('Failed to get user data');
    }
    
    const data = await response.json();
    user.value = data.user;
    
    return data.user;
  } catch (err) {
    console.error('Error getting current user:', err);
    logout(); // Clear invalid token
    return null;
  } finally {
    isLoading.value = false;
  }
}

// Get auth header
function getAuthHeader() {
  return token.value ? { 'Authorization': `Bearer ${token.value}` } : {};
}

export default {
  user,
  token,
  isAuthenticated,
  isLoading,
  error,
  login,
  register,
  logout,
  getCurrentUser,
  getAuthHeader
};
