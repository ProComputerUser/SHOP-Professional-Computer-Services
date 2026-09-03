import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db, auth } from '../firebaseConfig'; 
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

// Clean White Sidebar with Top-Left Dropdown Menu and Collapsible Low Stock Section
export const Sidebar = ({ 
  products = [], 
  onSaveSuccess,
  selectedCategory = 'All Categories',
  onCategoryChange,
  categories = [],
  activePanel = 'home',
  onActivePanelChange
}: { 
  products?: any[]; 
  onSaveSuccess?: (itemId: string, newStock: number, newMinSafety: number) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
  activePanel?: string;
  onActivePanelChange?: (panel: string) => void;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isLowStockOpen, setIsLowStockOpen] = useState(true); // Default open to alert the user

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      window.location.href = '/';
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const lowStockItems = (products || []).filter(p => (p.stock ?? 0) <= (p.minThreshold ?? 3));

  return (
    <div className="w-64 min-h-screen bg-white text-slate-700 p-6 flex flex-col gap-6 border-r border-slate-200 shrink-0 text-left animate-in fade-in slide-in-from-left duration-200">
      {/* Top Left Dropdown Menu */}
      <div className="relative text-left">
        <button 
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-sm font-semibold text-slate-700 transition-all outline-none"
        >
          <span>⚙️ Portal Options</span>
          <span>{dropdownOpen ? '▲' : '▼'}</span>
        </button>
        
        {dropdownOpen && (
          <div className="absolute left-0 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1">
            <button className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">Profile Settings</button>
            <button className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">System Diagnostics</button>
            <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 font-medium">Log Out</button>
          </div>
        )}
      </div>

      {/* VIEW CATEGORY STOCK Dropdown Section */}
      <div className="flex flex-col gap-2 border-t border-slate-100 pt-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          VIEW CATEGORY STOCK
        </span>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange?.(e.target.value)}
          className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-xl px-3 py-2.5 text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm cursor-pointer"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Collapsible Low Stock Accordion */}
      {lowStockItems.length > 0 && (
        <div className="flex flex-col border border-amber-200 rounded-2xl bg-amber-50/30 overflow-hidden shadow-sm">
          <button
            onClick={() => setIsLowStockOpen(!isLowStockOpen)}
            className="w-full flex items-center justify-between px-4 py-3 bg-amber-50/80 hover:bg-amber-100/60 text-amber-800 text-[11px] font-black uppercase tracking-wider transition-all duration-150 outline-none"
          >
            <div className="flex items-center gap-2">
              <span>⚠️ Low Stock</span>
              <span className="bg-amber-600 text-white font-black text-[10px] px-2 py-0.5 rounded-full shadow-sm">
                {lowStockItems.length}
              </span>
            </div>
            <span className="text-amber-600 text-[10px] font-bold">
              {isLowStockOpen ? '▲' : '▼'}
            </span>
          </button>

          {isLowStockOpen && (
            <div className="p-3 border-t border-amber-200 bg-white max-h-80 overflow-y-auto space-y-3 scrollbar-thin">
              {lowStockItems.map((item) => (
                <SidebarLowStockItem 
                  key={item.id} 
                  item={item} 
                  onSaveSuccess={onSaveSuccess} 
                />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="text-xs font-bold tracking-wider text-slate-400 uppercase">Menu</div>
      
      {/* Strictly Allowed Navigation Modules */}
      <nav className="flex flex-col gap-2">
        <button 
          onClick={() => onActivePanelChange?.('home')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold border transition-all text-left text-xs cursor-pointer ${
            activePanel === 'home'
              ? 'bg-blue-50 text-blue-600 border-blue-100 font-bold'
              : 'text-slate-600 hover:bg-slate-100 border-transparent font-medium'
          }`}
        >
          🏠 Welcome Portal
        </button>

        <button 
          onClick={() => onActivePanelChange?.('inventory')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold border transition-all text-left text-xs cursor-pointer ${
            activePanel === 'inventory'
              ? 'bg-blue-50 text-blue-600 border-blue-100 font-bold'
              : 'text-slate-600 hover:bg-slate-100 border-transparent font-medium'
          }`}
        >
          🗃️ Inventory Panel
        </button>

        <button 
          onClick={() => onActivePanelChange?.('add_product')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold border transition-all text-left text-xs cursor-pointer ${
            activePanel === 'add_product'
              ? 'bg-blue-50 text-blue-600 border-blue-100 font-bold'
              : 'text-slate-600 hover:bg-slate-100 border-transparent font-medium'
          }`}
        >
          ➕ Add Product
        </button>

        <button 
          onClick={() => onActivePanelChange?.('customers')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold border transition-all text-left text-xs cursor-pointer ${
            activePanel === 'customers'
              ? 'bg-blue-50 text-blue-600 border-blue-100 font-bold'
              : 'text-slate-600 hover:bg-slate-100 border-transparent font-medium'
          }`}
        >
          👥 Customer Database
        </button>

        <div className="border-t border-slate-100 my-2 pt-2"></div>

        <Link 
          to="/" 
          className="flex items-center gap-3 px-4 py-3 rounded-lg font-bold border border-slate-200/60 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all text-xs text-slate-600"
        >
          🏪 Go to Web Store
        </Link>
      </nav>
    </div>
  );
};

// Sub-component for individual low stock item inside Sidebar
const SidebarLowStockItem = ({ 
  item, 
  onSaveSuccess 
}: { 
  item: any; 
  onSaveSuccess?: (itemId: string, newStock: number, newMinSafety: number) => void;
  key?: any;
}) => {
  const [stock, setStock] = useState(item.stock ?? 0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setStock(item.stock ?? 0);
  }, [item.stock]);

  const handleQuickSave = async () => {
    setIsSaving(true);
    try {
      const newStockNum = Number(stock);
      
      // Try updating 'products' collection in Firestore
      try {
        const prodRef = doc(db, "products", item.id);
        await updateDoc(prodRef, {
          stock: newStockNum,
          inStock: newStockNum > 0
        });
      } catch (e) {
        console.warn("Products update fallback:", e);
      }

      // Try updating 'inventory' collection in Firestore
      try {
        const invRef = doc(db, "inventory", item.id);
        await updateDoc(invRef, {
          currentStock: newStockNum
        });
      } catch (e) {
        console.warn("Inventory update fallback:", e);
      }

      // Notify parent to update local React state
      if (onSaveSuccess) {
        onSaveSuccess(item.id, newStockNum, item.minThreshold ?? 3);
      }
    } catch (err) {
      console.error("Error saving quick stock:", err);
    }
    setIsSaving(false);
  };

  return (
    <div className="p-2.5 bg-slate-50 hover:bg-slate-100/50 border border-slate-200/60 rounded-xl text-xs flex flex-col gap-1.5 transition-all duration-150">
      <div className="font-bold text-slate-700 leading-tight break-words" title={item.name}>
        {item.name}
      </div>
      <div className="flex items-center justify-between gap-1.5 mt-0.5">
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Stock:</span>
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)}
            className="w-12 bg-white text-slate-800 border border-slate-200 rounded px-1.5 py-0.5 text-center font-bold text-xs focus:ring-1 focus:ring-amber-400 focus:border-amber-400 outline-none"
          />
        </div>
        <button
          onClick={handleQuickSave}
          disabled={isSaving || Number(stock) === item.stock}
          className="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-100 disabled:text-slate-300 text-white font-black px-2.5 py-1 rounded-lg text-[10px] transition-all cursor-pointer shadow-sm active:scale-95"
        >
          {isSaving ? "..." : "Save"}
        </button>
      </div>
    </div>
  );
};

// Light Theme Edit Row for Low-Stock Items
export const LowStockRow = ({ item, onSaveSuccess }: { item: any; onSaveSuccess?: (id: string, newStock: number, newMinSafety: number) => void; key?: any }) => {
  const [stock, setStock] = useState(item.currentStock || 0);
  const [minSafety, setMinSafety] = useState(item.minSafety || 3);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const itemRef = doc(db, "inventory", item.id);
      await updateDoc(itemRef, {
        currentStock: Number(stock),
        minSafety: Number(minSafety)
      });
      if (onSaveSuccess) {
        onSaveSuccess(item.id, Number(stock), Number(minSafety));
      }
    } catch (err) {
      console.error("Error updating item: ", err);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-wrap items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl gap-4">
      <div className="flex items-center gap-2 text-orange-700 font-semibold text-sm">
        ⚠️ {item.name}
      </div>
      
      <div className="flex items-center gap-4 text-slate-600 text-sm">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-500">Estoque:</span>
          <input 
            type="number" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)}
            className="w-16 bg-white text-slate-800 border border-slate-300 rounded-lg px-2 py-1 text-center font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-500">Mínimo:</span>
          <input 
            type="number" 
            value={minSafety} 
            onChange={(e) => setMinSafety(e.target.value)}
            className="w-16 bg-white text-slate-800 border border-slate-300 rounded-lg px-2 py-1 text-center font-semibold focus:border-orange-500 focus:ring-1 focus:ring-orange-500 outline-none"
          />
        </div>

        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold px-4 py-2 rounded-lg transition-all text-xs shadow-sm"
        >
          {isSaving ? "Gravando..." : "Salvar ✓"}
        </button>
      </div>
    </div>
  );
};
