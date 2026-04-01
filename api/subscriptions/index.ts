import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';
import crypto from 'crypto';

function mapStatus(raw: string): string {
  const s = raw.toUpperCase();
  if (s === 'ACTIVE' || s === 'AUTHENTICATED' || s === 'CREATED') return 'ACTIVE';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'TRIAL') return 'TRIAL';
  return 'INACTIVE';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const authUser = await getSupabaseUser(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated' });

    // GET — return current subscription
    if (req.method === 'GET') {
      const { data: sub, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = row not found
      if (!sub) return res.status(200).json(null);

      return res.status(200).json({ ...sub, planType: sub.plan_id });
    }

    // POST / PUT / PATCH — upsert subscription
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});

      const planId = body.planId ?? body.planType ?? body.planName ?? 'unknown';
      const status = body.status ? mapStatus(String(body.status)) : undefined;
      const razorpaySubId = body.razorpaySubscriptionId ?? body.razorpaySubId ?? body.paymentId ?? null;
      const validUntil = body.currentPeriodEnd ?? body.validUntil ?? null;
      const trialEndsAt = body.trialEndsAt ?? null;

      // Check if subscription exists
      const { data: existing } = await supabaseAdmin
        .from('subscriptions')
        .select('id')
        .eq('user_id', authUser.id)
        .single();

      let sub: any;
      if (existing) {
        const updates: any = { updated_at: new Date().toISOString() };
        if (planId) updates.plan_id = planId;
        if (status) updates.status = status;
        if (razorpaySubId) updates.razorpay_sub_id = razorpaySubId;
        if (validUntil) updates.valid_until = new Date(validUntil).toISOString();
        if (trialEndsAt) updates.trial_ends_at = new Date(trialEndsAt).toISOString();

        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .update(updates)
          .eq('user_id', authUser.id)
          .select()
          .single();
        if (error) throw error;
        sub = data;
      } else {
        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            user_id: authUser.id,
            plan_id: planId,
            status: status ?? 'ACTIVE',
            razorpay_sub_id: razorpaySubId,
            valid_until: validUntil ? new Date(validUntil).toISOString() : null,
            trial_ends_at: trialEndsAt ? new Date(trialEndsAt).toISOString() : null,
          })
          .select()
          .single();
        if (error) throw error;
        sub = data;
      }

      return res.status(200).json({ ...sub, planType: sub.plan_id });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e: any) {
    console.error('Subscription error:', e);
    return res.status(500).json({ error: e.message });
  }
}
