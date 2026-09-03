import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

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
  const placeholder = 'https://placehold.co/600x600/f8fafc/64748b?text=PCS+Product';
  const { id } = req.query;

  if (!id) {
    return res.redirect(placeholder);
  }

  const { clientId, clientSecret, refreshToken, orgId } = resolveZohoCredentials();

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    return res.redirect(placeholder);
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
      return res.redirect(placeholder);
    }

    const imgRes = await axios.get(
      `https://www.zohoapis.eu/inventory/v1/items/${encodeURIComponent(String(id))}/image?organization_id=${encodeURIComponent(orgId)}`,
      {
        headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
        responseType: 'arraybuffer',
        timeout: 6000,
        validateStatus: (s) => s < 500
      }
    );

    const contentType = String(imgRes.headers['content-type'] || '');
    if (imgRes.status === 200 && imgRes.data && contentType.includes('image')) {
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
      return res.send(Buffer.from(imgRes.data));
    }

    return res.redirect(placeholder);
  } catch {
    return res.redirect(placeholder);
  }
}
