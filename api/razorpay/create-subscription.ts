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

  const keyId = process.env.RAZORPAY_KEY_ID ?? process.env.VITE_RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET ?? process.env.VITE_RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    res.status(500).json({ error: 'Missing Razorpay server configuration (set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET)' });
    return;
  }

  const body = await readJsonBody(req);
  const planId = typeof body.planId === 'string' ? body.planId.trim() : '';
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const customerEmail = typeof body.email === 'string' ? body.email.trim() : '';
  const customerName = typeof body.name === 'string' ? body.name.trim() : '';
  const trialDaysRaw = Number(body.trialDays);
  const trialDays = Number.isFinite(trialDaysRaw) && trialDaysRaw > 0 ? Math.min(trialDaysRaw, 60) : 0; // cap at 60 days for safety

  if (!planId) {
    res.status(400).json({ error: 'Missing planId' });
    return;
  }

  const totalCountRaw = Number(body.totalCount);
  const totalCount = Number.isFinite(totalCountRaw) && totalCountRaw > 0 ? totalCountRaw : 24;

  try {
    const RazorpayModule: any = await import('razorpay');
    const Razorpay = RazorpayModule.default ?? RazorpayModule;
    const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

    const payload: any = {
      plan_id: planId,
      customer_notify: 1,
      total_count: totalCount,
      notes: {
        userId,
        email: customerEmail,
        name: customerName,
      },
    };

    // Implement free trial by setting a future start date
    if (trialDays > 0) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const startAt = nowSeconds + trialDays * 24 * 60 * 60;
      payload.start_at = startAt;
    }

    const subscription = await razorpay.subscriptions.create(payload);

    res.status(200).json({
      subscriptionId: subscription.id,
      subscription,
      keyId,
    });
  } catch (error: any) {
    res.status(500).json({
      error: error?.message || 'Failed to create subscription',
    });
  }
}
