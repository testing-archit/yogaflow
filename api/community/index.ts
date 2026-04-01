import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // GET requests are public (read community posts without auth)
  // POST requires auth
  const authUser = await getSupabaseUser(req);
  if (!authUser && req.method !== 'GET') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { action, conversationId } = req.query as { action: string; conversationId?: string };

  try {
    // Auto-seed default conversations if none exist
    const { count } = await supabaseAdmin
      .from('community_conversations')
      .select('*', { count: 'exact', head: true });

    if (count === 0 && authUser) {
      await supabaseAdmin.from('community_conversations').upsert([
        { id: 'support',   title: 'Support Group',      author_id: authUser.id, updated_at: new Date().toISOString() },
        { id: 'beginners', title: "Beginner's Circle",  author_id: authUser.id, updated_at: new Date().toISOString() },
        { id: 'advanced',  title: 'Advanced Practice',  author_id: authUser.id, updated_at: new Date().toISOString() },
      ], { onConflict: 'id', ignoreDuplicates: true });
    }

    // GET /api/community?action=conversations
    if (req.method === 'GET' && action === 'conversations') {
      const { data: convs, error } = await supabaseAdmin
        .from('community_conversations')
        .select(`
          id, title, updated_at,
          community_messages (
            text, created_at,
            users ( name )
          )
        `)
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const mapped = (convs || []).map((c: any) => {
        const messages = c.community_messages || [];
        // Get the latest message
        const lastMsg = messages.sort((a: any, b: any) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        return {
          id: c.id,
          author: c.title,
          lastText: lastMsg?.text || 'No messages yet',
          time: lastMsg
            ? new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : 'Recently',
          isGroup: true,
          isSupportGroup: c.title.toLowerCase().includes('support'),
          unreadCount: 0,
        };
      });

      return res.status(200).json(mapped);
    }

    // GET /api/community?action=messages&conversationId=...
    if (req.method === 'GET' && action === 'messages' && conversationId) {
      const { data: messages, error } = await supabaseAdmin
        .from('community_messages')
        .select('id, text, created_at, author_id, users ( id, name, avatar_url )')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      const mapped = (messages || []).map((m: any) => ({
        id: m.id,
        sender: m.users?.name || 'User',
        avatar: (m.users?.name || 'U').slice(0, 2).toUpperCase(),
        text: m.text,
        time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMe: authUser ? m.author_id === authUser.id : false,
      }));

      return res.status(200).json(mapped);
    }

    // POST /api/community?action=send-message
    if (req.method === 'POST' && action === 'send-message') {
      if (!authUser) return res.status(401).json({ error: 'Unauthorized' });

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { conversationId: convId, text } = body;
      if (!convId || !text) return res.status(400).json({ error: 'Missing data' });

      const now = new Date().toISOString();

      const { data: msg, error: msgError } = await supabaseAdmin
        .from('community_messages')
        .insert({ text, author_id: authUser.id, conversation_id: convId, updated_at: now })
        .select()
        .single();

      if (msgError) throw msgError;

      // Update conversation's updated_at timestamp
      await supabaseAdmin
        .from('community_conversations')
        .update({ updated_at: now })
        .eq('id', convId);

      return res.status(200).json(msg);
    }

    return res.status(404).json({ error: 'Action not found' });
  } catch (error: any) {
    console.error('Community API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
