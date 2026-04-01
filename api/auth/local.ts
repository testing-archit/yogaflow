// api/auth/local.ts — Legacy local-auth endpoint.
// With Supabase migration, auth is fully handled by Supabase Auth.
// This file is kept as a no-op redirect to avoid 404s from old clients.
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  return res.status(410).json({
    error: 'This endpoint is deprecated. Please use Supabase Auth.',
  });
}
