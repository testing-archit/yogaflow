import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../../utils/prisma.js';
import crypto from 'crypto';

const clerkClient = createClerkClient({
  secretKey: (process.env.CLERK_SECRET_KEY || '').trim(),
  publishableKey: (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Build a proper Request so Clerk can see the Authorization Bearer token
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

    if (!userId) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    // Find the user in Neon by clerkId
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      // If user exists in Clerk but not Neon yet, we might want to trigger a sync
      // or just return 404 until the webhook arrives.
      // For resilience, let's try to fetch user from Clerk and create if missing
      const clerkUser = await clerkClient.users.getUser(userId);
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      const name = `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim();

      if (email) {
        const newUser = await prisma.user.upsert({
          where: { clerkId: userId },
          update: { email, name: name || undefined },
          create: {
            id: crypto.randomUUID(),
            clerkId: userId,
            email,
            name: name || null,
            updatedAt: new Date(),
          }
        });
        return res.json({ id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, avatarUrl: newUser.avatarUrl });
      }

      return res.status(404).json({ error: 'User not found in database' });
    }

    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl });
  } catch (e: any) {
    console.error('Auth error:', e);
    res.status(401).json({ error: 'Invalid session', details: e.message });
  }
}
