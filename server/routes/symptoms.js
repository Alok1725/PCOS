import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get symptom logs (last 30 days)
router.get('/:userId', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { data, error } = await supabase
      .from('symptom_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .gte('log_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('log_date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Log symptoms for today
router.post('/', async (req, res) => {
  try {
    const { userId, symptoms, severity, notes } = req.body;
    const today = new Date().toISOString().split('T')[0];
    // Upsert — update if already logged today
    const { data: existing } = await supabase
      .from('symptom_logs')
      .select('id')
      .eq('user_id', userId)
      .eq('log_date', today)
      .single();
    
    let result;
    if (existing) {
      const { data, error } = await supabase.from('symptom_logs').update({ symptoms, severity, notes }).eq('id', existing.id).select().single();
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase.from('symptom_logs').insert({ user_id: userId, log_date: today, symptoms, severity, notes }).select().single();
      if (error) throw error;
      result = data;
    }
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
