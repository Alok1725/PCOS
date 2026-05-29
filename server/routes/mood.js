import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data, error } = await supabase
      .from('mood_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { mood, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase.from('mood_logs').select('id').eq('user_id', req.user.id).eq('log_date', today).single();
    let result;
    if (existing) {
      const { data, error } = await supabase.from('mood_logs').update({ mood, notes }).eq('id', existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from('mood_logs').insert({ user_id: req.user.id, log_date: today, mood, notes }).select().single();
      if (error) throw error;
      result = data;
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
