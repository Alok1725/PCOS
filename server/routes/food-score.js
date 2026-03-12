import express from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const router = express.Router();

// POST /api/food-score — analyze food image for PCOS friendliness
router.post('/', async (req, res) => {
  try {
    const { imageBase64, mimeType, riskLevel } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'imageBase64 required' });

    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${imageBase64}` },
            },
            {
              type: 'text',
              text: `You are a PCOS nutritionist. Analyze this food image for a patient with PCOS risk level: ${riskLevel || 'unknown'}.

Identify all visible foods. Rate each as PCOS-friendly or problematic. Give an overall PCOS Score 0-100 (100 = perfectly PCOS-friendly, 0 = very bad).

Criteria for good score: low glycemic index, anti-inflammatory, high fiber, lean protein, no/low sugar, no refined carbs.
Criteria for bad score: high sugar, refined carbs (white rice/bread/pasta), fried foods, processed foods, dairy excess.

Respond ONLY with valid JSON (no markdown):
{
  "score": <0-100>,
  "verdict": "<one word: Excellent|Good|Fair|Poor>",
  "foods": ["<food 1>", "<food 2>"],
  "positives": ["<PCOS-friendly item + why>"],
  "negatives": ["<problematic item + why>"],
  "swapTip": "<one specific actionable swap to improve this meal>",
  "message": "<1 encouraging sentence about this meal>"
}

If you cannot identify food in the image, return: { "score": null, "verdict": "Unable to detect food", "foods": [], "positives": [], "negatives": [], "swapTip": "", "message": "Please upload a clear photo of your meal." }`
            }
          ]
        }
      ],
      temperature: 0.3,
      max_tokens: 600,
    });

    const text = completion.choices[0]?.message?.content || '{}';
    let result;
    try {
      result = JSON.parse(text.replace(/```json\n?|\n?```/g, '').trim());
    } catch {
      result = { score: null, verdict: 'Parse error', foods: [], positives: [], negatives: [], swapTip: '', message: 'Could not analyze image. Please try again.' };
    }

    console.log(`[FoodScore] Score: ${result.score} | Foods: ${result.foods?.join(', ')}`);
    res.json(result);
  } catch (e) {
    console.error('[FoodScore] Full error:', e?.error || e?.message || e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
