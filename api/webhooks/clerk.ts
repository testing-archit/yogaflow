import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Webhook } from 'svix';
import { prisma } from '../../utils/prisma.js';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return res.status(500).json({ error: 'Missing webhook secret' });
  }

  // Get the headers
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return res.status(400).json({ error: 'Missing svix headers' });
  }

  // Get the body
  const payload = req.body;
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret.
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }

  // Handle the webhook
  const { id } = evt.data;
  const eventType = evt.type;

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const { email_addresses, first_name, last_name, profile_image_url } = evt.data;
    const email = email_addresses?.[0]?.email_address;
    const name = `${first_name || ''} ${last_name || ''}`.trim();

    if (!email) {
      return res.status(400).json({ error: 'Missing email in Clerk event' });
    }

    try {
      // Upsert user into Neon via Prisma
      const user = await prisma.user.upsert({
        where: { clerkId: id },
        update: {
          email,
          name: name || undefined,
          avatarUrl: profile_image_url || undefined,
          updatedAt: new Date(),
        },
        create: {
          id: crypto.randomUUID(), // Internal ID
          clerkId: id,
          email,
          name: name || null,
          avatarUrl: profile_image_url || null,
          updatedAt: new Date(),
        },
      });

      console.log(`User ${user.id} synchronized from Clerk event ${eventType}`);
      return res.status(200).json({ success: true, userId: user.id });
    } catch (err) {
      console.error('Error upserting user in Prisma:', err);
      return res.status(500).json({ error: 'Database sync failure' });
    }
  }

  return res.status(200).json({ received: true });
}
