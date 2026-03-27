// File: /Users/archit/yogaflow/yogafloww/api/auth/google.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';

function getBaseUrl(req: VercelRequest) {
  const protoHeader = req.headers['x-forwarded-proto'];
  const protocol =
    (Array.isArray(protoHeader) ? protoHeader[0] : protoHeader) ||
    (process.env.NODE_ENV === 'production' ? 'https' : 'http');
  const host = req.headers.host;

  return `${protocol}://${host}`;
}

// Initiates Google OAuth flow by redirecting the user to Google's consent screen.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(500).send('Missing GOOGLE_CLIENT_ID');
  }

  const redirectUri = `${getBaseUrl(req)}/api/auth/google/callback`;
  const state = Math.random().toString(36).substring(2, 15); // simple CSRF token (store in cookie)
  const scope = encodeURIComponent('openid email profile');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}&prompt=select_account`;

  // Set state cookie for verification later (httpOnly, secure)
  const isSecure = redirectUri.startsWith('https://');
  res.setHeader(
    'Set-Cookie',
    `oauth_state=${state}; HttpOnly; Path=/; SameSite=Lax${isSecure ? '; Secure' : ''}`
  );
  res.redirect(302, authUrl);
}
