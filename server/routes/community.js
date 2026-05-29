import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get all community posts (paginated)
router.get('/', async (req, res) => {
  try {
    const { tag, page = 1 } = req.query;
    const limit = 20;
    const offset = (page - 1) * limit;
    let query = supabase.from('community_posts').select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (tag) query = query.contains('tags', [tag]);
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ posts: data, total: count });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { displayName, content, tags } = req.body;
    const { data, error } = await supabase
      .from('community_posts')
      .insert({ user_id: req.user.id, display_name: displayName || 'Anonymous Warrior', content, tags: tags || [] })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id/like', async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: post } = await supabase.from('community_posts').select('likes, liked_by').eq('id', req.params.id).single();
    const likedBy = post?.liked_by || [];
    const alreadyLiked = likedBy.includes(userId);
    const newLikedBy = alreadyLiked ? likedBy.filter(id => id !== userId) : [...likedBy, userId];
    const newLikes = newLikedBy.length;
    const { data, error } = await supabase.from('community_posts').update({ likes: newLikes, liked_by: newLikedBy }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('community_posts').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
