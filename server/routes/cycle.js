import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cycle_logs')
      .select('*')
      .eq('user_id', req.user.id)
      .order('start_date', { ascending: false })
      .limit(24);
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', async (req, res) => {
  try {
    const { startDate, endDate, flowIntensity, notes } = req.body;
    const { data, error } = await supabase
      .from('cycle_logs')
      .insert({ user_id: req.user.id, start_date: startDate, end_date: endDate, flow_intensity: flowIntensity || 'medium', notes })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const { endDate, flowIntensity, notes } = req.body;
    const updates = {};
    if (endDate !== undefined) updates.end_date = endDate;
    if (flowIntensity) updates.flow_intensity = flowIntensity;
    if (notes !== undefined) updates.notes = notes;
    const { data, error } = await supabase.from('cycle_logs').update(updates).eq('id', req.params.id).eq('user_id', req.user.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('cycle_logs').delete().eq('id', req.params.id).eq('user_id', req.user.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
