// Vercel dynamic route: /api/crud/[table]
// Delegates to the main CRUD handler with `table` injected into req.query
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './index';

export default function tableHandler(req: VercelRequest, res: VercelResponse) {
  // req.query.table is automatically populated by Vercel file-based routing
  return handler(req, res);
}
