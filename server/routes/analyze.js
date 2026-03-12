import express from 'express';
import { supabase } from '../utils/db.js';
import { analyzeHealthData } from '../services/geminiService.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, usgReportId, bloodReportId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    if (!usgReportId && !bloodReportId) {
      return res.status(400).json({ error: 'At least one report must be provided' });
    }

    // 1. Fetch User Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return res.status(404).json({ error: 'User profile not found' });
    }

    // 2. Fetch Report Texts
    let usgReportText = null;
    let bloodReportText = null;

    if (usgReportId) {
      const { data: usgData } = await supabase
        .from('reports')
        .select('ocr_extracted_text')
        .eq('id', usgReportId)
        .single();
      usgReportText = usgData?.ocr_extracted_text;
    }

    if (bloodReportId) {
      const { data: bloodData } = await supabase
        .from('reports')
        .select('ocr_extracted_text')
        .eq('id', bloodReportId)
        .single();
      bloodReportText = bloodData?.ocr_extracted_text;
    }

    // 3. Call Gemini API
    const analysisResult = await analyzeHealthData(profile, bloodReportText, usgReportText);

    // 4. Save Assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert([{
        user_id: userId,
        usg_report_id: usgReportId || null,
        blood_report_id: bloodReportId || null,
        risk_level: analysisResult.risk_level,
        risk_score: analysisResult.risk_score,
        ai_summary: analysisResult.ai_summary
      }])
      .select()
      .single();

    if (assessmentError) {
      console.error('Assessment insert error:', assessmentError);
      return res.status(500).json({ error: 'Failed to save assessment' });
    }

    // 5. Save Recommendations
    const recsToInsert = [];
    const categories = ['diet', 'exercise', 'lifestyle', 'medical'];

    categories.forEach(category => {
      if (analysisResult.recommendations && analysisResult.recommendations[category]) {
        analysisResult.recommendations[category].forEach(rec => {
          recsToInsert.push({
            assessment_id: assessment.id,
            category,
            title: rec.title,
            description: rec.description,
            frequency: rec.frequency
          });
        });
      }
    });

    if (recsToInsert.length > 0) {
      const { error: recsError } = await supabase
        .from('recommendations')
        .insert(recsToInsert);
      
      if (recsError) {
         console.error('Recommendation insert error:', recsError);
        // We can swallow this error and still return the assessment, but let's log it
      }
    }
    
    // Updates report with parsed values
    if(bloodReportId && analysisResult.parsed_values) {
       await supabase.from('reports').update({parsed_values: analysisResult.parsed_values}).eq('id', bloodReportId);
    }
    
    // 6. Return Data
    res.status(200).json({
      assessment,
      parsed_values: analysisResult.parsed_values,
      recommendations: analysisResult.recommendations
    });

  } catch (error) {
    console.error('Analyze route error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

export default router;
