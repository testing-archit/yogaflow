import crypto from 'crypto';
import { getSupabaseUser } from '../../utils/auth-helper.js';
import { supabaseAdmin } from '../../utils/supabase-server.js';
import Razorpay from 'razorpay';

export const config = {
  api: { bodyParser: false },
};

const PRODUCT_KEY_FULL  = 'FULL_COURSE_6_MONTHS';
const PRODUCT_KEY_TRIAL = 'TRIAL_SEVEN_DAY_FLOW';
const AMOUNT_PAISE_FULL  = 4499 * 100;
const AMOUNT_PAISE_TRIAL = 29   * 100;

const readJsonBody = async (req: any) => {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return {}; }
};

const getRawBody = async (req: any) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

/** Ensure a public.users row exists for the given Supabase user id */
async function ensureUserRow(userId: string, email: string, name?: string | null) {
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id, email')
    .eq('id', userId)
    .single();
  if (existing) return existing;

  const { data: created, error } = await supabaseAdmin
    .from('users')
    .insert({ id: userId, email: email || `user_${userId}@placeholder.com`, name: name ?? null, role: 'USER' })
    .select()
    .single();
  if (error) throw error;
  return created;
}

export default async function handler(req: any, res: any) {
  const { action } = req.query;
  const keyId      = (process.env.RAZORPAY_KEY_ID      ?? process.env.VITE_RAZORPAY_KEY_ID      ?? '').trim();
  const keySecret  = (process.env.RAZORPAY_KEY_SECRET  ?? process.env.VITE_RAZORPAY_KEY_SECRET  ?? '').trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // ── GET key-id (public) ─────────────────────────────────────
  if (req.method === 'GET' && action === 'key-id') {
    if (!keyId) return res.status(500).json({ error: 'Missing Razorpay key id' });
    return res.status(200).json({ keyId });
  }

  // ── GET fetch-subscription ──────────────────────────────────
  if (req.method === 'GET' && action === 'fetch-subscription') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const subscriptionId = typeof req.query?.subscriptionId === 'string' ? req.query.subscriptionId : '';
    if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' });
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return res.status(200).json({ subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to fetch subscription' });
    }
  }

  // ── POST create-subscription ────────────────────────────────
  if (req.method === 'POST' && action === 'create-subscription') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const body = await readJsonBody(req);
    const planId        = typeof body.planId       === 'string' ? body.planId.trim()       : '';
    const userId        = typeof body.userId       === 'string' ? body.userId.trim()       : '';
    const customerEmail = typeof body.email        === 'string' ? body.email.trim()        : '';
    const customerName  = typeof body.name         === 'string' ? body.name.trim()         : '';
    const trialDaysRaw  = Number(body.trialDays);
    const trialDays     = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? Math.min(trialDaysRaw, 60) : 0;
    if (!planId) return res.status(400).json({ error: 'Missing planId' });
    const totalCount = Number.isFinite(Number(body.totalCount)) && Number(body.totalCount) > 0 ? Number(body.totalCount) : 24;
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const payload: any = {
        plan_id: planId,
        customer_notify: 1,
        total_count: totalCount,
        notes: { userId, email: customerEmail, name: customerName },
      };
      if (trialDays > 0) payload.trial_days = trialDays;
      const subscription = await razorpay.subscriptions.create(payload);
      return res.status(200).json({ subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create subscription' });
    }
  }

  // ── POST cancel-subscription ────────────────────────────────
  if (req.method === 'POST' && action === 'cancel-subscription') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const body = await readJsonBody(req);
    const subscriptionId    = typeof body.subscriptionId    === 'string' ? body.subscriptionId.trim() : '';
    const cancelAtCycleEnd  = body.cancelAtCycleEnd === false ? false : true;
    if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' });
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      return res.status(200).json({ ok: true, subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to cancel subscription' });
    }
  }

  // ── POST verify-subscription ────────────────────────────────
  if (req.method === 'POST' && action === 'verify-subscription') {
    if (!keySecret || !keyId) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const body           = await readJsonBody(req);
    const subscriptionId = typeof body.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id : '';
    const paymentId      = typeof body.razorpay_payment_id      === 'string' ? body.razorpay_payment_id      : '';
    const signature      = typeof body.razorpay_signature       === 'string' ? body.razorpay_signature       : '';
    if (!subscriptionId || !paymentId || !signature) return res.status(400).json({ error: 'Missing verification fields' });
    const expected = crypto.createHmac('sha256', keySecret).update(`${paymentId}|${subscriptionId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });
    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return res.status(200).json({ ok: true, subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Verification succeeded but fetch failed' });
    }
  }

  // ── POST webhook ────────────────────────────────────────────
  if (req.method === 'POST' && action === 'webhook') {
    if (!webhookSecret) return res.status(500).send('Missing webhook secret');

    const rawBody  = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) return res.status(400).send('Missing signature');

    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (expected !== signature) return res.status(400).send('Invalid signature');

    let event: any = null;
    try { event = JSON.parse(rawBody.toString('utf8')); }
    catch { return res.status(400).send('Invalid JSON'); }

    const eventType = event.event;
    console.log(`🔔 Razorpay Webhook: ${eventType}`);

    try {
      const now = new Date().toISOString();

      // CASE 1: Subscription events
      if (eventType.startsWith('subscription.')) {
        const entity      = event.payload.subscription.entity;
        const userId      = entity.notes?.userId;          // Supabase UUID stored when order was created
        const userEmail   = entity.notes?.email  || '';
        const userName    = entity.notes?.name   || null;
        if (!userId) return res.status(200).json({ ok: true, message: 'No userId in notes' });

        const status         = entity.status.toUpperCase();
        const planId         = entity.plan_id;
        const subscriptionId = entity.id;
        const currentEnd     = entity.current_end ? new Date(entity.current_end * 1000).toISOString() : null;

        await ensureUserRow(userId, userEmail, userName);

        await supabaseAdmin.from('subscriptions').upsert({
          user_id:        userId,
          plan_id:        planId,
          status:         mapWebhookStatus(status),
          razorpay_sub_id: subscriptionId,
          valid_until:    currentEnd,
          updated_at:     now,
        }, { onConflict: 'user_id' });
      }

      // CASE 2: Order / payment events (one-time enrolments)
      else if (eventType === 'order.paid' || eventType === 'payment.captured') {
        const entity     = eventType === 'order.paid'
          ? event.payload.order.entity
          : event.payload.payment.entity;
        const userId     = entity.notes?.userId;
        const productKey = entity.notes?.productKey;
        const userEmail  = entity.notes?.email || '';

        if (!userId || !productKey) {
          return res.status(200).json({ ok: true, message: 'Missing metadata' });
        }

        await ensureUserRow(userId, userEmail);

        await supabaseAdmin.from('entitlements').upsert({
          user_id:     userId,
          product_key: productKey,
          purchased_at: now,
        }, { onConflict: 'user_id, product_key' });
      }

      return res.status(200).json({ ok: true });
    } catch (e: any) {
      console.error('❌ Webhook error:', e);
      return res.status(500).send(e?.message || 'Webhook internal error');
    }
  }

  // ── POST full-course-order ──────────────────────────────────
  if (req.method === 'POST' && action === 'full-course-order') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const authUser = await getSupabaseUser(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated' });

    const user = await ensureUserRow(authUser.id, authUser.email!);

    const { data: existing } = await supabaseAdmin
      .from('entitlements')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('product_key', PRODUCT_KEY_FULL)
      .single();
    if (existing) return res.status(409).json({ error: 'Full course already purchased' });

    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: AMOUNT_PAISE_FULL,
        currency: 'INR',
        receipt: `receipt_fc_${authUser.id.slice(0, 8)}_${Date.now()}`,
        notes: { userId: authUser.id, productKey: PRODUCT_KEY_FULL, email: user.email },
      });
      return res.status(200).json({ ok: true, orderId: order.id, keyId });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create full course order' });
    }
  }

  // ── PUT full-course-order (verify) ──────────────────────────
  if (req.method === 'PUT' && action === 'full-course-order') {
    if (!keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const authUser = await getSupabaseUser(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated' });

    const body      = await readJsonBody(req);
    const paymentId = body.razorpay_payment_id;
    const orderId   = body.razorpay_order_id;
    const signature = body.razorpay_signature;
    if (!paymentId || !orderId || !signature) return res.status(400).json({ error: 'Missing verification fields' });

    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });

    await ensureUserRow(authUser.id, authUser.email!);
    const { error } = await supabaseAdmin.from('entitlements').upsert(
      { user_id: authUser.id, product_key: PRODUCT_KEY_FULL },
      { onConflict: 'user_id, product_key' }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  // ── POST trial-order ────────────────────────────────────────
  if (req.method === 'POST' && action === 'trial-order') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const authUser = await getSupabaseUser(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated' });

    const user = await ensureUserRow(authUser.id, authUser.email!);

    const { data: existing } = await supabaseAdmin
      .from('entitlements')
      .select('id')
      .eq('user_id', authUser.id)
      .eq('product_key', PRODUCT_KEY_TRIAL)
      .single();
    if (existing) return res.status(409).json({ error: 'Trial pack already purchased' });

    try {
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const order = await razorpay.orders.create({
        amount: AMOUNT_PAISE_TRIAL,
        currency: 'INR',
        receipt: `receipt_tr_${authUser.id.slice(0, 8)}_${Date.now()}`,
        notes: { userId: authUser.id, productKey: PRODUCT_KEY_TRIAL, email: user.email },
      });
      return res.status(200).json({ ok: true, orderId: order.id, keyId });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create trial order' });
    }
  }

  // ── PUT trial-order (verify) ────────────────────────────────
  if (req.method === 'PUT' && action === 'trial-order') {
    if (!keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const authUser = await getSupabaseUser(req);
    if (!authUser) return res.status(401).json({ error: 'Unauthenticated' });

    const body      = await readJsonBody(req);
    const paymentId = body.razorpay_payment_id;
    const orderId   = body.razorpay_order_id;
    const signature = body.razorpay_signature;
    if (!paymentId || !orderId || !signature) return res.status(400).json({ error: 'Missing verification fields' });

    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });

    await ensureUserRow(authUser.id, authUser.email!);
    const { error } = await supabaseAdmin.from('entitlements').upsert(
      { user_id: authUser.id, product_key: PRODUCT_KEY_TRIAL },
      { onConflict: 'user_id, product_key' }
    );
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(404).json({ error: 'Not found' });
}

function mapWebhookStatus(s: string): string {
  if (s === 'ACTIVE' || s === 'AUTHENTICATED' || s === 'CREATED') return 'ACTIVE';
  if (s === 'CANCELLED' || s === 'CANCELED') return 'CANCELLED';
  if (s === 'TRIAL') return 'TRIAL';
  return 'INACTIVE';
}
