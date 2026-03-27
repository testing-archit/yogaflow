// Use generic types for Vercel compatibility
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';

const PRODUCT_KEY_FULL = 'FULL_COURSE_6_MONTHS';
const PRODUCT_KEY_TRIAL = 'TRIAL_SEVEN_DAY_FLOW';
const AMOUNT_PAISE_FULL = 4499 * 100;
const AMOUNT_PAISE_TRIAL = 29 * 100;

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const matched = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return matched?.[1];
}

function getUserIdFromSession(req: any) {
  const token = (req as any).cookies?.session || getCookieValue(req.headers.cookie, 'session');
  if (!token) return null;
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return null;
  try {
    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    return payload.userId || null;
  } catch {
    return null;
  }
}

const readJsonBody = async (req: any) => {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const getRawBody = async (req: any) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

export default async function handler(req: any, res: any) {
  const { action } = req.query;
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? process.env.VITE_RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  // GET /api/razorpay?action=key-id
  if (req.method === 'GET' && action === 'key-id') {
    if (!keyId) return res.status(500).json({ error: 'Missing Razorpay key id' });
    return res.status(200).json({ keyId });
  }

  // GET /api/razorpay?action=fetch-subscription&subscriptionId=xxx
  if (req.method === 'GET' && action === 'fetch-subscription') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const subscriptionId = typeof req.query?.subscriptionId === 'string' ? req.query.subscriptionId : '';
    if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return res.status(200).json({ subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to fetch subscription' });
    }
  }

  // POST /api/razorpay?action=create-subscription
  if (req.method === 'POST' && action === 'create-subscription') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const body = await readJsonBody(req);
    const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    const customerEmail = typeof body.email === 'string' ? body.email.trim() : '';
    const customerName = typeof body.name === 'string' ? body.name.trim() : '';
    const trialDaysRaw = Number(body.trialDays);
    const trialDays = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? Math.min(trialDaysRaw, 60) : 0;
    if (!planId) return res.status(400).json({ error: 'Missing planId' });
    const totalCountRaw = Number(body.totalCount);
    const totalCount = Number.isFinite(totalCountRaw) && totalCountRaw > 0 ? totalCountRaw : 24;
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
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

  // POST /api/razorpay?action=cancel-subscription
  if (req.method === 'POST' && action === 'cancel-subscription') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const body = await readJsonBody(req);
    const subscriptionId = typeof body.subscriptionId === 'string' ? body.subscriptionId.trim() : '';
    const cancelAtCycleEnd = body.cancelAtCycleEnd === false ? false : true;
    if (!subscriptionId) return res.status(400).json({ error: 'Missing subscriptionId' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const subscription = await razorpay.subscriptions.cancel(subscriptionId, cancelAtCycleEnd);
      return res.status(200).json({ ok: true, subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to cancel subscription' });
    }
  }

  // POST /api/razorpay?action=verify-subscription
  if (req.method === 'POST' && action === 'verify-subscription') {
    if (!keySecret || !keyId) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const body = await readJsonBody(req);
    const subscriptionId = typeof body.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id : '';
    const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
    const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';
    if (!subscriptionId || !paymentId || !signature) return res.status(400).json({ error: 'Missing verification fields' });
    const expected = crypto.createHmac('sha256', keySecret).update(`${paymentId}|${subscriptionId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      const subscription = await razorpay.subscriptions.fetch(subscriptionId);
      return res.status(200).json({ ok: true, subscription });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Verification succeeded but fetch failed' });
    }
  }

  // POST /api/razorpay?action=webhook
  if (req.method === 'POST' && action === 'webhook') {
    if (!webhookSecret) return res.status(500).send('Missing webhook secret');
    const rawBody = await getRawBody(req);
    const signature = req.headers['x-razorpay-signature'] as string | undefined;
    if (!signature) return res.status(400).send('Missing signature');
    const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
    if (expected !== signature) return res.status(400).send('Invalid signature');
    let event: any = null;
    try { event = JSON.parse(rawBody.toString('utf8')); } catch { return res.status(400).send('Invalid JSON'); }
    try {
      const entity = event?.payload?.subscription?.entity;
      const userId = entity?.notes?.userId;
      if (!userId || typeof userId !== 'string') return res.status(200).json({ ok: true });
      const status = typeof entity?.status === 'string' ? entity.status.toUpperCase() : undefined;
      const planId = typeof entity?.plan_id === 'string' ? entity.plan_id : undefined;
      const subscriptionId = typeof entity?.id === 'string' ? entity.id : undefined;
      const currentEnd = typeof entity?.current_end === 'number' ? new Date(entity.current_end * 1000) : undefined;
      const now = new Date();
      // Ensure user exists first
      let userRecord = await prisma.user.findUnique({ where: { firebaseId: userId } });
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            firebaseId: userId,
            email: entity?.notes?.email || `unknown_${userId}@domain.com`,
            name: entity?.notes?.name || null,
            createdAt: now,
            updatedAt: now,
            role: 'USER',
          },
        });
      }
      const userDbId = userRecord.id;
      const existingSub = await prisma.subscription.findUnique({ where: { userId: userDbId } });
      if (existingSub) {
        await prisma.subscription.update({ where: { userId: userDbId }, data: { status: status as any || existingSub.status, planId: planId || existingSub.planId, razorpaySubId: subscriptionId || existingSub.razorpaySubId, validUntil: currentEnd || existingSub.validUntil, updatedAt: now } });
      } else {
        await prisma.subscription.create({ data: { id: crypto.randomUUID(), userId: userDbId, planId: planId || 'unknown', status: status as any || 'INACTIVE', razorpaySubId: subscriptionId || '', validUntil: currentEnd || now, createdAt: now, updatedAt: now } });
      }
      return res.status(200).json({ ok: true });
    } catch (e: any) { return res.status(500).send(e?.message || 'Webhook error'); }
  }

  // POST /api/razorpay?action=full-course-order
  if (req.method === 'POST' && action === 'full-course-order') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const userId = getUserIdFromSession(req);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const existing = await prisma.entitlement.findUnique({ where: { userId_productKey: { userId, productKey: PRODUCT_KEY_FULL } } });
    if (existing) return res.status(409).json({ error: 'Full course already purchased' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      // ...existing logic for full course order...
      return res.status(200).json({ ok: true }); // Placeholder
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create full course order' });
    }
  }

  // POST /api/razorpay?action=trial-order
  if (req.method === 'POST' && action === 'trial-order') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const userId = getUserIdFromSession(req);
    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });
    const existing = await prisma.entitlement.findUnique({ where: { userId_productKey: { userId, productKey: PRODUCT_KEY_TRIAL } } });
    if (existing) return res.status(409).json({ error: 'Trial pack already purchased' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      // ...existing logic for trial order...
      return res.status(200).json({ ok: true }); // Placeholder
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create trial order' });
    }
  }

  res.status(404).json({ error: 'Not found' });
}
