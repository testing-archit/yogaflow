import { supabaseAdmin } from './supabase-server.js';

/**
 * Extracts and verifies the Supabase JWT from the Authorization header.
 * Returns the Supabase user object or null on failure.
 *
 * Usage in Vercel functions:
 *   const user = await getSupabaseUser(req);
 *   if (!user) return res.status(401).json({ error: 'Unauthenticated' });
 */
export async function getSupabaseUser(req: any) {
  try {
    const authHeader: string = req.headers?.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;

    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;

    return data.user;
  } catch {
    return null;
  }
}

/**
 * Fetches the public.users row for the given Supabase user.
 * Returns null if the row does not exist yet.
 */
export async function getPublicUser(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();

  if (error || !data) return null;
  return data;
}

/**
 * Upserts a public.users row. Called from auth/me.ts when a row may be missing.
 */
export async function upsertPublicUser(userId: string, email: string, name?: string | null) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .upsert(
      { id: userId, email, name: name ?? null, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}
