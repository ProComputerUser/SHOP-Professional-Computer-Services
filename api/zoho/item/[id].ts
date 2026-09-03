import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

function resolveZohoCredentials() {
  const clientId = (process.env.ZOHO_CLIENT_ID || '').trim().replace(/^['"]|['"]$/g, '');
  const clientSecret = (process.env.ZOHO_CLIENT_SECRET || '').trim().replace(/^['"]|['"]$/g, '');
  let refreshToken = (process.env.ZOHO_REFRESH_TOKEN || '').trim().replace(/^['"]|['"]$/g, '');
  const apiDomain = (process.env.ZOHO_API_DOMAIN || '').trim().replace(/^['"]|['"]$/g, '');
  const orgId = (process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_ORG_ID || '').trim().replace(/^['"]|['"]$/g, '');

  if (apiDomain && apiDomain.startsWith('1000.') && !refreshToken.startsWith('1000.')) {
    refreshToken = apiDomain;
  }

  return { clientId, clientSecret, refreshToken, orgId };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: 'Item ID required' });
  }

  const { clientId, clientSecret, refreshToken, orgId } = resolveZohoCredentials();

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    // Fallback to static catalog item
    try {
      const catalogPath = path.join(process.cwd(), 'public', 'zoho-catalog.json');
      if (fs.existsSync(catalogPath)) {
        const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
        const item = catalog.items?.find((it: any) => String(it.item_id) === String(id) || String(it.id) === String(id));
        if (item) {
          return res.status(200).json({ item });
        }
      }
    } catch {
      // ignore
    }
    return res.status(404).json({ error: 'Item not found' });
  }

  try {
    const tokenRes = await axios.post(
      'https://accounts.zoho.eu/oauth/v2/token',
      null,
      {
        params: {
          refresh_token: refreshToken,
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: 'refresh_token'
        },
        timeout: 5000
      }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      return res.status(500).json({ error: 'Auth failed' });
    }

    const itemRes = await axios.get(
      `https://www.zohoapis.eu/inventory/v1/items/${encodeURIComponent(String(id))}?organization_id=${encodeURIComponent(orgId)}`,
      {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        timeout: 6000
      }
    );

    return res.status(200).json({ item: itemRes.data?.item });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Error fetching item' });
  }
}
