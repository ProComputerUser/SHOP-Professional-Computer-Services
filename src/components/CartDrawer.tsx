import { useState, type ClipboardEvent } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Trash2, ArrowRight, ShieldCheck, CreditCard, Truck, CheckCircle2, Loader2, Sparkles, Check, Phone, Mail, AlertCircle, Lock } from 'lucide-react';
import { CartItem, OrderInfo } from '../types';
import { calculateCartTotals } from '../context/CartContext';
import StripeCheckout from './StripeCheckout';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (index: number, newQty: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
}

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: CartDrawerProps) {
  // Checkout multi-step flow state: 'cart' | 'shipping' | 'payment' | 'submitting' | 'success'
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'payment' | 'submitting' | 'success'>('cart');
  const [shippingInfo, setShippingInfo] = useState<OrderInfo>({
    name: '',
    phone: '',
    email: '',
    confirmEmail: '',
    address: '',
    city: '',
    zipCode: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [pasteNotice, setPasteNotice] = useState<string | null>(null);
  const [orderId, setOrderId] = useState('');
  const [paidMethod, setPaidMethod] = useState<string>('Card');

  // Standard Irish VAT & Tiered Shipping Pricing Calculation
  const {
    itemsTotal,
    netSubtotal,
    vatAmount,
    shippingFee,
    amountNeededForFreeShipping,
    qualifiesForFreeShipping,
    freeShippingProgress,
    finalTotal
  } = calculateCartTotals(cartItems, 0);

  // Input bindings
  const handleInputChange = (field: keyof OrderInfo, val: string) => {
    setShippingInfo((prev) => ({ ...prev, [field]: val }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // Block copy/paste for email fields
  const handleBlockPaste = (e: ClipboardEvent, label: string) => {
    e.preventDefault();
    setPasteNotice(`Copy-pasting is disabled for ${label}. Please type your email address manually.`);
    setTimeout(() => {
      setPasteNotice(null);
    }, 4500);
  };

  // Form step validators
  const validateShippingForm = () => {
    const errors: Record<string, string> = {};
    
    // Mandatory Name
    if (!shippingInfo.name.trim()) {
      errors.name = 'Full recipient name is mandatory';
    }

    // Mandatory Phone Number
    const cleanPhone = shippingInfo.phone.replace(/[\s\-().+]/g, '');
    if (!shippingInfo.phone.trim()) {
      errors.phone = 'Phone number is mandatory';
    } else if (cleanPhone.length < 7) {
      errors.phone = 'Please enter a valid phone number';
    }

    // Mandatory Email Address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmedEmail = shippingInfo.email.trim();
    const trimmedConfirmEmail = (shippingInfo.confirmEmail || '').trim();

    if (!trimmedEmail) {
      errors.email = 'Email address is mandatory';
    } else if (!emailRegex.test(trimmedEmail)) {
      errors.email = 'Please enter a valid email address';
    }

    // Mandatory Confirm Email & Match check
    if (!trimmedConfirmEmail) {
      errors.confirmEmail = 'Please re-type your email address';
    } else if (trimmedEmail.toLowerCase() !== trimmedConfirmEmail.toLowerCase()) {
      errors.confirmEmail = 'Email addresses do not match';
    }

    // Mandatory Street Address
    if (!shippingInfo.address.trim()) {
      errors.address = 'Street address is mandatory';
    }

    // Mandatory City
    if (!shippingInfo.city.trim()) {
      errors.city = 'City / Town is mandatory';
    }

    // Mandatory Eircode / Postal Code
    if (!shippingInfo.zipCode.trim()) {
      errors.zipCode = 'Eircode / Postal Code is mandatory';
    } else if (shippingInfo.zipCode.trim().length < 3) {
      errors.zipCode = 'Please enter a valid Eircode or Postal Code';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePaymentForm = () => {
    const errors: Record<string, string> = {};
    const cleanCard = shippingInfo.cardNumber.replace(/\s/g, '');
    if (!cleanCard || cleanCard.length < 15) {
      errors.cardNumber = 'Valid 16-Digit Card number is required';
    }
    if (!shippingInfo.cardExpiry.trim() || !shippingInfo.cardExpiry.includes('/')) {
      errors.cardExpiry = 'MM/YY required';
    }
    if (!shippingInfo.cardCvv.trim() || shippingInfo.cardCvv.length < 3) {
      errors.cardCvv = 'CVV';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    if (checkoutStep === 'cart') {
      setCheckoutStep('shipping');
    } else if (checkoutStep === 'shipping') {
      if (validateShippingForm()) {
        setCheckoutStep('payment');
      }
    } else if (checkoutStep === 'payment') {
      if (validatePaymentForm()) {
        setCheckoutStep('submitting');
        // Simulate safe transaction processing
        setTimeout(() => {
          const generatedId = `TSX-${Math.floor(Math.random() * 900000 + 100000)}`;
          setOrderId(generatedId);
          setCheckoutStep('success');
          onClearCart();
        }, 2000);
      }
    }
  };

  const handleBackStep = () => {
    if (checkoutStep === 'shipping') setCheckoutStep('cart');
    if (checkoutStep === 'payment') setCheckoutStep('shipping');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div key="cart-drawer-root" className="fixed inset-0 z-50 overflow-hidden" id="cart-slideout-drawer">
          {/* Dark overlay backdrop */}
          <motion.div
            key="cart-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-950 cursor-pointer"
            onClick={onClose}
          />

          {/* Sliding Panel */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              key="cart-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between"
            >
            {/* Drawer Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-500" />
                <span className="font-extrabold text-slate-800 text-base uppercase tracking-wider">
                  {checkoutStep === 'cart' && 'My Cart'}
                  {checkoutStep === 'shipping' && 'Delivery Details'}
                  {checkoutStep === 'payment' && 'Secure Checkout'}
                  {checkoutStep === 'submitting' && 'Encrypting Order'}
                  {checkoutStep === 'success' && 'Order Registered!'}
                </span>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-200 rounded-full text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step Indicators */}
            {checkoutStep !== 'success' && checkoutStep !== 'submitting' && (
              <div className="bg-slate-100/60 px-6 py-2 border-b border-gray-100 flex justify-between text-[10px] font-bold text-slate-400">
                <span className={checkoutStep === 'cart' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}>1. Cart</span>
                <span className="text-slate-300">➔</span>
                <span className={checkoutStep === 'shipping' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}>2. Shipping</span>
                <span className="text-slate-300">➔</span>
                <span className={checkoutStep === 'payment' ? 'text-blue-600 font-extrabold' : 'text-slate-500'}>3. Payment</span>
              </div>
            )}

            {/* Main Drawer Scrollable Viewport */}
            <div className="flex-1 overflow-y-auto p-6" id="cart-drawer-viewport">
              
              {/* == STEP 1: CART LISTING == */}
              {checkoutStep === 'cart' && (
                <>
                  {cartItems.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-12">
                      <div className="bg-slate-50 p-6 rounded-full text-slate-300">
                        <ShoppingBag className="w-16 h-16" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-700 text-sm">Your shopping bag is empty</h3>
                        <p className="text-xs text-slate-400 mt-1">Select from our premium devices and deals to begin compiling your setup.</p>
                      </div>
                      <button
                        onClick={onClose}
                        className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-2.5 px-6 rounded-xl transition-all cursor-pointer"
                      >
                        Keep Exploring
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4" id="cart-items-list">
                      {/* Free Delivery Notification Banner */}
                      <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-900 text-left transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 shrink-0 text-emerald-600" />
                            <span className="text-xs font-bold leading-tight">
                              🎉 FREE Delivery on All Orders!
                            </span>
                          </div>
                          <span className="text-[11px] font-extrabold font-mono shrink-0 text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full">
                            €0.00
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-700/90 leading-normal mt-1">
                          Every order includes 100% free tracked courier delivery across Ireland (2–3 business days).
                        </p>
                      </div>

                      {cartItems.map((item, index) => (
                        <div 
                          key={index} 
                          className="flex items-center gap-4 bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 relative group text-left"
                        >
                          {/* Image */}
                          <img 
                            src={`/api/zoho/item/${item.product.zohoItemId || item.product.id}/image?v=${encodeURIComponent(item.product.last_modified_time || item.product.updatedAt || '')}`} 
                            alt={item.product?.name || 'Cart Item'} 
                            className="w-16 h-16 object-contain rounded-lg bg-white p-1 border border-gray-100 shrink-0"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://placehold.co/600x600/f8fafc/64748b?text=No+Image';
                            }}
                          />

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-800 text-xs truncate" title={item.product.name}>
                              {item.product.name}
                            </h4>
                            {item.product.sku && (
                              <p className="text-[10px] font-mono text-slate-400 truncate">SKU: {item.product.sku}</p>
                            )}
                            
                            {/* Selected configurations display */}
                            {(item.selectedColor || item.selectedRam || item.selectedStorage) && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {item.selectedColor && (
                                  <span className="text-[9px] bg-white border border-gray-200 text-slate-500 font-semibold px-1 rounded">
                                    Col: {item.selectedColor}
                                  </span>
                                )}
                                {item.selectedRam && (
                                  <span className="text-[9px] bg-white border border-gray-200 text-slate-500 font-semibold px-1 rounded">
                                    {item.selectedRam}
                                  </span>
                                )}
                                {item.selectedStorage && (
                                  <span className="text-[9px] bg-white border border-gray-200 text-slate-500 font-semibold px-1 rounded">
                                    {item.selectedStorage}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className="flex items-center justify-between gap-2 mt-2">
                              {/* Quantity selection track */}
                              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white">
                                <button
                                  onClick={() => onUpdateQuantity(index, Math.max(1, item.quantity - 1))}
                                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="px-2.5 py-0.5 font-bold text-slate-700 text-[11px]">{item.quantity}</span>
                                <button
                                  onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                                  className="px-2 py-0.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-black cursor-pointer"
                                >
                                  +
                                </button>
                              </div>

                              {/* Price (VAT Inclusive) */}
                              <div className="text-right">
                                <span className="text-xs font-black text-slate-900 block">
                                  €{((Number(item.product.price) || 0) * item.quantity).toFixed(2)}
                                </span>
                                <span className="text-[9px] text-slate-400">inc. 23% VAT</span>
                              </div>
                            </div>
                          </div>

                          {/* Trash modifier */}
                          <button
                            onClick={() => onRemoveItem(index)}
                            className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-lg transition-colors shrink-0 ml-1 cursor-pointer"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* == STEP 2: SHIPPING INPUT FORM == */}
              {checkoutStep === 'shipping' && (
                <div className="space-y-4 text-left" id="checkout-shipping-form">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Delivery Details</h3>
                    <span className="text-[10px] font-bold text-slate-400">
                      <span className="text-rose-500 font-bold">*</span> All fields mandatory
                    </span>
                  </div>

                  {/* Paste Blocked Notification Toast */}
                  {pasteNotice && (
                    <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2.5 shadow-sm animate-in fade-in slide-in-from-top duration-300">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-tight">
                        <span className="font-bold block mb-0.5">Typing Verification</span>
                        <span className="text-[11px] text-amber-800">{pasteNotice}</span>
                      </div>
                    </div>
                  )}

                  {/* Full Name field */}
                  <div className="space-y-1">
                    <label htmlFor="shipping-name" className="text-[11px] font-extrabold text-slate-700 block">
                      Full Recipient Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="shipping-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="e.g. Alexis Martinez"
                      value={shippingInfo.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                        formErrors.name ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.name && <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.name}</span>}
                  </div>

                  {/* Phone Number field */}
                  <div className="space-y-1">
                    <label htmlFor="shipping-phone" className="text-[11px] font-extrabold text-slate-700 block">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="shipping-phone"
                        name="tel"
                        type="tel"
                        autoComplete="tel"
                        placeholder="e.g. 087 123 4567 or +353 1 234 5678"
                        value={shippingInfo.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className={`w-full border rounded-xl p-2.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          formErrors.phone ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {formErrors.phone ? (
                      <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.phone}</span>
                    ) : (
                      <span className="text-[9px] text-slate-400 block">Required for courier delivery SMS & call dispatch</span>
                    )}
                  </div>

                  {/* Email field (paste disabled) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="shipping-email" className="text-[11px] font-extrabold text-slate-700 block">
                        Email Address <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-slate-400 font-medium">Type manually or autofill</span>
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="shipping-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        placeholder="e.g. alexis@example.ie"
                        value={shippingInfo.email}
                        onPaste={(e) => handleBlockPaste(e, 'Email Address')}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className={`w-full border rounded-xl p-2.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          formErrors.email ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {formErrors.email && <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.email}</span>}
                  </div>

                  {/* Confirm Email field (paste disabled) */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label htmlFor="shipping-confirm-email" className="text-[11px] font-extrabold text-slate-700 block">
                        Confirm Email Address <span className="text-rose-500">*</span>
                      </label>
                      <span className="text-[9px] text-amber-600/90 font-medium flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" /> No paste allowed
                      </span>
                    </div>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="shipping-confirm-email"
                        name="confirm-email"
                        type="email"
                        autoComplete="email"
                        placeholder="Re-type email address"
                        value={shippingInfo.confirmEmail || ''}
                        onPaste={(e) => handleBlockPaste(e, 'Confirm Email Address')}
                        onCopy={(e) => e.preventDefault()}
                        onCut={(e) => e.preventDefault()}
                        onChange={(e) => handleInputChange('confirmEmail', e.target.value)}
                        className={`w-full border rounded-xl p-2.5 pl-8 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          formErrors.confirmEmail ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                    </div>
                    {formErrors.confirmEmail ? (
                      <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.confirmEmail}</span>
                    ) : shippingInfo.confirmEmail && shippingInfo.email ? (
                      shippingInfo.confirmEmail.trim().toLowerCase() === shippingInfo.email.trim().toLowerCase() ? (
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Email addresses match
                        </span>
                      ) : (
                        <span className="text-[10px] text-rose-500 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" /> Email addresses do not match
                        </span>
                      )
                    ) : null}
                  </div>

                  {/* Address field */}
                  <div className="space-y-1">
                    <label htmlFor="shipping-address" className="text-[11px] font-extrabold text-slate-700 block">
                      Street Address <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="shipping-address"
                      name="address"
                      type="text"
                      autoComplete="street-address"
                      placeholder="e.g. 14 Grafton Street, Apartment 4B"
                      value={shippingInfo.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                        formErrors.address ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                      }`}
                    />
                    {formErrors.address && <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.address}</span>}
                  </div>

                  {/* City and ZipCode grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label htmlFor="shipping-city" className="text-[11px] font-extrabold text-slate-700 block">
                        City / Town <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="shipping-city"
                        name="city"
                        type="text"
                        autoComplete="address-level2"
                        placeholder="e.g. Dublin"
                        value={shippingInfo.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors ${
                          formErrors.city ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.city && <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.city}</span>}
                    </div>

                    <div className="space-y-1">
                      <label htmlFor="shipping-zip" className="text-[11px] font-extrabold text-slate-700 block">
                        Eircode / Postcode <span className="text-rose-500">*</span>
                      </label>
                      <input
                        id="shipping-zip"
                        name="postal-code"
                        type="text"
                        autoComplete="postal-code"
                        placeholder="e.g. D02 X285"
                        value={shippingInfo.zipCode}
                        onChange={(e) => handleInputChange('zipCode', e.target.value.toUpperCase())}
                        maxLength={10}
                        className={`w-full border rounded-xl p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-colors font-mono ${
                          formErrors.zipCode ? 'border-rose-400 bg-rose-50/20 focus:border-rose-400' : 'border-gray-200 focus:border-blue-500'
                        }`}
                      />
                      {formErrors.zipCode && <span className="text-[10px] text-rose-500 font-semibold block">{formErrors.zipCode}</span>}
                    </div>
                  </div>

                  {/* Delivery Pledge notice */}
                  <div className="p-3 border rounded-xl mt-4 flex gap-2.5 bg-emerald-50/80 border-emerald-200">
                    <Truck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="text-[11px] font-black block text-emerald-900">
                        🎉 Free Tracked Delivery Included (€0.00)
                      </span>
                      <p className="text-[10px] text-slate-500 leading-normal mt-0.5">
                        Your order includes 100% Free tracked courier delivery across Ireland (2-3 business days).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* == STEP 3: PAYMENT FORM == */}
              {checkoutStep === 'payment' && (
                <div className="space-y-4 text-left" id="checkout-payment-form">
                  <StripeCheckout
                    amount={finalTotal}
                    shippingInfo={shippingInfo}
                    onSuccess={(paymentId, paymentMethod) => {
                      setOrderId(paymentId);
                      if (paymentMethod) setPaidMethod(paymentMethod);
                      setCheckoutStep('success');
                      onClearCart();
                    }}
                    onBack={handleBackStep}
                  />
                </div>
              )}

              {/* == STEP 4: SUBMITTING LOADER == */}
              {checkoutStep === 'submitting' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Synchronizing Secure Gateway</h3>
                    <p className="text-xs text-slate-400 mt-1">Please keep the browser open. Authorizing credentials and verifying item locks...</p>
                  </div>
                </div>
              )}

              {/* == STEP 5: ORDER SUCCESS CARD == */}
              {checkoutStep === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-5" id="checkout-success-view">
                  <div className="text-emerald-500 bg-emerald-50 p-5 rounded-full shadow-inner animate-bounce">
                    <CheckCircle2 className="w-14 h-14" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg">Order Successfully Authenticated!</h3>
                    <p className="text-xs text-slate-400 mt-1">Thank you for ordering from Professional Computers Ireland. Your receipt has been routed to your inbox.</p>
                  </div>

                  {/* Receipt code box */}
                  <div className="bg-slate-50 p-4 rounded-2xl w-full border border-gray-100 text-left space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Order ID:</span>
                      <span className="font-black text-slate-700 font-mono">{orderId}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Payment Method:</span>
                      <span className="font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded">
                        {paidMethod}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Recipient:</span>
                      <span className="font-bold text-slate-700">{shippingInfo.name}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Contact:</span>
                      <span className="font-semibold text-slate-700">{shippingInfo.email} • {shippingInfo.phone}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Delivery Address:</span>
                      <span className="font-semibold text-slate-700">{shippingInfo.address}, {shippingInfo.city} ({shippingInfo.zipCode})</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Total Paid:</span>
                      <span className="font-black text-slate-900">€{finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">VAT (23% Included):</span>
                      <span className="font-semibold text-slate-600">€{vatAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-slate-400">Delivery:</span>
                      <span className="font-bold text-emerald-600">
                        FREE Tracked Delivery (€0.00)
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setCheckoutStep('cart');
                      onClose();
                    }}
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-black text-xs py-3 rounded-xl transition-all cursor-pointer shadow-lg"
                  >
                    Return to Catalog
                  </button>
                </div>
              )}

            </div>

            {/* Bottom Checkout Action & Price Breakdown Panel */}
            {cartItems.length > 0 && checkoutStep !== 'success' && checkoutStep !== 'submitting' && (
              <div className="p-6 border-t border-gray-100 bg-slate-50 text-left space-y-4">
                
                {/* Subtotals & Irish VAT (23%) breakdown list */}
                <div className="space-y-2 text-xs">
                  {/* Items Subtotal */}
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-medium">Items Subtotal (inc. VAT)</span>
                    <span className="font-semibold text-slate-900 font-mono">€{itemsTotal.toFixed(2)}</span>
                  </div>

                  {/* Subtotal Excl. VAT & VAT Breakdown */}
                  <div className="flex justify-between items-center text-slate-500 text-[11px] pl-2 border-l border-slate-200">
                    <span>Subtotal (excl. VAT)</span>
                    <span className="font-mono text-slate-600">€{netSubtotal.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-500 text-[11px] pl-2 border-l border-slate-200">
                    <span>VAT Breakdown (23% included)</span>
                    <span className="font-mono text-slate-600">€{vatAmount.toFixed(2)}</span>
                  </div>

                  {/* Delivery */}
                  <div className="flex justify-between items-center text-slate-700 pt-0.5">
                    <span className="font-medium">Delivery</span>
                    <span className="font-bold font-mono text-emerald-600">
                      FREE (€0.00)
                    </span>
                  </div>

                  {/* Total to Pay */}
                  <div className="flex justify-between items-baseline border-t border-slate-200 pt-3 mt-1">
                    <div>
                      <span className="text-slate-900 font-extrabold text-sm block">Total to Pay</span>
                      <span className="text-[10px] text-slate-400 font-normal">All taxes & delivery included</span>
                    </div>
                    <span className="text-slate-950 text-lg font-black font-mono">€{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* CTA buttons */}
                {checkoutStep !== 'payment' && (
                  <div className="flex gap-2 pt-2">
                    {checkoutStep !== 'cart' && (
                      <button
                        onClick={handleBackStep}
                        className="border border-gray-300 hover:bg-gray-100 text-slate-700 font-bold text-xs py-3 px-4 rounded-xl transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                    )}
                    <button
                      onClick={handleNextStep}
                      disabled={checkoutStep === 'cart' && cartItems.length === 0}
                      className={`flex-1 flex items-center justify-center gap-2 font-extrabold text-xs py-3 px-6 rounded-xl transition-all duration-200 shadow-md ${
                        checkoutStep === 'cart' && cartItems.length === 0
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                          : 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                      }`}
                    >
                      <span>
                        {checkoutStep === 'cart' && 'Proceed to Delivery'}
                        {checkoutStep === 'shipping' && 'Proceed to Payment'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Accepted Payment Methods reassurance strip */}
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-500 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Accepted Methods:
                  </span>
                  <div className="flex items-center gap-2 font-bold text-slate-600">
                    <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                      <CreditCard className="w-2.5 h-2.5 text-blue-600" /> Card
                    </span>
                    <span className="flex items-center gap-0.5 bg-black text-white px-1.5 py-0.5 rounded shadow-2xs">
                      Pay
                    </span>
                    <span className="flex items-center gap-0.5 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs">
                      GPay
                    </span>
                    <span className="flex items-center gap-0.5 bg-black text-white px-1.5 py-0.5 rounded shadow-2xs font-black">
                      Revolut
                    </span>
                  </div>
                </div>

              </div>
            )}

          </motion.div>
        </div>
      </div>
      )}
    </AnimatePresence>
  );
}
