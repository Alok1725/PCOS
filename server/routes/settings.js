import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', req.user.id)
      .single();

    if (error && error.code === 'PGRST116') {
      return res.json({ remind_symptoms: true, remind_water: true, remind_mood: true, reminder_time: '09:00', email_digest: false });
    }
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:userId', async (req, res) => {
  try {
    const { remind_symptoms, remind_water, remind_mood, reminder_time, email_digest } = req.body;
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: req.user.id,
        remind_symptoms, remind_water, remind_mood, reminder_time, email_digest,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:userId', async (req, res) => {
  try {
    const tables = ['symptom_logs', 'water_logs', 'mood_logs', 'cycle_logs', 'community_posts', 'chat_history', 'user_settings', 'assessments', 'profiles'];
    for (const table of tables) {
      await supabase.from(table).delete().eq('user_id', req.user.id);
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
