import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser, upsertPublicUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Try to fetch the public.users row
    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('id, name, email, role, avatar_url, classes_attended, hours_practiced, streak, last_active_date')
      .eq('id', authUser.id)
      .single();

    if (error || !user) {
      // Row may not exist yet (trigger race or first login) — upsert it
      const name = authUser.user_metadata?.full_name || authUser.user_metadata?.name || null;
      const newUser = await upsertPublicUser(authUser.id, authUser.email!, name);
      return res.json({
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        avatar_url: newUser.avatar_url,
        classesAttended: newUser.classes_attended,
        hoursPracticed: newUser.hours_practiced,
        streak: newUser.streak,
        lastActiveDate: newUser.last_active_date,
      });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar_url: user.avatar_url,
      classesAttended: user.classes_attended,
      hoursPracticed: user.hours_practiced,
      streak: user.streak,
      lastActiveDate: user.last_active_date,
    });
  } catch (e: any) {
    console.error('Auth/me error:', e);
    return res.status(401).json({ error: 'Invalid session', details: e.message });
  }
}
