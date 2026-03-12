import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get unread + recent notifications
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { data, error } = await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Mark all as read
router.patch('/read-all/:userId', async (req, res) => {
  try {
    const { error } = await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.params.userId).eq('is_read', false);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Create notification (internal use)
router.post('/', async (req, res) => {
  try {
    const { userId, title, message, type } = req.body;
    const { data, error } = await supabase.from('notifications').insert({ user_id: userId, title, message, type: type || 'info' }).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
