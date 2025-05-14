const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  url: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  author: String,
  description: String,
  imageUrl: String,
  addedAt: {
    type: Date,
    default: Date.now
  }
});

// Compound index to ensure a user can't subscribe to the same podcast twice
subscriptionSchema.index({ userId: 1, url: 1 }, { unique: true });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription;