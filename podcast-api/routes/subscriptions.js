const express = require('express');
const Subscription = require('../models/Subscription');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all subscriptions for the current user
router.get('/', auth, async (req, res) => {
  try {
    const subscriptions = await Subscription.find({ userId: req.userId });
    res.json(subscriptions);
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({ error: 'Failed to fetch subscriptions' });
  }
});

// Subscribe to a podcast
router.post('/', auth, async (req, res) => {
  try {
    const { url, title, description, imageUrl, author } = req.body;
    
    if (!url || !title) {
      return res.status(400).json({ error: 'URL and title are required' });
    }
    
    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({ 
      userId: req.userId, 
      url 
    });
    
    if (existingSubscription) {
      return res.status(409).json({ error: 'Already subscribed to this feed' });
    }
    
    // Create new subscription
    const subscription = new Subscription({
      userId: req.userId,
      url,
      title,
      description,
      imageUrl,
      author,
      addedAt: new Date()
    });
    
    await subscription.save();
    
    res.status(201).json(subscription);
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to subscribe to podcast' });
  }
});

// Delete a subscription
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find and delete subscription
    const subscription = await Subscription.findOneAndDelete({
      _id: id,
      userId: req.userId
    });
    
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }
    
    res.status(204).end();
  } catch (error) {
    console.error('Error deleting subscription:', error);
    res.status(500).json({ error: 'Failed to delete subscription' });
  }
});

module.exports = router;