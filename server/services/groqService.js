import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export const analyzeHealthData = async (profile, bloodReportText, usgReportText) => {
  // Calculate BMI
  let bmi = 'N/A';
  if (profile.weight_kg && profile.height_cm) {
    const heightM = profile.height_cm / 100;
    bmi = (profile.weight_kg / (heightM * heightM)).toFixed(1);
  }

  const prompt = `
You are a specialized medical AI assistant for PCOS screening. Analyze the following patient data and provide a structured assessment. This is a screening tool only, not a diagnostic tool.

PATIENT PROFILE:
- Age: ${profile.age || 'Not provided'}
- Weight: ${profile.weight_kg || 'Not provided'} kg, Height: ${profile.height_cm || 'Not provided'} cm (BMI: ${bmi})
- Cycle regularity: ${profile.cycle_regularity || 'Not provided'}
- Reported symptoms: ${profile.symptoms ? profile.symptoms.join(', ') : 'None reported'}
- Last period: ${profile.last_period_date || 'Not provided'}

BLOOD TEST REPORT (OCR extracted):
${bloodReportText || 'Not provided'}

ULTRASOUND REPORT (OCR extracted):
${usgReportText || 'Not provided'}

IMPORTANT CLINICAL REFERENCE RANGES:
- LH/FSH ratio > 2 suggests PCOS
- AMH > 4.7 ng/mL suggests PCOS
- Testosterone > 0.6 ng/mL (female) suggests hyperandrogenism
- Fasting Insulin > 15 µIU/mL suggests insulin resistance

Based on all above data, respond ONLY with a valid JSON object in this exact format:
{
  "risk_level": "none" | "at_risk" | "pcos_positive",
  "risk_score": <number 0-100>,
  "parsed_values": {
    "lh": <number or null>,
    "fsh": <number or null>,
    "lh_fsh_ratio": <number or null>,
    "amh": <number or null>,
    "testosterone": <number or null>,
    "fasting_insulin": <number or null>,
    "blood_glucose": <number or null>
  },
  "usg_findings": "<string summarizing USG findings or 'Not provided'>",
  "ai_summary": "<2-3 sentence plain English summary of findings>",
  "recommendations": {
    "diet": [
      { "title": "", "description": "", "frequency": "" }
    ],
    "exercise": [
      { "title": "", "description": "", "frequency": "" }
    ],
    "lifestyle": [
      { "title": "", "description": "", "frequency": "" }
    ],
    "medical": [
      { "title": "", "description": "", "frequency": "" }
    ]
  }
}

Rules:
- Provide at least 3 recommendations per category.
- If risk_level is 'none', focus recommendations on maintenance and prevention.
- If risk_level is 'at_risk', focus on lifestyle modifications to prevent progression.
- If risk_level is 'pcos_positive', include specific medical follow-up recommendations.
- Always include a recommendation to consult a gynecologist/endocrinologist regardless of risk level.
- Never claim certainty in diagnosis, use language like "indicators suggest" or "screening shows".
- Respond ONLY with valid JSON. No markdown, no code fences, no extra text.
`;

  console.log('[Groq] Sending analysis request via Groq (Llama 3.3-70B)...');
  console.log('[Groq] API Key present:', !!process.env.GROQ_API_KEY);

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a medical screening AI. Respond ONLY with valid JSON. No markdown, no code fences, no explanations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: 'json_object' }
    });

    const responseText = chatCompletion.choices[0]?.message?.content || '';
    console.log('[Groq] Response received, length:', responseText.length);

    try {
      const parsedData = JSON.parse(responseText);
      console.log('[Groq] Parsed risk_level:', parsedData.risk_level);
      return parsedData;
    } catch (parseError) {
      console.error('[Groq] JSON parse error. Raw response:', responseText.substring(0, 500));
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('[Groq] Error details:', error.message);
    if (error.message?.includes('API')) {
      console.error('[Groq] Check your GROQ_API_KEY in server/.env');
    }
    throw new Error(`Failed to generate AI analysis: ${error.message}`);
  }
};
