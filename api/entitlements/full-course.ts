import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';

const PRODUCT_KEY = 'FULL_COURSE_6_MONTHS';

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const userId = getUserIdFromSession(req);
  if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

  const existing = await prisma.entitlement.findUnique({
    where: { userId_productKey: { userId, productKey: PRODUCT_KEY } },
  });

  return res.status(200).json({ productKey: PRODUCT_KEY, hasPurchased: !!existing });
}

