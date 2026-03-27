// File: /Users/archit/yogaflow/yogafloww/api/auth/me.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const matched = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return matched?.[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.cookies?.session || getCookieValue(req.headers.cookie, 'session');
  if (!token) return res.status(401).json({ error: 'Unauthenticated' });
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) return res.status(500).json({ error: 'Missing JWT_SECRET' });

    const payload = jwt.verify(token, jwtSecret) as { userId: string };
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl });
  } catch (e) {
    res.status(401).json({ error: 'Invalid session' });
  }
}
