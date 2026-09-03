import React, { useState, useEffect } from 'react';
import { isCategoryMatch, isValidWebsiteCategory } from '../mapCategory';

export default function Storefront() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // Fetch REAL live Zoho products from server.ts
  useEffect(() => {
    async function fetchLiveZohoProducts() {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('/api/zoho/items');
        let data: any = {};
        try {
          const text = await response.text();
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.warn('[Storefront Non-JSON Response Ignored]:', jsonErr);
          data = { items: [] };
        }

        const rawList = data.products || data.items || data.rawItems || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          // Strictly keep only products with explicit valid website category
          const validProducts = rawList.filter((p: any) => isValidWebsiteCategory(p.category));
          setProducts(validProducts);
          const exactCats = Array.from(new Set(validProducts.map((p: any) => p.category)));
          console.log('🏷️ [Storefront: Zoho Categories Loaded]:', exactCats);
          console.table(validProducts.map((p: any) => ({
            id: p.zohoItemId || p.id,
            name: p.name,
            category: p.category,
            price: `€${p.price || p.rate || 0}`
          })));
        } else {
          setError('No products found or invalid API response.');
        }
      } catch (err) {
        console.error('Fetch error:', err);
        setError('Failed to connect to backend server endpoint.');
      } finally {
        setLoading(false);
      }
    }

    fetchLiveZohoProducts();
  }, []);

  // Extract unique categories from real products
  const categories = ['ALL', ...Array.from(new Set(products.filter(p => isValidWebsiteCategory(p.category)).map((p: any) => p.category)))];

  const filteredProducts =
    selectedCategory === 'ALL'
      ? products.filter((p: any) => isValidWebsiteCategory(p.category))
      : products.filter((p: any) => isValidWebsiteCategory(p.category) && isCategoryMatch(p.category, selectedCategory, undefined, p.name, p.subcategory, p.parentCategory));

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <h3>🔄 Connecting to Zoho EU Inventory...</h3>
        <p>Fetching real item details and custom categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.centerContainer}>
        <h3 style={{ color: '#dc2626' }}>⚠️ Connection Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()} style={styles.retryBtn}>
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>
            PCS Online Storefront
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '0.875rem' }}>
            Live Zoho Inventory Feed
          </p>
        </div>
        <span style={styles.statusBadge}>
          🟢 Live ({products.length} Products Loaded)
        </span>
      </header>

      {/* CATEGORY FILTER BAR */}
      <div style={styles.filterBar}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.filterBtn,
              backgroundColor: selectedCategory === cat ? '#0f172a' : '#ffffff',
              color: selectedCategory === cat ? '#ffffff' : '#334155',
              border: selectedCategory === cat ? '1px solid #0f172a' : '1px solid #cbd5e1'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div style={styles.centerContainer}>
          <p>No products found in category "{selectedCategory}".</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredProducts.map((product: any) => (
            <div key={product.zohoItemId || product.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.categoryBadge}>{product.category}</span>
                <span style={styles.stockBadge}>
                  {product.stockQuantity ?? product.actual_available_stock ?? 0} in stock
                </span>
              </div>

              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.skuText}>SKU: {product.sku || 'N/A'}</p>
              <p style={styles.desc}>{product.description || 'No description available.'}</p>

              <div style={styles.cardFooter}>
                <span style={styles.price}>
                  €{Number(product.price || product.rate || 0).toFixed(2)}
                </span>
                <button style={styles.addBtn}>Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: '24px', fontFamily: 'system-ui, -apple-system, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e2e8f0' },
  statusBadge: { backgroundColor: '#dcfce7', color: '#166534', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold' },
  filterBar: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '24px' },
  filterBtn: { padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.2s' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '18px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  categoryBadge: { fontSize: '0.75rem', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '4px 10px', borderRadius: '6px' },
  stockBadge: { fontSize: '0.75rem', color: '#059669', fontWeight: 'bold' },
  productName: { fontSize: '1.05rem', margin: '0 0 6px 0', color: '#0f172a', fontWeight: '600' },
  skuText: { fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 10px 0' },
  desc: { fontSize: '0.85rem', color: '#64748b', flexGrow: 1, margin: '0 0 18px 0', lineHeight: '1.4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '14px', borderTop: '1px solid #f1f5f9' },
  price: { fontSize: '1.25rem', fontWeight: 'bold', color: '#0f172a' },
  addBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '9px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' },
  centerContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', fontFamily: 'system-ui, sans-serif' },
  retryBtn: { marginTop: '12px', padding: '8px 16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  spinner: { width: '32px', height: '32px', border: '4px solid #e2e8f0', borderTop: '4px solid #2563eb', borderRadius: '50%', marginBottom: '16px', animation: 'spin 1s linear infinite' }
};
