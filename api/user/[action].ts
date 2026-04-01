import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query as { action: string };

  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // ------------------------------------------------------------------------
    // DASHBOARD ENDPOINT 
    // ------------------------------------------------------------------------
    if (action === 'dashboard') {
      if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      // Fetch user stats
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, classes_attended, hours_practiced, streak, created_at')
        .eq('id', authUser.id)
        .single();

      if (userError || !user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Fetch last 10 activity records with class info
      const { data: activities } = await supabaseAdmin
        .from('user_activity')
        .select(`
          id, duration_mins, completed_at,
          yoga_classes (
            title,
            instructors ( name )
          )
        `)
        .eq('user_id', authUser.id)
        .order('completed_at', { ascending: false })
        .limit(10);

      const pastClasses = (activities || []).map((a: any) => ({
        id: a.id,
        title: a.yoga_classes?.title || 'Yoga Flow Session',
        date: new Date(a.completed_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        }),
        instructor: a.yoga_classes?.instructors?.name || 'Yogi',
        durationMins: a.duration_mins,
      }));

      return res.json({
        success: true,
        stats: {
          classesAttended: user.classes_attended,
          hoursPracticed: Number(user.hours_practiced.toFixed(1)),
          streak: user.streak,
          joinDate: user.created_at,
        },
        pastClasses,
        upcomingClasses: [],
      });
    }

    // ------------------------------------------------------------------------
    // ACTIVITY ENDPOINT
    // ------------------------------------------------------------------------
    else if (action === 'activity') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
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
    }

    // ------------------------------------------------------------------------
    // SAVED_ASANAS ENDPOINT
    // ------------------------------------------------------------------------
    else if (action === 'saved-asanas') {
      if (req.method === 'GET') {
        const { data, error } = await supabaseAdmin
          .from('saved_asanas')
          .select('*, asanas(*)')
          .eq('user_id', authUser.id)
          .order('saved_at', { ascending: false });

        if (error) throw error;
        return res.status(200).json({ savedAsanas: data });
      }

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
    }

    // ------------------------------------------------------------------------
    // NOT FOUND
    // ------------------------------------------------------------------------
    else {
      return res.status(404).json({ error: 'Endpoint not found' });
    }

  } catch (e: any) {
    console.error(`User/${action} error:`, e);
    return res.status(500).json({ error: 'Internal server error', details: e.message });
  }
}
