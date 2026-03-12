import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Global search across assessments, community posts, profile
router.get('/', async (req, res) => {
  try {
    const { q, userId } = req.query;
    if (!q || q.trim().length < 2) return res.json({ results: [] });

    const query = q.trim().toLowerCase();
    const results = [];

    // Search community posts
    const { data: posts } = await supabase
      .from('community_posts')
      .select('id, content, display_name, tags, created_at')
      .ilike('content', `%${query}%`)
      .limit(5);

    if (posts?.length) {
      posts.forEach(p => results.push({
        type: 'community',
        title: `${p.display_name || 'Anonymous'}: ${p.content.substring(0, 80)}...`,
        link: '/community',
        date: p.created_at,
      }));
    }

    // Search user's assessments
    if (userId) {
      const { data: assessments } = await supabase
        .from('assessments')
        .select('id, risk_level, risk_score, ai_summary, created_at')
        .eq('user_id', userId)
        .or(`ai_summary.ilike.%${query}%,risk_level.ilike.%${query}%`)
        .limit(5);

      if (assessments?.length) {
        assessments.forEach(a => results.push({
          type: 'assessment',
          title: `Assessment — ${a.risk_level} (Score: ${a.risk_score})`,
          subtitle: a.ai_summary?.substring(0, 100),
          link: `/results/${a.id}`,
          date: a.created_at,
        }));
      }
    }

    res.json({ results });
  } catch (e) {
    console.error('[Search] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
