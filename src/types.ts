export type Category = 
  | 'Laptops'
  | 'Monitors'
  | 'Tablets'
  | 'Promethean'
  | 'Assistive Software'
  | '3CX Phone System'
  | 'Peripherals & Audio'
  | 'Printer & Supplies'
  | 'Printers'
  | 'Supplies'
  | 'Network & Connectivity'
  | 'Adapters & Accessories'
  | 'Deals & Promotions'
  | 'Help & Advice'
  | 'Business'
  | 'Schools'
  | 'Services';

export interface Product {
  id: string;
  sku?: string;
  name: string;
  category: Category;
  parentCategory?: string;
  subcategory?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviewsCount: number;
  imageUrl?: string;
  images: string[];
  description: string;
  overview?: string;
  specs: Record<string, string>;
  colors?: string[];
  storageOptions?: string[];
  ramOptions?: string[];
  badge?: string;
  features: string[];
  peripherals?: string[];
  inStock: boolean;
  stockQuantity?: number;
  brand: string;
  zohoItemId?: string;
  item_id?: string;
  last_modified_time?: string;
  updatedAt?: string;
  product_description?: string;
  rawCustomFields?: any;
  rawCategory?: string;
  item_desc?: string;
  sales_description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedRam?: string;
  selectedStorage?: string;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  verified: boolean;
}

export interface FilterState {
  searchQuery: string;
  selectedCategory: Category | 'All' | 'All Tech' | null;
  minPrice: number;
  maxPrice: number;
  selectedBrands: string[];
  sortBy: 'featured' | 'price-asc' | 'price-desc' | 'rating';
  inStockOnly: boolean;
}

export interface CompareState {
  items: Product[];
}

export interface OrderInfo {
  name: string;
  phone: string;
  email: string;
  confirmEmail?: string;
  address: string;
  city: string;
  zipCode: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}
