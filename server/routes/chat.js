import express from 'express';
import Groq from 'groq-sdk';
import { supabase } from '../utils/db.js';
import dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });
const router = express.Router();

// Get chat history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_history')
      .select('role, content, created_at')
      .eq('user_id', req.params.userId)
      .order('created_at', { ascending: true })
      .limit(50);

    if (error) throw error;
    res.json(data || []);
  } catch (e) {
    res.json([]);
  }
});

// Clear chat history
router.delete('/history/:userId', async (req, res) => {
  try {
    await supabase.from('chat_history').delete().eq('user_id', req.params.userId);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { message, pageContext, chatHistory, userName, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log(`[Chat] User${userName ? ` (${userName})` : ''}: "${message.substring(0, 80)}..."`);

    const nameInstruction = userName
      ? `The user's name is "${userName}". Address them by their first name occasionally to be warm and personal (e.g., "Hey ${userName.split(' ')[0]}!"). Don't overuse it — just naturally, like a friend would.`
      : 'The user has not set their name yet. Use generic greetings.';

    const systemPrompt = `You are CycleSync AI — a friendly, empathetic health assistant specialized in PCOS (Polycystic Ovary Syndrome) and women's reproductive wellness.

${nameInstruction}

The user is currently on the ${pageContext || 'app'}. Use this context to provide relevant help.

YOUR ROLE:
- Answer questions about PCOS, hormonal health, menstrual cycle regulation, and general women's wellness
- Provide supportive guidance tailored to the user's situation
- If the user is on the Upload page, help them understand what reports to upload
- If the user is on the Results page, help them interpret PCOS screening results
- If the user is on the Dashboard, provide general wellness tips

IMPORTANT RULES:
- Be warm, supportive, and encouraging — avoid clinical coldness
- NEVER say you can "see", "read", or "look at" the user's screen/page/data — you do NOT have that ability
- NEVER diagnose. Always use language like "indicators suggest" or "screening shows"
- Always recommend consulting a gynecologist/endocrinologist for definitive diagnosis
- Keep responses concise (2-4 sentences unless the user asks for detail)
- Use simple language, avoid excessive medical jargon
- If asked about something unrelated to health/PCOS, gently redirect
- Use emoji sparingly for warmth (💛, 🌸, etc.)`;

    // Build messages array with history
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add chat history (last 20 messages for context — increased for memory)
    if (chatHistory && Array.isArray(chatHistory)) {
      const recentHistory = chatHistory.slice(-20);
      recentHistory.forEach(msg => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        });
      });
    }

    // Add current message
    messages.push({ role: 'user', content: message });

    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.6,
      max_tokens: 512,
    });

    const reply = chatCompletion.choices[0]?.message?.content || 'I\'m sorry, I couldn\'t generate a response.';
    console.log(`[Chat] AI reply: "${reply.substring(0, 80)}..."`);

    // Save to chat history if userId provided
    if (userId) {
      try {
        await supabase.from('chat_history').insert([
          { user_id: userId, role: 'user', content: message },
          { user_id: userId, role: 'assistant', content: reply },
        ]);
      } catch (err) {
        console.error('[Chat] History save error:', err.message);
      }
    }

    res.status(200).json({ reply });

  } catch (error) {
    console.error('[Chat] Error:', error.message);
    res.status(500).json({ error: `Chat error: ${error.message}` });
  }
});

export default router;
