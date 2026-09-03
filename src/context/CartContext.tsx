import { CartItem } from '../types';

export const VAT_RATE = 0.23; // 23% Standard Irish VAT
export const FREE_SHIPPING_THRESHOLD = 0; // Free delivery on all orders
export const STANDARD_SHIPPING_FEE = 0; // Delivery is €0.00 (Free Delivery)

export interface CartCalculationResult {
  itemsTotal: number; // Gross items total (VAT inclusive)
  discountAmount: number;
  grossAfterDiscount: number;
  netSubtotal: number; // Subtotal Excl. VAT (Gross / 1.23)
  vatAmount: number; // VAT 23% Included (Gross - Subtotal Excl. VAT)
  shippingFee: number; // €0.00 Free Delivery
  amountNeededForFreeShipping: number;
  qualifiesForFreeShipping: boolean;
  freeShippingProgress: number; // 0 to 100 percentage
  finalTotal: number; // Total to pay
}

export function calculateCartTotals(
  items: CartItem[],
  discountPercent: number = 0
): CartCalculationResult {
  // Gross items total (VAT inclusive)
  const itemsTotal = items.reduce((sum, item) => {
    const price = Number(item.product?.price) || 0;
    const qty = Number(item.quantity) || 1;
    return sum + price * qty;
  }, 0);

  // Discount calculation if any coupon is applied
  const validDiscountPercent = Math.max(0, Math.min(100, Number(discountPercent) || 0));
  const discountAmount = (itemsTotal * validDiscountPercent) / 100;
  const grossAfterDiscount = Math.max(0, itemsTotal - discountAmount);

  // Delivery calculation (Free delivery on all orders: €0.00)
  const qualifiesForFreeShipping = true;
  const shippingFee = 0;
  const amountNeededForFreeShipping = 0;
  const freeShippingProgress = 100;

  // VAT Breakdown (calculated from gross - all item prices are VAT inclusive)
  const netSubtotal = grossAfterDiscount / (1 + VAT_RATE);
  const vatAmount = grossAfterDiscount - netSubtotal;

  // Final checkout total
  const finalTotal = grossAfterDiscount + shippingFee;

  return {
    itemsTotal,
    discountAmount,
    grossAfterDiscount,
    netSubtotal,
    vatAmount,
    shippingFee,
    amountNeededForFreeShipping,
    qualifiesForFreeShipping,
    freeShippingProgress,
    finalTotal,
  };
}
