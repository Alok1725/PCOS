import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const groqApiKey = process.env.GROQ_API_KEY || '';
const geminiApiKey = process.env.GEMINI_API_KEY || '';

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;
const genAI = geminiApiKey ? new GoogleGenerativeAI(geminiApiKey) : null;

// Preferred Groq models in order of priority
const GROQ_TEXT_MODELS = [
  process.env.GROQ_MODEL,
  'openai/gpt-oss-120b',
  'qwen/qwen3.8-27b',
].filter(Boolean);

const GROQ_VISION_MODELS = [
  process.env.GROQ_VISION_MODEL,
  'qwen/qwen3.8-27b',
].filter(Boolean);

/**
 * Generate chat completion with automatic model fallback (Groq -> Gemini)
 */
export async function getChatCompletion({
  messages = [],
  systemPrompt = '',
  temperature = 0.6,
  maxTokens = 1000,
  jsonMode = false,
}) {
  // 1. Try Groq with available text models
  if (groq) {
    for (const model of GROQ_TEXT_MODELS) {
      try {
        const fullMessages = [];
        if (systemPrompt) {
          fullMessages.push({ role: 'system', content: systemPrompt });
        }
        fullMessages.push(...messages);

        const options = {
          model,
          messages: fullMessages,
          temperature,
          max_tokens: maxTokens,
        };

        if (jsonMode) {
          options.response_format = { type: 'json_object' };
        }

        const completion = await groq.chat.completions.create(options);
        const text = completion.choices[0]?.message?.content || '';
        if (text) {
          return { text, provider: 'groq', model };
        }
      } catch (err) {
        console.warn(`[AI Provider] Groq model ${model} failed:`, err.message);
        // If it's a 404 model not found, loop to next model; else fallback to Gemini
      }
    }
  }

  // 2. Fallback to Gemini
  if (genAI) {
    const geminiModels = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
    for (const gemModel of geminiModels) {
      try {
        console.log(`[AI Provider] Trying Gemini fallback (${gemModel})...`);
        const model = genAI.getGenerativeModel({
          model: gemModel,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
          ...(systemPrompt ? { systemInstruction: systemPrompt } : {}),
        });

        // Format messages for Gemini
        const promptParts = [];
        for (const m of messages) {
          if (m.role === 'system') continue;
          promptParts.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`);
        }
        const prompt = promptParts.join('\n\n') || messages[messages.length - 1]?.content || '';

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          return { text, provider: 'gemini', model: gemModel };
        }
      } catch (err) {
        console.warn(`[AI Provider] Gemini (${gemModel}) text fallback failed:`, err.message);
      }
    }
  }

  throw new Error('No AI provider configured or operational.');
}

/**
 * Generate vision completion (e.g. food score) with fallback (Groq Scout 4 -> Gemini)
 */
export async function getVisionCompletion({
  prompt,
  imageBase64,
  mimeType = 'image/jpeg',
  temperature = 0.3,
  maxTokens = 800,
  jsonMode = true,
}) {
  // 1. Try Groq Scout 4 first
  if (groq) {
    for (const model of GROQ_VISION_MODELS) {
      try {
        console.log(`[AI Provider] Trying Groq vision model ${model}...`);
        const completion = await groq.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${mimeType};base64,${imageBase64}` },
                },
                {
                  type: 'text',
                  text: prompt,
                },
              ],
            },
          ],
          temperature,
          max_tokens: maxTokens,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        });

        const text = completion.choices[0]?.message?.content || '';
        if (text) {
          return { text, provider: 'groq', model };
        }
      } catch (err) {
        console.warn(`[AI Provider] Groq vision model ${model} failed:`, err.message);
      }
    }
  }

  // 2. Fallback to Gemini Multimodal
  if (genAI) {
    const geminiModels = ['gemini-flash-latest', 'gemini-flash-lite-latest'];
    for (const gemModel of geminiModels) {
      try {
        console.log(`[AI Provider] Using Gemini (${gemModel}) for vision analysis...`);
        const model = genAI.getGenerativeModel({
          model: gemModel,
          generationConfig: {
            temperature,
            maxOutputTokens: maxTokens,
            ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
          },
        });

        const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');

        const result = await model.generateContent([
          {
            inlineData: {
              mimeType,
              data: cleanBase64,
            },
          },
          prompt,
        ]);

        const text = result.response.text();
        return { text, provider: 'gemini', model: gemModel };
      } catch (err) {
        console.warn(`[AI Provider] Gemini (${gemModel}) vision failed:`, err.message);
      }
    }
  }

  throw new Error('No AI provider available for vision processing.');
}
