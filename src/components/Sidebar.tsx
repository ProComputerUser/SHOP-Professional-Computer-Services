import React, { useMemo } from 'react';
import { EXACT_STORE_CATEGORIES, StoreCategory } from '../categoryData';
import { FilterState, Product } from '../types';
import { ChevronDown, ChevronRight, Check, Filter } from 'lucide-react';
import { normalizeCategoryName, isProductMatchingCategory, isProductMatchingSubcategory } from '../mapCategory';

export const MAIN_CATEGORIES = EXACT_STORE_CATEGORIES;

interface SidebarProps {
  activeCategory: string | null;
  onSelectCategory: (category: any) => void;
  selectedSubcategories?: string[];
  onToggleSubcategory?: (subcategory: string, parentCategory?: any) => void;
  activeSubcategory?: string | null;
  onSelectSubcategory?: (subcategory: string | null) => void;
  filterState?: FilterState;
  setFilterState?: React.Dispatch<React.SetStateAction<FilterState>>;
  onResetFilters?: () => void;
  products?: Product[];
}

// Categories to exclude strictly from the left sidebar filter list
function isExcludedFromSidebar(name: string): boolean {
  const norm = (name || '').toLowerCase().trim();
  return (
    norm.includes('promethean') ||
    norm.includes('assistive') ||
    norm.includes('gaming pc') ||
    norm.includes('quote') ||
    norm.includes('3cx')
  );
}

