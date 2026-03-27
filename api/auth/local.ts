import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../utils/prisma';

function getBaseUrl(req: VercelRequest) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol =
    (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.host;

  return `${protocol}://${host}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) return res.status(500).json({ error: 'Missing JWT_SECRET' });

  const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  const email = (body?.email as string | undefined)?.trim().toLowerCase();
  const name = (body?.name as string | undefined)?.trim();
  if (!email) return res.status(400).json({ error: 'Missing email' });

  const existing = await prisma.user.findUnique({ where: { email } });
  const user =
    existing ??
    (await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name: name || null,
        updatedAt: new Date(),
      },
    }));

  const sessionToken = jwt.sign({ userId: user.id, email: user.email }, jwtSecret, { expiresIn: '7d' });

  const baseUrl = getBaseUrl(req);
  const isSecure = baseUrl.startsWith('https://');
  res.setHeader(
    'Set-Cookie',
    `session=${sessionToken}; HttpOnly; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}; Max-Age=604800`
  );

  return res.status(200).json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
  });
}

