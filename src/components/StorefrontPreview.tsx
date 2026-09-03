import React, { useState, useEffect } from 'react';
import { isCategoryMatch, isValidWebsiteCategory } from '../mapCategory';

export default function StorefrontPreview() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');

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
          console.warn('[StorefrontPreview Non-JSON Response Ignored]:', jsonErr);
          data = { items: [] };
        }

        const rawList = data.products || data.items || data.rawItems || [];
        if (Array.isArray(rawList) && rawList.length > 0) {
          const validProducts = rawList.filter((p: any) => isValidWebsiteCategory(p.category));
          setProducts(validProducts);
          const exactCats = Array.from(new Set(validProducts.map((p: any) => p.category)));
          console.log('🏷️ [StorefrontPreview: Zoho Categories Loaded]:', exactCats);
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

  const categories = ['ALL', ...Array.from(new Set(products.filter(p => isValidWebsiteCategory(p.category)).map((p: any) => p.category)))];

  const filteredProducts = selectedCategory === 'ALL' 
    ? products.filter((p: any) => isValidWebsiteCategory(p.category))
    : products.filter((p: any) => isValidWebsiteCategory(p.category) && isCategoryMatch(p.category, selectedCategory, undefined, p.name, p.subcategory, p.parentCategory));

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontWeight: 'bold', color: '#2563eb' }}>🔄 Connecting to Live Zoho Inventory Feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ color: '#dc2626', fontWeight: 'bold' }}>⚠️ Connection Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>🛒</span> PCS Online Storefront Preview
        </h2>
        <span style={styles.statusBadge}>🟢 Live ({products.length} Products Loaded)</span>
      </header>

      {/* CATEGORY FILTER BAR */}
      <div style={styles.filterBar}>
        {categories.map((cat: any) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.filterBtn,
              backgroundColor: selectedCategory === cat ? '#0f172a' : '#f1f5f9',
              color: selectedCategory === cat ? '#ffffff' : '#475569'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* PRODUCT GRID */}
      {filteredProducts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
          No products found in category "{selectedCategory}".
        </div>
      ) : (
        <div style={styles.grid}>
          {filteredProducts.map((product: any) => (
            <div key={product.zohoItemId || product.id} style={styles.card}>
              <div style={styles.cardHeader}>
                <span style={styles.categoryBadge}>{product.category}</span>
                <span style={styles.stockBadge}>
                  {product.stockQuantity ?? product.actual_available_stock ?? product.stockCount ?? 0} Left
                </span>
              </div>

              <div style={{ height: '140px', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: '8px', marginBottom: '12px', overflow: 'hidden' }}>
                <img 
                  src={`/api/zoho/item/${product.zohoItemId || product.id}/image?v=${encodeURIComponent(product.last_modified_time || product.updatedAt || '')}`}
                  alt={product.name}
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f8fafc/64748b?text=No+Image';
                  }}
                />
              </div>
              
              <h3 style={styles.productName}>{product.name}</h3>
              <p style={styles.skuText}>SKU: {product.sku || (product.specs && product.specs['SKU']) || 'N/A'}</p>
              <p style={styles.desc}>{product.description || 'No description available.'}</p>
              
              <div style={styles.cardFooter}>
                <span style={styles.price}>€{Number(product.price || product.rate || 0).toFixed(2)}</span>
                <button style={styles.addBtn}>Add to Cart</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: { padding: '24px', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f8fafc', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  statusBadge: { backgroundColor: '#dcfce7', color: '#166534', padding: '4px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' },
  filterBar: { display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' },
  filterBtn: { border: 'none', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', whiteSpace: 'nowrap' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' },
  card: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '16px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  categoryBadge: { fontSize: '0.7rem', fontWeight: 'bold', color: '#2563eb', backgroundColor: '#eff6ff', padding: '3px 8px', borderRadius: '4px' },
  stockBadge: { fontSize: '0.7rem', color: '#059669', fontWeight: 'bold' },
  productName: { fontSize: '1rem', margin: '0 0 4px 0', color: '#0f172a', fontWeight: '600' },
  skuText: { fontSize: '0.75rem', color: '#94a3b8', margin: '0 0 8px 0' },
  desc: { fontSize: '0.82rem', color: '#64748b', flexGrow: 1, margin: '0 0 16px 0', lineHeight: '1.4' },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #f1f5f9' },
  price: { fontSize: '1.15rem', fontWeight: 'bold', color: '#0f172a' },
  addBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 12px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.8rem' }
};
