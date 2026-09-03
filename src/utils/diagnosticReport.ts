import { Product } from '../types';

export interface MissingDescriptionReportItem {
  index: number;
  id: string;
  sku: string;
  name: string;
  category: string;
  subcategory?: string;
  price: string;
  zohoItemId?: string;
  hasDescription: boolean;
}

/**
 * Runs a console-based diagnostic report iterating over all products in state.
 * Identifies and logs any item with a missing, empty, or whitespace-only description.
 */
export function generateDescriptionDiagnosticReport(products: Product[]) {
  if (!products || products.length === 0) {
    console.warn('%c[Zoho Diagnostic Report] No products available in application state yet.', 'color: orange; font-weight: bold;');
    return;
  }

  const missingItems: MissingDescriptionReportItem[] = [];
  const validItems: Product[] = [];

  products.forEach((p, idx) => {
    const desc = p.description ? p.description.trim() : '';
    if (!desc || desc.length === 0) {
      missingItems.push({
        index: idx + 1,
        id: p.id,
        zohoItemId: p.zohoItemId || p.id,
        sku: p.sku || 'N/A (No SKU)',
        name: p.name || 'Unnamed Item',
        category: p.parentCategory || p.category || 'Uncategorized',
        subcategory: p.subcategory || 'N/A',
        price: `€${p.price?.toFixed(2) ?? '0.00'}`,
        hasDescription: false
      });
    } else {
      validItems.push(p);
    }
  });

  const total = products.length;
  const missingCount = missingItems.length;
  const validCount = validItems.length;

  console.group(
    `%c🔍 ZOHO INVENTORY PRODUCT DESCRIPTION DIAGNOSTIC REPORT (%c${total} total items analyzed%c)`,
    'background: #1e293b; color: #38bdf8; font-weight: bold; padding: 4px 8px; border-radius: 4px; font-size: 13px;',
    'color: #facc15; font-weight: bold; font-size: 13px;',
    'background: #1e293b; color: #38bdf8; font-weight: bold; font-size: 13px;'
  );

  console.log(
    `%cStatus Overview:%c ✅ ${validCount} items with valid Zoho descriptions | %c⚠️ ${missingCount} items missing descriptions`,
    'font-weight: bold; color: #64748b;',
    'color: #22c55e; font-weight: bold;',
    missingCount > 0 ? 'color: #ef4444; font-weight: bold;' : 'color: #22c55e; font-weight: bold;'
  );

  if (missingCount === 0) {
    console.log(
      '%c🎉 EXCELLENT: All ' + total + ' products currently in website catalog have valid, populated Zoho descriptions!',
      'color: #16a34a; font-weight: bold; font-size: 12px;'
    );
  } else {
    console.warn(
      `%c⚠️ ATTENTION NEEDED: Found ${missingCount} product(s) missing descriptions in Zoho Inventory. Details below:`,
      'color: #dc2626; font-weight: bold; font-size: 12px;'
    );

    // Render interactive clean table for quick copying/inspection
    console.table(
      missingItems.map(item => ({
        '#': item.index,
        'SKU': item.sku,
        'Zoho Item ID': item.id,
        'Product Name': item.name,
        'Category': item.category,
        'Price': item.price
      }))
    );

    console.groupCollapsed('%c📋 Raw List for Copying into Zoho Inventory', 'color: #ea580c; font-weight: bold;');
    missingItems.forEach((item) => {
      console.log(
        `• SKU: "${item.sku}" | Zoho ID: "${item.id}" | Name: "${item.name}" [${item.category}]`
      );
    });
    console.groupEnd();
  }

  console.log(
    '%c💡 Tip: You can re-run this audit anytime in browser console by calling: %cwindow.runProductDescriptionAudit()',
    'color: #94a3b8; font-style: italic;',
    'color: #3b82f6; font-weight: bold; font-style: normal;'
  );
  console.groupEnd();

  return {
    total,
    validCount,
    missingCount,
    missingItems
  };
}
