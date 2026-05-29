import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

const TIMING_HINTS = {
  inositol: { hint: 'Best before breakfast', icon: '🌅' },
  metformin: { hint: 'Take with food to reduce nausea', icon: '🍽️' },
  'vitamin d': { hint: 'Take with a fatty meal for better absorption', icon: '☀️' },
  spearmint: { hint: 'Drink 1-2 cups daily, any time', icon: '🌿' },
  omega: { hint: 'Take with meals to avoid fishy aftertaste', icon: '🐟' },
  zinc: { hint: 'Best taken with food, not on empty stomach', icon: '💊' },
  magnesium: { hint: 'Ideally before bedtime — aids sleep', icon: '🌙' },
  'vitamin b': { hint: 'Take in the morning for energy', icon: '⚡' },
  iron: { hint: 'Take with vitamin C, not with calcium', icon: '🩸' },
  probiotics: { hint: 'Best on an empty stomach, 30 min before meals', icon: '🦠' },
};

function getHint(name) {
  const lower = (name || '').toLowerCase();
  for (const [key, val] of Object.entries(TIMING_HINTS)) {
    if (lower.includes(key)) return val;
  }
  return { hint: 'As prescribed / as needed', icon: '💊' };
}

// GET /api/supplements/:userId — list all supplements + today's log status
router.get('/:userId', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data: supplements, error } = await supabase
      .from('supplements')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: true });
    if (error) throw error;

    const { data: logs } = await supabase
      .from('supplement_logs')
      .select('supplement_id, taken')
      .eq('user_id', req.user.id)
      .eq('log_date', today);

    const logMap = {};
    (logs || []).forEach(l => { logMap[l.supplement_id] = l.taken; });

    const result = (supplements || []).map(s => ({
      ...s,
      takenToday: logMap[s.id] || false,
      hint: getHint(s.name),
    }));

    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// POST /api/supplements — add a supplement
router.post('/', async (req, res) => {
  try {
    const { name, timing, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const { data, error } = await supabase
      .from('supplements')
      .insert({ user_id: req.user.id, name: name.trim(), timing: timing || 'morning', notes: notes || '' })
      .select().single();
    if (error) throw error;
    res.json({ ...data, takenToday: false, hint: getHint(data.name) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PATCH /api/supplements/:id/toggle — toggle taken today
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { taken } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('supplement_logs')
      .upsert(
        { supplement_id: req.params.id, user_id: req.user.id, log_date: today, taken },
        { onConflict: 'supplement_id,log_date' }
      ).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// DELETE /api/supplements/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('supplements').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
