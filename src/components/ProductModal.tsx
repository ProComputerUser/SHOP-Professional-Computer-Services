import React, { useEffect, useState } from 'react';
import { Share2, Check, X, Heart } from 'lucide-react';
import { Product, CartItem } from '../types';
import { extractZohoExactDescription, cleanZohoDescriptionText } from '../mapCategory';

interface ProductModalProps {
  isOpen?: boolean;
  product: Product | any | null;
  onClose: () => void;
  onAddToCart?: (product: any, quantity?: number) => void;
  onAddToCartWithConfig?: (item: CartItem) => void;
  onToggleWishlist?: (product: any) => void;
  isWishlisted?: boolean;
  onRequestQuote?: (product: any) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen = true,
  product,
  onClose,
  onAddToCart,
  onAddToCartWithConfig,
  onToggleWishlist,
  isWishlisted = false,
  onRequestQuote,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [extraDesc, setExtraDesc] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen && product) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, product, onClose]);

  useEffect(() => {
    if (!product) return;
    setQuantity(1);
    setCopied(false);
    
    const initialDesc =
      product.description ||
      product.cf_website_description ||
      product.cf_product_description ||
      product.cf_description ||
      product.purchase_description ||
      product.item_description ||
      extractZohoExactDescription(product) ||
      '';
    setExtraDesc(initialDesc);

    const targetId = product.zohoItemId || product.item_id || product.id;
    if (targetId && !String(targetId).startsWith('seeded-')) {
      // Fetch raw Zoho item in case detailed fields or descriptions were updated
      fetch(`/api/zoho/item/${targetId}`)
        .then((r) => r.json())
        .then((data) => {
          const item = data?.item;
          if (!item) return;
          const liveDesc =
            item.description ||
            item.cf_website_description ||
            item.cf_product_description ||
            item.cf_description ||
            item.purchase_description ||
            item.item_description;
          if (liveDesc && typeof liveDesc === 'string' && liveDesc.trim().length > 0) {
            setExtraDesc(cleanZohoDescriptionText(liveDesc));
          } else {
            const extracted = extractZohoExactDescription(item);
            if (extracted && extracted.trim().length > 0) {
              setExtraDesc(extracted.trim());
            }
          }
        })
        .catch(() => {});
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const title = product.name || '';
  const priceNum = Number(product.price || 0);
  const isOutOfStock = priceNum <= 1 || product.stock === 0 || (product.stockQuantity !== undefined && product.stockQuantity === 0);
  const imageUrl = product.imageUrl || (product.images && product.images.length > 0 ? product.images[0] : null) || product.image || `/api/zoho/item/${product.zohoItemId || product.id}/image`;

  const handleShare = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!product) return;

    let shareUrl = window.location.href;
    try {
      const url = new URL(window.location.origin + window.location.pathname);
      const targetId = product.zohoItemId || product.item_id || product.id || product.sku;
      if (targetId) {
        url.searchParams.set('product', String(targetId));
      }
      shareUrl = url.toString();
    } catch {
      // fallback
    }

    const priceText = priceNum > 1 ? `€${priceNum.toFixed(2)}` : 'Request Quote / POA';
    const shareData = {
      title: `${title} | Professional Computers`,
      text: `${title} (${priceText}) - Professional Computers Ireland`,
      url: shareUrl,
    };

    // 1. Native Web Share API (mobile & supported browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          return; // User canceled
        }
        console.warn('Native share failed, falling back to copy:', err);
      }
    }

    // 2. Clipboard fallback with fallback element
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = shareUrl;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy product link:', err);
    }
  };

  const handleActionClick = () => {
    if (isOutOfStock) {
      if (onRequestQuote) {
        onRequestQuote(product);
      } else {
        window.location.href = 'mailto:sales@shop-pcs.ie?subject=Quote%20Request%20for%20' + encodeURIComponent(title);
      }
      onClose();
    } else {
      if (onAddToCartWithConfig) {
        onAddToCartWithConfig({
          product,
          quantity,
        });
      } else if (onAddToCart) {
        onAddToCart(product, quantity);
      }
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-slate-900/70 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row max-h-[85vh] z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Action Buttons (Share & Close) */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          {/* Share Button */}
          <button
            onClick={handleShare}
            className={`px-3 py-1.5 rounded-full transition shadow-sm flex items-center gap-1.5 text-xs font-semibold cursor-pointer ${
              copied
                ? 'bg-emerald-600 text-white shadow-emerald-500/20'
                : 'bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 border border-blue-200/80 active:scale-95'
            }`}
            title={copied ? 'Link copied to clipboard!' : 'Share product details'}
            aria-label="Share product"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="text-white font-bold text-[11px] animate-in fade-in">Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="text-blue-600 font-bold text-[11px]">Share</span>
              </>
            )}
          </button>

          {/* Close Button */}
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition shadow-sm cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-slate-50 p-6 flex items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 min-h-[260px] relative">
          <img
            src={imageUrl}
            alt={title}
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop&q=60';
            }}
            className="max-h-64 max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
          />

          {/* Floating quick actions on image */}
          {onToggleWishlist && (
            <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleWishlist(product);
                }}
                className={`p-2 rounded-xl transition backdrop-blur-sm text-xs flex items-center gap-1 shadow-sm ${
                  isWishlisted
                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                    : 'bg-white/80 hover:bg-white text-slate-600 border border-slate-200/60'
                }`}
                title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              >
                <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
              </button>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              {product.brand && !['zoho', 'generic', 'professional computers'].includes(product.brand.toLowerCase()) && (
                <span className="bg-slate-100 text-slate-800 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider border border-slate-200">
                  {product.brand}
                </span>
              )}
              <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
                {product.parentCategory || product.category || 'Product'}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {title}
              </h2>
              {product.sku && (
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 pt-0.5">
                  <span className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider">SKU:</span>
                  <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded-md text-xs select-all border border-slate-200/60">
                    {product.sku}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-baseline gap-3 py-2 border-y border-slate-100 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-extrabold text-blue-600">
                  {priceNum > 1 ? `€${priceNum.toFixed(2)}` : 'POA / Quote'}
                </span>
                {priceNum > 1 && (
                  <span className="text-[11px] font-semibold text-slate-400">inc. 23% VAT</span>
                )}
              </div>
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  isOutOfStock ? 'text-amber-700 bg-amber-50' : 'text-emerald-700 bg-emerald-50'
                }`}
              >
                {isOutOfStock ? 'Request Quote' : 'In Stock'}
              </span>
            </div>

            {/* Overview / Specs Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Product Overview
                </h4>
              </div>

              <div className="product-overview-content text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {(extraDesc && extraDesc.trim().length > 0 && extraDesc !== 'No description available') || (product.description && product.description.trim().length > 0 && product.description !== 'No description available') ? (
                  extraDesc || product.description
                ) : (
                  <p className="text-slate-400 italic">
                    {product.description || 'No description available'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 mt-2">
            <div className="flex items-center gap-3">
              {!isOutOfStock && (
                <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-l-xl font-bold transition cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  <span className="px-3 py-2 font-semibold text-sm min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-r-xl font-bold transition cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              )}

              <button
                onClick={handleActionClick}
                className={`flex-1 py-3 px-5 rounded-xl font-semibold text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                  isOutOfStock
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20'
                }`}
              >
                {isOutOfStock ? 'Contact For Quote' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductModal;
