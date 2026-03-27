import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';

const PRODUCT_KEY = 'FULL_COURSE_6_MONTHS';
const AMOUNT_PAISE = 4499 * 100; // ₹4,499

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const matched = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return matched?.[1];
}

function getUserIdFromSession(req: VercelRequest) {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? process.env.VITE_RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    return res
      .status(500)
      .json({ error: 'Missing Razorpay server configuration (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)' });
  }

  const userId = getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

  if (req.method === 'POST') {
    const existing = await prisma.entitlement.findUnique({
      where: { userId_productKey: { userId, productKey: PRODUCT_KEY } },
    });
    if (existing) return res.status(409).json({ error: 'Full course already purchased' });

    try {
      const RazorpayModule: any = await import('razorpay');
      const Razorpay = RazorpayModule.default ?? RazorpayModule;
      const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

      const order = await razorpay.orders.create({
        amount: AMOUNT_PAISE,
        currency: 'INR',
        receipt: `full_${userId}_${Date.now()}`,
        notes: { userId, productKey: PRODUCT_KEY },
      });

      return res.status(200).json({ keyId, orderId: order.id, amount: AMOUNT_PAISE, currency: 'INR' });
    } catch (e: any) {
      return res.status(500).json({ error: e?.message || 'Failed to create order' });
    }
  }

  if (req.method === 'PUT') {
    const body = await readJsonBody(req);
    const orderId = typeof body.razorpay_order_id === 'string' ? body.razorpay_order_id : '';
    const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
    const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';

    if (!orderId || !paymentId || !signature) return res.status(400).json({ error: 'Missing verification fields' });

    const expected = crypto.createHmac('sha256', keySecret).update(`${orderId}|${paymentId}`).digest('hex');
    if (expected !== signature) return res.status(400).json({ error: 'Invalid signature' });

    try {
      await prisma.entitlement.create({
        data: {
          id: crypto.randomUUID(),
          userId,
          productKey: PRODUCT_KEY,
          purchasedAt: new Date(),
        },
      });
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (!msg.includes('unique') && !msg.includes('duplicate')) {
        return res.status(500).json({ error: e?.message || 'Failed to record entitlement' });
      }
    }

    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

