require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Parser = require('rss-parser');

// Import routes
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');
const missingEpisodesRoutes = require('./routes/missingEpisodes');

// Initialize Express app
const app = express();
const parser = new Parser({
  customFields: {
    item: [
      ['itunes:duration', 'duration'],
      ['itunes:image', 'itunesImage', { keepArray: false }],
      ['itunes:explicit', 'explicit'],
      ['itunes:episodeType', 'episodeType'],
      ['itunes:season', 'season'],
      ['itunes:episode', 'episodeNumber']
    ]
  }
});

// Configure CORS for production
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.CLIENT_URL || 'https://podcast-client.up.railway.app'] 
    : 'http://localhost:3000',
  optionsSuccessStatus: 200
};

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', environment: process.env.NODE_ENV });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/missing-episodes', missingEpisodesRoutes);

// Fetch podcast feed by URL
app.get('/api/podcast', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    const feed = await parser.parseURL(url);
    
    res.json(feed);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    res.status(500).json({ error: 'Failed to fetch podcast feed' });
  }
});

// Get episodes for a podcast
app.get('/api/podcast/episodes', async (req, res) => {
  try {
    const { url } = req.query;
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }
    
    const feed = await parser.parseURL(url);
    
    // Extract episodes and add some additional data
    const episodes = feed.items.map(item => ({
      ...item,
      podcastTitle: feed.title,
      podcastImage: feed.image?.url || feed.itunes?.image,
      // Add episode-specific image if available, otherwise use podcast image
      imageUrl: item.image?.url || feed.image?.url || feed.itunes?.image
    }));
    
    // Extract podcast name for missing episode lookup
    let podcastName = feed.title;
    let basePodcastName = '';
    
    if (podcastName.includes('|')) {
      podcastName = podcastName.split('|')[0].trim();
    }
    
    // Extract the base name (first word) from the podcast name
    basePodcastName = podcastName.split(' ')[0].trim();
    console.log(`Podcast name: ${podcastName}, Base name: ${basePodcastName}`);
    
    // Get all episode numbers from the feed
    const feedEpisodeNumbers = new Set();
    episodes.forEach(episode => {
      const parts = episode.title.split(' - ');
      if (parts.length > 0) {
        const podcastPart = parts[0].trim();
        const numbers = podcastPart.match(/\d+/g);
        if (numbers && numbers.length > 0) {
          const num = parseInt(numbers[numbers.length - 1], 10);
          episode.episodeNumber = num;
          feedEpisodeNumbers.add(num);
        }
      }
    });
    
    // Try to fetch all missing episodes for this podcast
    if (basePodcastName) {
      try {
        console.log(`Fetching missing episodes for podcast base name: ${basePodcastName}`);
        
        // Use the current host for the API call instead of hardcoded localhost
        const apiHost = process.env.NODE_ENV === 'production' 
          ? process.env.API_URL || 'https://podcast-api.up.railway.app' 
          : 'http://localhost:3001';
        
        // Fetch all missing episodes for this podcast using the base name
        const missingEpisodesResponse = await fetch(
          `${apiHost}/api/missing-episodes/podcast/all?name=${encodeURIComponent(basePodcastName)}`
        );
        
        if (missingEpisodesResponse.ok) {
          const missingEpisodes = await missingEpisodesResponse.json();
          console.log(`Found ${missingEpisodes.length} missing episodes in database`);
          
          // Filter out episodes that are already in the feed
          const uniqueMissingEpisodes = missingEpisodes.filter(me => 
            !feedEpisodeNumbers.has(me.episodeNumber)
          );
          
          console.log(`After filtering, ${uniqueMissingEpisodes.length} unique missing episodes remain`);
          
          // Convert missing episodes to the same format as feed episodes
          const formattedMissingEpisodes = uniqueMissingEpisodes.map(me => ({
            title: me.title,
            link: me.url,
            enclosure: { url: me.audio_url },
            content: me.description,
            contentSnippet: me.description ? me.description.substring(0, 150) + '...' : '',
            isoDate: me.publish_date,
            pubDate: me.publish_date,
            episodeNumber: me.episodeNumber,
            podcastTitle: feed.title,
            podcastImage: feed.image?.url || feed.itunes?.image,
            imageUrl: me.image_url || feed.image?.url || feed.itunes?.image,
            isMissingEpisode: true // Flag to identify these as missing episodes
          }));
          
          // Combine all episodes
          episodes.push(...formattedMissingEpisodes);
          console.log(`Total episodes after combining: ${episodes.length}`);
        } else {
          console.error('Failed to fetch missing episodes:', await missingEpisodesResponse.text());
        }
      } catch (error) {
        console.error('Error fetching missing episodes:', error);
        // Continue without missing episodes if there's an error
      }
    }
    
    // Sort all episodes by date (newest first)
    episodes.sort((a, b) => {
      // Parse dates, handling different date formats
      const dateA = a.isoDate || a.pubDate;
      const dateB = b.isoDate || b.pubDate;
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return new Date(dateB) - new Date(dateA);
    });
    
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching podcast:', error);
    res.status(500).json({ error: 'Failed to fetch podcast feed' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  console.log(`Podcast API listening on port ${PORT}`);
  console.log(`Server started at: ${new Date().toLocaleString()}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  
  // Add a message to indicate hot reloading is active
  if (process.env.NODE_ENV !== 'production') {
    console.log('Hot reloading is active - changes to files will restart the server');
  }
});

// Add graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed');
      process.exit(0);
    });
  });
});
