/**
 * Category parsing and matching utilities for Zoho Inventory items & storefront.
 */

import { EXACT_STORE_CATEGORIES } from './categoryData';

export { EXACT_STORE_CATEGORIES };

export const TARGET_CATEGORIES = EXACT_STORE_CATEGORIES.map(c => c.name);

export interface ParsedCategory {
  raw: string;
  parentCategory: string;
  subcategory: string | null;
}

/**
 * Normalizes a category string for case-insensitive and punctuation-agnostic comparison.
 */
export function normalizeCategoryStr(str: string | null | undefined): string {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeCategoryName(cat: string): string {
  if (!cat) return 'Adapters & Accessories';
  const clean = cat.toLowerCase().trim().replace(/[-_&]/g, ' ');

  if (clean.includes('laptop') || clean.includes('thinkpad') || clean.includes('macbook')) return 'Laptops';
  if (clean.includes('monitor') || clean.includes('screen') || clean.includes('display')) return 'Monitors';
  if (clean.includes('tablet') || clean.includes('ipad')) return 'Tablets';
  if (clean.includes('promethean') || clean.includes('activpanel')) return 'Promethean';
  if (clean.includes('3cx') || clean.includes('phone system') || clean.includes('voip')) return '3CX Phone System';
  if (clean.includes('c-pen') || clean.includes('reader') || clean.includes('assistive soft') || clean.includes('software')) return 'Assistive Software';
  if (clean.includes('printer') || clean.includes('ink') || clean.includes('toner')) return 'Printer & Supplies';
  if (clean.includes('audio') || clean.includes('headset') || clean.includes('peripheral') || clean.includes('mouse') || clean.includes('keyboard')) return 'Peripherals & Audio';
  if (clean.includes('network') || clean.includes('router') || clean.includes('switch') || clean.includes('wifi')) return 'Network & Connectivity';
  if (clean.includes('adapter') || clean.includes('cable') || clean.includes('charger') || clean.includes('accessories') || clean.includes('case')) return 'Adapters & Accessories';

  return cat.trim();
}

export const normalizeCategory = normalizeCategoryName;

/**
 * Checks if a category value is a genuine, non-empty, non-uncategorized category.
 */
export function isValidWebsiteCategory(category: any): boolean {
  if (!category || typeof category !== 'string') return false;
  const trimmed = category.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'uncategorized' && trimmed !== 'null' && trimmed !== 'undefined' && trimmed !== 'none';
}

/**
 * Extracts Zoho custom field value whether it appears as direct top-level key,
 * within custom_fields array, or in custom_field_hash.
 */
export function extractZohoCustomField(item: any, fieldKey: string): string {
  if (!item) return '';
  if (item[fieldKey] && typeof item[fieldKey] === 'string') return item[fieldKey].trim();

  const cleanKey = fieldKey.replace(/^cf_/, '').replace(/_/g, ' ').toLowerCase();

  // Check direct properties without cf_ prefix
  const altKey = fieldKey.replace(/^cf_/, '');
  if (item[altKey] && typeof item[altKey] === 'string') return item[altKey].trim();

  // Check custom_fields array
  if (Array.isArray(item.custom_fields)) {
    const found = item.custom_fields.find((f: any) => {
      const api = (f.api_name || f.placeholder_name || '').toLowerCase();
      const label = (f.label || f.field_name || f.name || '').toLowerCase();
      return (
        api === fieldKey.toLowerCase() ||
        api === altKey.toLowerCase() ||
        label === cleanKey ||
        (fieldKey.includes('category') && !fieldKey.includes('subcategory') && (label.includes('website category') || label.includes('web category') || api.includes('website_category'))) ||
        (fieldKey.includes('subcategory') && (label.includes('website subcategory') || label.includes('web subcategory') || api.includes('website_subcategory'))) ||
        api === cleanKey.replace(/\s+/g, '_')
      );
    });
    if (found && found.value !== undefined && found.value !== null) {
      return String(found.value).trim();
    }
  }

  // Check custom_field_hash map
  if (item.custom_field_hash && typeof item.custom_field_hash === 'object') {
    if (item.custom_field_hash[fieldKey]) return String(item.custom_field_hash[fieldKey]).trim();
    if (item.custom_field_hash[altKey]) return String(item.custom_field_hash[altKey]).trim();
    for (const k of Object.keys(item.custom_field_hash)) {
      const kLower = k.toLowerCase();
      if (fieldKey.includes('subcategory') && (kLower.includes('website_subcategory') || kLower.includes('website subcategory') || kLower.includes('cf_website_subcategory'))) {
        return String(item.custom_field_hash[k]).trim();
      }
      if (!fieldKey.includes('subcategory') && fieldKey.includes('category') && (kLower.includes('website_category') || kLower.includes('website category') || kLower.includes('cf_website_category'))) {
        return String(item.custom_field_hash[k]).trim();
      }
      if (kLower === cleanKey || kLower === fieldKey.toLowerCase() || kLower === altKey.toLowerCase()) {
        return String(item.custom_field_hash[k]).trim();
      }
    }
  }

  if (!fieldKey.startsWith('cf_')) {
    return item.category_name || item.category || '';
  }

  return '';
}

export function getProductSubcategory(product: any): string {
  if (!product) return '';
  
  // 1. If explicit subcategory property exists and is valid
  const explicitSub = product.subcategory || extractZohoCustomField(product, 'cf_website_subcategory') || product.subcategory_name;
  if (explicitSub && typeof explicitSub === 'string' && explicitSub.trim()) {
    return explicitSub.trim();
  }

  // 2. Check if parentCategory or rawCategory has a subcategory component ("Parent > Sub" or "Parent / Sub" or "Parent - Sub")
  const rawCat = product.rawCategory || extractZohoCustomField(product, 'cf_website_category') || product.category || '';
  if (rawCat && typeof rawCat === 'string' && (rawCat.includes('>') || rawCat.includes('/') || rawCat.includes(' - '))) {
    const parts = rawCat.split(/[>\/]|(?:\s+-\s+)/).map((s: string) => s?.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return parts.slice(1).join(' - ');
    }
  }

  // 3. Deterministic classifier based on item name and description within its parent category
  const parentCat = normalizeCategoryName(product.parentCategory || product.category || '').toLowerCase();
  const name = (product.name || product.item_name || '').toLowerCase();
  const desc = (product.description || '').toLowerCase();
  const fullText = `${name} ${desc}`;

  if (parentCat === 'laptops') {
    if (fullText.includes('bag') || fullText.includes('backpack') || fullText.includes('briefcase') || fullText.includes('sleeve') || fullText.includes('carry case') || fullText.includes('messenger')) {
      return 'Laptop Bags';
    }
    if (fullText.includes('charger') || fullText.includes('power supply') || fullText.includes('ac adapter') || fullText.includes('power cord') || fullText.includes('65w') || fullText.includes('45w') || fullText.includes('90w') || fullText.includes('130w') || fullText.includes('watt adapter') || fullText.includes('power lead') || fullText.includes('green cell')) {
      return 'Laptop Chargers';
    }
    if (fullText.includes('refurb') || fullText.includes('renewed') || fullText.includes('grade a') || fullText.includes('grade b') || fullText.includes('pre-owned') || fullText.includes('second hand')) {
      return 'Refurbished Laptops';
    }
    return 'New Laptops';
  }

  if (parentCat === 'tablets') {
    if (fullText.includes('keyboard case') || fullText.includes('folio case') || fullText.includes('smart keyboard') || fullText.includes('magic keyboard') || fullText.includes('type cover')) {
      return 'Keyboard Cases';
    }
    if (fullText.includes('shockproof') || fullText.includes('rugged') || fullText.includes('tough') || fullText.includes('survivor') || fullText.includes('armor') || fullText.includes('defender') || fullText.includes('drop protection') || fullText.includes('heavy duty')) {
      return 'Shockproof Cases';
    }
    if (fullText.includes('case') || fullText.includes('cover') || fullText.includes('protective') || fullText.includes('sleeve') || fullText.includes('skin') || fullText.includes('folio')) {
      return 'Protective Cases';
    }
    if (fullText.includes('ipad') || fullText.includes('apple tablet') || fullText.includes('ipad air') || fullText.includes('ipad pro') || fullText.includes('ipad mini')) {
      return 'Apple iPads';
    }
    if (fullText.includes('samsung') || fullText.includes('galaxy tab') || fullText.includes('active tab')) {
      return 'Samsung Tablets';
    }
    return 'Android Tablets';
  }

  if (parentCat === 'printer & supplies' || parentCat === 'printers & supplies') {
    if (fullText.includes('toner') || fullText.includes('cartridge') || fullText.includes('ink') || fullText.includes('drum') || fullText.includes('ribbon') || fullText.includes('paper') || fullText.includes('maintenance box') || fullText.includes('waste toner') || fullText.includes('refill')) {
      return 'Supplies';
    }
    return 'Printers';
  }

  if (parentCat === 'peripherals & audio') {
    if (fullText.includes('headset') || fullText.includes('headphone') || fullText.includes('earphone') || fullText.includes('speaker') || fullText.includes('soundbar') || fullText.includes('microphone') || fullText.includes('mic') || fullText.includes('audio') || fullText.includes('gaming head') || fullText.includes('jabra') || fullText.includes('plantronics')) {
      return 'Audio & Gaming Headsets';
    }
    if (fullText.includes('cable') || fullText.includes('adapter') || fullText.includes('converter') || fullText.includes('hdmi') || fullText.includes('displayport') || fullText.includes('vga') || fullText.includes('usb-c') || fullText.includes('dongle') || fullText.includes('lead') || fullText.includes('dvi')) {
      return 'Cables & Adapters';
    }
    return 'Keyboards & Mice';
  }

  if (parentCat === 'network & connectivity') {
    if (fullText.includes('cat6') || fullText.includes('cat5') || fullText.includes('patch lead') || fullText.includes('patch cable') || fullText.includes('ethernet cable') || fullText.includes('rj45') || fullText.includes('keystone') || fullText.includes('faceplate') || fullText.includes('patch panel') || fullText.includes('trunking') || fullText.includes('cabling')) {
      return 'Cables & Structural Cabling';
    }
    if (fullText.includes('storage') || fullText.includes('server') || fullText.includes('nas') || fullText.includes('synology') || fullText.includes('qnap') || fullText.includes('rackmount') || fullText.includes('san') || fullText.includes('poweredge') || fullText.includes('proliant')) {
      return 'Network Storage & Servers';
    }
    if (fullText.includes('switch') || fullText.includes('gigabit switch') || fullText.includes('poe') || fullText.includes('managed switch') || fullText.includes('unmanaged switch') || fullText.includes('cisco switch') || fullText.includes('tp-link switch') || fullText.includes('sfp')) {
      return 'Network Switches';
    }
    return 'Routers & Access Points';
  }

  return '';
}

export function mapZohoItemToCategory(item: any) {
  const rawCat = item?.cf_website_category || item?.custom_field_hash?.cf_website_category || extractZohoCustomField(item, 'cf_website_category') || '';
  if (!rawCat || typeof rawCat !== 'string' || rawCat.trim().length === 0) {
    return { parentCategory: '', category: '', subcategory: '' };
  }
  
  const parsed = parseCategoryHierarchy(rawCat);
  const parentCategory = parsed.parentCategory || normalizeCategoryName(rawCat.trim());
  const explicitSubcategory = extractZohoCustomField(item, 'cf_website_subcategory') || item?.subcategory || item?.subcategory_name || '';
  let subcategory = (explicitSubcategory.trim() || parsed.subcategory || '').trim();
  
  if (!subcategory) {
    subcategory = getProductSubcategory({ ...item, parentCategory, category: parentCategory });
  }

  return { parentCategory, category: parentCategory, subcategory };
}

export function resolveCategory(item: any): string {
  return mapZohoItemToCategory(item).parentCategory;
}

export function getWebsiteCategoryValue(item: any): string {
  return extractZohoCustomField(item, 'cf_website_category');
}

export function isWebsiteProduct(item: any): boolean {
  const val = getWebsiteCategoryValue(item);
  return Boolean(val && val.length > 0 && val.toLowerCase() !== 'none' && val.toLowerCase() !== 'null' && val.toLowerCase() !== 'undefined');
}

export function isOnlineShopItem(item: any): boolean {
  return isWebsiteProduct(item);
}

/**
 * Extracts the explicit Website Category custom field or category from a Zoho Item.
 */
export function extractWebsiteCategory(item: any): string | null {
  if (!item) return null;
  const mapped = mapZohoItemToCategory(item);
  return mapped.parentCategory;
}

export function getWebsiteCategoryFromZoho(zohoItem: any): string | null {
  return extractWebsiteCategory(zohoItem);
}

export function getWebsiteCategory(customFields: any[]): string | null {
  if (!Array.isArray(customFields)) return null;
  return extractWebsiteCategory({ custom_fields: customFields });
}

/**
 * Legacy compatibility hierarchy parser
 */
export function parseCategoryHierarchy(categoryStr: string | null | undefined, itemName?: string | null): ParsedCategory {
  if (!categoryStr) {
    return { raw: '', parentCategory: '', subcategory: null };
  }
  let parent = categoryStr.trim();
  let sub: string | null = null;

  if (parent.includes('>') || parent.includes('/') || parent.includes(' - ')) {
    const parts = parent.split(/[>\/]|(?:\s+-\s+)/).map(s => s?.trim()).filter(Boolean);
    if (parts.length >= 2) {
      parent = parts[0];
      sub = parts.slice(1).join(' - ');
    }
  }

  const norm = normalizeCategoryName(parent);
  return {
    raw: categoryStr,
    parentCategory: norm,
    subcategory: sub
  };
}

/**
 * Subcategory keyword dictionaries and matcher for storefront navigation
 */
export const SUBCATEGORY_KEYWORDS: Record<string, string[]> = {
  'Refurbished Laptops': ['refurb', 'renewed', 'grade a', 'grade b', 'pre-owned'],
  'New Laptops': ['laptop', 'notebook', 'thinkpad', 'macbook', 'latitude', 'elitebook', 'yoga', 'ideapad', 'zenbook'],
  'Laptop Bags': ['bag', 'backpack', 'briefcase', 'sleeve', 'carry case', 'messenger'],
  'Laptop Chargers': ['charger', 'power supply', 'ac adapter', 'power cord', 'watt adapter', '65w', '45w', '90w'],
  
  'Apple iPads': ['ipad', 'apple tablet', 'ipad air', 'ipad pro', 'ipad mini'],
  'Samsung Tablets': ['samsung', 'galaxy tab', 'active tab'],
  'Android Tablets': ['android', 'lenovo tab', 'tablet', 'mediapad'],
  'Protective Cases': ['case', 'cover', 'protective', 'sleeve', 'skin', 'folio'],
  'Keyboard Cases': ['keyboard case', 'folio case', 'smart keyboard', 'magic keyboard', 'type cover'],
  'Shockproof Cases': ['shockproof', 'rugged', 'tough', 'survivor', 'armor', 'defender', 'drop protection', 'heavy duty'],

  'Printers': ['printer', 'laserjet', 'inkjet', 'pixma', 'laser', 'epson', 'brother', 'canon', 'hp laser', 'all in one printer'],
  'Supplies': ['toner', 'cartridge', 'ink', 'drum', 'ribbon', 'paper', 'maintenance box', 'waste toner', 'refill', 'cyan', 'magenta', 'yellow', 'black toner'],

  'Keyboards & Mice': ['keyboard', 'mouse', 'mice', 'trackball', 'keypad', 'numpad', 'combo', 'wireless desktop', 'cherry', 'logitech keyboard', 'logitech mouse'],
  'Audio & Gaming Headsets': ['audio', 'headset', 'headphone', 'earphone', 'speaker', 'soundbar', 'microphone', 'mic', 'gaming head', 'jabber', 'plantronics', 'jabra', 'sennheiser'],
  'Cables & Adapters': ['cable', 'adapter', 'converter', 'hdmi', 'displayport', 'vga', 'usb-c', 'dongle', 'lead', 'dvi', 'lightning'],

  'Routers & Access Points': ['router', 'access point', 'wap', 'ap', 'mesh', 'wifi', 'wi-fi', 'gateway', 'unifi', 'draytek', 'ubiquiti', 'wireless router'],
  'Network Switches': ['switch', 'gigabit switch', 'poe', 'managed switch', 'unmanaged switch', 'hub', 'cisco switch', 'netgear switch', 'tp-link switch', 'sfp'],
  'Cables & Structural Cabling': ['cat6', 'cat5', 'patch lead', 'patch cable', 'ethernet cable', 'rj45', 'keystone', 'faceplate', 'patch panel', 'trunking', 'cabling', 'structural cable', 'utp', 'ftp', 'booted patch'],
  'Network Storage & Servers': ['storage', 'server', 'nas', 'synology', 'qnap', 'rackmount', 'san', 'poweredge', 'proliant', 'enclosure', 'hard drive array']
};

/**
 * Robust Category Matcher
 */
export function isProductMatchingCategory(product: any, activeCategory: string | null | undefined): boolean {
  if (!product) return false;
  if (!activeCategory || activeCategory === 'All' || activeCategory === 'All Tech' || activeCategory === 'All Products') {
    return true;
  }
  if (activeCategory === 'Deals & Promotions') {
    return Boolean(product.originalPrice && product.originalPrice > product.price);
  }

  const targetNorm = normalizeCategoryName(activeCategory).toLowerCase().trim();
  const prodParent = normalizeCategoryName(product.parentCategory || product.category || '').toLowerCase().trim();

  if (prodParent === targetNorm) return true;

  const rawCat = (product.rawCategory || extractZohoCustomField(product, 'cf_website_category') || '').toLowerCase();
  if (rawCat && normalizeCategoryName(rawCat).toLowerCase() === targetNorm) return true;

  return false;
}

/**
 * Robust Subcategory Matcher
 * Strictly compares normalized subcategories so that items in "Laptop Bags" or "Laptop Chargers"
 * are never shown when the user selects "New Laptops".
 */
export function isProductMatchingSubcategory(product: any, subcategory: string): boolean {
  if (!product || !subcategory) return false;

  const itemSub = getProductSubcategory(product).toLowerCase().trim();
  const subNorm = subcategory.toLowerCase().trim();

  if (!itemSub) return false;

  // Direct exact match
  if (itemSub === subNorm) return true;
  if (normalizeCategoryStr(itemSub) === normalizeCategoryStr(subNorm)) return true;

  return false;
}

/**
 * Checks category match strictly
 */
export function isCategoryMatch(
  itemCategory: string | undefined | null,
  activeCategory: string | null | undefined,
  selectedSubcategories?: string[] | string | null,
  itemName?: string | null,
  itemSubcategory?: string | null,
  itemParentCategory?: string | null
): boolean {
  const dummyProduct = {
    parentCategory: itemParentCategory || itemCategory,
    category: itemCategory,
    subcategory: itemSubcategory,
    name: itemName
  };

  if (activeCategory && !isProductMatchingCategory(dummyProduct, activeCategory)) {
    return false;
  }

  if (selectedSubcategories) {
    const subs = Array.isArray(selectedSubcategories) ? selectedSubcategories : [selectedSubcategories];
    if (subs.length > 0) {
      return subs.some(sub => isProductMatchingSubcategory(dummyProduct, sub));
    }
  }

  return true;
}

export function mapZohoToWebsiteCategory(zohoCategoryName?: string, itemName?: string, tags?: string[] | string): string {
  if (zohoCategoryName) {
    const norm = normalizeCategoryName(zohoCategoryName);
    if (norm && norm !== 'Other') return norm;
  }
  return 'Adapters & Accessories';
}

export function cleanZohoDescriptionText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  let cleaned = text
    // Replace <br> and <p> with newlines
    .replace(/<br\s*[\/]?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<p[^>]*>/gi, '')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]+>/g, '') // remove remaining HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return cleaned;
}

