// Vercel dynamic route: /api/entitlements/[key]
// Handles both trial (key=trial) and full-course (key=full-course) entitlement checks.
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../../utils/prisma.js';

const PRODUCT_KEY_MAP: Record<string, string> = {
  trial: 'TRIAL_SEVEN_DAY_FLOW',
  'full-course': 'FULL_COURSE_6_MONTHS',
};

const clerkClient = createClerkClient({
  secretKey: (process.env.CLERK_SECRET_KEY || '').trim(),
  publishableKey: (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const keyParam = req.query.key as string;
  const PRODUCT_KEY = PRODUCT_KEY_MAP[keyParam];
  if (!PRODUCT_KEY) {
    return res.status(404).json({ error: `Unknown entitlement key: ${keyParam}` });
  }

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

    if (!userId) return res.status(401).json({ error: 'Unauthenticated' });

    const user = await prisma.user.findFirst({
      where: { clerkId: userId },
    });

    if (!user) return res.status(200).json({ productKey: PRODUCT_KEY, hasPurchased: false });

    const existing = await prisma.entitlement.findUnique({
      where: { userId_productKey: { userId: user.id, productKey: PRODUCT_KEY } },
    });

    return res.status(200).json({ productKey: PRODUCT_KEY, hasPurchased: !!existing });
  } catch (error: any) {
    console.error(`Entitlement check error (${keyParam}):`, error);
    return res.status(500).json({ error: error.message });
  }
}
