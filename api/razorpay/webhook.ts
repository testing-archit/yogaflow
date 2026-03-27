import crypto from 'crypto';
import admin from 'firebase-admin';

type VercelRequest = any;
type VercelResponse = any;

const getRawBody = async (req: any) => {
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks);
};

const getAdminApp = () => {
  if (admin.apps.length > 0) return admin.app();
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error('Missing FIREBASE_SERVICE_ACCOUNT_JSON');
  const serviceAccount = JSON.parse(raw);
  return admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
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
    getAdminApp();
    const db = admin.firestore();

    const entity = event?.payload?.subscription?.entity;
    const paymentEntity = event?.payload?.payment?.entity;
    const userId = entity?.notes?.userId;

    if (!userId || typeof userId !== 'string') {
      res.status(200).json({ ok: true });
      return;
    }

    const status = typeof entity?.status === 'string' ? entity.status : undefined;
    const planId = typeof entity?.plan_id === 'string' ? entity.plan_id : undefined;
    const subscriptionId = typeof entity?.id === 'string' ? entity.id : undefined;
    const currentEnd = typeof entity?.current_end === 'number' ? entity.current_end : undefined;
    const paymentId = typeof paymentEntity?.id === 'string' ? paymentEntity.id : undefined;

    const updates: any = {
      status,
      razorpayPlanId: planId,
      razorpaySubscriptionId: subscriptionId,
      paymentId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    if (currentEnd) {
      updates.currentPeriodEnd = admin.firestore.Timestamp.fromDate(new Date(currentEnd * 1000));
    }

    await db.collection('subscription').doc(userId).set(updates, { merge: true });
    await db.collection('users').doc(userId).set(
      {
        planStatus: status,
        planUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        planCurrentPeriodEnd: currentEnd ? admin.firestore.Timestamp.fromDate(new Date(currentEnd * 1000)) : undefined,
      },
      { merge: true }
    );

    res.status(200).json({ ok: true });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Webhook handling failed' });
  }
}

