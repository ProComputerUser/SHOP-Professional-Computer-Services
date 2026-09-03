import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, RefreshCw, AlertCircle, Trash2, Edit3, Save, X, Eye, 
  Users, ShoppingBag, ShieldAlert, CheckCircle2, UploadCloud 
} from 'lucide-react';
import { auth, db, storage } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { collection, doc, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { motion } from 'motion/react';
import { Sidebar, LowStockRow } from './LowStockRow';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
}

interface SimpleEmployeeDashboardProps {
  products: any[];
  setProducts: React.Dispatch<React.SetStateAction<any[]>>;
  categoryConfig: Record<string, string[]>;
}

export default function SimpleEmployeeDashboard({ 
  products = [], 
  setProducts, 
  categoryConfig = {} 
}: SimpleEmployeeDashboardProps) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string>('home');

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Users Directory State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<any>({});

  // New product addition state
  const [newProductData, setNewProductData] = useState({
    name: '',
    category: '',
    subcategory: '',
    price: '',
    stock: '',
    minThreshold: '3',
    brand: '',
    description: '',
    image: ''
  });

  // File upload states
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');

  // Selected category state for filtering inventory
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const handleFileUpload = (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, etc.)');
      return;
    }

    setUploadError('');
    setUploadProgress(0);

    const fileExtension = file.name.split('.').pop() || 'jpg';
    const uniqueFileName = `products/prod-${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, uniqueFileName);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        setUploadError(`Upload failed: ${error.message}`);
        setUploadProgress(null);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setUploadedImageUrl(downloadUrl);
          setNewProductData((prev) => ({
            ...prev,
            image: downloadUrl
          }));
          setUploadProgress(null);
        } catch (err: any) {
          console.error('Error getting download URL:', err);
          setUploadError(`Failed to get URL: ${err.message}`);
          setUploadProgress(null);
        }
      }
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  // Load hash on change
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#customers') {
        setActivePanel('customers');
      } else if (hash === '#inventory') {
        setActivePanel('inventory');
      } else if (hash === '#add_product') {
        setActivePanel('add_product');
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Auth verification check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role === 'employee') {
              setCurrentUser(userData);
            } else {
              // Deny if not employee
              await signOut(auth);
              navigate('/');
            }
          } else {
            // Fallback for demo user
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || 'Field Operations Specialist',
              role: 'employee'
            });
          }
        } catch (err) {
          console.error("Auth verify error:", err);
          navigate('/');
        }
      } else {
        navigate('/');
      }
      setIsVerifying(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  // Load custom users list from Firestore
  useEffect(() => {
    if (currentUser && activePanel === 'customers') {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        setUsersError('');
        try {
          const querySnapshot = await getDocs(collection(db, "users"));
          const usersList: UserProfile[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            usersList.push({
              uid: doc.id,
              fullName: data.fullName || 'Anonymous User',
              email: data.email || 'N/A',
              role: data.role || 'customer',
              createdAt: data.createdAt || 'N/A'
            });
          });
          setUsers(usersList);
        } catch (err) {
          console.error("Error fetching users:", err);
          setUsersError("Insufficient permissions to read the user database.");
        }
        setIsLoadingUsers(false);
      };
      fetchUsers();
    }
  }, [currentUser, activePanel]);

  // Low Stock safety alert products list
  const lowStockProducts = products.filter(p => (p.stock ?? 0) <= (p.minThreshold ?? 3));

  const handleLowStockSaveSuccess = (itemId: string, newStock: number, newMinSafety: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === itemId) {
        return { 
          ...p, 
          stock: newStock, 
          minThreshold: newMinSafety,
          inStock: newStock > 0
        };
      }
      return p;
    }));
  };

  // Editing Handlers
  const handleEditStart = (product: any) => {
    setEditingId(product.id);
    setEditFormData({
      name: product.name,
      price: product.price,
      stock: product.stock ?? 0,
      minThreshold: product.minThreshold ?? 3
    });
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditSave = (id: string) => {
    setProducts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          name: editFormData.name,
          price: Number(editFormData.price),
          stock: Number(editFormData.stock),
          minThreshold: Number(editFormData.minThreshold),
          inStock: Number(editFormData.stock) > 0
        };
      }
      return p;
    }));
    setEditingId(null);
  };

  const handleProductDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to de-list "${name}"?`)) {
      setProducts(prev => prev.filter(p => p.id !== id));
    }
  };

  // New Product Handler
  const handleNewProductChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setNewProductData({
      ...newProductData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddNewProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductData.name || !newProductData.category || !newProductData.price) {
      alert("Please fill in the product title, category, and price.");
      return;
    }

    const newId = 'prod-' + Date.now();
    const createdItem = {
      id: newId,
      name: newProductData.name,
      category: newProductData.category,
      subcategory: newProductData.subcategory || categoryConfig[newProductData.category]?.[0] || '',
      price: Number(newProductData.price) || 0,
      brand: newProductData.brand || 'Generic',
      description: newProductData.description || 'Professional retail grade equipment.',
      inStock: (Number(newProductData.stock) || 0) > 0,
      rating: 4.8,
      reviews: 1,
      image: newProductData.image || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80',
      images: [newProductData.image || 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?auto=format&fit=crop&w=600&q=80'],
      specs: {
        "Brand": newProductData.brand || 'Generic',
        "Warranty": "3 Years"
      },
      stock: Number(newProductData.stock) || 10,
      minThreshold: Number(newProductData.minThreshold) || 3
    };

    try {
      // Save directly to Firestore "products" collection
      await setDoc(doc(db, "products", newId), createdItem);
      
      setProducts(prev => [...prev, createdItem]);
      alert(`Published "${newProductData.name}" successfully!`);
      setActivePanel('inventory');

      setNewProductData({
        name: '',
        category: '',
        subcategory: '',
        price: '',
        stock: '',
        minThreshold: '3',
        brand: '',
        description: '',
        image: ''
      });
      setUploadedImageUrl('');
      setUploadProgress(null);
    } catch (err) {
      console.error("Error saving product to Firestore:", err);
      handleFirestoreError(err, OperationType.WRITE, `products/${newId}`);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Verifying Portal Access Credentials...</p>
      </div>
    );
  }

  const categoriesList = ['All Categories', ...Object.keys(categoryConfig)];
  const filteredProducts = selectedCategory === 'All Categories'
    ? products
    : products.filter(product => product.category === selectedCategory);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* 1. Header with Clean Light Styling */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-md">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">PCS Corporate Portal</h1>
            <p className="text-xs text-slate-500 font-medium">Enterprise Catalog & Operations Desk</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Back to Shop Navigation Option */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 font-extrabold text-xs py-2.5 px-4 rounded-xl shadow-sm hover:shadow-md transition-all duration-150 active:scale-95 cursor-pointer"
            title="Go to the Web Store"
          >
            <span>🏪</span>
            <span>Back to Online Shop</span>
          </button>

          <div className="flex items-center gap-3 bg-slate-100/80 px-4 py-2.5 rounded-xl border border-slate-200/55">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-sm shadow-sm">
              {currentUser?.fullName?.charAt(0).toUpperCase() || 'E'}
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-slate-800">{currentUser?.fullName}</span>
              <span className="block text-[10px] text-slate-500 font-mono">{currentUser?.email}</span>
            </div>
            <span className="ml-3 px-2.5 py-1 bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
              {currentUser?.role || 'Agent'}
            </span>
          </div>
        </div>
      </header>

      {/* 3. Main Split View Layout */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 flex flex-col md:flex-row gap-6 items-start">
        {/* Dynamic Sidebar with integrated low-stock alerts and inline quick updates */}
        <Sidebar 
          products={products} 
          onSaveSuccess={handleLowStockSaveSuccess} 
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categoriesList}
          activePanel={activePanel}
          onActivePanelChange={setActivePanel}
        />

        {/* Dynamic Tabs Content Workspace */}
        <div className="flex-1 w-full bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[600px]">
          
          {/* === 0. HOME / WELCOME PORTAL === */}
          {activePanel === 'home' && (
            <div className="space-y-6 text-left animate-in fade-in duration-300">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/60 rounded-3xl p-8 flex flex-col md:flex-row items-center gap-6 justify-between shadow-sm">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100/80 text-blue-800 text-[10px] font-black uppercase tracking-widest rounded-full">
                    <span>⚡ Secure Employee Dashboard</span>
                  </div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                    Welcome to the Corporate Hardware Spec Portal
                  </h2>
                  <p className="text-sm text-slate-500 leading-relaxed max-w-2xl">
                    Publish hardware listings, adjust stock balances, setup safety alerts triggers, and manage secure client profiles. Ensure our technical specification catalog is always accurate and updated.
                  </p>
                </div>
                <div className="shrink-0 bg-white/80 p-4 rounded-2xl border border-blue-100 shadow-sm flex items-center justify-center">
                  <span className="text-4xl animate-bounce">💻</span>
                </div>
              </div>

              {/* Quick Metrics Bento Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                <div 
                  onClick={() => setActivePanel('inventory')}
                  className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">🗃️</span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Store Inventory</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{products.length} Models Listed</span>
                  <p className="text-[11px] text-slate-500 mt-1">Review, search, edit and manage specs.</p>
                </div>

                <div 
                  onClick={() => setActivePanel('add_product')}
                  className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">➕</span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">New Spec Catalog</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">Add Product</span>
                  <p className="text-[11px] text-slate-500 mt-1">Register new hardware units to the catalog.</p>
                </div>

                <div 
                  onClick={() => setActivePanel('customers')}
                  className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200/70 rounded-2xl p-5 text-left transition-all duration-200 cursor-pointer group shadow-sm"
                >
                  <span className="text-2xl block mb-2 group-hover:scale-110 transition-transform">👥</span>
                  <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Profiles</span>
                  <span className="text-xl font-extrabold text-slate-800 block mt-1">{users.length} Active Accounts</span>
                  <p className="text-[11px] text-slate-500 mt-1">Verify authorized registered clients.</p>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-slate-50/65 border border-slate-200/70 p-5 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Database Status: Connected & Synced</span>
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  Last updated: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}

          {/* === A. ADD PRODUCT PANEL === */}
          {activePanel === 'add_product' && (
            <div className="space-y-6 text-left animate-in fade-in duration-300">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <span>➕ Register New Hardware Specification</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Add new hardware units and retail spec profiles to our live storefront catalog.
                </p>
              </div>

              {/* --- ADD NEW PRODUCT SECTION --- */}
              <form onSubmit={handleAddNewProduct} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Catalog New Hardware Spec</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Product Title</label>
                    <input 
                      type="text" 
                      required
                      name="name"
                      value={newProductData.name}
                      onChange={handleNewProductChange}
                      placeholder="e.g. QuantumBook Air 14" 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Primary Category</label>
                    <select 
                      name="category"
                      value={newProductData.category}
                      onChange={handleNewProductChange}
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">Select Primary Category</option>
                      {Object.keys(categoryConfig).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Subcategory</label>
                    <input 
                      type="text" 
                      name="subcategory"
                      value={newProductData.subcategory}
                      onChange={handleNewProductChange}
                      placeholder="e.g. Refurbished Laptops" 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Brand Manufacturer</label>
                    <input 
                      type="text" 
                      name="brand"
                      value={newProductData.brand}
                      onChange={handleNewProductChange}
                      placeholder="e.g. Promethean, Apple" 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Price ($)</label>
                    <input 
                      type="number" 
                      required
                      name="price"
                      value={newProductData.price}
                      onChange={handleNewProductChange}
                      placeholder="949" 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Initial Stock Qty</label>
                    <input 
                      type="number" 
                      name="stock"
                      value={newProductData.stock}
                      onChange={handleNewProductChange}
                      placeholder="10" 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Minimum Safety Level</label>
                    <input 
                      type="number" 
                      name="minThreshold"
                      value={newProductData.minThreshold}
                      onChange={handleNewProductChange}
                      placeholder="3" 
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                      Product Image Asset
                    </label>
                    
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${
                        isDragging 
                          ? 'border-blue-500 bg-blue-50/50' 
                          : uploadedImageUrl 
                            ? 'border-emerald-400 bg-emerald-50/10' 
                            : 'border-slate-300 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-400'
                      }`}
                    >
                      <input 
                        type="file"
                        id="image-file-upload"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                      />

                      {uploadProgress !== null ? (
                        <div className="w-full flex flex-col items-center py-2">
                          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
                          <div className="w-full max-w-xs bg-slate-200 h-2 rounded-full overflow-hidden mt-1 shadow-inner">
                            <div 
                              className="bg-blue-600 h-full transition-all duration-150" 
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <span className="text-[11px] font-bold text-blue-600 mt-2">
                            Streaming up to Storage... {uploadProgress}%
                          </span>
                        </div>
                      ) : (uploadedImageUrl && uploadedImageUrl.trim() !== '') ? (
                        <div className="flex items-center gap-4 w-full">
                          <img 
                            src={uploadedImageUrl} 
                            alt="Uploaded Spec Thumbnail" 
                            className="w-16 h-16 object-cover rounded-lg border border-slate-200 shadow-sm"
                            referrerPolicy="no-referrer"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Upload Complete!
                            </p>
                            <p className="text-[10px] text-slate-500 truncate mt-0.5">
                              {uploadedImageUrl}
                            </p>
                            <button
                              type="button"
                              onClick={() => {
                                setUploadedImageUrl('');
                                setNewProductData(prev => ({ ...prev, image: '' }));
                              }}
                              className="text-[10px] font-bold text-red-500 hover:text-red-600 hover:underline mt-1 cursor-pointer flex items-center gap-1"
                            >
                              ✕ Remove & Re-upload
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label 
                          htmlFor="image-file-upload" 
                          className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-3"
                        >
                          <UploadCloud className="w-8 h-8 text-slate-400 mb-1.5" />
                          <span className="text-xs font-bold text-slate-700">
                            Drag & drop your product image here, or <span className="text-blue-600 hover:underline">browse</span>
                          </span>
                          <span className="text-[10px] text-slate-400 mt-1">
                            Supports PNG, JPG, GIF up to 5MB
                          </span>
                        </label>
                      )}

                      {uploadError && (
                        <p className="text-[10px] font-semibold text-red-500 mt-2 bg-red-50 border border-red-100 rounded px-2.5 py-1">
                          ⚠️ {uploadError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Specs Description</label>
                  <textarea 
                    name="description"
                    value={newProductData.description}
                    onChange={handleNewProductChange}
                    placeholder="Provide full description and baseline specifications..." 
                    rows={2}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-md transition-all uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Spec to Live Storefront</span>
                </button>
              </form>
            </div>
          )}

          {/* === B. DATABASE INVENTORY TABLE === */}
          {activePanel === 'inventory' && (
            <div className="space-y-6 text-left animate-in fade-in duration-300">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <span>🗃️ Store Inventory & Catalog Control</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage stock balances, adjust pricing, and review current safety trigger alerts.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <label htmlFor="category-select-filter" className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                    Category Filter:
                  </label>
                  <select
                    id="category-select-filter"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="bg-blue-50 text-blue-800 text-[10px] font-black px-3 py-1.5 rounded-full border border-blue-100 uppercase tracking-widest inline-block focus:outline-none focus:ring-1 focus:ring-blue-400 shadow-sm cursor-pointer"
                  >
                    <option value="All Categories">ALL CATEGORIES</option>
                    {Object.keys(categoryConfig).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* --- DATABASE INVENTORY TABLE --- */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-inner">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                        <th className="px-5 py-4">Product Spec Name</th>
                        <th className="px-5 py-4">Store Hierarchy</th>
                        <th className="px-5 py-4">Price</th>
                        <th className="px-5 py-4">Stock Balance</th>
                        <th className="px-5 py-4 text-right">Operations</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/80">
                      {filteredProducts.map((product) => {
                        const isEditing = editingId === product.id;
                        return (
                          <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-900 max-w-[250px]">
                              {isEditing ? (
                                <input 
                                  type="text" 
                                  name="name" 
                                  value={editFormData.name} 
                                  onChange={handleEditChange} 
                                  className="w-full bg-white border border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500" 
                                />
                              ) : (
                                <div>
                                  <span className="text-slate-900 block font-bold leading-snug">{product.name}</span>
                                  <span className="text-[9px] text-slate-400 font-mono tracking-wider">ID Tag: {product.id}</span>
                                </div>
                              )}
                            </td>
                            <td className="px-5 py-4 text-slate-600">
                              <span className="text-[11px] font-bold text-slate-700 block">{product.category}</span>
                              <span className="text-[10px] text-slate-400">{product.subcategory || 'N/A'}</span>
                            </td>
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <input 
                                  type="number" 
                                  name="price" 
                                  value={editFormData.price} 
                                  onChange={handleEditChange} 
                                  className="w-24 bg-white border border-blue-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none" 
                                />
                              ) : (
                                <span className="text-emerald-600 font-bold text-sm">€{product.price}</span>
                              )}
                            </td>
                            <td className="px-5 py-4">
                              {isEditing ? (
                                <div className="space-y-1.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-slate-400 font-mono">Stock:</span>
                                    <input 
                                      type="number" 
                                      name="stock" 
                                      value={editFormData.stock} 
                                      onChange={handleEditChange} 
                                      className="w-16 bg-white border border-blue-500 rounded-lg p-1 text-xs text-slate-800 focus:outline-none" 
                                    />
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9px] text-slate-400 font-mono">Min:</span>
                                    <input 
                                      type="number" 
                                      name="minThreshold" 
                                      value={editFormData.minThreshold} 
                                      onChange={handleEditChange} 
                                      className="w-16 bg-white border border-blue-500 rounded-lg p-1 text-xs text-slate-800 focus:outline-none" 
                                    />
                                  </div>
                                </div>
                              ) : (
                                <span className={`text-[11px] font-semibold ${product.stock <= (product.minThreshold || 3) ? 'text-orange-600 font-bold' : 'text-slate-600'}`}>
                                  {product.stock ?? 0} units {product.stock <= (product.minThreshold || 3) ? '⚠️' : ''}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-4 text-right space-x-2 whitespace-nowrap">
                              {isEditing ? (
                                <>
                                  <button 
                                    onClick={() => handleEditSave(product.id)} 
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wide py-1.5 px-3 rounded-lg transition-all cursor-pointer shadow-sm"
                                  >
                                    Save
                                  </button>
                                  <button 
                                    onClick={() => setEditingId(null)} 
                                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold uppercase tracking-wide py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => handleEditStart(product)} 
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-100 text-[10px] font-bold uppercase tracking-wide py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                                  >
                                    Edit
                                  </button>
                                  <button 
                                    onClick={() => handleProductDelete(product.id, product.name)} 
                                    className="bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-100 text-[10px] font-bold uppercase tracking-wide py-1.5 px-3 rounded-lg transition-all cursor-pointer"
                                  >
                                    De-list
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* === C. CUSTOMER DATABASE === */}
          {activePanel === 'customers' && (
            <div className="space-y-6 text-left">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-600" />
                  <span>👥 Secure Corporate Customer Database</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Read-only view of authenticated customer and corporate buyer profiles registered on the storefront.
                </p>
              </div>

              {usersError ? (
                <div className="bg-red-50 border border-red-200 text-red-700 p-5 rounded-2xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
                  <div className="text-xs space-y-1">
                    <span className="font-extrabold uppercase block tracking-wider">Access Restrained</span>
                    <p>{usersError}</p>
                  </div>
                </div>
              ) : isLoadingUsers ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Querying Secure Client Directory...</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider">
                          <th className="px-5 py-4">Customer Name</th>
                          <th className="px-5 py-4">Email Address</th>
                          <th className="px-5 py-4">System Role</th>
                          <th className="px-5 py-4">Created Timestamp</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80">
                        {users.map((u) => (
                          <tr key={u.uid} className="hover:bg-slate-50 transition-colors">
                            <td className="px-5 py-4 font-bold text-slate-800 flex items-center gap-3">
                              <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shadow-sm">
                                {u.fullName.charAt(0).toUpperCase()}
                              </div>
                              <span>{u.fullName}</span>
                            </td>
                            <td className="px-5 py-4 text-slate-600 font-mono text-[11px]">{u.email}</td>
                            <td className="px-5 py-4">
                              <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-lg font-mono ${
                                u.role === 'employee' 
                                  ? 'bg-blue-50 text-blue-700 border border-blue-100' 
                                  : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-slate-400 text-[10px]">
                              {u.createdAt !== 'N/A' ? new Date(u.createdAt).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
