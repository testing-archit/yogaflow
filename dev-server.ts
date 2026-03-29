import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Helper to wrap Vercel-style handlers into Express
function makeHandler(handlerModule: any) {
  return async (req: express.Request, res: express.Response) => {
    const handler = handlerModule.default;
    if (!handler) {
      res.status(500).json({ error: 'Handler not found' });
      return;
    }
    try {
      await handler(req, res);
    } catch (err: any) {
      console.error('Handler error:', err);
      res.status(500).json({ error: err?.message || 'Internal server error' });
    }
  };
}

// Dynamically load handlers - using dynamic imports at startup
async function startServer() {
  // Auth routes
  const meHandler = await import('./api/auth/me.js');
  app.all('/api/auth/me', makeHandler(meHandler));

  // Entitlement routes
  const trialEntHandler = await import('./api/entitlements/trial.js');
  app.all('/api/entitlements/trial', makeHandler(trialEntHandler));

  const fullCourseEntHandler = await import('./api/entitlements/full-course.js');
  app.all('/api/entitlements/full-course', makeHandler(fullCourseEntHandler));

  // Razorpay routes - map action-based routes
  const razorpayHandler = await import('./api/razorpay/[action].js');
  
  // All razorpay routes redirect to the action handler with proper query params
  app.all('/api/razorpay/:action', (req, res) => {
    // inject {action} into req.query to match Vercel's dynamic routing
    (req as any).query = { ...req.query, action: req.params.action };
    makeHandler(razorpayHandler)(req, res);
  });

  // CRUD routes
  const crudHandler = await import('./api/crud.js');
  app.all('/api/crud/:table', (req, res) => {
    (req as any).query = { ...req.query, table: req.params.table };
    makeHandler(crudHandler)(req, res);
  });
  app.all('/api/crud/:table/:id', (req, res) => {
    (req as any).query = { ...req.query, table: req.params.table, id: req.params.id };
    makeHandler(crudHandler)(req, res);
  });

  // Webhook routes
  const clerkWebhookHandler = await import('./api/webhooks/clerk.js');
  app.all('/api/webhooks/clerk', makeHandler(clerkWebhookHandler));

  app.listen(PORT, () => {
    console.log(`[API Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