export function extractZohoExactDescription(item: any): string {
  if (!item) return '';

  const cleanName = (item.name || item.item_name || '').trim().toLowerCase();
  const cleanSku = (item.sku || '').trim().toLowerCase();
  const catName = (item.parentCategory || item.category || '').trim().toLowerCase();
  const subcatName = (item.subcategory || '').trim().toLowerCase();

  const isInvalidText = (val: string) => {
    if (!val || typeof val !== 'string') return true;
    const clean = cleanZohoDescriptionText(val).toLowerCase().trim();
    if (clean.length === 0) return true;
    if (cleanSku.length > 0 && clean === cleanSku) return true;
    if (clean === catName || clean === subcatName) return true;
    if (
      clean === 'monitors' ||
      clean === 'laptops' ||
      clean === 'tablets' ||
      clean === 'promethean' ||
      clean === 'assistive software' ||
      clean === 'assistive technology' ||
      clean === 'printer & supplies' ||
      clean === 'peripherals & audio' ||
      clean === 'network & connectivity' ||
      clean === 'adapters & accessories'
    ) {
      return true;
    }
    return false;
  };

  // 1. Check standard Zoho sales description & primary description candidates first
  const primaryDescCandidates = [
    item.description,
    item.cf_website_description,
    item.cf_website_description_unformatted,
    item.cf_product_description,
    item.cf_description,
    item.purchase_description,
    item.item_description,
    item.sales_description,
    item.cf_long_description,
    item.cf_item_description,
    item.cf_product_overview,
    item.cf_specs,
    item.cf_overview,
    item.description_formatted,
    item.item_desc,
    item.product_overview,
    item.overview
  ];

  for (const cand of primaryDescCandidates) {
    if (cand && typeof cand === 'string' && !isInvalidText(cand)) {
      return cleanZohoDescriptionText(cand);
    }
  }

  // 2. Search inside item.custom_fields array
  if (Array.isArray(item.custom_fields)) {
    for (const field of item.custom_fields) {
      const api = (field.api_name || '').toLowerCase();
      const label = (field.label || '').toLowerCase();

      if (api.includes('category') || label.includes('category')) continue;

      const val = field.value !== undefined && field.value !== null ? String(field.value).trim() : '';
      if (
        (api.includes('description') ||
         api.includes('overview') ||
         label.includes('description') ||
         label.includes('overview') ||
         label.includes('specification') ||
         label.includes('details')) &&
        !isInvalidText(val)
      ) {
        return cleanZohoDescriptionText(val);
      }
    }
  }

  // 3. Search inside item.custom_field_hash
  if (item.custom_field_hash && typeof item.custom_field_hash === 'object') {
    // Check specific keys first
    const h = item.custom_field_hash;
    const directHash = h.description || h.cf_website_description || h.cf_product_description || h.cf_description || h.purchase_description || h.item_description;
    if (directHash && typeof directHash === 'string' && !isInvalidText(directHash)) {
      return cleanZohoDescriptionText(directHash);
    }

    for (const [k, v] of Object.entries(item.custom_field_hash)) {
      const keyLower = k.toLowerCase();
      if (keyLower.includes('category')) continue;

      const valStr = v ? String(v).trim() : '';
      if (
        (keyLower.includes('description') || keyLower.includes('overview') || keyLower.includes('spec') || keyLower.includes('detail')) &&
        !isInvalidText(valStr)
      ) {
        return cleanZohoDescriptionText(valStr);
      }
    }
  }

  return '';
}

/**
 * Direct alias to extractZohoExactDescription
 */
export function generateStoreDescription(item: any): string {
  return extractZohoExactDescription(item);
}

