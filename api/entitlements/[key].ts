// Vercel dynamic route: /api/entitlements/[key]
// Handles both trial (key=trial) and full-course (key=full-course) entitlement checks.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';

const PRODUCT_KEY_MAP: Record<string, string> = {
  trial: 'TRIAL_SEVEN_DAY_FLOW',
  'full-course': 'FULL_COURSE_6_MONTHS',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const keyParam = req.query.key as string;
  const PRODUCT_KEY = PRODUCT_KEY_MAP[keyParam];
  if (!PRODUCT_KEY) {
    return res.status(404).json({ error: `Unknown entitlement key: ${keyParam}` });
  }

  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated' });

    const { data: existing } = await supabaseAdmin
      .from('entitlements')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('product_key', PRODUCT_KEY)
      .single();

    return res.status(200).json({ productKey: PRODUCT_KEY, hasPurchased: !!existing });
  } catch (error: any) {
    console.error(`Entitlement check error (${keyParam}):`, error);
    return res.status(500).json({ error: error.message });
  }
}
