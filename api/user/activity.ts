import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { classId, durationMins } = body;

    if (!durationMins || typeof durationMins !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid durationMins' });
    }

    // Fetch current user for streak calculation
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('classes_attended, hours_practiced, streak, last_active_date')
      .eq('id', authUser.id)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Streak calculation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = user.streak;
    if (user.last_active_date) {
      const lastActive = new Date(user.last_active_date);
      lastActive.setHours(0, 0, 0, 0);
      if (lastActive.getTime() === yesterday.getTime()) {
        newStreak += 1;
      } else if (lastActive.getTime() < yesterday.getTime()) {
        newStreak = 1;
      }
      // Same day: streak stays the same
    } else {
      newStreak = 1;
    }

    // Insert activity record
    const { error: insertError } = await supabaseAdmin.from('user_activity').insert({
      user_id: authUser.id,
      class_id: typeof classId === 'string' && classId ? classId : null,
      duration_mins: durationMins,
    });
    if (insertError) throw insertError;

    // Update user counters atomically
    const newClassesAttended = user.classes_attended + 1;
    const newHoursPracticed = user.hours_practiced + durationMins / 60;

    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update({
        classes_attended: newClassesAttended,
        hours_practiced: newHoursPracticed,
        streak: newStreak,
        last_active_date: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.id)
      .select('classes_attended, hours_practiced, streak')
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      classesAttended: updatedUser.classes_attended,
      hoursPracticed: updatedUser.hours_practiced,
      streak: updatedUser.streak,
    });
  } catch (e: any) {
    console.error('Activity tracking error:', e);
    return res.status(500).json({ error: 'Failed to record activity', details: e.message });
  }
}
