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

import { createClerkClient } from '@clerk/backend';

async function getUserIdFromSession(req: any) {
  const clerkSecretKey = (process.env.CLERK_SECRET_KEY || '').trim();
  if (!clerkSecretKey) {
    console.error('CLERK_SECRET_KEY is not set');
    return null;
  }

  try {
    const clerkClient = createClerkClient({
      secretKey: clerkSecretKey.trim(),
      publishableKey: (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim(),
    });

    // Build a proper Request object so Clerk can inspect headers (incl. Authorization Bearer)
    const authHeader = req.headers?.authorization || '';
    const cookieHeader = req.headers?.cookie || '';
    const url = `http://localhost${req.url || '/'}`;

    const fakeRequest = new Request(url, {
      method: req.method || 'GET',
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });

    const requestState = await clerkClient.authenticateRequest(fakeRequest);
    const { userId } = requestState.toAuth();
    if (userId) return userId;
  } catch (e) {
    console.error('Clerk Auth Error in Razorpay:', e);
  }

  // Fallback: legacy JWT session cookie
  const token = (req as any).cookies?.session || getCookieValue(req.headers?.cookie, 'session');
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

async function resolveUserInternalId(externalId: string) {
  const user = await prisma.user.findFirst({
    where: { clerkId: externalId }
  });
  return user;
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
  // Trim whitespace/newlines that can sneak into .env values
  const keyId = (process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID ?? '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET ?? process.env.VITE_RAZORPAY_KEY_SECRET ?? '').trim();
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
      // Ensure user exists first (lookup by Clerk ID only)
      let userRecord = await prisma.user.findFirst({ where: { clerkId: userId } });
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            clerkId: userId,
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
    const externalId = await getUserIdFromSession(req);
    if (!externalId) return res.status(401).json({ error: 'Unauthenticated' });

    // Auto-create user record if not yet synced from Clerk webhook
    let user = await resolveUserInternalId(externalId);
    if (!user) {
      const now = new Date();
      try {
        user = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            clerkId: externalId,
            email: `unknown_${externalId}@domain.com`,
            role: 'USER',
            createdAt: now,
            updatedAt: now,
          }
        });
      } catch (createErr: any) {
        user = await resolveUserInternalId(externalId);
        if (!user) return res.status(500).json({ error: 'Failed to initialize user record: ' + createErr?.message });
      }
    }

    const existing = await prisma.entitlement.findUnique({
      where: { userId_productKey: { userId: user.id, productKey: PRODUCT_KEY_FULL } }
    });
    if (existing) return res.status(409).json({ error: 'Full course already purchased' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      
      const order = await razorpay.orders.create({
        amount: AMOUNT_PAISE_FULL,
        currency: 'INR',
        receipt: `receipt_fc_${externalId.slice(0, 5)}_${Date.now()}`
      });
      return res.status(200).json({ ok: true, orderId: order.id, keyId });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create full course order' });
    }
  }

  // PUT /api/razorpay?action=full-course-order (Verify Payment)
  if (req.method === 'PUT' && action === 'full-course-order') {
    if (!keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const externalId = await getUserIdFromSession(req);
    if (!externalId) return res.status(401).json({ error: 'Unauthenticated' });
    const body = await readJsonBody(req);
    const paymentId = body.razorpay_payment_id;
    const orderId = body.razorpay_order_id;
    const signature = body.razorpay_signature;

    if (!paymentId || !orderId || !signature) return res.status(400).json({ error: 'Missing verification fields' });
    
    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });

    try {
      const now = new Date();
      // Ensure user has a User record (Clerk only)
      let userRecord = await resolveUserInternalId(externalId);
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            clerkId: externalId,
            email: `unknown_${externalId}@domain.com`,
            role: 'USER',
            createdAt: now,
            updatedAt: now,
          }
        });
      }
      
      await prisma.entitlement.upsert({
        where: { userId_productKey: { userId: userRecord.id, productKey: PRODUCT_KEY_FULL } },
        create: {
          id: crypto.randomUUID(),
          userId: userRecord.id,
          productKey: PRODUCT_KEY_FULL,
          purchasedAt: now,
        },
        update: {},
      });

      return res.status(200).json({ ok: true });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to verify full course order' });
    }
  }

  // POST /api/razorpay?action=trial-order
  if (req.method === 'POST' && action === 'trial-order') {
    if (!keyId || !keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const externalId = await getUserIdFromSession(req);
    if (!externalId) return res.status(401).json({ error: 'Unauthenticated' });

    // Auto-create user record if not yet synced from Clerk webhook
    let user = await resolveUserInternalId(externalId);
    if (!user) {
      const now = new Date();
      try {
        user = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            clerkId: externalId,
            email: `unknown_${externalId}@domain.com`,
            role: 'USER',
            createdAt: now,
            updatedAt: now,
          }
        });
      } catch (createErr: any) {
        // If create failed due to race condition, try to find again
        user = await resolveUserInternalId(externalId);
        if (!user) return res.status(500).json({ error: 'Failed to initialize user record: ' + createErr?.message });
      }
    }

    const existing = await prisma.entitlement.findUnique({
      where: { userId_productKey: { userId: user.id, productKey: PRODUCT_KEY_TRIAL } }
    });
    if (existing) return res.status(409).json({ error: 'Trial pack already purchased' });
    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
      
      const order = await razorpay.orders.create({
        amount: AMOUNT_PAISE_TRIAL,
        currency: 'INR',
        receipt: `receipt_tr_${externalId.slice(0, 5)}_${Date.now()}`
      });
      return res.status(200).json({ ok: true, orderId: order.id, keyId });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to create trial order' });
    }
  }

  // PUT /api/razorpay?action=trial-order (Verify Payment)
  if (req.method === 'PUT' && action === 'trial-order') {
    if (!keySecret) return res.status(500).json({ error: 'Missing Razorpay server configuration' });
    const externalId = await getUserIdFromSession(req);
    if (!externalId) return res.status(401).json({ error: 'Unauthenticated' });
    const body = await readJsonBody(req);
    const paymentId = body.razorpay_payment_id;
    const orderId = body.razorpay_order_id;
    const signature = body.razorpay_signature;

    if (!paymentId || !orderId || !signature) return res.status(400).json({ error: 'Missing verification fields' });
    
    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });

    try {
      const now = new Date();
      let userRecord = await resolveUserInternalId(externalId);
      if (!userRecord) {
        userRecord = await prisma.user.create({
          data: {
            id: crypto.randomUUID(),
            clerkId: externalId,
            email: `unknown_${externalId}@domain.com`,
            role: 'USER',
            createdAt: now,
            updatedAt: now,
          }
        });
      }
      
      await prisma.entitlement.upsert({
        where: { userId_productKey: { userId: userRecord.id, productKey: PRODUCT_KEY_TRIAL } },
        create: {
          id: crypto.randomUUID(),
          userId: userRecord.id,
          productKey: PRODUCT_KEY_TRIAL,
          purchasedAt: now,
        },
        update: {},
      });

      return res.status(200).json({ ok: true });
    } catch (error: any) {
      return res.status(500).json({ error: error?.message || 'Failed to verify trial order' });
    }
  }

  res.status(404).json({ error: 'Not found' });
}
