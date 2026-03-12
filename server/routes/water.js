import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get today's water count
router.get('/:userId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .eq('log_date', today)
      .single();
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
    res.json(data || { glasses: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Set water glasses for today
router.post('/', async (req, res) => {
  try {
    const { userId, glasses } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('water_logs')
      .upsert({ user_id: userId, log_date: today, glasses }, { onConflict: 'user_id,log_date' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
