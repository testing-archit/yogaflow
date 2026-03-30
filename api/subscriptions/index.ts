import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../../utils/prisma.js';
import crypto from 'crypto';

const clerkClient = createClerkClient({
  secretKey: (process.env.CLERK_SECRET_KEY || '').trim(),
  publishableKey: (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim(),
});

async function getClerkUserId(req: VercelRequest): Promise<string | null> {
  try {
    const authHeader = (req.headers?.authorization as string) || '';
    const cookieHeader = (req.headers?.cookie as string) || '';
    const fakeRequest = new Request(`http://localhost${req.url || '/'}`, {
      method: req.method || 'GET',
      headers: {
        ...(authHeader ? { authorization: authHeader } : {}),
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
    });
    const requestState = await clerkClient.authenticateRequest(fakeRequest);
    const { userId } = requestState.toAuth();
    return userId || null;
  } catch {
    return null;
  }
}

// Map frontend field names to Prisma schema field names
function mapToPrismaFields(body: any) {
  const now = new Date();
  const mapped: any = { updatedAt: now };

  // planType / planId
  if (body.planType !== undefined) mapped.planId = String(body.planType);
  if (body.planId !== undefined) mapped.planId = String(body.planId);

  // status — convert to Prisma enum values
  if (body.status !== undefined) {
    const rawStatus = String(body.status).toUpperCase();
    // Map Razorpay status values to Prisma enum
    if (rawStatus === 'ACTIVE' || rawStatus === 'AUTHENTICATED' || rawStatus === 'CREATED') {
      mapped.status = 'ACTIVE';
    } else if (rawStatus === 'CANCELLED' || rawStatus === 'CANCELED') {
      mapped.status = 'CANCELLED';
    } else if (rawStatus === 'TRIAL') {
      mapped.status = 'TRIAL';
    } else {
      mapped.status = 'INACTIVE';
    }
  }

  // razorpaySubscriptionId → razorpaySubId
  if (body.razorpaySubscriptionId !== undefined) mapped.razorpaySubId = body.razorpaySubscriptionId;
  if (body.razorpaySubId !== undefined) mapped.razorpaySubId = body.razorpaySubId;

  // currentPeriodEnd / validUntil
  if (body.currentPeriodEnd !== undefined) {
    try { mapped.validUntil = new Date(body.currentPeriodEnd); } catch {}
  }
  if (body.validUntil !== undefined) {
    try { mapped.validUntil = new Date(body.validUntil); } catch {}
  }

  // paymentId — store in razorpaySubId if no subscriptionId given (one-time payment)
  if (body.paymentId !== undefined && !mapped.razorpaySubId) {
    // For one-time purchases, we store the payment ID as a note
    mapped.razorpaySubId = body.paymentId;
  }

  // trialEndsAt
  if (body.trialEndsAt !== undefined) {
    try { mapped.trialEndsAt = new Date(body.trialEndsAt); } catch {}
  }

  return mapped;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clerkUserId = await getClerkUserId(req);
  if (!clerkUserId) return res.status(401).json({ error: 'Unauthenticated' });

  // Find internal user record
  const userRecord = await prisma.user.findFirst({ where: { clerkId: clerkUserId } });
  if (!userRecord) return res.status(404).json({ error: 'User not found' });

  // GET — return current subscription
  if (req.method === 'GET') {
    try {
      const sub = await prisma.subscription.findUnique({ where: { userId: userRecord.id } });
      if (sub) {
        return res.status(200).json({
          ...sub,
          planType: sub.planId // Alias for backward compatibility with frontend checks
        });
      }
      return res.status(200).json(null);
    } catch (e: any) {
      return res.status(500).json({ error: e.message });
    }
  }

  // POST / PUT — upsert subscription
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const mapped = mapToPrismaFields(body);

      // If we're setting a planId that looks like a name, ensure it's stored
      if (body.planName && !mapped.planId) {
        mapped.planId = body.planName;
      }

      const existingSub = await prisma.subscription.findUnique({ where: { userId: userRecord.id } });

      let sub;
      if (existingSub) {
        sub = await prisma.subscription.update({
          where: { userId: userRecord.id },
          data: mapped,
        });
      } else {
        sub = await prisma.subscription.create({
          data: {
            id: crypto.randomUUID(),
            userId: userRecord.id,
            planId: mapped.planId || 'unknown',
            status: mapped.status || 'ACTIVE',
            razorpaySubId: mapped.razorpaySubId || null,
            validUntil: mapped.validUntil || null,
            trialEndsAt: mapped.trialEndsAt || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }

      return res.status(200).json({
        ...sub,
        planType: sub.planId
      });
    } catch (e: any) {
      console.error('Subscription upsert error:', e);
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