export default function Sidebar({
  activeCategory,
  onSelectCategory,
  selectedSubcategories = [],
  onToggleSubcategory,
  filterState,
  setFilterState,
  onResetFilters,
  products = []
}: SidebarProps) {
  // Dynamically map store categories from predefined list + active Zoho item categories & subcategories
  const storeCategories = useMemo(() => {
    const categoriesMap = new Map<string, StoreCategory>();

    // Seed with standard store categories, excluding Promethean, Assistive Tech, and Gaming PC quotes from sidebar
    EXACT_STORE_CATEGORIES.forEach(cat => {
      if (isExcludedFromSidebar(cat.name)) return;

      categoriesMap.set(cat.name, {
        name: cat.name,
        header: cat.header,
        subcategories: [...cat.subcategories]
      });
    });

    // Incorporate any active Zoho product categories and subcategories
    products.forEach(p => {
      const catName = normalizeCategoryName(p.parentCategory || p.category || '');
      if (
        catName &&
        catName !== 'All Tech' &&
        catName !== 'All Products' &&
        catName !== 'All' &&
        !isExcludedFromSidebar(catName)
      ) {
        if (!categoriesMap.has(catName)) {
          categoriesMap.set(catName, {
            name: catName,
            subcategories: []
          });
        }

        const catObj = categoriesMap.get(catName);
        if (catObj && p.subcategory && p.subcategory.trim()) {
          const sub = p.subcategory.trim();
          if (!catObj.subcategories.includes(sub)) {
            catObj.subcategories.push(sub);
          }
        }
      }
    });

    return Array.from(categoriesMap.values());
  }, [products]);

  const [expandedCategories, setExpandedCategories] = React.useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    EXACT_STORE_CATEGORIES.forEach(cat => {
      if (cat.subcategories.length > 0) {
        initial[cat.name] = true;
      }
    });
    return initial;
  });

  // Calculate dynamic product counts per category from the active items
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    storeCategories.forEach((cat) => {
      counts[cat.name] = products.filter((p) => isProductMatchingCategory(p, cat.name)).length;
    });
    return counts;
  }, [products, storeCategories]);

  // Calculate subcategory product counts
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    storeCategories.forEach((cat) => {
      cat.subcategories.forEach((sub) => {
        counts[sub] = products.filter((p) => isProductMatchingSubcategory(p, sub)).length;
      });
    });
    return counts;
  }, [products, storeCategories]);

  // Extract available brands for the active category
  const availableBrands = useMemo(() => {
    const relevantProducts = !activeCategory || activeCategory === 'All' || activeCategory === 'All Tech' || activeCategory === 'All Products'
      ? products
      : products.filter(p => isProductMatchingCategory(p, activeCategory));

    const brandCounts: Record<string, number> = {};
    relevantProducts.forEach((p) => {
      if (p.brand && p.brand.trim().length > 0) {
        brandCounts[p.brand] = (brandCounts[p.brand] || 0) + 1;
      }
    });

    return Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }, [products, activeCategory]);

  const toggleCategoryExpand = (catName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: !prev[catName]
    }));
  };

  const handleCategoryClick = (catName: string) => {
    onSelectCategory(catName);
    setExpandedCategories(prev => ({
      ...prev,
      [catName]: true
    }));
    if (setFilterState) {
      setFilterState((prev) => ({ ...prev, selectedCategory: catName as any, selectedBrands: [] }));
    }
  };

  const toggleBrand = (brand: string) => {
    if (!setFilterState) return;
    setFilterState((prev) => {
      const exists = prev.selectedBrands.includes(brand);
      return {
        ...prev,
        selectedBrands: exists ? prev.selectedBrands.filter((b) => b !== brand) : [...prev.selectedBrands, brand]
      };
    });
  };

  const isAllSelected = !activeCategory || activeCategory === 'All Tech' || activeCategory === 'All' || activeCategory === 'All Products';

  return (
    <aside className="w-full md:w-64 shrink-0 bg-white border border-gray-100 p-5 rounded-2xl shadow-sm text-left space-y-6" id="catalog-sidebar-filters">
      {/* Browse Categories Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">Browse Categories</span>
          <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
            {products.length} Items
          </span>
        </div>

        <div className="border border-slate-100 rounded-xl divide-y divide-slate-50 overflow-hidden bg-slate-50/30" id="sidebar-categories-list">
          {/* 'All Products' option */}
          <button
            onClick={() => handleCategoryClick('All Tech')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-all text-left focus:outline-none cursor-pointer ${
              isAllSelected
                ? 'bg-blue-50/80 text-blue-600 font-bold border-l-2 border-blue-600'
                : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
            }`}
            id="sidebar-cat-all-tech"
          >
            <span>All Products</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${isAllSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-200/70 text-slate-500'}`}>
              {products.length}
            </span>
          </button>

          {storeCategories.map((cat: StoreCategory) => {
            const isParentActive = activeCategory === cat.name;
            const hasSubcategories = cat.subcategories.length > 0;
            const isExpanded = expandedCategories[cat.name] ?? isParentActive;
            const count = categoryCounts[cat.name] || 0;

            return (
              <div key={cat.name} className="flex flex-col bg-white">
                <div
                  onClick={() => handleCategoryClick(cat.name)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-semibold transition-all text-left focus:outline-none cursor-pointer ${
                    isParentActive
                      ? 'bg-blue-50/80 text-blue-600 font-bold border-l-2 border-blue-600'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  id={`sidebar-cat-${cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="truncate">{cat.name}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isParentActive ? 'bg-blue-100 text-blue-700 font-bold' : 'bg-slate-100 text-slate-500'}`}>
                        {count}
                      </span>
                    )}
                    {hasSubcategories && (
                      <button
                        type="button"
                        onClick={(e) => toggleCategoryExpand(cat.name, e)}
                        className="p-0.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronRight className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories Checkbox List */}
                {hasSubcategories && isExpanded && (
                  <div className="bg-slate-50/70 px-3 py-2 space-y-1 border-t border-slate-100/60 animate-in fade-in duration-150">
                    {cat.header && (
                      <div className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider px-1 pb-1">
                        {cat.header}
                      </div>
                    )}
                    {cat.subcategories.map((subName) => {
                      const isChecked = selectedSubcategories.includes(subName);
                      const subCount = subcategoryCounts[subName] || 0;

                      return (
                        <label
                          key={subName}
                          className="flex items-center justify-between gap-2 px-1.5 py-1 rounded hover:bg-slate-100/80 text-xs text-slate-600 hover:text-slate-900 cursor-pointer select-none group"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <input
                              type="checkbox"
                              checked={selectedSubcategories.includes(subName)}
                              onChange={() => onToggleSubcategory && onToggleSubcategory(subName, cat.name)}
                              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer accent-blue-600"
                            />
                            <span className={`text-[11px] truncate ${isChecked ? 'font-bold text-blue-700' : 'font-normal'}`}>
                              {subName}
                            </span>
                          </div>
                          {subCount > 0 && (
                            <span className="text-[9px] text-slate-400 font-mono">
                              {subCount}
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Filters CTA */}
      {onResetFilters && (
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={onResetFilters}
            className="w-full text-center text-xs font-semibold text-slate-500 hover:text-blue-600 py-1.5 px-3 rounded-lg hover:bg-blue-50/50 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </aside>
  );
}
