import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) {
      return res.status(401).json({ error: 'Unauthenticated' });
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
  } catch (e: any) {
    console.error('Dashboard error:', e);
    return res.status(500).json({ error: 'Failed to load dashboard data', details: e.message });
  }
}
