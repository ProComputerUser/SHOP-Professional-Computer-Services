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

function loadFallbackCatalog() {
  try {
    const catalogPath = path.join(process.cwd(), 'public', 'zoho-catalog.json');
    if (fs.existsSync(catalogPath)) {
      return JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
    }
  } catch (err) {
    console.warn('Error reading fallback catalog:', err);
  }
  return { items: [], count: 0 };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { clientId, clientSecret, refreshToken, orgId } = resolveZohoCredentials();

  if (!clientId || !clientSecret || !refreshToken || !orgId) {
    const catalog = loadFallbackCatalog();
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    return res.status(200).json(catalog);
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
        timeout: 8000
      }
    );

    const accessToken = tokenRes.data?.access_token;
    if (!accessToken) {
      const catalog = loadFallbackCatalog();
      return res.status(200).json(catalog);
    }

    // Fetch active items across pages
    const allItems: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) {
      const itemsRes = await axios.get(
        `https://www.zohoapis.eu/inventory/v1/items?organization_id=${encodeURIComponent(orgId)}&filter_by=Status.Active&page=${page}&per_page=200`,
        {
          headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
          timeout: 10000
        }
      );

      const items = itemsRes.data?.items || [];
      allItems.push(...items);

      const pageContext = itemsRes.data?.page_context;
      hasMore = pageContext ? Boolean(pageContext.has_more_page) : items.length === 200;
      page++;
    }

    const withWebsiteCat = allItems.filter((it: any) => it.cf_website_category || it.custom_field_hash?.cf_website_category);

    if (withWebsiteCat.length > 0) {
      res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=300');
      return res.status(200).json({
        items: withWebsiteCat,
        count: withWebsiteCat.length,
        syncedAt: new Date().toISOString()
      });
    }

    const catalog = loadFallbackCatalog();
    return res.status(200).json(catalog);
  } catch (err: any) {
    console.warn('[Vercel API Zoho Items Notice]:', err.message);
    const catalog = loadFallbackCatalog();
    return res.status(200).json(catalog);
  }
}
