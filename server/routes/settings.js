import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get user settings
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', req.params.userId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings yet, return defaults
      return res.json({ remind_symptoms: true, remind_water: true, remind_mood: true, reminder_time: '09:00', email_digest: false });
    }
    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Save/update user settings
router.put('/:userId', async (req, res) => {
  try {
    const { remind_symptoms, remind_water, remind_mood, reminder_time, email_digest } = req.body;

    const { data, error } = await supabase
      .from('user_settings')
      .upsert({
        user_id: req.params.userId,
        remind_symptoms,
        remind_water,
        remind_mood,
        reminder_time,
        email_digest,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete user account data
router.delete('/:userId', async (req, res) => {
  try {
    // Delete all user data across tables
    const tables = ['symptom_logs', 'water_logs', 'mood_logs', 'cycle_logs', 'community_posts', 'chat_history', 'user_settings', 'assessments', 'profiles'];
    for (const table of tables) {
      await supabase.from(table).delete().eq('user_id', req.params.userId);
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
