import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../utils/auth-helper.js';
import { supabaseAdmin } from '../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({ error: 'Assistant is not configured on the server.' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { messages } = body;
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array' });
    }

    const geminiContents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const systemPrompt = `You are a knowledgeable Yoga guide from Rishikesh. You provide short, meaningful, and practical yoga and meditation advice. Always be encouraging. Do not provide medical diagnoses. Format your text nicely using markdown if necessary, but keep it brief (under 80 words if possible).`;

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
    const assistantMessage =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I'm sorry, I couldn't formulate a response.";

    return res.status(200).json({ reply: assistantMessage });
  } catch (err: any) {
    console.error('Assistant API error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
