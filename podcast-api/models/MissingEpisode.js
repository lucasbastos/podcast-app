const mongoose = require('mongoose');

const missingEpisodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
  },
  audio_url: {
    type: String,
    required: true
  },
  image_url: String,
  description: String,
  filename: String,
  publish_date: Date,
  episodeNumber: Number,
  podcastName: String,
  basePodcastName: String // Add this new field
});

// Extract episode number from title if possible
missingEpisodeSchema.pre('save', function(next) {
  if (!this.episodeNumber && this.title) {
    // Extract the podcast name and episode number from titles like "99Vidas 31 - Episode Title"
    const parts = this.title.split(' - ');
    if (parts.length > 0) {
      const podcastPart = parts[0].trim();
      // Find the last number in the podcast part (which is typically the episode number)
      const numbers = podcastPart.match(/\d+/g);
      if (numbers && numbers.length > 0) {
        // Use the last number found as the episode number
        this.episodeNumber = parseInt(numbers[numbers.length - 1], 10);
      }
    }
  }
  
  // Extract base podcast name if not set
  if (!this.basePodcastName && this.podcastName) {
    const parts = this.podcastName.split(' ');
    if (parts.length > 0) {
      this.basePodcastName = parts[0];
    }
  }
  
  next();
});

module.exports = mongoose.model('MissingEpisode', missingEpisodeSchema);
