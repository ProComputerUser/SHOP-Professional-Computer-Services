import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
  const hasSecretKey = !!(process.env.STRIPE_SECRET_KEY || '').trim();

  res.status(200).json({
    publishableKey,
    isConfigured: !!(publishableKey && hasSecretKey)
  });
}
