import express from 'express';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { riskLevel, riskScore, parsedValues, aiSummary, profile, dietaryPreference } = req.body;

    // Dietary preference rules to inject into the AI prompt
    const dietaryRule = dietaryPreference === 'nonveg'
      ? 'DIETARY RESTRICTION: Meals MAY include lean meats (chicken, fish, eggs). Avoid red meat and pork. Prefer grilled or baked over fried. Still include plenty of vegetables and whole grains.'
      : 'DIETARY RESTRICTION: ALL meals MUST be 100% vegetarian. NO meat, poultry, fish, seafood, or eggs of any kind. Use paneer, tofu, lentils, dal, legumes, dairy, nuts, seeds, and plant-based proteins exclusively.';

    console.log('[Wellness] Generating personalized plan for risk_level:', riskLevel);

    // Build patient context from actual data
    let bmi = 'N/A';
    if (profile?.weight_kg && profile?.height_cm) {
      const hm = profile.height_cm / 100;
      bmi = (profile.weight_kg / (hm * hm)).toFixed(1);
    }

    const prompt = `You are a women's health nutritionist and fitness coach specialized in PCOS management.

PATIENT DATA:
- Age: ${profile?.age || 'Unknown'}
- Weight: ${profile?.weight_kg || 'Unknown'} kg, Height: ${profile?.height_cm || 'Unknown'} cm, BMI: ${bmi}
- PCOS Risk Level: ${riskLevel} (Score: ${riskScore}/100)
- AI Assessment Summary: ${aiSummary || 'N/A'}

HORMONE LEVELS:
- LH: ${parsedValues?.lh ?? 'N/A'} mIU/mL
- FSH: ${parsedValues?.fsh ?? 'N/A'} mIU/mL
- LH/FSH Ratio: ${parsedValues?.lh_fsh_ratio ?? 'N/A'}
- AMH: ${parsedValues?.amh ?? 'N/A'} ng/mL
- Testosterone: ${parsedValues?.testosterone ?? 'N/A'} ng/mL
- Fasting Insulin: ${parsedValues?.fasting_insulin ?? 'N/A'} µIU/mL

CLINICAL CONTEXT:
${parsedValues?.fasting_insulin > 15 ? '- Patient has INSULIN RESISTANCE — diet must be low glycemic index, avoid sugar spikes' : ''}
${parsedValues?.testosterone > 0.6 ? '- Patient has HYPERANDROGENISM (high testosterone) — include anti-androgen foods like spearmint tea, flaxseeds' : ''}
${parsedValues?.lh > (parsedValues?.fsh * 2) ? '- LH/FSH ratio is elevated — include foods that support FSH production' : ''}
${parseFloat(bmi) > 25 ? `- Patient BMI is ${bmi} (overweight) — calorie-conscious portions, weight management focus` : ''}
${parseFloat(bmi) > 30 ? `- Patient BMI is ${bmi} (obese) — prioritize weight loss-focused plans` : ''}

Generate a PERSONALIZED 7-day diet plan and exercise routine based on the above data. Respond ONLY with this JSON:
{
  "diet": {
    "label": "<name of the diet type based on their condition>",
    "tagline": "<one line explaining why this diet is chosen for THIS patient>",
    "tips": "<3-4 specific dietary tips based on their hormone levels>",
    "meals": [
      {
        "day": "Monday",
        "breakfast": "<specific meal>",
        "snack1": "<morning snack>",
        "lunch": "<specific meal>",
        "snack2": "<evening snack>",
        "dinner": "<specific meal>"
      }
    ]
  },
  "exercise": {
    "label": "<name of exercise plan>",
    "tagline": "<why this plan suits THIS patient>",
    "tips": "<exercise-specific tips based on their condition>",
    "sections": [
      {
        "category": "<category name with emoji, e.g. '🏃‍♀️ Cardio (4x/week)'>",
        "exercises": [
          { "name": "<exercise name>", "detail": "<sets x reps or duration>", "intensity": "Low|Moderate|High" }
        ]
      }
    ]
  }
}

RULES:
- ${dietaryRule}
- Meals MUST be 7 days (Mon-Sun). Include ALL 5 meal slots per day.
- Exercise sections: include Cardio, Strength, and Yoga/Flexibility.
- If insulin resistant: focus on LOW GI foods, no white rice/bread/sugar.
- If high testosterone: include spearmint tea, flaxseeds, green tea, soy.
- If overweight/obese: include portion control, calorie-deficit meals.
- If underweight: include calorie-dense nutritious meals.
- If PCOS positive: anti-inflammatory focus (turmeric, omega-3, berries).
- If at_risk: prevention-focused, balanced hormonal support.
- If none: general wellness maintenance.
- Be specific with food names and quantities where helpful.
- Include Indian and international meal options.
- Respond ONLY with valid JSON, no markdown.`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a certified nutritionist and fitness trainer specializing in PCOS. Respond ONLY with valid JSON. No markdown, no code fences.'
        },
        { role: 'user', content: prompt }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 4096,
      response_format: { type: 'json_object' }
    });

    const text = chatCompletion.choices[0]?.message?.content || '';
    console.log('[Wellness] AI response length:', text.length);

    const plan = JSON.parse(text);
    console.log('[Wellness] Plan generated — diet days:', plan.diet?.meals?.length, ', exercise sections:', plan.exercise?.sections?.length);

    res.status(200).json(plan);

  } catch (error) {
    console.error('[Wellness] Error:', error.message);
    res.status(500).json({ error: `Failed to generate wellness plan: ${error.message}` });
  }
});

export default router;
