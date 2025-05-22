const express = require('express');
const router = express.Router();
const MissingEpisode = require('../models/MissingEpisode');
const fs = require('fs');
const path = require('path');

// Import missing episodes from JSON file
router.post('/import', async (req, res) => {
  try {
    // Try to find the file in various locations
    const possiblePaths = [
      path.join(__dirname, '../../missing-episodes/metadata/episodes_metadata.json'),
      path.join(__dirname, '../../missing-episodes/episodes_metadata.json'),
      path.join(process.cwd(), 'missing-episodes/metadata/episodes_metadata.json'),
      path.join(process.cwd(), 'missing-episodes/episodes_metadata.json')
    ];
    
    let filePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'Episodes metadata file not found in any expected location' });
    }
    
    console.log('Reading episodes from:', filePath);
    const fileData = fs.readFileSync(filePath, 'utf8');
    
    let episodes;
    try {
      episodes = JSON.parse(fileData);
    } catch (jsonError) {
      return res.status(400).json({ 
        error: 'Invalid JSON in episodes file',
        message: jsonError.message
      });
    }
    
    if (!Array.isArray(episodes)) {
      return res.status(400).json({ 
        error: 'Episodes data is not an array',
        dataType: typeof episodes
      });
    }
    
    let importCount = 0;
    let errors = [];
    
    for (const episode of episodes) {
      try {
        // Check if episode already exists in database
        const existingEpisode = await MissingEpisode.findOne({ title: episode.title });
        
        if (!existingEpisode) {
          // Extract episode number from title - using improved logic
          let episodeNumber = null;
          if (episode.title) {
            const parts = episode.title.split(' - ');
            if (parts.length > 0) {
              const podcastPart = parts[0].trim();
              const numbers = podcastPart.match(/\d+/g);
              if (numbers && numbers.length > 0) {
                episodeNumber = parseInt(numbers[numbers.length - 1], 10);
              }
            }
          }
          
          // Extract podcast name - using improved logic
          let podcastName = null;
          if (episode.title) {
            // For titles like "99Vidas 21 - Alex Kidd e seus jogos | 99Vidas Podcast"
            // First split by pipe if it exists
            let mainTitle = episode.title;
            if (mainTitle.includes('|')) {
              mainTitle = mainTitle.split('|')[0].trim();
            }
            
            const parts = mainTitle.split(' - ');
            if (parts.length > 0) {
              const podcastPart = parts[0].trim();
              // Extract the podcast name without the episode number
              podcastName = podcastPart.replace(/\d+$/, '').trim();
              
              // Also store the base podcast name (e.g., "99Vidas")
              const basePodcastName = podcastName.split(' ')[0];
              
              // Create new episode with parsed date
              const newEpisode = new MissingEpisode({
                ...episode,
                publish_date: episode.publish_date ? new Date(episode.publish_date) : null,
                episodeNumber,
                podcastName,
                basePodcastName // Add this new field
              });
              
              await newEpisode.save();
              importCount++;
            }
          }
        }
      } catch (episodeError) {
        errors.push({
          title: episode.title,
          error: episodeError.message
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: `Imported ${importCount} new episodes out of ${episodes.length} total`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error importing episodes:', error);
    res.status(500).json({ error: 'Failed to import episodes', message: error.message });
  }
});

// Get missing episodes for a podcast by name pattern
router.get('/podcast', async (req, res) => {
  try {
    const { name, numbers } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Podcast name parameter is required' });
    }
    
    let query = { podcastName: { $regex: name, $options: 'i' } };
    
    // If specific episode numbers are requested
    if (numbers) {
      const episodeNumbers = numbers.split(',').map(num => parseInt(num.trim(), 10));
      query.episodeNumber = { $in: episodeNumbers };
    }
    
    const episodes = await MissingEpisode.find(query).sort({ episodeNumber: 1 });
    
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching missing episodes:', error);
    res.status(500).json({ error: 'Failed to fetch missing episodes' });
  }
});

// Get all missing episodes for a podcast by name pattern
router.get('/podcast/all', async (req, res) => {
  try {
    const { name } = req.query;
    
    if (!name) {
      return res.status(400).json({ error: 'Podcast name parameter is required' });
    }
    
    console.log(`Searching for missing episodes with podcast name: ${name}`);
    
    // Extract the base name (first word) from the podcast name
    const baseName = name.split(' ')[0].trim();
    console.log(`Base podcast name: ${baseName}`);
    
    // Create a more flexible search query
    const query = { 
      $or: [
        { podcastName: { $regex: name, $options: 'i' } },
        { basePodcastName: { $regex: baseName, $options: 'i' } },
        { title: { $regex: baseName, $options: 'i' } }
      ]
    };
    
    const episodes = await MissingEpisode.find(query).sort({ episodeNumber: 1 });
    
    console.log(`Found ${episodes.length} missing episodes for podcast: ${name}`);
    
    res.json(episodes);
  } catch (error) {
    console.error('Error fetching missing episodes:', error);
    res.status(500).json({ error: 'Failed to fetch missing episodes' });
  }
});

