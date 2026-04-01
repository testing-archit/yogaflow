// api/auth/google/callback.ts
// This endpoint is no longer used. Google OAuth is now handled via Supabase Auth.
// Supabase redirects the user back to the frontend after OAuth; no server-side callback needed.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  // Redirect to home — Supabase will have already set the session via URL fragment
  return res.redirect(302, '/');
}
