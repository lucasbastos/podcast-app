const express = require('express');
const cors = require('cors');
const Parser = require('rss-parser');

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

app.use(cors());
app.use(express.json());

// In-memory storage for subscribed feeds
const subscriptions = [];

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
      podcastImage: feed.image?.url || feed.itunes?.image
    }));
    
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching episodes:', error);
    res.status(500).json({ error: 'Failed to fetch podcast episodes' });
  }
});

// Subscribe to a podcast feed
app.post('/api/subscriptions', (req, res) => {
  const { url, title, description, imageUrl, author } = req.body;
  
  if (!url || !title) {
    return res.status(400).json({ error: 'URL and title are required' });
  }
  
  // Check if already subscribed
  const existingSubscription = subscriptions.find(sub => sub.url === url);
  if (existingSubscription) {
    return res.status(409).json({ error: 'Already subscribed to this feed' });
  }
  
  // Add to subscriptions
  const newSubscription = { 
    id: Date.now().toString(),
    url, 
    title,
    author,
    description,
    imageUrl,
    addedAt: new Date()
  };
  
  subscriptions.push(newSubscription);
  res.status(201).json(newSubscription);
});

// Get all subscriptions
app.get('/api/subscriptions', (req, res) => {
  res.json(subscriptions);
});

// Delete a subscription
app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const index = subscriptions.findIndex(sub => sub.id === id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Subscription not found' });
  }
  
  subscriptions.splice(index, 1);
  res.status(204).end();
});

app.listen(3001, () => {
  console.log('Podcast API listening on port 3001');
});