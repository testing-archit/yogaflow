import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../../utils/prisma';

const PRODUCT_KEY = 'TRIAL_SEVEN_DAY_FLOW';
const clerkClient = createClerkClient({
  secretKey: (process.env.CLERK_SECRET_KEY || '').trim(),
  publishableKey: (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

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

    // Find internal user ID
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ clerkId: userId }, { firebaseId: userId }]
      }
    });

    if (!user) return res.status(200).json({ productKey: PRODUCT_KEY, hasPurchased: false });

    const existing = await prisma.entitlement.findUnique({
      where: { userId_productKey: { userId: user.id, productKey: PRODUCT_KEY } },
    });

    return res.status(200).json({ productKey: PRODUCT_KEY, hasPurchased: !!existing });
  } catch (error: any) {
    console.error('Trial entitlement check error:', error);
    return res.status(500).json({ error: error.message });
  }
}
