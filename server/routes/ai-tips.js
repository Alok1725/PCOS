import express from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../utils/db.js';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const router = express.Router();

// Generate AI tips based on user's PCOS status
router.post('/tips', async (req, res) => {
  try {
    const { riskLevel, symptoms, category } = req.body;

    const prompt = `You are a women's health expert specializing in PCOS management.

Patient context:
- PCOS Risk Level: ${riskLevel || 'unknown'}
- Current symptoms: ${symptoms?.join(', ') || 'none specified'}
- Category requested: ${category || 'general'}

Generate 5 unique, practical, and specific health tips for this patient. Each tip should be actionable and different from generic advice. Include a mix of:
- Dietary tips (specific foods, recipes, timing)
- Lifestyle hacks (sleep, stress, skincare)
- Exercise suggestions
- Mental health tips
- Hormone-balancing natural remedies

Respond ONLY with a JSON array:
[
  { "title": "<short catchy title>", "tip": "<2-3 sentence detailed actionable tip>", "emoji": "<relevant emoji>", "category": "diet|exercise|lifestyle|mental_health|remedy" }
]

Rules:
- Be specific (e.g., "Drink spearmint tea twice daily" not "Drink herbal tea")
- Include scientific reasoning briefly where helpful
- Make tips interesting and varied, not just platitudes
- For PCOS positive: focus on insulin resistance, inflammation
- For at_risk: focus on prevention  
- For none: focus on general wellness
- JSON only, no markdown`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON array. No markdown.' },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.8,
      max_tokens: 1500,
      response_format: { type: 'json_object' }
    });

    const text = completion.choices[0]?.message?.content || '[]';
    let tips;
    try {
      const parsed = JSON.parse(text);
      tips = Array.isArray(parsed) ? parsed : parsed.tips || parsed.data || [];
    } catch { tips = []; }

    res.json({ tips });
  } catch (e) {
    console.error('[AI Tips] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Generate AI motivational quote
router.post('/quote', async (req, res) => {
  try {
    const { riskLevel, userName } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
        { role: 'user', content: `Generate 1 unique motivational wellness quote for a woman ${riskLevel === 'pcos_positive' ? 'managing PCOS' : riskLevel === 'at_risk' ? 'focused on health prevention' : 'maintaining wellness'}. ${userName ? `Her name is ${userName}.` : ''}

Respond with JSON: { "quote": "<inspiring quote>", "author": "<attribution or 'CycleSync AI'>" }

Make it empowering, specific to women's health, and different from generic motivational quotes. It can be a real quote or AI-generated.` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.9,
      max_tokens: 200,
      response_format: { type: 'json_object' }
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.json(parsed);
  } catch (e) {
    console.error('[AI Quote] Error:', e.message);
    res.json({ quote: "Your body is your most precious gift. Honor it, nourish it, listen to it.", author: "CycleSync AI" });
  }
});

// AI-powered FAQ answers
router.post('/faq', async (req, res) => {
  try {
    const { question, riskLevel } = req.body;
    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are a knowledgeable women\'s health advisor. Give clear, empathetic, evidence-based answers. Keep response under 200 words. Do not diagnose.' },
        { role: 'user', content: `Patient PCOS risk level: ${riskLevel || 'unknown'}. Question: ${question}` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 500
    });
    res.json({ answer: completion.choices[0]?.message?.content || 'Unable to generate answer.' });
  } catch (e) {
    console.error('[AI FAQ] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══ AI Weekly Health Digest ═══
router.post('/weekly-digest', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

    const [symptoms, water, mood, cycle] = await Promise.all([
      supabase.from('symptom_logs').select('*').eq('user_id', userId).gte('logged_date', weekAgo),
      supabase.from('water_logs').select('*').eq('user_id', userId).gte('logged_date', weekAgo),
      supabase.from('mood_logs').select('*').eq('user_id', userId).gte('logged_date', weekAgo),
      supabase.from('cycle_logs').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(3),
    ]);

    const trackingData = {
      symptomDays: symptoms.data?.length || 0,
      symptoms: symptoms.data?.flatMap(s => s.symptoms || []) || [],
      waterAvg: water.data?.length ? Math.round(water.data.reduce((a, w) => a + (w.glasses || 0), 0) / water.data.length) : 0,
      moodDays: mood.data?.length || 0,
      moods: mood.data?.map(m => m.mood) || [],
      hasCycleData: (cycle.data?.length || 0) > 0,
    };

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
        { role: 'user', content: `Generate a warm, encouraging weekly health digest for a PCOS patient based on this tracking data:

${JSON.stringify(trackingData)}

Respond with JSON:
{
  "summary": "<2-3 sentence overview of their week>",
  "highlights": ["<positive observation 1>", "<positive observation 2>"],
  "improvements": ["<gentle suggestion 1>"],
  "encouragement": "<single motivational sentence>",
  "trackingScore": <1-10 rating of how well they tracked this week>
}

Be warm, supportive. Celebrate wins. If data is sparse, encourage more tracking gently.` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 600,
      response_format: { type: 'json_object' }
    });

    const digest = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.json(digest);
  } catch (e) {
    console.error('[AI Digest] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══ AI Symptom Pattern Analysis ═══
router.post('/symptom-patterns', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];

    const [symptoms, cycle] = await Promise.all([
      supabase.from('symptom_logs').select('*').eq('user_id', userId).gte('logged_date', monthAgo).order('logged_date'),
      supabase.from('cycle_logs').select('*').eq('user_id', userId).order('start_date', { ascending: false }).limit(6),
    ]);

    if (!symptoms.data?.length) {
      return res.json({ patterns: [], summary: 'Not enough symptom data yet. Log your symptoms daily for AI pattern detection!', trend: 'insufficient_data' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
        { role: 'user', content: `Analyze these PCOS symptom logs for patterns and correlations:

Symptoms (30 days): ${JSON.stringify(symptoms.data?.map(s => ({ date: s.logged_date, symptoms: s.symptoms })))}
Cycle data: ${JSON.stringify(cycle.data?.map(c => ({ start: c.start_date, end: c.end_date })))}

Respond with JSON:
{
  "patterns": [
    { "title": "<pattern name>", "description": "<what you noticed, 1-2 sentences>", "emoji": "<emoji>", "severity": "info|warning|positive" }
  ],
  "summary": "<2-3 sentence overall analysis>",
  "mostCommon": "<most frequent symptom>",
  "trend": "improving|stable|worsening|insufficient_data"
}

Look for: symptom clusters, cyclical patterns around periods, frequency changes over time. Be specific and actionable.` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 800,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.json(result);
  } catch (e) {
    console.error('[AI Patterns] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══ AI Smart Diet Swap ═══
router.post('/diet-swap', async (req, res) => {
  try {
    const { currentMeal, mealType, riskLevel } = req.body;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
        { role: 'user', content: `Suggest a PCOS-friendly alternative for this meal:

Current: ${currentMeal || 'general meal'}
Meal type: ${mealType || 'any'}
PCOS risk: ${riskLevel || 'unknown'}

Respond with JSON:
{
  "original": "${currentMeal}",
  "alternative": "<PCOS-friendly alternative>",
  "reason": "<why this swap helps PCOS, 1 sentence>",
  "calories": "<approximate calories>",
  "benefits": ["<benefit 1>", "<benefit 2>"]
}

Focus on anti-inflammatory, low-glycemic options.` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.json(result);
  } catch (e) {
    console.error('[AI Diet] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══ AI Risk Trend Analysis ═══
router.post('/risk-trend', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'userId required' });

    const { data: assessments } = await supabase
      .from('assessments')
      .select('risk_score, risk_level, created_at, ai_summary')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (!assessments?.length || assessments.length < 2) {
      return res.json({ analysis: null, message: 'Need at least 2 assessments for trend analysis.' });
    }

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
        { role: 'user', content: `Analyze this PCOS assessment trend over time:

${JSON.stringify(assessments.map(a => ({ date: a.created_at?.split('T')[0], score: a.risk_score, level: a.risk_level })))}

Respond with JSON:
{
  "trend": "improving|stable|worsening",
  "scoreChange": <number, positive = improvement>,
  "summary": "<2-3 sentence encouraging analysis>",
  "celebration": "<short celebratory message if improving, encouraging message otherwise>",
  "tips": ["<1 actionable tip based on trend>"]
}

Be encouraging and supportive regardless of trend. Focus on progress.` }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 400,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.json({ analysis: result, assessmentCount: assessments.length });
  } catch (e) {
    console.error('[AI Trend] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ═══ AI Doctor Appointment Prep ═══
router.post('/doctor-prep', async (req, res) => {
  try {
    const { riskLevel, parsedValues, aiSummary } = req.body;

    const hormonesText = parsedValues
      ? Object.entries(parsedValues)
          .filter(([, v]) => v !== null && v !== undefined)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'Not available';

    const completion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'Respond only with valid JSON. No markdown.' },
        {
          role: 'user',
          content: `You are a women's health advocate helping a PCOS patient prepare for her doctor appointment.

Patient data:
- PCOS Risk Level: ${riskLevel || 'unknown'}
- Hormone Values: ${hormonesText}
- AI Assessment Summary: ${aiSummary || 'Not available'}

Generate 6-8 specific, insightful questions this patient should ask her gynecologist or endocrinologist. Each question must be directly based on her actual lab values or risk level — not generic advice.

Respond ONLY with JSON:
{
  "questions": [
    {
      "category": "<Hormones|Insulin|Fertility|Lifestyle|Medication|Follow-up>",
      "question": "<specific, direct question to ask the doctor>",
      "why": "<1 sentence: why this question matters for her specific data>"
    }
  ],
  "appointmentTip": "<1 practical tip for the appointment itself>"
}

Rules:
- Reference her actual values (e.g., "My LH is 8.2 — is this contributing to my irregular cycles?")
- Mix categories: don't just ask about one topic
- Be assertive but respectful in tone
- Include at least one question about next steps / follow-up tests
- JSON only, no markdown`
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1200,
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    res.json(result);
  } catch (e) {
    console.error('[Doctor Prep] Error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

export default router;
