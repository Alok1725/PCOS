import express from 'express';
import { supabase } from '../utils/db.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      throw error;
    }

    res.status(200).json(profile || {});

  } catch (error) {
    console.error('Fetch profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.patch('/:userId', async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;

    // First check if profile row exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    let result;

    if (existing) {
      // Row exists — just UPDATE (no email needed)
      result = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
    } else {
      // Row doesn't exist — need to get email from auth.users for INSERT
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email || '';

      result = await supabase
        .from('profiles')
        .insert({ id: userId, email, ...updates })
        .select()
        .single();
    }

    if (result.error) throw result.error;

    res.status(200).json(result.data);

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
