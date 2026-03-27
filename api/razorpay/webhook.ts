import crypto from 'crypto';
import { prisma } from '../../utils/prisma';

type VercelRequest = any;
type VercelResponse = any;

const getRawBody = async (req: any) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).send('Method not allowed');
    return;
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    res.status(500).send('Missing webhook secret');
    return;
  }

  const rawBody = await getRawBody(req);
  const signature = req.headers['x-razorpay-signature'] as string | undefined;
  if (!signature) {
    res.status(400).send('Missing signature');
    return;
  }

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  if (expected !== signature) {
    res.status(400).send('Invalid signature');
    return;
  }

  let event: any = null;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).send('Invalid JSON');
    return;
  }

  try {
    const entity = event?.payload?.subscription?.entity;
    const userId = entity?.notes?.userId;

    if (!userId || typeof userId !== 'string') {
      res.status(200).json({ ok: true });
      return;
    }

    const status = typeof entity?.status === 'string' ? entity.status.toUpperCase() : undefined;
    const planId = typeof entity?.plan_id === 'string' ? entity.plan_id : undefined;
    const subscriptionId = typeof entity?.id === 'string' ? entity.id : undefined;
    const currentEnd = typeof entity?.current_end === 'number' ? new Date(entity.current_end * 1000) : undefined;

    // Prisma: Update or create subscription
    const existingSub = await prisma.subscription.findUnique({ where: { userId } });
    if (existingSub) {
       await prisma.subscription.update({
         where: { userId },
         data: {
           status: status as any || existingSub.status,
           planId: planId || existingSub.planId,
           razorpaySubId: subscriptionId || existingSub.razorpaySubId,
           validUntil: currentEnd || existingSub.validUntil,
         }
       });
    } else {
       await prisma.subscription.create({
         data: {
           userId,
           planId: planId || 'unknown',
           status: status as any || 'INACTIVE',
           razorpaySubId: subscriptionId,
           validUntil: currentEnd
         }
       });
    }

    // Prisma: Update user record
    const existingUser = await prisma.user.findUnique({ where: { firebaseId: userId } });
    if (!existingUser) {
        // Create skeleton if they never logged in properly before webhook ping
        await prisma.user.create({
            data: {
                firebaseId: userId,
                email: entity?.notes?.email || 'unknown@domain.com',
                name: entity?.notes?.name || 'Unknown',
            }
        });
    }

    res.status(200).json({ ok: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error?.message || 'Webhook handling failed' });
  }
}

