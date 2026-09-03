import { fetchZohoItems, fetchZohoItemDetail, ZohoItem, clearLocalCatalogCache } from './zohoService.js';
import { parseCategoryHierarchy, extractZohoExactDescription } from './mapCategory.js';
import { db, sanitizeForFirestore } from './firebaseConfig.js';
import { doc, setDoc } from 'firebase/firestore';

export const KNOWN_BRANDS = [
  'CANON', 'HP', 'EPSON', 'BROTHER', 'DELL', 'LENOVO', 'ASUS', 'ACER', 'APPLE',
  'SAMSUNG', 'LOGITECH', 'PROMETHEAN', 'MICROSOFT', 'TP-LINK', 'D-LINK', 'CISCO',
  'KINGSTON', 'CORSAIR', 'CRUCIAL', 'SEAGATE', 'WD', 'WESTERN DIGITAL', 'SANDISK',
  'NETGEAR', 'SYNOLOGY', 'QNAP', 'INTEL', 'AMD', 'NVIDIA', 'MSI', 'GIGABYTE',
  'VIEWSONIC', 'BENQ', 'PHILIPS', 'AOC', 'LG', 'SONY', 'JBL', 'JABRA', 'PLANTRONICS',
  'POLY', 'YEALINK', 'SNOM', 'FANVIL', 'GRANDSTREAM', 'DYMO', 'KYOCERA',
  'RICOH', 'LEXMARK', 'OKI', 'XEROX', 'PANASONIC'
];

export const extractBrand = (item: any): string => {
  if (!item) return 'Generic';

  if (item.brand && typeof item.brand === 'string' && item.brand.trim().length > 0) {
    const b = item.brand.trim();
    if (b.toLowerCase() !== 'professional computers' && b.toLowerCase() !== 'zoho') {
      return b;
    }
  }

  if (item.manufacturer && typeof item.manufacturer === 'string' && item.manufacturer.trim().length > 0) {
    const m = item.manufacturer.trim();
    if (m.toLowerCase() !== 'professional computers' && m.toLowerCase() !== 'zoho') {
      return m;
    }
  }

  // Check custom fields / custom_field_hash
  if (item.custom_field_hash && typeof item.custom_field_hash === 'object') {
    const h = item.custom_field_hash;
    const b = h.brand || h.cf_brand || h.manufacturer || h.cf_manufacturer;
    if (typeof b === 'string' && b.trim().length > 0 && b.toLowerCase() !== 'professional computers') {
      return b.trim();
    }
  }

  if (Array.isArray(item.custom_fields)) {
    for (const f of item.custom_fields) {
      const label = (f.label || f.name || f.field_name || f.api_name || '').toLowerCase();
      if ((label === 'brand' || label === 'manufacturer' || label === 'cf_brand') && f.value) {
        const val = String(f.value).trim();
        if (val && val.toLowerCase() !== 'professional computers') {
          return val;
        }
      }
    }
  }

  // Fallback: extract first word of title if it matches known brands like Canon, HP, etc.
  const title = (item.name || item.item_name || '').trim();
  const firstWord = title ? title.split(/[\s\-_]+/)[0] : '';
  const upperFirstWord = firstWord.toUpperCase();

  const foundBrand = KNOWN_BRANDS.find((b) => b === upperFirstWord);
  if (foundBrand) {
    return firstWord.length <= 3
      ? firstWord.toUpperCase()
      : firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
  }

  return ['CANON', 'HP', 'EPSON', 'BROTHER'].includes(upperFirstWord)
    ? upperFirstWord
    : 'Generic'; // Avoids displaying "Professional Computers" as a product brand
};

