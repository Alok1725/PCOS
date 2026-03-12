import express from 'express';
import { supabase } from '../utils/db.js';
const router = express.Router();

// Get reviews (optionally filter by specialty/location)
router.get('/', async (req, res) => {
  try {
    const { specialty, location } = req.query;
    let query = supabase.from('doctor_reviews').select('*').order('created_at', { ascending: false }).limit(50);
    if (specialty) query = query.ilike('specialty', `%${specialty}%`);
    if (location) query = query.ilike('location', `%${location}%`);
    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Post a review
router.post('/', async (req, res) => {
  try {
    const { userId, doctorName, specialty, location, rating, reviewText, visitDate } = req.body;
    const { data, error } = await supabase
      .from('doctor_reviews')
      .insert({ user_id: userId, doctor_name: doctorName, specialty, location, rating, review_text: reviewText, visit_date: visitDate })
      .select()
      .single();
    if (error) throw error;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
