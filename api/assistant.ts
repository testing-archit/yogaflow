import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../utils/auth-helper.js';
import { supabaseAdmin } from '../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Handle GET: Fetch history
    if (req.method === 'GET') {
      const { data: messages, error } = await supabaseAdmin
        .from('ai_chat_messages')
        .select('id, role, content, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) throw error;
      return res.status(200).json({ messages });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Assistant is not configured on the server.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { message } = body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid message string' });
    }

    // 1. Insert user message into context
    const { data: userMsg, error: insertUserErr } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert({
        user_id: authUser.id,
        role: 'user',
        content: message
      })
      .select('id, role, content, created_at')
      .single();

    if (insertUserErr) throw insertUserErr;

    // 2. Fetch recent conversation context (limit to last 20 messages for LLM context window)
    const { data: history, error: historyErr } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('role, content')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (historyErr) throw historyErr;

    // Supabase returns descending, so reverse it for Gemini order
    const chronologicalHistory = history.reverse();

    const geminiContents = chronologicalHistory.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const country = req.headers['x-vercel-ip-country'] || 'US';
    const isIndia = typeof country === 'string' && country.toUpperCase() === 'IN';
    const pricingDetails = isIndia
      ? "Pricing (INR): Trial Pack (7-Days) is ₹29. Monthly Subscription is ₹999/month. Full Course (6 Months) is ₹4,499 one-time."
      : "Pricing (USD): Trial Pack (7-Days) is $1. Monthly Subscription is $49/month. Full Course (6 Months) is $219 one-time.";

    const systemPrompt = `You are the official AI Yoga Assistant for YogaFlow, a premium gamified yoga and wellness platform. 
As an expert Yoga guide originally from Rishikesh, you are incredibly smart, deeply knowledgeable about yoga philosophy, anatomy, meditation, and well-being.
About the YogaFlow Platform: We help users track their yoga journey through a Gamified Dashboard with live activity tracking. Users can bookmark their favorite poses using the 'Saved Asanas' feature, and access premium content.
Current Pricing & Plans: ${pricingDetails} Tell the user to click on the "Pricing" section in the main navigation menu or visit the Pricing page directly to make a purchase.
Your Role: Provide highly practical, insightful, and meaningful advice. Encourage users to use YogaFlow features like tracking their workouts or saving asanas. 
Constraints: Be highly encouraging and wise. Do not provide medical diagnoses. Format your responses beautifully using markdown (using bolding, italics, or lists if it helps readability), but keep your responses concise, punchy, and under 100 words unless complex explanation is needed.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: geminiContents,
          generationConfig: { temperature: 0.7 },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API Error:', errText);
      return res.status(500).json({ error: 'Failed to generate response' });
    }

    const data = await response.json();
    const assistantContent =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't formulate a response.";

    // 3. Save assistant response logic to persistence
    const { data: assistantMsg, error: insertAssErr } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert({
        user_id: authUser.id,
        role: 'assistant',
        content: assistantContent
      })
      .select('id, role, content, created_at')
      .single();

    if (insertAssErr) throw insertAssErr;

    return res.status(200).json({ 
      reply: assistantContent,
      messageObj: assistantMsg,
      userMessageObj: userMsg
    });
  } catch (err: any) {
    console.error('Assistant API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
