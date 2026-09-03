import axios from 'axios';

export interface ZohoItem {
  item_id: string;
  name: string;
  sku?: string;
  description?: string;
  rate?: number;
  unit_price?: number;
  actual_available_stock?: number;
  stock_on_hand?: number;
  category_name?: string;
  unit?: string;
  status?: string;
  brand?: string;
  image_document_id?: string;
  [key: string]: any;
}

/**
 * Clears any stale localStorage cache for catalog items upon refresh
 */
export function clearLocalCatalogCache(): void {
  try {
    const keysToRemove = [
      'zoho_cached_products',
      'zoho_cached_items',
      'techshop_zoho_products',
      'techshop_products',
      'zoho_raw_items',
      'zoho_last_sync'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    console.log('🧹 [Cache Buster] Cleared stale localStorage catalog cache.');
  } catch (err) {
    console.warn('Notice clearing local storage cache:', err);
  }
}

/**
 * Fetches active inventory items from Zoho Inventory API via backend proxy endpoint.
 * When force=true, bypasses server and client cache and queries Zoho live.
 * If backend endpoint is unavailable (e.g., on Vercel static deployment), automatically falls back to bundled static catalog.
 */
export async function fetchZohoItems(force = false): Promise<ZohoItem[]> {
  try {
    const url = force
      ? `/api/zoho/refresh?_t=${Date.now()}`
      : '/api/zoho/items';
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        const items = Array.isArray(data.items)
          ? data.items
          : (Array.isArray(data.rawItems)
            ? data.rawItems
            : (Array.isArray(data.products) ? data.products : (Array.isArray(data) ? data : [])));
        if (items.length > 0) return items;
      } catch (jsonErr) {
        console.warn('[Zoho Non-JSON Response Ignored]:', text.slice(0, 50));
      }
    } else {
      console.warn(`[Zoho Fetch Status]: ${res.status}`);
    }
  } catch (err) {
    console.warn('[Zoho Network Error, attempting static catalog fallback]:', err);
  }

  // Seamless fallback for Vercel deployment and offline mode
  try {
    const staticRes = await fetch(`/zoho-catalog.json?v=${Date.now()}`);
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      const items = Array.isArray(staticData.items) ? staticData.items : (Array.isArray(staticData) ? staticData : []);
      if (items.length > 0) {
        console.log(`📦 [Catalog Service] Loaded ${items.length} items from bundled catalog.`);
        return items;
      }
    }
  } catch (staticErr) {
    console.warn('[Catalog Service] Static catalog fallback error:', staticErr);
  }

  return [];
}

/**
 * Fetches full single-item detail from Zoho via backend proxy endpoint.
 * Unlike the bulk List Items endpoint (fetchZohoItems), Zoho's per-item
 * "Get an Item" endpoint returns the complete item object, including the
 * full `description` field, which the list endpoint omits.
 */
export async function fetchZohoItemDetail(itemId: string): Promise<ZohoItem | null> {
  try {
    const res = await fetch(`/api/zoho/item/${encodeURIComponent(itemId)}`);
    if (!res.ok) {
      console.warn(`[Zoho Item Detail Fetch Status]: ${res.status} for item ${itemId}`);
      return null;
    }
    const data = await res.json();
    return data?.item || null;
  } catch (err) {
    console.warn(`[Zoho Item Detail Fetch Error] for item ${itemId}:`, err);
    return null;
  }
}

/**
 * Clears local cache and triggers a fresh catalog reload from Zoho
 */
export async function refreshZohoCatalog(): Promise<{ success: boolean; items: any[]; count: number }> {
  clearLocalCatalogCache();
  try {
    const res = await fetch(`/api/zoho/refresh?_t=${Date.now()}`);
    if (!res.ok) {
      console.warn(`[Zoho Refresh Status]: ${res.status}`);
      return { success: false, items: [], count: 0 };
    }
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      const items = Array.isArray(data.items) ? data.items : (Array.isArray(data.products) ? data.products : []);
      return {
        success: Boolean(data.success !== false),
        items,
        count: data.count || items.length
      };
    } catch (jsonErr) {
      console.warn('[Zoho Non-JSON Response Ignored]:', text.slice(0, 50));
      return { success: false, items: [], count: 0 };
    }
  } catch (err: any) {
    console.warn('Live refresh endpoint unavailable, falling back to static catalog:', err.message);
  }

  // Fallback to static catalog on Vercel
  try {
    const staticRes = await fetch(`/zoho-catalog.json?_t=${Date.now()}`);
    if (staticRes.ok) {
      const staticData = await staticRes.json();
      const items = Array.isArray(staticData.items) ? staticData.items : (Array.isArray(staticData) ? staticData : []);
      return {
        success: true,
        items,
        count: items.length
      };
    }
  } catch (staticErr) {
    console.warn('Static catalog fallback error:', staticErr);
  }

  return { success: false, items: [], count: 0 };
}
