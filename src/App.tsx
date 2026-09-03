import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import HeroSection from './components/HeroSection';
import ProductCard from './components/ProductCard';
import ProductModal from './components/ProductModal';
import CartDrawer from './components/CartDrawer';
import WishlistDrawer from './components/WishlistDrawer';
import Portals from './components/Portals';
import PortalSignInModal from './components/PortalSignInModal';
import SimpleEmployeeDashboard from './components/SimpleEmployeeDashboard';
import CustomerPortalDashboard from './components/CustomerPortalDashboard';
import GamingPcQuotationModal from './components/GamingPcQuotationModal';
import PrometheanQuoteForm from './components/PrometheanQuoteForm';
import PrometheanPage from './components/PrometheanPage';
import AssistiveSoftwarePage from './components/AssistiveSoftwarePage';
import ThreeCXPage from './components/ThreeCXPage';
import Storefront from './components/Storefront';
import Footer from './components/Footer';

import { auth, db, sanitizeForFirestore } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

import { Product, Category, CartItem, FilterState } from './types';
import { SlidersHorizontal, ArrowUpDown, RefreshCw, Sparkles, Flame, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { EXACT_STORE_CATEGORIES } from './categoryData';
import { isCategoryMatch, isValidWebsiteCategory, extractWebsiteCategory, extractZohoCustomField, parseCategoryHierarchy, mapZohoItemToCategory, resolveCategory, isOnlineShopItem, normalizeCategoryName, getWebsiteCategoryValue, isWebsiteProduct, extractZohoExactDescription, isProductMatchingCategory, isProductMatchingSubcategory } from './mapCategory';
import { clearLocalCatalogCache } from './zohoService';

const categoryConfig: Record<string, string[]> = EXACT_STORE_CATEGORIES.reduce((acc, cat) => {
  acc[cat.name] = cat.subcategories;
  return acc;
}, {} as Record<string, string[]>);

import { syncZohoInventoryToStorefront, extractProductDescription, extractBrand, extractProductPrice } from './zohoSync';
import { generateDescriptionDiagnosticReport } from './utils/diagnosticReport';
import MobilePaymentScreen from './components/MobilePaymentScreen';

export default function App() {
  // Check if current view is a mobile phone QR scan session
  const isMobilePayView = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/mobile-pay') ||
    new URLSearchParams(window.location.search).get('mobilePay') === 'true'
  );

  if (isMobilePayView) {
    return <MobilePaymentScreen />;
  }

  // === CORE PERSISTENT STATES ===
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('techshop_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('techshop_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [products, setProducts] = useState<Product[]>([]);

  // === ZOHO INVENTORY INTEGRATION STATE ===
  const [zohoStatus, setZohoStatus] = useState<{ configured: boolean; count?: number; message?: string }>({ configured: false });
  const [isSyncingZoho, setIsSyncingZoho] = useState(false);

  // Helper to format Zoho item to Product object
  const formatZohoProduct = (p: any): Product => {
    const parentCategory = resolveCategory(p);
    const subcategory = (extractZohoCustomField(p, 'cf_website_subcategory') || p.subcategory || p.subcategory_name || '').trim();
    const stock = Number(p.stockQuantity ?? p.stockCount ?? p.actual_available_stock ?? p.stock_on_hand ?? (p.inStock !== false ? 10 : 0));
    const id = String(p.zohoItemId || p.id || p.item_id || p.sku || Math.random().toString(36).substring(7));
    const imageUrl = p.imageUrl || `/api/zoho/item/${encodeURIComponent(id)}/image`;
    const description =
      p.description ||
      p.cf_website_description ||
      p.cf_product_description ||
      p.cf_description ||
      p.purchase_description ||
      p.item_description ||
      extractProductDescription(p) ||
      'No description available';

    return {
      ...p,
      id,
      name: p.name || p.item_name || 'Product',
      brand: extractBrand(p),
      description: description,
      overview: description,
      category: parentCategory as Category,
      parentCategory: parentCategory,
      subcategory: subcategory || undefined,
      rawCategory: extractZohoCustomField(p, 'cf_website_category') || parentCategory,
      price: Number(p.price ?? p.rate ?? p.unit_price ?? 0),
      inStock: stock > 0,
      stockQuantity: stock,
      rating: Number(p.rating ?? 4.8),
      reviewsCount: Number(p.reviewsCount ?? 12),
      specs: p.specs && typeof p.specs === 'object' ? p.specs : {},
      features: Array.isArray(p.features) ? p.features : [],
      peripherals: Array.isArray(p.peripherals) ? p.peripherals : [],
      imageUrl: imageUrl,
      images: Array.isArray(p.images) && p.images.length > 0 ? p.images : [imageUrl]
    };
  };

  // Helper to map and synchronize Zoho items with price update tracking
  const processZohoResponse = (data: any, isInitial = false) => {
    const rawItems = Array.isArray(data.items)
      ? data.items
      : (Array.isArray(data.products) ? data.products : (Array.isArray(data.rawItems) ? data.rawItems : []));

    const validWebsiteItems = (rawItems || []).filter((item: any) => {
      const websiteCategory = item.cf_website_category || item.custom_field_hash?.cf_website_category;
      return typeof websiteCategory === 'string' && websiteCategory.trim().length > 0;
    });

    const mapped: Product[] = validWebsiteItems.map((item: any) => {
      const catInfo = mapZohoItemToCategory(item);
      const itemId = String(item.item_id || item.id || item.sku || Math.random().toString(36).substring(7));
      const imageUrl = item.imageUrl || `/api/zoho/item/${item.item_id || item.id || itemId}/image`;
      const stock = Number(item.stockQuantity ?? item.stockCount ?? item.actual_available_stock ?? item.stock_on_hand ?? (item.inStock !== false ? 10 : 0));
      const rawWebsiteCat = extractZohoCustomField(item, 'cf_website_category') || item.cf_website_category || catInfo.parentCategory;
      const rawWebsiteSub = catInfo.subcategory || extractZohoCustomField(item, 'cf_website_subcategory') || undefined;
      const desc =
        item.description ||
        item.cf_website_description ||
        item.cf_product_description ||
        item.cf_description ||
        item.purchase_description ||
        item.item_description ||
        extractProductDescription(item) ||
        'No description available';

      const livePrice = extractProductPrice(item);

      return {
        id: itemId,
        zohoItemId: itemId,
        name: item.name || item.item_name || 'Product',
        price: livePrice,
        sku: item.sku || item.item_code || '',
        description: desc,
        overview: desc,
        parentCategory: catInfo.parentCategory,
        category: catInfo.parentCategory as Category,
        subcategory: rawWebsiteSub,
        rawCategory: rawWebsiteCat,
        imageUrl,
        images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [imageUrl],
        brand: extractBrand(item),
        rating: Number(item.rating ?? 4.8),
        reviewsCount: Number(item.reviewsCount ?? 12),
        specs: item.specs && typeof item.specs === 'object' ? item.specs : {},
        features: Array.isArray(item.features) ? item.features : [],
        peripherals: Array.isArray(item.peripherals) ? item.peripherals : [],
        inStock: stock > 0,
        stockQuantity: stock,
        rawCustomFields: item.custom_fields || item.custom_field_hash || {}
      };
    });

    if (mapped.length > 0) {
      let priceChangesCount = 0;
      setProducts((prev) => {
        prev.forEach((oldP) => {
          const freshP = mapped.find((m) => m.id === oldP.id || m.zohoItemId === oldP.zohoItemId);
          if (freshP && Math.abs(freshP.price - oldP.price) > 0.001) {
            priceChangesCount++;
            console.log(`⚡ [Zoho Price Update] "${oldP.name}": €${oldP.price} -> €${freshP.price}`);
          }
        });
        return mapped;
      });

      // Synchronize cart items with updated prices
      setCartItems((prevCart) =>
        prevCart.map((c) => {
          const fresh = mapped.find((p) => p.id === c.id || p.zohoItemId === c.zohoItemId);
          if (fresh && Math.abs(fresh.price - c.price) > 0.001) {
            return { ...c, price: fresh.price };
          }
          return c;
        })
      );

      // Synchronize wishlist items with updated prices
      setWishlist((prevWishlist) =>
        prevWishlist.map((w) => {
          const fresh = mapped.find((p) => p.id === w.id || p.zohoItemId === w.zohoItemId);
          if (fresh && Math.abs(fresh.price - w.price) > 0.001) {
            return { ...w, price: fresh.price };
          }
          return w;
        })
      );

      setZohoStatus({
        configured: true,
        count: mapped.length,
        message: priceChangesCount > 0
          ? `Zoho sync complete! Synced ${mapped.length} products (${priceChangesCount} price${priceChangesCount > 1 ? 's' : ''} updated).`
          : `Catalog updated! Synced ${mapped.length} live products from Zoho.`
      });

      // Fallback enrichment for items needing descriptions
      const itemsNeedingDesc = mapped.filter((p: Product) => !p.description || p.description.trim().length === 0);
      if (itemsNeedingDesc.length > 0) {
        (async () => {
          const CONCURRENCY = 5;
          for (let i = 0; i < itemsNeedingDesc.length; i += CONCURRENCY) {
            const chunk = itemsNeedingDesc.slice(i, i + CONCURRENCY);
            await Promise.all(
              chunk.map(async (prod) => {
                try {
                  const res = await fetch(`/api/zoho/item/${encodeURIComponent(prod.id)}`);
                  if (!res.ok) return;
                  const json = await res.json();
                  const itemData = json?.item;
                  if (!itemData) return;
                  const resolvedDesc = extractZohoExactDescription(itemData);
                  if (resolvedDesc && resolvedDesc.trim().length > 0) {
                    setProducts((prev) =>
                      prev.map((p) => (p.id === prod.id ? { ...p, description: resolvedDesc } : p))
                    );
                  }
                } catch {
                  // ignore
                }
              })
            );
          }
        })();
      }
    } else {
      setZohoStatus({
        configured: data.configured ?? false,
        message: data.message || data.warning || data.error || 'Synced with Zoho. No products marked with website categories.'
      });
    }
  };

  // Manual Force Zoho Sync: triggers /api/zoho/refresh and pulls live prices (with static catalog fallback for Vercel)
  const handleForceZohoSync = async () => {
    setIsSyncingZoho(true);
    console.log('🔄 [Force Zoho Sync] Initiating manual synchronization from Zoho Inventory...');
    clearLocalCatalogCache();
    
    try {
      // 1. Force server cache purge
      await fetch(`/api/zoho/refresh?_t=${Date.now()}`).catch(() => {});

      // 2. Fetch fresh live items
      const res = await fetch(`/api/zoho/items?force=true&_t=${Date.now()}`);
      if (res.ok) {
        let data: any = {};
        try {
          const text = await res.text();
          data = JSON.parse(text);
        } catch (jsonErr) {
          console.warn('[Zoho Force Sync Non-JSON]:', jsonErr);
        }
        if (data && Array.isArray(data.items) && data.items.length > 0) {
          console.log('📦 [Force Zoho Sync] Zoho inventory response received:', data);
          processZohoResponse(data, false);
          return;
        }
      }
    } catch (err: any) {
      console.warn('Live Zoho refresh endpoint unavailable, reloading bundled catalog:', err.message);
    }

    // Fallback reload from bundled static catalog (Vercel & offline support)
    try {
      const staticRes = await fetch(`/zoho-catalog.json?_t=${Date.now()}`);
      if (staticRes.ok) {
        const staticData = await staticRes.json();
        if (staticData && Array.isArray(staticData.items) && staticData.items.length > 0) {
          console.log('📦 [Static Catalog] Reloaded products from bundled catalog file.');
          processZohoResponse(staticData, false);
          setZohoStatus({
            configured: true,
            count: staticData.items.length,
            message: `Catalog loaded! ${staticData.items.length} products active. (Static bundle)`
          });
          return;
        }
      }
    } catch (staticErr: any) {
      console.error('❌ [Catalog Reload Error]:', staticErr);
    }

    setZohoStatus({ configured: false, message: 'Sync unavailable. Check connection.' });
    setIsSyncingZoho(false);
  };

  // Initial Zoho sync to populate catalog (supports Vercel serverless & static catalog fallback)
  useEffect(() => {
    async function loadInitialZohoData() {
      setIsSyncingZoho(true);
      try {
        const res = await fetch('/api/zoho/items');
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items) && data.items.length > 0) {
            console.log('📦 Loaded items from /api/zoho/items:', data.items.length);
            processZohoResponse(data, true);
            setIsSyncingZoho(false);
            return;
          }
        }
      } catch (err: any) {
        console.warn('Initial live Zoho catalog notice:', err.message);
      }

      // Seamless fallback for Vercel deployment: load bundled zoho-catalog.json
      try {
        const staticRes = await fetch(`/zoho-catalog.json?v=${Date.now()}`);
        if (staticRes.ok) {
          const staticData = await staticRes.json();
          if (staticData && Array.isArray(staticData.items) && staticData.items.length > 0) {
            console.log(`📦 [Vercel / Offline Fallback] Loaded ${staticData.items.length} items from bundled zoho-catalog.json`);
            processZohoResponse(staticData, true);
            setZohoStatus({
              configured: true,
              count: staticData.items.length,
              message: `Catalog active with ${staticData.items.length} products.`
            });
            setIsSyncingZoho(false);
            return;
          }
        }
      } catch (staticErr: any) {
        console.warn('Static catalog fallback notice:', staticErr.message);
      }

      setZohoStatus({ configured: false, message: 'Ready for Zoho sync.' });
      setIsSyncingZoho(false);
    }

    loadInitialZohoData();
  }, []);

  // Diagnostic Report: Audits description presence across all website items
  useEffect(() => {
    if (products.length > 0) {
      generateDescriptionDiagnosticReport(products);
      
      // Attach to window for on-demand manual auditing in DevTools console
      (window as any).runProductDescriptionAudit = () => generateDescriptionDiagnosticReport(products);
      (window as any).auditProductDescriptions = () => generateDescriptionDiagnosticReport(products);
      (window as any).currentProductsCatalog = products;
    }
  }, [products]);

  useEffect(() => {
    // Listen for an existing, persisted user session
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // User is logged in! Let's fetch their role from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setCurrentUser({
              uid: user.uid,
              ...userDoc.data()
            });
          } else {
            // Default or fallback user profile
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || user.email?.split('@')[0] || 'User',
              role: 'customer',
              createdAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error("Error reading persisted session profile: ", err);
          setCurrentUser({
            uid: user.uid,
            email: user.email,
            fullName: user.displayName || user.email?.split('@')[0] || 'User',
            role: 'customer'
          });
        }
      } else {
        // No session found
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Clean up listener
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
    } catch (err) {
      console.error("Error signing out: ", err);
    }
  };

  // === UI DISPLAY STATES ===
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Deep-link check: auto-open modal if URL contains ?product=ID or ?p=ID
  useEffect(() => {
    if (products.length > 0 && !selectedProduct) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const targetQuery = urlParams.get('product') || urlParams.get('p') || urlParams.get('id');
        if (targetQuery) {
          const match = products.find(
            (p) =>
              String(p.id).toLowerCase() === targetQuery.toLowerCase() ||
              String(p.zohoItemId || '').toLowerCase() === targetQuery.toLowerCase() ||
              String(p.sku || '').toLowerCase() === targetQuery.toLowerCase()
          );
          if (match) {
            setSelectedProduct(match);
          }
        }
      } catch (e) {
        console.warn('URL deep link parse notice:', e);
      }
    }
  }, [products]);

  const handleOpenProductModal = (prod: Product | null) => {
    setSelectedProduct(prod);
    try {
      const url = new URL(window.location.href);
      if (prod) {
        const targetId = prod.zohoItemId || prod.id || prod.sku;
        if (targetId) url.searchParams.set('product', String(targetId));
      } else {
        url.searchParams.delete('product');
        url.searchParams.delete('p');
        url.searchParams.delete('id');
      }
      window.history.replaceState({}, '', url.toString());
    } catch {
      // Safe fallback
    }
  };
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isPortalOpen, setIsPortalOpen] = useState(false);
  const [isGamingPcQuoteOpen, setIsGamingPcQuoteOpen] = useState(false);
  const [selectedPrometheanQuoteProduct, setSelectedPrometheanQuoteProduct] = useState<Product | null>(null);

  // Reset subcategory filters whenever top category changes
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setSelectedSubcategories([]);
    setActiveSubcategory(null);
    setIsGamingPcQuoteOpen(false);
    setSearchQuery('');
    setFilterState(prev => ({
      ...prev,
      selectedCategory: category as any,
      selectedBrands: []
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleSelectCategory = handleCategoryChange;

  const handleSelectSubcategory = (subcategory: string | null) => {
    setActiveSubcategory(subcategory);
    if (subcategory) {
      setSelectedSubcategories([subcategory]);
    } else {
      setSelectedSubcategories([]);
    }
  };

  const handleToggleSubcategory = (subCat: string, parentCat?: Category | string) => {
    if (parentCat && activeCategory !== parentCat && activeCategory !== 'All Tech' && activeCategory !== 'All' && activeCategory !== 'All Products') {
      setActiveCategory(parentCat);
      setSelectedSubcategories([subCat]);
      setActiveSubcategory(subCat);
      return;
    }
    setSelectedSubcategories(prev => {
      const exists = prev.some(s => s.toLowerCase() === subCat.toLowerCase());
      if (exists) {
        const next = prev.filter(s => s.toLowerCase() !== subCat.toLowerCase());
        if (next.length === 0) setActiveSubcategory(null);
        return next;
      } else {
        return [...prev, subCat];
      }
    });
  };

  const handleRequestPrometheanQuote = (product: Product) => {
    setSelectedPrometheanQuoteProduct(product);
    if (activeCategory !== 'Promethean') {
      setActiveCategory('Promethean');
    }
    setTimeout(() => {
      const formEl = document.getElementById('promethean-panel-quote-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };
  const [isMobile, setIsMobile] = useState(false);
  const [openSubcategories, setOpenSubcategories] = useState<Record<string, boolean>>({});

  const toggleSubcategory = (subCat: string) => {
    setOpenSubcategories(prev => {
      const current = prev[subCat] !== false;
      return {
        ...prev,
        [subCat]: !current
      };
    });
  };

  // === RESIZE EFFECT FOR RESPONSIVE GRIDS ===
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // === SIDEBAR FILTERS STATE ===
  const [filterState, setFilterState] = useState<FilterState>({
    searchQuery: '',
    selectedCategory: 'All',
    minPrice: 0,
    maxPrice: 6000,
    selectedBrands: [],
    sortBy: 'featured',
    inStockOnly: false
  });

  // === FLASH DEAL COUNTDOWNS STATE (DEALS & PROMOTIONS) ===
  const [countdownTimers, setCountdownTimers] = useState<Record<string, number>>({
    'lap-1': 43200, // 12 hours in seconds
    'mon-1': 28800, // 8 hours in seconds
    'acc-2': 14400  // 4 hours in seconds
  });

  // === FLASH DEAL STOCK COUNT STATE ===
  const [dealStocks, setDealStocks] = useState<Record<string, number>>({
    'lap-1': 12,
    'mon-1': 4,
    'acc-2': 27
  });

  // === EFFECT: PERSIST CART & WISHLIST TO STORAGE ===
  useEffect(() => {
    localStorage.setItem('techshop_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('techshop_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // === EFFECT: DECREMENT COUNTDOWNS EVERY SECOND ===
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdownTimers((prev) => {
        const updated: Record<string, number> = {};
        for (const id in prev) {
          const secs = prev[id];
          updated[id] = secs > 0 ? secs - 1 : 43200; // Reset after zero for continuous template preview
        }
        return updated;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // === DYNAMIC HELPER: FORMAT COUNTDOWN SECONDS ===
  const formatCountdown = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const minutes = Math.floor((totalSecs % 3600) / 60);
    const seconds = totalSecs % 60;

    const pad = (num: number) => String(num).padStart(2, '0');
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  // === DYNAMIC CALCULATOR: CART STATS ===
  const getCartCount = () => {
    return cartItems.reduce((acc, item) => acc + item.quantity, 0);
  };

  const getCartTotal = () => {
    return cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  };

  // === EVENT HANDLERS: CART OPERATIONS ===
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const existingIdx = prev.findIndex(
        (item) => item.product.id === product.id && !item.selectedColor && !item.selectedRam && !item.selectedStorage
      );
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleAddToCartWithConfig = (item: CartItem) => {
    setCartItems((prev) => {
      // Find matching item with exact configurations
      const existingIdx = prev.findIndex(
        (existing) => 
          existing.product.id === item.product.id && 
          existing.selectedColor === item.selectedColor && 
          existing.selectedRam === item.selectedRam && 
          existing.selectedStorage === item.selectedStorage
      );
      
      if (existingIdx > -1) {
        const copy = [...prev];
        copy[existingIdx].quantity += item.quantity;
        return copy;
      }
      return [...prev, item];
    });
  };

  const handleUpdateCartQuantity = (index: number, newQty: number) => {
    setCartItems((prev) => {
      const copy = [...prev];
      copy[index].quantity = newQty;
      return copy;
    });
  };

  const handleRemoveCartItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // === EVENT HANDLERS: WISHLIST OPERATIONS ===
  const handleToggleWishlist = (product: Product) => {
    setWishlist((prev) => {
      const isExist = prev.some((item) => item.id === product.id);
      if (isExist) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isProductWishlisted = (product: Product) => {
    return wishlist.some((item) => item.id === product.id);
  };

  // === BRAND SELECTION FILTER MODIFIER ===
  const handleToggleBrandFilter = (brand: string) => {
    setFilterState((prev) => {
      const isSelected = prev.selectedBrands.includes(brand);
      const updatedBrands = isSelected
        ? prev.selectedBrands.filter((b) => b !== brand)
        : [...prev.selectedBrands, brand];
      return { ...prev, selectedBrands: updatedBrands };
    });
  };

  // === HELPER FOR SUBCATEGORY MATCHING ===
  const matchesSubcategoryCheck = (item: Product, subcategory: string): boolean => {
    return isCategoryMatch(
      item.category,
      item.parentCategory || activeCategory,
      [subcategory],
      item.name,
      item.subcategory,
      item.parentCategory
    );
  };

  // === FILTER RESET ===
  const handleResetFilters = () => {
    setFilterState({
      searchQuery: '',
      selectedCategory: activeCategory,
      minPrice: 0,
      maxPrice: 6000,
      selectedBrands: [],
      sortBy: 'featured',
      inStockOnly: false
    });
    setSelectedSubcategories([]);
    setActiveSubcategory(null);
    setSearchQuery('');
  };

  // === CORE DATA INDEXING & FILTER ENGINE ===
  const filteredProducts = useMemo(() => {
    if (!products || products.length === 0) return [];

    let list = products.filter((product) => {
      if (!product) return false;

      // 1. Category filter (if not on 'All Products' / 'All Tech')
      if (activeCategory && activeCategory !== 'All' && activeCategory !== 'All Products' && activeCategory !== 'All Tech') {
        if (!isProductMatchingCategory(product, activeCategory)) {
          return false;
        }
      }

      // 2. Subcategory checkbox filter (if any checkbox is ticked)
      if (selectedSubcategories.length > 0) {
        const matched = selectedSubcategories.some((sub) => isProductMatchingSubcategory(product, sub));
        if (!matched) return false;
      }

      return true;
    });

    // 2. Filter by search query
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (p) => 
          p.name.toLowerCase().includes(query) || 
          p.brand.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query) ||
          Object.values(p.specs || {}).some(val => typeof val === 'string' && val.toLowerCase().includes(query))
      );
    }

    // 3. Filter by brands selected
    if (filterState.selectedBrands.length > 0) {
      list = list.filter((p) => filterState.selectedBrands.some(brand => brand.toLowerCase() === p.brand.toLowerCase()));
    }

    // 4. Filter by price bounds
    list = list.filter((p) => p.price >= filterState.minPrice && p.price <= filterState.maxPrice);

    // 5. Filter by in stock status
    if (filterState.inStockOnly) {
      list = list.filter((p) => p.inStock);
    }

    // 6. Sorting engine & Top Product Pinning
    if (filterState.sortBy === 'price-asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (filterState.sortBy === 'price-desc') {
      list.sort((a, b) => b.price - a.price);
    } else if (filterState.sortBy === 'rating') {
      list.sort((a, b) => b.rating - a.rating);
    } else {
      // Default / Featured sort: Pin C-Pen Reader 3 as the #1 top product on Homepage & in Adapters & Accessories
      list.sort((a, b) => {
        const isCPenA = a.id === 'c-pen-reader-3' || (a.name || '').toLowerCase().includes('c-pen');
        const isCPenB = b.id === 'c-pen-reader-3' || (b.name || '').toLowerCase().includes('c-pen');
        if (isCPenA && !isCPenB) return -1;
        if (!isCPenA && isCPenB) return 1;
        return 0;
      });
    }

    return list;
  }, [products, activeCategory, selectedSubcategories, searchQuery, filterState]);

  useEffect(() => {
    console.log('ACTIVE_CATEGORY_SELECTED:', activeCategory, 'MATCHED_COUNT:', filteredProducts.length);
  }, [activeCategory, filteredProducts.length]);

  // === QUICK HELPER FOR PORTAL BOOLEANS ===
  const isAuxiliaryCategory = ['Help & Advice', 'Business', 'Schools', 'Services'].includes(activeCategory);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider animate-pulse">Loading Shop...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/employee/dashboard" element={
        <SimpleEmployeeDashboard 
          products={products} 
          setProducts={setProducts} 
          categoryConfig={categoryConfig} 
        />
      } />
      <Route path="/customer/dashboard" element={
        <CustomerPortalDashboard />
      } />
      <Route path="/storefront" element={
        <Storefront />
      } />
      <Route path="/*" element={
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-blue-600 selection:text-white" id="main-app-root">
      
      {/* 1. Header & exact navigation categories bar */}
      <Header
        activeCategory={activeCategory}
        onSelectCategory={handleSelectCategory}
        activeSubcategory={activeSubcategory}
        onSelectSubcategory={handleSelectSubcategory}
        selectedSubcategories={selectedSubcategories}
        cartCount={getCartCount()}
        cartTotal={getCartTotal()}
        wishlistCount={wishlist.length}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenWishlist={() => setIsWishlistOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenPortalSignIn={() => setIsPortalOpen(true)}
        currentUser={currentUser}
        onSignOut={handleSignOut}
        onOpenGamingPcQuote={() => {
          setActiveCategory('Gaming PC Quote' as any);
          setIsGamingPcQuoteOpen(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onForceZohoSync={handleForceZohoSync}
        isSyncingZoho={isSyncingZoho}
        zohoCount={zohoStatus.count}
      />

      {/* Dynamic Zoho Live Status / Sync Feedback Notification Banner */}
      {zohoStatus.message && (
        <div className="w-full bg-slate-900 border-b border-slate-800 text-slate-300 py-2 px-4 text-xs transition-all animate-in fade-in duration-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${zohoStatus.configured ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="font-medium text-slate-200">{zohoStatus.message}</span>
            </div>
            <button
              onClick={handleForceZohoSync}
              disabled={isSyncingZoho}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer underline disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncingZoho ? 'animate-spin' : ''}`} />
              <span>{isSyncingZoho ? 'Syncing...' : 'Force Fresh Sync'}</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. Main Content Wrapper */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-[1]" id="main-catalog-view">
        
        {/* Render Gaming PC Quotation Workshop inline on the same page */}
        {activeCategory === 'Gaming PC Quote' || isGamingPcQuoteOpen ? (
          <GamingPcQuotationModal
            isOpen={true}
            isInlineView={true}
            onClose={() => {
              setIsGamingPcQuoteOpen(false);
              if (activeCategory === 'Gaming PC Quote') {
                setActiveCategory('All Tech');
              }
            }}
          />
        ) : activeCategory === 'Assistive Software' ? (
          <AssistiveSoftwarePage />
        ) : activeCategory === '3CX Phone System' ? (
          <ThreeCXPage />
        ) : activeCategory === 'Promethean' ? (
          <PrometheanPage
            selectedProduct={selectedPrometheanQuoteProduct}
            onClearSelectedProduct={() => setSelectedPrometheanQuoteProduct(null)}
          />
        ) : isAuxiliaryCategory ? (
          <Portals
            category={activeCategory as 'Help & Advice' | 'Business' | 'Schools' | 'Services'}
            products={products}
            onQuickView={setSelectedProduct}
            onAddToCart={handleAddToCart}
          />
        ) : (
          /* ========================================================
             STANDARD CATALOG / DEALS & PROMOTIONS DYNAMIC RENDER
             ======================================================== */
          <div className="flex flex-col md:flex-row gap-8 items-start">
            
            {/* Sidebar Filters panel - Sticky desktop, Collapses elegantly */}
            <Sidebar
              activeCategory={activeCategory}
              onSelectCategory={handleCategoryChange}
              selectedSubcategories={selectedSubcategories}
              onToggleSubcategory={handleToggleSubcategory}
              activeSubcategory={activeSubcategory}
              onSelectSubcategory={handleSelectSubcategory}
              filterState={filterState}
              setFilterState={setFilterState}
              onResetFilters={handleResetFilters}
              products={products}
            />

            {/* Catalog list container */}
            <div className="flex-1 w-full space-y-6">

              {/* Catalog header statistics and title */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100 pb-3" id="catalog-results-header">
                <div className="text-left">
                  <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <span>
                      {selectedSubcategories.length > 0 ? (
                        <span className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-medium text-lg">{activeCategory || 'Devices'}</span>
                          <span className="text-slate-300 font-light text-base">/</span>
                          <span className="text-blue-600">{selectedSubcategories.join(', ')}</span>
                        </span>
                      ) : (activeCategory === 'All' || activeCategory === 'All Tech' || activeCategory === null) ? (
                        'Ultimate Device Catalog'
                      ) : (
                        `${activeCategory}`
                      )}
                    </span>
                    {searchQuery.trim() && (
                      <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        Search Results for "{searchQuery}"
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedSubcategories.length > 0
                      ? `Displaying ${filteredProducts.length} models matching ${selectedSubcategories.join(', ')}`
                      : `Displaying all ${filteredProducts.length} models for ${activeCategory || 'All Tech'}`
                    }
                  </p>
                </div>
              </div>

              {/* Main catalog items grid */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl py-16 px-6 text-center space-y-4 shadow-sm" id="catalog-empty-view">
                  <div className="bg-slate-50 p-6 rounded-full inline-block text-slate-300">
                    <SlidersHorizontal className="w-16 h-16" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 text-sm">No models fit your active filters</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Try resetting your price slider bounds or deselecting brand checklist requirements to discover broader listings.
                    </p>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl transition-all cursor-pointer"
                  >
                    Clear Filter Settings
                  </button>
                </div>
              ) : (
                <div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" 
                  id="catalog-items-grid"
                >
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickView={handleOpenProductModal}
                      onAddToCart={handleAddToCart}
                      onToggleWishlist={handleToggleWishlist}
                      isWishlisted={isProductWishlisted(product)}
                      onRequestQuote={handleRequestPrometheanQuote}
                    />
                  ))}
                </div>
              )}

            </div>

          </div>
        )}
      </main>

      {/* 4. Modular footer layout */}
      <Footer onSelectCategory={handleSelectCategory} />

      {/* 5. Drawers / Overlays & Modals */}
      
      {/* Cart checkout sliding panel */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
      />

      {/* Wishlist panel */}
      <WishlistDrawer
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistItems={wishlist}
        onRemoveFromWishlist={handleToggleWishlist}
        onAddToCart={handleAddToCart}
      />

      {/* 8. Corporate Gate Portal Login Modal */}
      <PortalSignInModal 
        isOpen={isPortalOpen}
        onClose={() => setIsPortalOpen(false)}
      />

      {/* Product quick specs inspector modal (Root Level) */}
      <ProductModal
        product={selectedProduct}
        onClose={() => handleOpenProductModal(null)}
        onAddToCart={handleAddToCart}
        onAddToCartWithConfig={handleAddToCartWithConfig}
        onToggleWishlist={handleToggleWishlist}
        isWishlisted={selectedProduct ? isProductWishlisted(selectedProduct) : false}
        onRequestQuote={handleRequestPrometheanQuote}
      />

        </div>
      } />
    </Routes>
  );
}