export function extractProductDescription(item: any): string {
  if (!item) return 'No description available';

  const desc =
    item.description ||
    item.cf_website_description ||
    item.cf_product_description ||
    item.cf_description ||
    item.purchase_description ||
    item.item_description;

  if (typeof desc === 'string' && desc.trim().length > 0) {
    return desc.trim();
  }

  // 2. Custom field hash check
  if (item.custom_field_hash && typeof item.custom_field_hash === 'object') {
    const h = item.custom_field_hash;
    const hashDesc =
      h.description ||
      h.cf_website_description ||
      h.cf_product_description ||
      h.cf_description ||
      h.purchase_description ||
      h.item_description;
    if (typeof hashDesc === 'string' && hashDesc.trim().length > 0) {
      return hashDesc.trim();
    }
    for (const [key, val] of Object.entries(item.custom_field_hash)) {
      const lower = key.toLowerCase();
      if (
        (lower.includes('website_description') ||
         lower.includes('product_description') ||
         lower.includes('description')) &&
        typeof val === 'string' &&
        val.trim().length > 0
      ) {
        return val.trim();
      }
    }
  }

  // 3. Custom fields array check
  if (Array.isArray(item.custom_fields)) {
    for (const f of item.custom_fields) {
      const label = (f.label || f.name || f.field_name || f.api_name || '').toLowerCase();
      if (
        (label.includes('website description') ||
         label.includes('product description') ||
         label.includes('website_description') ||
         label.includes('cf_website_description') ||
         label.includes('description')) &&
        f.value &&
        typeof f.value === 'string' &&
        f.value.trim().length > 0
      ) {
        return f.value.trim();
      }
    }
  }

  return 'No description available';
}

export function extractProductPrice(item: any): number {
  if (!item) return 0;

  const candidates = [
    item.rate,
    item.sales_rate,
    item.price,
    item.unit_price,
    item.pricebook_rate,
    item.custom_field_hash?.cf_price,
    item.custom_field_hash?.cf_selling_price,
    item.custom_field_hash?.price
  ];

  if (Array.isArray(item.custom_fields)) {
    for (const f of item.custom_fields) {
      const name = (f.api_name || f.placeholder_name || f.label || '').toLowerCase();
      if (name.includes('price') || name.includes('selling') || name.includes('rate')) {
        candidates.push(f.value);
      }
    }
  }

  for (const c of candidates) {
    if (c !== undefined && c !== null && c !== '') {
      if (typeof c === 'number' && !isNaN(c) && c > 0) {
        return Math.round(c * 100) / 100;
      }
      if (typeof c === 'string') {
        const cleaned = c.replace(/[^0-9.-]/g, '').trim();
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 0) {
          return Math.round(parsed * 100) / 100;
        }
      }
    }
  }

  const fallback = Number(item.rate ?? item.price ?? item.unit_price ?? 0);
  return isNaN(fallback) ? 0 : Math.round(fallback * 100) / 100;
}

export function transformZohoItemToProduct(item: any) {
  const description =
    item.description ||
    item.cf_website_description ||
    item.cf_product_description ||
    item.cf_description ||
    item.purchase_description ||
    item.item_description ||
    'No description available';

  const product = {
    ...item,
    id: item.item_id || item.id,
    name: item.name || item.item_name,
    sku: item.sku || item.item_code || '',
    price: extractProductPrice(item),
    brand: extractBrand(item),
    description: description,
    overview: description,
    category: item.cf_website_category || item.category_name || '',
    subcategory: item.cf_website_subcategory || item.subcategory_name || '',
  };

  return product;
}

export interface NormalizedProduct {
  zohoItemId: string;
  sku: string;
  name: string;
  brand: string;
  description: string;
  overview?: string;
  price: number;
  stockQuantity: number;
  category: string;
  parentCategory?: string;
  subcategory?: string;
  unit: string;
  status: 'In Stock' | 'Out of Stock';
  image?: string;
  images?: string[];
  lastSyncedAt: string;
}

