import { useState } from 'react';
import { ShoppingCart, Menu, X, Sparkles, ChevronDown, Phone, Mail, RefreshCw } from 'lucide-react';
import { Category } from '../types';
import Logo from './Logo';
import { EXACT_STORE_CATEGORIES, StoreCategory } from '../categoryData';

interface HeaderProps {
  activeCategory: string | null;
  onSelectCategory: (category: string) => void;
  activeSubcategory: string | null;
  onSelectSubcategory: (subcategory: string | null) => void;
  selectedSubcategories?: string[];
  cartCount: number;
  cartTotal: number;
  wishlistCount: number;
  compareCount?: number;
  onOpenCart: () => void;
  onOpenWishlist: () => void;
  onOpenCompare?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onOpenPortalSignIn?: () => void;
  currentUser?: any;
  onSignOut?: () => void;
  onOpenGamingPcQuote?: () => void;
  onForceZohoSync?: () => void;
  isSyncingZoho?: boolean;
  zohoCount?: number;
}

export default function Header({
  activeCategory,
  onSelectCategory,
  activeSubcategory,
  onSelectSubcategory,
  cartCount,
  cartTotal,
  onOpenCart,
  onOpenGamingPcQuote,
  onForceZohoSync,
  isSyncingZoho = false,
  zohoCount
}: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleCategoryClick = (category: string | null, subcategory: string | null = null) => {
    onSelectCategory(category || 'All Tech');
    onSelectSubcategory(subcategory);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm w-full overflow-visible" id="main-app-header">
      {/* Top Utility Bar (Pure White) */}
      <div className="w-full bg-white text-slate-800 py-3.5 px-4 sm:px-6 lg:px-8 border-b border-gray-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
          
          {/* Logo */}
          <div 
            onClick={() => handleCategoryClick('All Tech')}
            className="flex items-center gap-2 cursor-pointer group shrink-0"
            id="header-brand-logo"
          >
            <Logo className="h-12 sm:h-14 md:h-16 lg:h-18 w-auto object-contain cursor-pointer transition-transform group-hover:scale-105" />
          </div>

          {/* Centered Contact & Support Bar */}
          <div className="hidden md:flex flex-1 items-center justify-center px-2 lg:px-6" id="header-center-support">
            <div className="flex items-center gap-2.5 lg:gap-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full py-1.5 px-4 lg:px-5.5 shadow-sm transition-all border border-blue-500/80">
              <div className="flex items-center shrink-0 text-xs">
                <span className="font-bold tracking-tight text-white">Need support?</span>
              </div>
              <div className="h-3.5 w-px bg-blue-400/60 mx-0.5 shrink-0" />
              <div className="flex items-center gap-2.5 lg:gap-3.5 shrink-0">
                <a 
                  href="tel:+353906452550" 
                  className="flex items-center gap-1.5 text-xs font-bold text-white hover:text-blue-100 transition-colors"
                  title="Call +353 90 645 2550"
                  id="header-phone-link"
                >
                  <Phone className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                  <span>+353 90 645 2550</span>
                </a>
                <span className="text-blue-300/70 text-xs">|</span>
                <a 
                  href="mailto:sales@procomputer.ie" 
                  className="flex items-center gap-1.5 text-xs font-semibold text-blue-100 hover:text-white transition-colors"
                  title="Email sales@procomputer.ie"
                  id="header-email-link"
                >
                  <Mail className="w-3.5 h-3.5 text-blue-200 shrink-0" />
                  <span>sales@procomputer.ie</span>
                </a>
              </div>
            </div>
          </div>

          {/* User & Interactive Counters */}
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 shrink-0" id="header-interactive-counters">
            {/* Quick Phone & Email Buttons (Mobile/Tablet below md) */}
            <div className="flex items-center gap-1 md:hidden">
              <a 
                href="tel:+353906452550" 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-700 hover:text-blue-600 transition-all border border-slate-200"
                title="Click to call landline: +353 90 645 2550"
                id="header-mobile-phone-link"
              >
                <Phone className="w-4 h-4 text-blue-600" />
              </a>
              <a 
                href="mailto:sales@procomputer.ie" 
                className="p-2 hover:bg-slate-100 rounded-full text-slate-700 hover:text-blue-600 transition-all border border-slate-200"
                title="Email sales@procomputer.ie"
                id="header-mobile-email-link"
              >
                <Mail className="w-4 h-4 text-blue-600" />
              </a>
            </div>

            {/* Zoho Live Price Sync Button */}
            {onForceZohoSync && (
              <button
                onClick={onForceZohoSync}
                disabled={isSyncingZoho}
                title="Sync live prices and catalog from Zoho Inventory"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300 border border-slate-200 transition-all cursor-pointer disabled:opacity-50"
                id="header-zoho-sync-btn"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncingZoho ? 'animate-spin' : ''}`} />
                <span className="hidden md:inline">{isSyncingZoho ? 'Syncing...' : 'Zoho Sync'}</span>
                {zohoCount !== undefined && zohoCount > 0 && !isSyncingZoho && (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full">
                    {zohoCount}
                  </span>
                )}
              </button>
            )}

            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-full py-2 px-3.5 sm:px-4 text-white transition-all duration-200 shadow-sm hover:shadow-md group active:scale-95 cursor-pointer"
              id="header-cart-button"
            >
              <ShoppingCart className="w-4 h-4 group-hover:scale-110 transition-transform text-white" />
              <div className="hidden sm:block text-left text-xs">
                <span className="block text-[9px] text-blue-100 group-hover:text-white leading-none">My Cart</span>
                <span className="font-bold text-white">{cartCount} items</span>
              </div>
              <span className="sm:hidden bg-white text-blue-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
              {cartCount > 0 && (
                <span className="hidden lg:inline-block border-l border-blue-400/60 pl-2 text-xs font-bold text-cyan-200 ml-1">
                  €{(Number(cartTotal) || 0).toFixed(2)}
                </span>
              )}
            </button>

            {/* Mobile Menu Trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-700 md:hidden transition-all border border-slate-200"
              id="header-mobile-toggle"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Categories Sub-Navigation Bar */}
      <div className="w-full bg-white relative z-40 overflow-visible" id="header-categories-bar">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-visible">
          
          {/* 2-Row Balanced Navigation */}
          <div className="flex flex-col gap-2 py-2 border-b border-gray-100 bg-white overflow-visible select-none">
            
            {/* Row 1 (General Hardware, Peripherals & Infrastructure) */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap text-sm font-medium text-slate-700 relative z-30 overflow-visible" id="nav-row-1">
              <button
                onClick={() => {
                  handleCategoryClick('All Tech');
                  onSelectSubcategory(null);
                }}
                className={`text-xs md:text-[13px] font-medium px-2 md:px-2.5 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  activeCategory === 'All Tech' || activeCategory === 'All' || activeCategory === 'All Products' || !activeCategory
                    ? 'text-blue-600 bg-blue-50/80 font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
                id="nav-all-products-btn"
              >
                All Products
              </button>

              {/* Row 1 Categories: Laptops, Monitors, Tablets, Printer & Supplies, Peripherals & Audio, Network & Connectivity, Adapters & Accessories */}
              {EXACT_STORE_CATEGORIES.filter((cat: StoreCategory) => cat.name !== 'Promethean' && cat.name !== 'Assistive Software' && cat.name !== '3CX Phone System').map((cat: StoreCategory) => {
                const hasSubs = cat.subcategories.length > 0;
                const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                if (hasSubs) {
                  return (
                    <div key={cat.name} className="relative group/dropdown py-0.5 shrink-0 overflow-visible z-50" id={`desktop-${slug}-dropdown-container`}>
                      <button
                        onClick={() => {
                          handleCategoryClick(cat.name);
                          onSelectSubcategory(null);
                        }}
                        className={`text-xs md:text-[13px] font-medium px-1.5 md:px-2 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                          activeCategory === cat.name
                            ? 'text-blue-600 bg-blue-50/50 font-semibold'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                        id={`nav-${slug}-dropdown-trigger`}
                      >
                        <span>{cat.name}</span>
                        <ChevronDown className="w-3.5 h-3.5 opacity-60 group-hover/dropdown:rotate-180 transition-transform duration-200" />
                      </button>
                      
                      {/* Dropdown Content */}
                      <div className="absolute left-0 mt-1 w-60 bg-white border border-slate-100 rounded-xl shadow-2xl py-2 z-[999] hidden group-hover/dropdown:block animate-in fade-in slide-in-from-top-2 duration-200" id={`nav-${slug}-dropdown-menu`}>
                        {cat.header && (
                          <div className="px-3 pb-1.5 mb-1.5 border-b border-slate-50 text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-left">
                            {cat.header}
                          </div>
                        )}
                        <button
                          onClick={() => {
                            handleCategoryClick(cat.name);
                            onSelectSubcategory(null);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-between ${
                            activeCategory === cat.name && !activeSubcategory
                              ? 'text-blue-600 bg-blue-50/30 font-bold'
                              : 'text-slate-700 hover:text-slate-900 hover:bg-slate-50'
                          }`}
                        >
                          <span>All {cat.name}</span>
                          {activeCategory === cat.name && !activeSubcategory && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                        </button>
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub}
                            onClick={() => {
                              handleCategoryClick(cat.name);
                              onSelectSubcategory(sub);
                            }}
                            className={`w-full text-left px-4 py-2 text-xs font-medium rounded-lg flex items-center justify-between ${
                              activeCategory === cat.name && activeSubcategory === sub
                                ? 'text-blue-600 bg-blue-50/50 font-bold'
                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                            }`}
                          >
                            <span>{sub}</span>
                            {activeCategory === cat.name && activeSubcategory === sub && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                }

                return (
                  <button
                    key={cat.name}
                    onClick={() => {
                      handleCategoryClick(cat.name);
                      onSelectSubcategory(null);
                    }}
                    className={`text-xs md:text-[13px] font-medium px-1.5 md:px-2 py-1.5 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                      activeCategory === cat.name
                        ? 'text-blue-600 bg-blue-50/50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    {cat.name}
                  </button>
                );
              })}
            </div>

            {/* Row 2 (Special Solutions & Quote Builder) */}
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap text-sm font-medium relative z-20 overflow-visible" id="nav-row-2">
              {/* Promethean Quote */}
              <button
                onClick={() => {
                  handleCategoryClick('Promethean');
                  onSelectSubcategory(null);
                }}
                className={`bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition flex items-center cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeCategory === 'Promethean' ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-700' : ''
                }`}
                id="nav-promethean-quote-btn"
              >
                <span>Promethean Quote</span>
              </button>

              {/* Assistive Tech Quote */}
              <button
                onClick={() => {
                  handleCategoryClick('Assistive Software');
                  onSelectSubcategory(null);
                }}
                className={`bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition flex items-center cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeCategory === 'Assistive Software' ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-700' : ''
                }`}
                id="nav-assistive-tech-quote-btn"
              >
                <span>Assistive Tech Quote</span>
              </button>

              {/* 3CX Phone System Quote */}
              <button
                onClick={() => {
                  handleCategoryClick('3CX Phone System');
                  onSelectSubcategory(null);
                }}
                className={`bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition flex items-center cursor-pointer whitespace-nowrap active:scale-95 ${
                  activeCategory === '3CX Phone System' ? 'ring-2 ring-blue-400 ring-offset-1 bg-blue-700' : ''
                }`}
                id="nav-3cx-quote-btn"
              >
                <span>3CX Phone System Quote</span>
              </button>

              {/* Build Gaming PC Quote */}
              {onOpenGamingPcQuote && (
                <button
                  onClick={onOpenGamingPcQuote}
                  className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm transition flex items-center cursor-pointer whitespace-nowrap active:scale-95"
                  id="header-gaming-pc-quote-btn"
                >
                  <span>Build Gaming PC Quote</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Mobile Slide-down Full Overlay Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-[110px] left-0 w-full bg-white shadow-xl z-40 border-b border-gray-200 py-4 px-6 md:hidden max-h-[80vh] overflow-y-auto animate-in fade-in slide-in-from-top-4 duration-200">
          
          {/* Quick Call Landline & Email Links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
            <a
              href="tel:+353906452550"
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all border border-blue-200 shadow-2xs"
              id="mobile-menu-phone-call"
            >
              <Phone className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Call: +353 90 645 2550</span>
            </a>
            <a
              href="mailto:sales@procomputer.ie"
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-all border border-slate-200"
              id="mobile-menu-email-link"
            >
              <Mail className="w-4 h-4 text-blue-600 shrink-0" />
              <span>sales@procomputer.ie</span>
            </a>
          </div>

          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Dedicated Solutions & Quotes</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => {
                handleCategoryClick('Promethean');
                onSelectSubcategory(null);
              }}
              className={`text-left text-xs p-3 rounded-xl font-bold flex items-center justify-between border transition-all ${
                activeCategory === 'Promethean'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50/50 text-blue-900 border-blue-100 hover:bg-blue-50'
              }`}
            >
              <span>Promethean Quote</span>
              <span className="text-[10px] font-normal opacity-80">Interactive Panels</span>
            </button>
            <button
              onClick={() => {
                handleCategoryClick('Assistive Software');
                onSelectSubcategory(null);
              }}
              className={`text-left text-xs p-3 rounded-xl font-bold flex items-center justify-between border transition-all ${
                activeCategory === 'Assistive Software'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50/50 text-blue-900 border-blue-100 hover:bg-blue-50'
              }`}
            >
              <span>Assistive Tech Quote</span>
              <span className="text-[10px] font-normal opacity-80">SEN & Access</span>
            </button>
            <button
              onClick={() => {
                handleCategoryClick('3CX Phone System');
                onSelectSubcategory(null);
              }}
              className={`text-left text-xs p-3 rounded-xl font-bold flex items-center justify-between border transition-all ${
                activeCategory === '3CX Phone System'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-blue-50/50 text-blue-900 border-blue-100 hover:bg-blue-50'
              }`}
            >
              <span>3CX Phone System Quote</span>
              <span className="text-[10px] font-normal opacity-80">Business VoIP</span>
            </button>
            {onOpenGamingPcQuote && (
              <button
                onClick={() => {
                  onOpenGamingPcQuote();
                  setMobileMenuOpen(false);
                }}
                className="text-left text-xs p-3 rounded-xl font-bold flex items-center justify-between border bg-slate-900 text-white border-slate-800 shadow-sm hover:bg-slate-800 transition-all"
              >
                <span>Build Gaming PC Quote</span>
                <span className="text-[10px] font-normal text-cyan-300">Custom Rig</span>
              </button>
            )}
          </div>

          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Device Categories</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {EXACT_STORE_CATEGORIES.filter((cat: StoreCategory) => cat.name !== 'Promethean' && cat.name !== 'Assistive Software' && cat.name !== '3CX Phone System').map((cat: StoreCategory) => {
              const hasSubs = cat.subcategories.length > 0;
              const slug = cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

              if (hasSubs) {
                return (
                  <div key={cat.name} className="col-span-2 border border-slate-100 rounded-xl p-2.5 bg-slate-50/50 space-y-2 text-left" id={`mobile-${slug}-sub-container`}>
                    {cat.header && (
                      <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest pl-1">{cat.header}</span>
                    )}
                    <div className="grid grid-cols-1 gap-1">
                      <button
                        onClick={() => {
                          handleCategoryClick(cat.name);
                          onSelectSubcategory(null);
                        }}
                        className={`text-left text-xs p-2 rounded-lg font-medium transition-all ${
                          activeCategory === cat.name && !activeSubcategory
                            ? 'bg-blue-600 text-white shadow-sm font-semibold'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-100/80'
                        }`}
                      >
                        All {cat.name}
                      </button>
                      {cat.subcategories.map((sub) => (
                        <button
                          key={sub}
                          onClick={() => {
                            handleCategoryClick(cat.name);
                            onSelectSubcategory(sub);
                          }}
                          className={`text-left text-xs p-2 rounded-lg font-medium pl-4 transition-all ${
                            activeCategory === cat.name && activeSubcategory === sub
                              ? 'bg-blue-50 text-blue-600 font-semibold'
                              : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-100/80'
                          }`}
                        >
                          └ {sub}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    handleCategoryClick(cat.name);
                    onSelectSubcategory(null);
                  }}
                  className={`text-left text-xs p-2.5 rounded-lg font-medium ${
                    activeCategory === cat.name ? 'bg-blue-50 text-blue-600' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
