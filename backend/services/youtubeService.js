const axios = require('axios');
require('dotenv').config();


// Search YouTube for relevant tutorial videos based on improvements
exports.searchVideos = async (improvements, labContext = '') => {
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  
  if (!YOUTUBE_API_KEY) {
    console.warn('⚠️ YouTube API key not configured - videos will not be fetched');
    return [];
  }

  if (!improvements || improvements.length === 0) {
    console.warn('⚠️ No improvements provided - cannot search for videos');
    return [];
  }

  // Always fetch minimum 1-2 videos based on improvements
  const maxVideos = 2;
  const videosPerImprovement = 1;

  console.log(`🔍 [YouTube] Searching for videos based on ${improvements.length} improvements (Context: ${labContext})...`);

  try {
    const videos = [];
    const seenVideoIds = new Set(); // Avoid duplicates
    
    // Search for videos based on improvements (limit to first 2)
    const improvementsToSearch = improvements.slice(0, 2);
    
    for (const improvement of improvementsToSearch) {
      if (videos.length >= maxVideos) break;
      
      try {
        // Extract key terms from improvement text and add context
        const query = extractSearchQuery(improvement, labContext);
        console.log(`🔍 [YouTube] Searching for: "${query}"`);
        
        const response = await axios.get(
          `https://www.googleapis.com/youtube/v3/search`,
          {
            params: {
              part: 'snippet',
              maxResults: videosPerImprovement,
              q: query,
              key: YOUTUBE_API_KEY,
              type: 'video',
              order: 'relevance',
              safeSearch: 'moderate'
            }
          }
        );

        if (response.data.items && response.data.items.length > 0) {
          console.log(`✅ [YouTube] Found ${response.data.items.length} results for "${query}"`);
          
          for (const item of response.data.items) {
            if (seenVideoIds.has(item.id.videoId) || videos.length >= maxVideos) {
              continue;
            }
            
            seenVideoIds.add(item.id.videoId);
            
            let duration = null;
            try {
              const videoDetails = await axios.get(
                `https://www.googleapis.com/youtube/v3/videos`,
                {
                  params: {
                    part: 'contentDetails',
                    id: item.id.videoId,
                    key: YOUTUBE_API_KEY
                  }
                }
              );
              if (videoDetails.data.items && videoDetails.data.items[0]) {
                duration = parseDuration(videoDetails.data.items[0].contentDetails.duration);
              }
            } catch (e) {
              console.log(`⚠️ [YouTube] Could not fetch duration for video ${item.id.videoId}`);
            }
            
            const videoData = {
              videoId: item.id.videoId,
              title: item.snippet.title,
              thumbnail: item.snippet.thumbnails?.medium?.url || item.snippet.thumbnails?.default?.url || item.snippet.thumbnails?.high?.url,
              channelTitle: item.snippet.channelTitle,
              url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
              description: item.snippet.description?.substring(0, 150) || '',
              duration: duration,
              relatedTo: improvement
            };
            
            videos.push(videoData);
            console.log(`✅ [YouTube] Added video: ${videoData.title}`);
            
            if (videos.length >= maxVideos) break;
          }
        } else {
          console.warn(`⚠️ [YouTube] No results found for query: "${query}"`);
        }
      } catch (error) {
        console.error(`❌ [YouTube] Error searching for "${improvement}":`, error.response?.data || error.message);
      }
    }

    return videos;
  } catch (error) {
    console.error('YouTube API error:', error.message);
    return [];
  }
};

// Parse YouTube duration (PT1H2M10S format) to readable format
function parseDuration(duration) {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return null;
  
  const hours = parseInt(match[1] || 0);
  const minutes = parseInt(match[2] || 0);
  const seconds = parseInt(match[3] || 0);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Extract search query from improvement text
function extractSearchQuery(improvement, labContext = '') {
  // Clean up improvement by removing meta-feedback and common prefixes
  let cleaned = improvement
    .replace(/^(Review|Understanding|Consider|Focus on|Don't forget|Try|Learn about|It seems you got stuck early on)\s+/i, '')
    .replace(/Try reviewing the lab scenario again/i, '')
    .replace(/\.$/, '')
    .trim();
    
  // If the improvement is very generic, purely rely on the labContext
  const isGeneric = !cleaned || 
                    cleaned.toLowerCase().includes('scenario again') || 
                    cleaned.toLowerCase().includes('prerequisites first') ||
                    cleaned.length < 5;
                    
  let query = '';
  if (isGeneric && labContext) {
    query = `${labContext} tutorial`;
  } else if (labContext) {
      // If we have a technical detail, combine it with context
      // but avoid doubling up if context is already in the cleaning
      if (cleaned.toLowerCase().includes(labContext.toLowerCase())) {
          query = cleaned;
      } else {
          query = `${labContext} ${cleaned}`;
      }
  } else {
    query = cleaned;
  }
  
  // Clean up whitespace
  query = query.trim();
  
  // Ensure AWS is in there
  if (!query.toLowerCase().includes('aws')) {
    query = 'AWS ' + query;
  }
  
  // Cap length to avoid API issues and keep it focused
  return query.substring(0, 100);
}