export async function syncZohoInventoryToStorefront(force = false): Promise<NormalizedProduct[] | undefined> {
  console.log(`🔄 Starting Zoho Inventory sync (force=${force}) using custom Website Category...`);
  if (force) {
    clearLocalCatalogCache();
  }
  
  try {
    const fetched = await fetchZohoItems(force);
    const rawZohoItems: ZohoItem[] = Array.isArray(fetched) ? fetched : [];
    console.log(`📦 Retrieved ${rawZohoItems.length} active items from Zoho.`);
    console.log('SYNC_TOTAL_ITEMS_PAGINATED:', rawZohoItems.length);

    // Strictly enforce cf_website_category filter (ignoring internal/discontinued items)
    const validWebsiteItems = rawZohoItems.filter((item: any) => {
      const websiteCategory = item.cf_website_category || item.custom_field_hash?.cf_website_category;
      return typeof websiteCategory === 'string' && websiteCategory.trim().length > 0;
    });

    console.log(`🎯 Filtered strictly to ${validWebsiteItems.length} products with cf_website_category.`);
    console.log('SYNC_TOTAL_MATCHED_ITEMS:', validWebsiteItems.length);

    // Zoho's bulk List Items endpoint does not return the full `description`
    // field (only the single-item "Get an Item" endpoint does). For any item
    // where we can't already extract a usable description from the list
    // response, fetch its full detail and merge it in before continuing.
    // Requests are batched to stay well under Zoho's rate limits (100/min,
    // 10 concurrent).
    const itemsNeedingDetail = validWebsiteItems.filter((item) => {
      const desc = extractProductDescription(item);
      return !desc || desc === 'No description available';
    });

    if (itemsNeedingDetail.length > 0) {
      console.log(`📝 ${itemsNeedingDetail.length} item(s) missing description in list response — fetching full detail from Zoho...`);
      const CONCURRENCY = 5;
      for (let i = 0; i < itemsNeedingDetail.length; i += CONCURRENCY) {
        const batch = itemsNeedingDetail.slice(i, i + CONCURRENCY);
        await Promise.all(
          batch.map(async (item) => {
            const detail = await fetchZohoItemDetail(item.item_id);
            if (detail) {
              Object.assign(item, detail, {
                actual_available_stock: item.actual_available_stock,
                stock_on_hand: item.stock_on_hand,
              });
            }
          })
        );
      }
      console.log('✅ Finished enriching items with full Zoho item detail.');
    }

    if (validWebsiteItems.length > 0) {
      const sample = validWebsiteItems[0] as any;
      console.log('ZOHO_DESCRIPTION_KEYS_SAMPLE:', {
        item_desc: sample.item_desc,
        product_description: sample.product_description,
        item_description: sample.item_description,
        description: sample.description
      });
    }

    const batchPromises = validWebsiteItems.map(async (item: any) => {
      const description = extractProductDescription(item) || extractZohoExactDescription(item);
      // Pull directly from the Website Category custom field
      const rawCat = item.cf_website_category || item.custom_field_hash?.cf_website_category || '';
      const assignedCategory = typeof rawCat === 'string' ? rawCat.trim() : '';
      const { parentCategory, subcategory } = parseCategoryHierarchy(assignedCategory);
      const stock = item.actual_available_stock ?? item.stock_on_hand ?? 0;
      const primaryImageUrl = `/api/zoho/item/${item.item_id}/image`;

      const normalizedProduct: NormalizedProduct = {
        zohoItemId: item.item_id,
        sku: item.sku || item.item_code || '',
        name: item.name || item.item_name || 'Unnamed Product',
        brand: extractBrand(item),
        description: description,
        overview: description,
        price: extractProductPrice(item),
        stockQuantity: stock,
        category: assignedCategory, // Exact string from Zoho
        parentCategory: parentCategory || assignedCategory,
        subcategory: item.cf_website_subcategory || subcategory || undefined,
        unit: item.unit || 'pcs',
        status: stock > 0 ? 'In Stock' : 'Out of Stock',
        image: primaryImageUrl,
        images: [primaryImageUrl],
        lastSyncedAt: new Date().toISOString()
      };

      // Example Firebase Firestore update (Upsert)
      try {
        if (db && item.item_id) {
          await setDoc(doc(db, 'products', item.item_id), sanitizeForFirestore(normalizedProduct), { merge: true });
        }
      } catch (dbErr) {
        console.warn(`Could not sync item ${item.item_id} to Firestore:`, dbErr);
      }

      return normalizedProduct;
    });

    const syncedProducts = await Promise.all(batchPromises);
    console.log('✅ Prepared products for database sync!');
    return syncedProducts;

  } catch (error) {
    console.error('❌ Sync failed:', error);
  }
}