// Debug endpoint to check file paths
router.get('/debug-paths', (req, res) => {
  try {
    const paths = [
      path.join(__dirname, '../../missing-episodes/metadata/episodes_metadata.json'),
      path.join(__dirname, '../../missing-episodes/episodes_metadata.json'),
      path.join(__dirname, '../missing-episodes/metadata/episodes_metadata.json'),
      path.join(__dirname, '../missing-episodes/episodes_metadata.json'),
      path.join(process.cwd(), 'missing-episodes/metadata/episodes_metadata.json'),
      path.join(process.cwd(), 'missing-episodes/episodes_metadata.json')
    ];
    
    const results = paths.map(p => ({
      path: p,
      exists: fs.existsSync(p),
      isDirectory: fs.existsSync(p) ? fs.statSync(p).isDirectory() : false
    }));
    
    res.json({
      currentDirectory: __dirname,
      projectRoot: process.cwd(),
      possiblePaths: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Direct file reading endpoint
router.get('/read-file', (req, res) => {
  try {
    // Try to find the file in various locations
    const possiblePaths = [
      path.join(__dirname, '../../missing-episodes/metadata/episodes_metadata.json'),
      path.join(__dirname, '../../missing-episodes/episodes_metadata.json'),
      path.join(process.cwd(), 'missing-episodes/metadata/episodes_metadata.json'),
      path.join(process.cwd(), 'missing-episodes/episodes_metadata.json')
    ];
    
    let filePath = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }
    
    if (!filePath) {
      return res.status(404).json({ error: 'Episodes metadata file not found in any expected location' });
    }
    
    const fileData = fs.readFileSync(filePath, 'utf8');
    
    // Validate that it's proper JSON before parsing
    try {
      JSON.parse(fileData);
      res.json({ 
        success: true, 
        filePath,
        fileSize: fileData.length,
        preview: fileData.substring(0, 200) + '...'
      });
    } catch (jsonError) {
      res.status(400).json({ 
        error: 'File exists but contains invalid JSON',
        message: jsonError.message,
        filePath,
        preview: fileData.substring(0, 200) + '...'
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update episode numbers for existing records
router.post('/update-episode-numbers', async (req, res) => {
  try {
    const episodes = await MissingEpisode.find({});
    let updatedCount = 0;
    let errors = [];
    
    for (const episode of episodes) {
      try {
        let updated = false;
        
        // Extract episode number using improved logic
        if (episode.title) {
          const parts = episode.title.split(' - ');
          if (parts.length > 0) {
            const podcastPart = parts[0].trim();
            const numbers = podcastPart.match(/\d+/g);
            if (numbers && numbers.length > 0) {
              const newEpisodeNumber = parseInt(numbers[numbers.length - 1], 10);
              
              // Only update if the number is different
              if (episode.episodeNumber !== newEpisodeNumber) {
                episode.episodeNumber = newEpisodeNumber;
                updated = true;
              }
            }
          }
        }
        
        // Extract podcast name using improved logic
        if (episode.title) {
          const parts = episode.title.split(' - ');
          if (parts.length > 0) {
            const podcastPart = parts[0].trim();
            const newPodcastName = podcastPart.replace(/\d+$/, '').trim();
            
            // Only update if the name is different
            if (episode.podcastName !== newPodcastName) {
              episode.podcastName = newPodcastName;
              updated = true;
            }
          }
        }
        
        // Save if changes were made
        if (updated) {
          await episode.save();
          updatedCount++;
        }
      } catch (episodeError) {
        errors.push({
          title: episode.title,
          error: episodeError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} episodes out of ${episodes.length} total`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error updating episode numbers:', error);
    res.status(500).json({ error: 'Failed to update episode numbers', message: error.message });
  }
});

// Debug endpoint to list all missing episodes
router.get('/debug/list-all', async (req, res) => {
  try {
    const episodes = await MissingEpisode.find({}).sort({ podcastName: 1, episodeNumber: 1 });
    
    // Group episodes by podcast name
    const groupedEpisodes = {};
    episodes.forEach(episode => {
      const podcastName = episode.podcastName || 'Unknown';
      if (!groupedEpisodes[podcastName]) {
        groupedEpisodes[podcastName] = [];
      }
      groupedEpisodes[podcastName].push({
        id: episode._id,
        title: episode.title,
        episodeNumber: episode.episodeNumber,
        publish_date: episode.publish_date
      });
    });
    
    res.json({
      totalCount: episodes.length,
      podcasts: Object.keys(groupedEpisodes).length,
      episodes: groupedEpisodes
    });
  } catch (error) {
    console.error('Error listing all episodes:', error);
    res.status(500).json({ error: 'Failed to list episodes' });
  }
});

// Update all episodes with base podcast name
router.post('/update-base-names', async (req, res) => {
  try {
    const episodes = await MissingEpisode.find({});
    let updatedCount = 0;
    let errors = [];
    
    for (const episode of episodes) {
      try {
        let updated = false;
        
        // Extract base podcast name if not set
        if (!episode.basePodcastName && episode.podcastName) {
          const parts = episode.podcastName.split(' ');
          if (parts.length > 0) {
            episode.basePodcastName = parts[0];
            updated = true;
          }
        }
        
        // If no podcast name is set, try to extract it from title
        if (!episode.podcastName && episode.title) {
          // For titles like "99Vidas 21 - Alex Kidd e seus jogos | 99Vidas Podcast"
          let mainTitle = episode.title;
          if (mainTitle.includes('|')) {
            mainTitle = mainTitle.split('|')[0].trim();
          }
          
          const parts = mainTitle.split(' - ');
          if (parts.length > 0) {
            const podcastPart = parts[0].trim();
            // Extract the podcast name without the episode number
            episode.podcastName = podcastPart.replace(/\d+$/, '').trim();
            
            // Also set the base podcast name
            episode.basePodcastName = episode.podcastName.split(' ')[0];
            updated = true;
          }
        }
        
        // Save if changes were made
        if (updated) {
          await episode.save();
          updatedCount++;
        }
      } catch (episodeError) {
        errors.push({
          title: episode.title,
          error: episodeError.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Updated ${updatedCount} episodes out of ${episodes.length} total`,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error updating base names:', error);
    res.status(500).json({ error: 'Failed to update base names', message: error.message });
  }
});

module.exports = router;
