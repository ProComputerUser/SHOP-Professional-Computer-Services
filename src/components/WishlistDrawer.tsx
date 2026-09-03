import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, ShoppingCart, Trash2 } from 'lucide-react';
import { Product } from '../types';

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  wishlistItems: Product[];
  onRemoveFromWishlist: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function WishlistDrawer({
  isOpen,
  onClose,
  wishlistItems,
  onRemoveFromWishlist,
  onAddToCart
}: WishlistDrawerProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div key="wishlist-drawer-root" className="fixed inset-0 z-50 overflow-hidden" id="wishlist-slideout-drawer">
          {/* Backdrop */}
          <motion.div
            key="wishlist-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950 cursor-pointer"
            onClick={onClose}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              key="wishlist-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
            >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500 fill-current" />
                <span className="font-extrabold text-slate-800 text-base uppercase tracking-wider">
                  My Wishlist ({wishlistItems.length})
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-6 text-left">
              {wishlistItems.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <div className="bg-slate-50 p-6 rounded-full text-slate-300">
                    <Heart className="w-16 h-16" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">Your wishlist is empty</h3>
                    <p className="text-xs text-slate-400 mt-1">Tap the heart symbol on catalog cards to pin hardware items here for future reference.</p>
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all cursor-pointer"
                  >
                    Browse Catalog
                  </button>
                </div>
              ) : (
                <div className="space-y-4" id="wishlist-items-list">
                  {wishlistItems.map((item) => (
                    <div 
                      key={item.id} 
                      className="flex items-center gap-4 bg-slate-50/60 p-3 rounded-xl border border-slate-100 relative text-left"
                    >
                      {/* Image */}
                      <img 
                        src={`/api/zoho/item/${item.zohoItemId || item.id}/image?v=${encodeURIComponent(item.last_modified_time || item.updatedAt || '')}`} 
                        alt={item?.name || 'Wishlist item'} 
                        className="w-14 h-14 object-contain rounded-lg bg-white p-1 border border-gray-100 shrink-0"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f8fafc/64748b?text=No+Image';
                        }}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] font-bold text-blue-500 uppercase block">{item.brand}</span>
                        <h4 className="font-bold text-slate-800 text-xs truncate" title={item.name}>
                          {item.name}
                        </h4>
                        {item.sku && (
                          <p className="text-[10px] font-mono text-slate-400 truncate">SKU: {item.sku}</p>
                        )}
                        <span className="text-xs font-black text-slate-900 block mt-1">
                          €{item.price}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1.5 shrink-0">
                        {item.inStock && (
                          <button
                            onClick={() => onAddToCart(item)}
                            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg p-2 transition-colors cursor-pointer"
                            title="Add to shopping cart"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => onRemoveFromWishlist(item)}
                          className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors cursor-pointer"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-100 bg-slate-50 text-xs text-slate-400 text-center">
              <span>Saved items are retained in your browser cache.</span>
            </div>

          </motion.div>
        </div>
      </div>
      )}
    </AnimatePresence>
  );
}
