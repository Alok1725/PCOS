import express from 'express';
import { supabase } from '../utils/db.js';

const router = express.Router();

router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: assessments, error } = await supabase
      .from('assessments')
      .select(`
        *,
        usg_report:usg_report_id(file_url, report_type),
        blood_report:blood_report_id(file_url, report_type)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.status(200).json(assessments);

  } catch (error) {
    console.error('Fetch assessments error:', error);
    res.status(500).json({ error: 'Failed to fetch assessments' });
  }
});

router.get('/detail/:assessmentId', async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select(`
        *,
        usg_report:usg_report_id(*),
        blood_report:blood_report_id(*)
      `)
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    const { data: recommendations, error: recError } = await supabase
      .from('recommendations')
      .select('*')
      .eq('assessment_id', assessmentId);

    if (recError) throw recError;

    // Fetch profile for wellness plan personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('age, weight_kg, height_cm')
      .eq('id', assessment.user_id)
      .single();

    res.status(200).json({
      assessment,
      recommendations,
      profile: profile || {}
    });

  } catch (error) {
    console.error('Fetch assessment detail error:', error);
    res.status(500).json({ error: 'Failed to fetch assessment detail' });
  }
});

export default router;
