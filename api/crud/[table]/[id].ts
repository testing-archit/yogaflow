// Vercel dynamic route: /api/crud/[table]/[id]
// Delegates to the main CRUD handler with `table` and `id` injected into req.query
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../index';

export default function tableIdHandler(req: VercelRequest, res: VercelResponse) {
  // req.query.table and req.query.id are automatically populated by Vercel file-based routing
  return handler(req, res);
}
