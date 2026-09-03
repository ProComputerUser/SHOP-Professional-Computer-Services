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
 */
export async function fetchZohoItems(force = false): Promise<ZohoItem[]> {
  try {
    const url = force
      ? `/api/zoho/refresh?_t=${Date.now()}`
      : '/api/zoho/items';
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`[Zoho Fetch Status]: ${res.status}`);
      return [];
    }
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      if (Array.isArray(data.items)) return data.items;
      if (Array.isArray(data.rawItems)) return data.rawItems;
      if (Array.isArray(data.products)) return data.products;
      if (Array.isArray(data)) return data;
      return [];
    } catch (jsonErr) {
      console.warn('[Zoho Non-JSON Response Ignored]:', text.slice(0, 50));
      return [];
    }
  } catch (err) {
    console.error('[Zoho Network Error]:', err);
    return [];
  }
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
    console.error('Error in refreshZohoCatalog:', err);
    return { success: false, items: [], count: 0 };
  }
}
