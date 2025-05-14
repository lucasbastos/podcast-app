require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const Parser = require('rss-parser');

// Import routes
const authRoutes = require('./routes/auth');
const subscriptionRoutes = require('./routes/subscriptions');

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

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);

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
      // Note: itunesImage is already included from the parser customFields
    }));
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch podcast episodes' });
  }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Podcast API listening on port ${PORT}`);
});
