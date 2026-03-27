type VercelRequest = any;
type VercelResponse = any;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? process.env.VITE_RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'Missing Razorpay server configuration (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)' });
    return;
  }

  const subscriptionId = typeof req.query?.subscriptionId === 'string' ? req.query.subscriptionId : '';
  if (!subscriptionId) {
    res.status(400).json({ error: 'Missing subscriptionId' });
    return;
  }

  try {
    const RazorpayModule: any = await import('razorpay');
    const Razorpay = RazorpayModule.default ?? RazorpayModule;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    res.status(200).json({ subscription });
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'Failed to fetch subscription' });
  }
}
