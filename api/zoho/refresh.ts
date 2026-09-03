import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './items.js';

export default async function refreshHandler(req: VercelRequest, res: VercelResponse) {
  // Delegate to items handler with no-cache header
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  return handler(req, res);
}
