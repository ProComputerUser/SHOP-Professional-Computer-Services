import React from 'react';
import { Star, ShoppingCart, Eye, Sparkles, FileText, Package } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  key?: React.Key;
  product: Product;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onToggleWishlist: (product: Product) => void;
  isWishlisted: boolean;
  onAddToCompare?: (product: Product) => void;
  isCompared?: boolean;
  onRequestQuote?: (product: Product) => void;
}

export default function ProductCard({
  product,
  onQuickView,
  onAddToCart,
  onToggleWishlist,
  isWishlisted,
  onRequestQuote
}: ProductCardProps) {
  const isPromethean = product.category === 'Promethean' || product.brand === 'Promethean';

  // Render Stars Helper
  const renderStars = (rating: number = 5) => {
    const safeRating = Number(rating) || 5;
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <span key={i} className="relative inline-block w-3.5 h-3.5">
            <Star className="w-3.5 h-3.5 text-gray-200 absolute top-0 left-0" />
            <span className="absolute top-0 left-0 overflow-hidden w-[50%]">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            </span>
          </span>
        );
      } else {
        stars.push(<Star key={i} className="w-3.5 h-3.5 text-gray-200" />);
      }
    }
    return stars;
  };

  return (
    <div 
      className={
        isPromethean
          ? "group bg-[#0c152b] rounded-3xl border border-slate-800 hover:border-violet-500/60 shadow-xl hover:shadow-violet-500/10 transition-all duration-300 flex flex-col justify-between overflow-hidden text-left relative"
          : "group bg-white rounded-2xl border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden text-left relative"
      }
      id={`product-card-${product.id}`}
    >
      
      {/* Top badges / actions track */}
      {product.badge && (
        <div className="absolute top-3 left-3 z-10 flex flex-col gap-1 items-start">
          <span className={
            isPromethean
              ? "bg-violet-600 text-white text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-md border border-violet-400/30"
              : "bg-slate-900 text-white text-[9px] font-extrabold px-2 py-1 rounded-md uppercase tracking-wider shadow-sm"
          }>
            {product.badge}
          </span>
        </div>
      )}

      {/* Product Image and Quick View Trigger */}
      <div 
        className={
          isPromethean
            ? "w-full pt-[60%] bg-slate-900 relative overflow-hidden group/img cursor-pointer"
            : "w-full pt-[75%] bg-slate-50 relative overflow-hidden group/img cursor-pointer"
        }
        onClick={() => onQuickView(product)}
        title="View Product Details"
      >
        <img
          src={product.imageUrl || `/api/zoho/item/${product.zohoItemId || product.id}/image` || 'https://placehold.co/600x600/f8fafc/64748b?text=Product+Image'}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300 ease-out"
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f8fafc/64748b?text=PCS+Product';
          }}
        />
        
        {/* Dynamic Dark Vignette Overlay on hover with Quick View indicator */}
        <div className={
          isPromethean
            ? "absolute inset-0 bg-gradient-to-t from-[#0c152b] via-[#0c152b]/40 to-transparent opacity-80 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center"
            : "absolute inset-0 bg-slate-950/20 opacity-0 group-hover/img:opacity-100 transition-opacity duration-300 flex items-center justify-center"
        }>
          <span className="bg-white/90 text-slate-900 font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-1.5 shadow-lg transform translate-y-2 group-hover/img:translate-y-0 transition-transform duration-300">
            <Eye className="w-3.5 h-3.5 text-violet-600" />
            <span>Quick View</span>
          </span>
        </div>
      </div>

      {/* Product Information Area */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        
        <div className="space-y-2">
          {/* Brand & Subcategory row */}
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            {product.brand && !['zoho', 'generic', 'professional computers'].includes(product.brand.toLowerCase()) ? (
              <span className={isPromethean ? "text-violet-400 font-extrabold uppercase tracking-wider text-[11px]" : "font-semibold uppercase tracking-wider text-slate-400 text-[11px]"}>
                {product.brand}
              </span>
            ) : <span />}
            {product.subcategory && (
              <span className={
                isPromethean
                  ? "bg-slate-800/90 text-slate-300 px-2 py-0.5 rounded text-[11px] font-medium uppercase border border-slate-700/80"
                  : "bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[11px] font-medium uppercase"
              }>
                {product.subcategory}
              </span>
            )}
          </div>

          {/* Title name */}
          <h3 
            onClick={() => onQuickView(product)}
            className={
              isPromethean
                ? "font-black text-white text-base hover:text-violet-300 cursor-pointer line-clamp-2 min-h-[44px] leading-snug transition-colors drop-shadow-sm"
                : "font-bold text-slate-800 text-sm hover:text-blue-600 cursor-pointer line-clamp-2 min-h-[40px] leading-snug transition-colors"
            }
          >
            {product.name}
          </h3>

          {/* Product SKU under product name */}
          {product.sku && (
            <div className={`text-[11px] font-mono flex items-center gap-1 -mt-1 ${isPromethean ? 'text-violet-300/80' : 'text-slate-400'}`}>
              <span className="text-[10px] font-sans font-medium uppercase tracking-wider opacity-75">SKU:</span>
              <span className="truncate" title={product.sku}>{product.sku}</span>
            </div>
          )}

          {/* Ratings row */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center">
              {renderStars(product.rating ?? 4.8)}
            </div>
            <span className={`text-[11px] font-bold ${isPromethean ? 'text-slate-300' : 'text-slate-500'}`}>
              {(Number(product.rating) || 4.8).toFixed(1)}
            </span>
            <span className={`text-[10px] ${isPromethean ? 'text-slate-400' : 'text-slate-400'}`}>
              ({product.reviewsCount ?? 12})
            </span>
          </div>

          {/* Micro spec items bullet list (for standard products) */}
          {!isPromethean && product.specs && Object.keys(product.specs).length > 0 && (
            <div className="pt-2 pb-1 space-y-1 border-t border-slate-50">
              {Object.entries(product.specs || {}).slice(0, 3).map(([key, value]) => (
                <div key={key} className="flex justify-between text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-400">{key}:</span>
                  <span className="text-right truncate max-w-[130px]" title={value}>{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pricing, Compare checkbox and Checkout CTA row */}
        {isPromethean ? (
          <div className="pt-3 border-t border-slate-800/80 mt-3 space-y-3.5">
            {/* Section 1: Specifications */}
            <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
              <div className="text-[10px] font-black text-violet-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-violet-400" />
                <span>Specifications</span>
              </div>
              <div className="space-y-1.5 text-xs">
                {Object.entries(product.specs || {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-baseline gap-2 border-b border-slate-800/80 pb-1.5 last:border-0 last:pb-0">
                    <span className="font-semibold text-slate-400 text-[11px] shrink-0">{key}:</span>
                    <span className="font-mono font-bold text-slate-100 text-right text-[11px] truncate" title={value}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section 2: Unique Features */}
            {product.features && product.features.length > 0 && (
              <div className="bg-violet-950/40 p-3.5 rounded-2xl border border-violet-800/40 space-y-1.5">
                <div className="text-[10px] font-black text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>Unique Features</span>
                </div>
                <ul className="list-disc pl-3.5 space-y-1 text-[11px] text-slate-300">
                  {product.features.map((feat, idx) => (
                    <li key={idx} className="leading-snug">{feat}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Section 3: Included Peripherals */}
            {product.peripherals && product.peripherals.length > 0 && (
              <div className="bg-slate-900/90 p-3.5 rounded-2xl border border-slate-800 space-y-2">
                <div className="text-[10px] font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-violet-400" />
                  <span>Included Peripherals</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {product.peripherals.map((item, idx) => (
                    <span key={idx} className="bg-slate-800 text-slate-200 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-slate-700/80 shadow-2xs">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quote Action Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onRequestQuote) {
                  onRequestQuote(product);
                } else {
                  const formEl = document.getElementById('promethean-panel-quote-form');
                  if (formEl) formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="w-full bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 tracking-wide cursor-pointer"
            >
              <span>Request a Quote ✉️</span>
            </button>
          </div>
        ) : (
          <div className="pt-3 border-t border-slate-100 mt-3 space-y-3">
            
            <div className="flex items-baseline justify-between gap-1.5">
              {/* Price section */}
              <div className="flex items-baseline gap-1">
                <span className="text-base font-extrabold text-slate-900">
                  €{Number(product.price).toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">inc. VAT</span>
              </div>
            </div>

            {/* Primary Action Button: Add to Cart */}
            {product.inStock ? (
              <button
                onClick={() => onAddToCart(product)}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition-all duration-200 transform active:scale-[0.98] shadow-sm shadow-blue-600/20 cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add to Cart</span>
              </button>
            ) : (
              <button
                disabled
                className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-400 font-bold text-xs py-2 px-4 rounded-xl cursor-not-allowed"
              >
                Out of Stock
              </button>
            )}

          </div>
        )}

      </div>

    </div>
  );
}
