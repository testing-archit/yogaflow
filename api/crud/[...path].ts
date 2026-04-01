import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

// Tables that anyone can read without authentication
const PUBLIC_READ_TABLES = ['asanas', 'instructors', 'yoga_classes', 'research_topics', 'app_settings'];

// Tables that only admins can mutate via this generic endpoint
const ADMIN_WRITE_TABLES = ['asanas', 'instructors', 'yoga_classes', 'research_topics', 'app_settings', 'users', 'contact_requests', 'newsletter_subscribers'];

// Complete whitelist of allowed tables (prevents arbitrary table access)
const ALLOWED_TABLES = [
  ...PUBLIC_READ_TABLES,
  'subscriptions', 'entitlements', 'user_activity',
  'community_conversations', 'community_messages',
  'contact_requests', 'newsletter_subscribers',
];

const parseBody = (body: any) => (typeof body === 'string' ? JSON.parse(body) : body);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { path } = req.query as { path?: string | string[] };
  const pathArray = Array.isArray(path) ? path : (path ? [path] : []);

  const table = pathArray[0];
  const id = pathArray[1] || (req.query.id as string | undefined);

  if (!table || !ALLOWED_TABLES.includes(table)) {
    return res.status(400).json({ error: 'Invalid or disallowed table name' });
  }

  const isPublicRead = req.method === 'GET' && PUBLIC_READ_TABLES.includes(table);
  let userId: string | null = null;
  let isAdmin = false;

  if (!isPublicRead) {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthorized: Missing or invalid session' });
    }
    userId = authUser.id;

    // Resolve admin status
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();
    isAdmin = userRow?.role === 'ADMIN';
  }

  try {
    switch (req.method) {
      case 'GET': {
        if (id) {
          const { data, error } = await supabaseAdmin.from(table).select('*').eq('id', id).single();
          if (error) throw error;
          return res.status(200).json(data);
        }

        // Build filters from query params
        let query = supabaseAdmin.from(table).select('*');

        const filtersStr = req.query.filters as string | undefined;
        if (filtersStr) {
          try {
            const filters = JSON.parse(filtersStr);
            Object.entries(filters).forEach(([key, value]) => {
              query = query.eq(key, value as any);
            });
          } catch { /* ignore bad filter JSON */ }
        }

        if (req.query.orderBy) {
          const dir = req.query.orderDir === 'desc' ? false : true;
          query = query.order(req.query.orderBy as string, { ascending: dir });
        }

        const { data, error } = await query;
        if (error) throw error;
        return res.status(200).json(data);
      }

      case 'POST':
      case 'PUT':
      case 'PATCH': {
        // Admin-only for protected tables
        if (ADMIN_WRITE_TABLES.includes(table) && !isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }

        const body = parseBody(req.body);
        const targetId = id || body.id;

        if (targetId) {
          delete body.id;
          const { data, error } = await supabaseAdmin
            .from(table)
            .update(body)
            .eq('id', targetId)
            .select()
            .single();
          if (error) throw error;
          return res.status(200).json(data);
        } else {
          const { data, error } = await supabaseAdmin
            .from(table)
            .insert(body)
            .select()
            .single();
          if (error) throw error;
          return res.status(201).json(data);
        }
      }

      case 'DELETE': {
        if (!id) return res.status(400).json({ error: 'Missing ID for delete' });
        if (ADMIN_WRITE_TABLES.includes(table) && !isAdmin) {
          return res.status(403).json({ error: 'Forbidden: Admin access required' });
        }
        const { error } = await supabaseAdmin.from(table).delete().eq('id', id);
        if (error) throw error;
        return res.status(204).end();
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error(`DB Error on ${table}:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
