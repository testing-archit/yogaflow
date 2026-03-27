import crypto from 'crypto';

type VercelRequest = any;
type VercelResponse = any;

const readJsonBody = async (req: any) => {
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(Buffer.from(chunk));
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? process.env.VITE_RAZORPAY_KEY_SECRET;
  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;
  if (!keySecret || !keyId) {
    res.status(500).json({ error: 'Missing Razorpay server configuration (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)' });
    return;
  }

  const body = await readJsonBody(req);
  const subscriptionId = typeof body.razorpay_subscription_id === 'string' ? body.razorpay_subscription_id : '';
  const paymentId = typeof body.razorpay_payment_id === 'string' ? body.razorpay_payment_id : '';
  const signature = typeof body.razorpay_signature === 'string' ? body.razorpay_signature : '';

  if (!subscriptionId || !paymentId || !signature) {
    res.status(400).json({ error: 'Missing verification fields' });
    return;
  }

  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${paymentId}|${subscriptionId}`)
    .digest('hex');

  if (expected !== signature) {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  try {
    const RazorpayModule: any = await import('razorpay');
    const Razorpay = RazorpayModule.default ?? RazorpayModule;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    res.status(200).json({ ok: true, subscription });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Verification succeeded but fetch failed' });
  }
}
