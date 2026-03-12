import express from 'express';
const router = express.Router();

// In-memory cache: query → { videoId, ts }
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

router.get('/', async (req, res) => {
  const exercise = (req.query.q || '').trim();
  if (!exercise) return res.status(400).json({ error: 'Missing query' });

  const searchTerm = `${exercise} exercise tutorial for women beginners`;
  const cacheKey = searchTerm.toLowerCase();

  // Return cached result if fresh
  if (cache.has(cacheKey)) {
    const { videoId, ts } = cache.get(cacheKey);
    if (Date.now() - ts < CACHE_TTL) {
      console.log(`[ExerciseVideo] Cache hit for: ${exercise}`);
      return res.json({ videoId });
    }
  }

  try {
    const encoded = encodeURIComponent(searchTerm);
    const response = await fetch(
      `https://www.youtube.com/results?search_query=${encoded}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      }
    );

    const html = await response.text();

    // YouTube buries initial data JSON in the page — extract all 11-char video IDs
    // The pattern "videoId":"XXXXXXXXXXX" appears for each result
    const matches = [...html.matchAll(/"videoId":"([a-zA-Z0-9_-]{11})"/g)];

    if (!matches.length) {
      console.warn(`[ExerciseVideo] No video IDs found for: ${exercise}`);
      return res.status(404).json({ error: 'No videos found' });
    }

    // Deduplicate and take the first real result (skip ads/shorts sometimes appear first)
    const seen = new Set();
    let videoId = null;
    for (const m of matches) {
      const id = m[1];
      if (!seen.has(id)) {
        seen.add(id);
        videoId = id;
        break;
      }
    }

    console.log(`[ExerciseVideo] Found videoId: ${videoId} for: ${exercise}`);
    cache.set(cacheKey, { videoId, ts: Date.now() });
    res.json({ videoId });

  } catch (err) {
    console.error('[ExerciseVideo] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

export default router;
