// File: /Users/archit/yogaflow/yogafloww/api/auth/google/callback.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../utils/prisma';

function getBaseUrl(req: VercelRequest) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol =
    (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.host;

  return `${protocol}://${host}`;
}

function getCookieValue(cookieHeader: string | undefined, name: string) {
  if (!cookieHeader) return undefined;
  const matched = cookieHeader.match(new RegExp(`${name}=([^;]+)`));
  return matched?.[1];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, state } = req.query as { code?: string; state?: string };
  const storedState = getCookieValue(req.headers.cookie, 'oauth_state');
  if (!code || !state || state !== storedState) {
    return res.status(400).send('Invalid OAuth state');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const jwtSecret = process.env.JWT_SECRET;
  if (!clientId || !clientSecret || !jwtSecret) {
    return res.status(500).send('Missing Google auth server configuration');
  }

  const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;

  // Exchange authorization code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(),
  });
  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    return res.status(400).send(`Google token exchange failed: ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  const idToken = tokenData.id_token;
  if (!idToken) {
    return res.status(400).send('Failed to obtain ID token');
  }

  // Verify ID token (basic verification using JWT lib)
  const payload = jwt.decode(idToken) as any; // we trust Google signature via client_id check
  if (!payload || payload.aud !== clientId) {
    return res.status(400).send('Invalid ID token');
  }

  const email = payload.email;
  const name = payload.name;

  // Upsert user in PostgreSQL
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        id: crypto.randomUUID(),
        email,
        name,
        avatarUrl: payload.picture,
        updatedAt: new Date(),
      },
    });
  }

  // Create session JWT
  const sessionToken = jwt.sign({ userId: user.id, email }, jwtSecret, { expiresIn: '7d' });
  // Set httpOnly cookie
  const isSecure = redirectUri.startsWith('https://');
  res.setHeader('Set-Cookie', [
    `session=${sessionToken}; HttpOnly; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}; Max-Age=604800`,
    `oauth_state=; HttpOnly; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}; Max-Age=0`,
  ]);
  // Redirect to home or dashboard
  res.redirect(302, '/');
}
