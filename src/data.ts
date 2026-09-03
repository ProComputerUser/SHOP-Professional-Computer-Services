export interface Product {
  id: string;
  zohoItemId?: string;
  name: string;
  price: number;
  sku?: string;
  description?: string;
  brand?: string;
  parentCategory: string;
  category: string;
  subcategory?: string;
  imageUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  subcategories?: string[];
}
