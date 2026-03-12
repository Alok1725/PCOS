import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get cycle logs for a user
router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', req.params.userId)
      .order('start_date', { ascending: false })
      .limit(24);
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Add a cycle log
router.post('/', async (req, res) => {
  try {
    const { userId, startDate, endDate, flowIntensity, notes } = req.body;
    const { data, error } = await supabase
      .from('cycle_logs')
      .insert({ user_id: userId, start_date: startDate, end_date: endDate, flow_intensity: flowIntensity || 'medium', notes })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Update a cycle log (e.g., set end_date)
router.patch('/:id', async (req, res) => {
  try {
    const { endDate, flowIntensity, notes } = req.body;
    const updates = {};
    if (endDate !== undefined) updates.end_date = endDate;
    if (flowIntensity) updates.flow_intensity = flowIntensity;
    if (notes !== undefined) updates.notes = notes;
    const { data, error } = await supabase.from('cycle_logs').update(updates).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Delete
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('cycle_logs').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
