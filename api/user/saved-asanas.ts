import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // GET — fetch all saved asanas for this user
    if (req.method === 'GET') {
      const { data, error } = await supabaseAdmin
        .from('saved_asanas')
        .select('*, asanas(*)')
        .eq('user_id', authUser.id)
        .order('saved_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json({ savedAsanas: data });
    }

    // POST — toggle save/unsave
    if (req.method === 'POST') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { asanaId } = body;
      if (!asanaId) return res.status(400).json({ error: 'Missing asanaId' });

      // Check if already saved
      const { data: existing } = await supabaseAdmin
        .from('saved_asanas')
        .select('id')
        .eq('user_id', authUser.id)
        .eq('asana_id', asanaId)
        .single();

      if (existing) {
        // Unsave
        const { error: delError } = await supabaseAdmin
          .from('saved_asanas')
          .delete()
          .eq('id', existing.id);
        if (delError) throw delError;
        return res.status(200).json({ saved: false, message: 'Asana removed from saved list' });
      } else {
        // Save
        const { data: newSaved, error: insError } = await supabaseAdmin
          .from('saved_asanas')
          .insert({ user_id: authUser.id, asana_id: asanaId })
          .select()
          .single();
        if (insError) throw insError;
        return res.status(200).json({ saved: true, data: newSaved });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Saved asanas API error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
