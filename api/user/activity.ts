import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../../utils/prisma.js';
import crypto from 'crypto';

const clerkClient = createClerkClient({
  secretKey: (process.env.CLERK_SECRET_KEY || '').trim(),
  publishableKey: (process.env.VITE_CLERK_PUBLISHABLE_KEY || '').trim(),
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = (req.headers?.authorization as string) || '';
    const cookieHeader = (req.headers?.cookie as string) || '';
    const fakeRequest = new Request(`http://localhost${req.url || '/'}`, {
      method: 'GET', // Internal req to verify token
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

    const { classId, durationMins } = req.body || {};

    if (!durationMins || typeof durationMins !== 'number') {
      return res.status(400).json({ error: 'Missing or invalid durationMins' });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    // Determine streak logic
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let newStreak = user.streak;
    let newLastActiveDate = user.lastActiveDate;

    if (user.lastActiveDate) {
      const lastActive = new Date(user.lastActiveDate);
      lastActive.setHours(0, 0, 0, 0);

      if (lastActive.getTime() === yesterday.getTime()) {
        // Logged in yesterday, increment streak
        newStreak += 1;
      } else if (lastActive.getTime() < yesterday.getTime()) {
        // Broke the streak (last active was before yesterday)
        newStreak = 1;
      }
      // If it's the same day, streak doesn't increase but stays valid
    } else {
      // First activity
      newStreak = 1;
    }

    newLastActiveDate = new Date();

    // 1. Log the Activity
    await prisma.userActivity.create({
      data: {
        userId: user.id,
        classId: typeof classId === 'string' ? classId : null,
        durationMins,
      }
    });

    // 2. Update the User cache variables
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        classesAttended: { increment: 1 },
        hoursPracticed: { increment: durationMins / 60 },
        streak: newStreak,
        lastActiveDate: newLastActiveDate,
        updatedAt: new Date(),
      }
    });

    res.json({
      success: true,
      classesAttended: updatedUser.classesAttended,
      hoursPracticed: updatedUser.hoursPracticed,
      streak: updatedUser.streak,
    });
  } catch (e: any) {
    console.error('Activity tracking error:', e);
    res.status(500).json({ error: 'Failed to record activity', details: e.message });
  }
}
