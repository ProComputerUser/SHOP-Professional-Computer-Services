export interface StoreCategory {
  name: string;
  header?: string;
  subcategories: string[];
}

export const EXACT_STORE_CATEGORIES: StoreCategory[] = [
  {
    name: 'Laptops',
    header: 'PORTABLE COMPUTING',
    subcategories: [
      'Refurbished Laptops',
      'New Laptops',
      'Laptop Bags',
      'Laptop Chargers'
    ]
  },
  {
    name: 'Monitors',
    subcategories: []
  },
  {
    name: 'Tablets',
    header: 'HANDHELD & CREATIVE',
    subcategories: [
      'Apple iPads',
      'Samsung Tablets',
      'Android Tablets',
      'Protective Cases',
      'Keyboard Cases',
      'Shockproof Cases'
    ]
  },
  {
    name: 'Promethean',
    subcategories: []
  },
  {
    name: 'Assistive Software',
    subcategories: []
  },
  {
    name: '3CX Phone System',
    subcategories: []
  },
  {
    name: 'Printer & Supplies',
    header: 'IMAGING & TONER',
    subcategories: [
      'Printers',
      'Supplies'
    ]
  },
  {
    name: 'Peripherals & Audio',
    header: 'INPUT & SOUND',
    subcategories: [
      'Keyboards & Mice',
      'Audio & Gaming Headsets',
      'Cables & Adapters'
    ]
  },
  {
    name: 'Network & Connectivity',
    header: 'NETWORKING GEAR',
    subcategories: [
      'Routers & Access Points',
      'Network Switches',
      'Cables & Structural Cabling',
      'Network Storage & Servers'
    ]
  },
  {
    name: 'Adapters & Accessories',
    subcategories: []
  }
];
