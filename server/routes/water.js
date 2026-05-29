import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('water_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('log_date', today)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json(data || { glasses: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { glasses } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('water_logs')
      .upsert({ user_id: req.user.id, log_date: today, glasses }, { onConflict: 'user_id,log_date' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
