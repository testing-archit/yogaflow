import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

// Load .env first, then .env.local (local overrides)
dotenv.config({ path: '.env' });
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local', override: true });
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.raw({ type: '*/*', limit: '10mb' }));

// Helper to wrap Vercel-style handlers into Express.
// Express 5 made req.query a read-only getter, so we use a Proxy
// to inject extra query params (e.g. {action}, {table}) without mutating req.
function withQuery(req: express.Request, extra: Record<string, string | string[]>): any {
  return new Proxy(req, {
    get(target: any, prop: string | symbol) {
      if (prop === 'query') {
        return { ...target.query, ...extra };
      }
      const val = target[prop];
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}

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

  // Entitlement routes (dynamic: /api/entitlements/:key)
  const entitlementsHandler = await import('./api/entitlements/[key].js');
  app.all('/api/entitlements/:key', (req, res) => {
    makeHandler(entitlementsHandler)(withQuery(req, { key: req.params.key }), res);
  });

  // Razorpay routes
  const razorpayHandler = await import('./api/razorpay/index.js');
  app.all('/api/razorpay', makeHandler(razorpayHandler));

  // CRUD routes
  const crudHandler = await import('./api/crud/[...path].js');
  app.all('/api/crud/:table', (req, res) => {
    makeHandler(crudHandler)(withQuery(req, { path: [req.params.table] }), res);
  });
  app.all('/api/crud/:table/:id', (req, res) => {
    makeHandler(crudHandler)(withQuery(req, { path: [req.params.table, req.params.id] }), res);
  });

  // Assistant route
  const assistantHandler = await import('./api/assistant.js');
  app.all('/api/assistant', makeHandler(assistantHandler));

  // User route
  const userHandler = await import('./api/user/[action].js');
  app.all('/api/user/:action', (req, res) => {
    makeHandler(userHandler)(withQuery(req, { action: req.params.action }), res);
  });

  // Community route
  const communityHandler = await import('./api/community/index.js');
  app.all('/api/community', makeHandler(communityHandler));

  // Subscriptions route
  const subscriptionsHandler = await import('./api/subscriptions/index.js');
  app.all('/api/subscriptions', makeHandler(subscriptionsHandler));


  app.listen(PORT, () => {
    console.log(`[API Server] running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
