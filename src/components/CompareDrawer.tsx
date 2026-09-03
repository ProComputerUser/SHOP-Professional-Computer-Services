import { motion, AnimatePresence } from 'motion/react';
import { X, GitCompare, ShoppingCart, Star, HelpCircle, Check, Trash } from 'lucide-react';
import { Product } from '../types';

interface CompareDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  compareItems: Product[];
  onRemoveCompareItem: (product: Product) => void;
  onClearCompare: () => void;
  onAddToCart: (product: Product) => void;
}

export default function CompareDrawer({
  isOpen,
  onClose,
  compareItems,
  onRemoveCompareItem,
  onClearCompare,
  onAddToCart
}: CompareDrawerProps) {
  // Compile a unique list of all specification keys present across compared products
  const getAllUniqueSpecKeys = () => {
    const keysSet = new Set<string>();
    compareItems.forEach((item) => {
      Object.keys(item.specs).forEach((key) => {
        keysSet.add(key);
      });
    });
    return Array.from(keysSet);
  };

  const specKeys = getAllUniqueSpecKeys();

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="compare-drawer-root" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 sm:p-6" id="spec-comparison-modal">
          {/* Backdrop overlay */}
          <motion.div
            key="compare-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="compare-panel"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
          >
          {/* Header */}
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <GitCompare className="w-5 h-5 text-cyan-500" />
              <div>
                <span className="font-extrabold text-slate-800 text-base uppercase tracking-wider block">
                  Compare Device Specifications
                </span>
                <span className="text-[10px] text-slate-400 font-bold block">
                  Comparing {compareItems.length} of 3 maximum items
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {compareItems.length > 0 && (
                <button
                  onClick={onClearCompare}
                  className="text-xs text-rose-500 hover:text-rose-600 hover:underline font-bold transition-all cursor-pointer"
                >
                  Clear All
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Core Content Body (scrollable) */}
          <div className="flex-1 overflow-x-auto p-6">
            {compareItems.length === 0 ? (
              <div className="py-16 text-center space-y-4">
                <div className="bg-slate-50 p-6 rounded-full inline-block text-slate-300">
                  <GitCompare className="w-16 h-16" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-700 text-sm">No items queued for comparison</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Toggle the "Compare" checkbox on product listings to append up to 3 monitors, laptops or smart devices here to view specification side-by-side matrices.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-2 px-6 rounded-xl transition-all cursor-pointer"
                >
                  Return to Catalog
                </button>
              </div>
            ) : (
              <div className="min-w-[600px] space-y-6">
                
                {/* 1. Header Cards Grid */}
                <div className="grid grid-cols-4 gap-4 pb-4 border-b border-gray-100 items-stretch">
                  {/* Aspect label column */}
                  <div className="flex items-center text-left pr-4">
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest block">
                      Core Specs Matrix
                    </span>
                  </div>

                  {/* Device Cards */}
                  {[0, 1, 2].map((idx) => {
                    const item = compareItems[idx];
                    if (!item) {
                      return (
                        <div key={idx} className="border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 text-center text-slate-300 bg-slate-50/50 min-h-[220px]">
                          <HelpCircle className="w-8 h-8 mb-2 opacity-50 text-slate-400" />
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Add Slot {idx + 1}</span>
                          <span className="text-[9px] text-slate-400 mt-1">Select from catalog</span>
                        </div>
                      );
                    }

                    return (
                      <div key={item.id} className="bg-slate-50/50 rounded-2xl border border-gray-200/60 p-4 flex flex-col justify-between relative text-left">
                        {/* Remove item trigger */}
                        <button
                          onClick={() => onRemoveCompareItem(item)}
                          className="absolute top-2 right-2 p-1 bg-white hover:bg-rose-50 hover:text-rose-600 rounded-full text-slate-400 shadow-sm transition-all cursor-pointer"
                          title="Remove from compare"
                        >
                          <Trash className="w-3 h-3" />
                        </button>

                        <div className="space-y-2">
                          {/* Thumbnail */}
                          <div className="w-full pt-[60%] bg-white rounded-xl relative overflow-hidden border border-gray-100 flex items-center justify-center p-2 mb-2">
                            <img 
                              src={`/api/zoho/item/${item.zohoItemId || item.id}/image?v=${encodeURIComponent(item.last_modified_time || item.updatedAt || '')}`} 
                              alt={item?.name || 'Compare Item'} 
                              className="absolute inset-0 w-full h-full object-contain p-2" 
                              referrerPolicy="no-referrer" 
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f8fafc/64748b?text=No+Image';
                              }}
                            />
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">{item.brand}</span>
                            <h4 className="font-extrabold text-slate-800 text-xs line-clamp-2 min-h-[32px] leading-tight" title={item.name}>
                              {item.name}
                            </h4>
                            {item.sku && (
                              <span className="text-[10px] font-mono text-slate-400 block truncate">SKU: {item.sku}</span>
                            )}
                          </div>

                          {/* Ratings */}
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="text-[10px] font-bold text-slate-600">{item.rating}</span>
                            <span className="text-[9px] text-slate-400">({item.reviewsCount})</span>
                          </div>
                        </div>

                        {/* Price & Add to Cart row */}
                        <div className="pt-3 border-t border-gray-100 mt-3 flex items-center justify-between gap-2">
                          <span className="font-black text-slate-900 text-sm">€{item.price}</span>
                          {item.inStock ? (
                            <button
                              onClick={() => onAddToCart(item)}
                              className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg p-1.5 transition-colors cursor-pointer group shadow-sm shadow-blue-600/20"
                              title="Add device to cart"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 group-hover:scale-115 transition-transform" />
                            </button>
                          ) : (
                            <span className="text-[9px] text-rose-500 font-extrabold">Sold Out</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Structured Spec Matrix Grid */}
                <div className="space-y-4">
                  
                  {/* Category spec row */}
                  <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-50 items-center text-left text-xs">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Device Family</span>
                    {[0, 1, 2].map((idx) => {
                      const item = compareItems[idx];
                      return (
                        <div key={idx} className="text-slate-700 font-semibold pl-1">
                          {item ? item.category : '-'}
                        </div>
                      );
                    })}
                  </div>

                  {/* Stock Availability row */}
                  <div className="grid grid-cols-4 gap-4 py-2 border-b border-gray-50 items-center text-left text-xs">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Fulfillment</span>
                    {[0, 1, 2].map((idx) => {
                      const item = compareItems[idx];
                      if (!item) return <div key={idx} className="text-slate-300">-</div>;
                      return (
                        <div key={idx} className="pl-1">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            item.inStock ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                          }`}>
                            {item.inStock ? 'Immediate Courier' : 'Backordered'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dynamic Technical Specifications rows */}
                  {specKeys.map((key) => (
                    <div key={key} className="grid grid-cols-4 gap-4 py-2.5 border-b border-gray-50 items-center text-left text-xs hover:bg-slate-50/40 rounded-lg transition-colors">
                      <span className="font-extrabold text-slate-500 truncate text-[10px]" title={key}>{key}</span>
                      {[0, 1, 2].map((idx) => {
                        const item = compareItems[idx];
                        if (!item) return <div key={idx} className="text-slate-300">-</div>;
                        const val = item.specs[key];
                        return (
                          <div key={idx} className="text-slate-700 pr-2 leading-relaxed pl-1" title={val || 'Not Specified'}>
                            {val ? (
                              <span className="font-medium">{val}</span>
                            ) : (
                              <span className="text-slate-300 italic text-[10px]">N/A</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}

                  {/* Key Features bullet comparison */}
                  <div className="grid grid-cols-4 gap-4 py-3 border-b border-gray-50 items-start text-left text-xs">
                    <span className="font-extrabold text-slate-400 uppercase tracking-wider text-[10px]">Primary Highlights</span>
                    {[0, 1, 2].map((idx) => {
                      const item = compareItems[idx];
                      if (!item) return <div key={idx} className="text-slate-300">-</div>;
                      return (
                        <div key={idx} className="space-y-1.5 pl-1">
                          {item.features.map((feat, i) => (
                            <div key={i} className="flex gap-1.5 items-start text-[11px] text-slate-600 leading-normal">
                              <Check className="w-3 h-3 text-emerald-500 mt-0.5 shrink-0" />
                              <span>{feat}</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            )}
          </div>

          {/* Footer bar */}
          <div className="p-4 border-t border-gray-100 bg-slate-50 flex justify-between items-center text-xs text-slate-400">
            <span>Verify CPU clock timings and thermal TDP values prior to purchase.</span>
            <button
              onClick={onClose}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
            >
              Done Comparing
            </button>
          </div>
        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
