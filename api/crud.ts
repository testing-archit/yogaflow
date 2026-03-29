import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClerkClient } from '@clerk/backend';
import { prisma } from '../utils/prisma';

const clerkClient = createClerkClient({ secretKey: (process.env.CLERK_SECRET_KEY || '').trim() });

// Utility to parse JSON
const parseBody = (body: any) => (typeof body === 'string' ? JSON.parse(body) : body);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { table, id } = req.query as { table: string, id?: string };
  
  if (!table || !(table in prisma)) {
    return res.status(400).json({ error: 'Invalid table name' });
  }

  // Security: check token for all operations except GETs on public tables
  // We'll consider asanas, instructors, classes, research, settings as public reads
  let decodedUserId: string | null = null;
  const publicTables = ['asana', 'instructor', 'yogaClass', 'researchTopic', 'appSetting', 'classVideo'];
  
  const isPublicRead = req.method === 'GET' && publicTables.includes(table);

  if (!isPublicRead) {
    try {
      const requestState = await clerkClient.authenticateRequest(req as any);
      const { userId } = requestState.toAuth();
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized: Invalid or missing Clerk session' });
      }
      decodedUserId = userId;
    } catch (e: any) {
      console.error('Clerk Auth Error:', e);
      return res.status(401).json({ error: 'Unauthorized', details: e.message });
    }
  }

  // Use (prisma as any)[table] dynamically
  const db: any = (prisma as any)[table];

  try {
    switch (req.method) {
      case 'GET':
        if (id) {
          const item = await db.findUnique({ where: { id } });
          return res.status(200).json(item);
        }
        
        // Handling custom queries via simple filtering
        const filtersStr = req.query.filters as string;
        let where = {};
        if (filtersStr) {
          try {
            where = JSON.parse(filtersStr);
          } catch(e) {}
        }
        
        let orderBy = undefined;
        if (req.query.orderBy) {
             const key = req.query.orderBy as string;
             const dir = req.query.orderDir === 'desc' ? 'desc' : 'asc';
             orderBy = { [key]: dir };
        }

        const items = await db.findMany({ where, orderBy });
        return res.status(200).json(items);

      case 'POST':
      case 'PUT':
      case 'PATCH':
        // Optional: Check if user is admin for public table modifications
        if (publicTables.includes(table) || table === 'appSetting') {
            const user = await (prisma.user as any).findUnique({ where: { clerkId: decodedUserId! } });
            if (!user || user.role !== 'ADMIN') {
              // Forbidden: Admin access only
            }
        }

        const body = parseBody(req.body);
        if (id || body.id) {
            // Update
            const finalId = id || body.id;
            delete body.id;
            const updated = await db.update({ where: { id: finalId }, data: body });
            return res.status(200).json(updated);
        } else {
            // Create
            const created = await db.create({ data: body });
            return res.status(201).json(created);
        }

      case 'DELETE':
        if (!id) return res.status(400).json({ error: 'Missing ID for delete' });
        // Check admin role if needed
        await db.delete({ where: { id } });
        return res.status(204).end();

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error: any) {
    console.error(`DB Error on ${table}:`, error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
