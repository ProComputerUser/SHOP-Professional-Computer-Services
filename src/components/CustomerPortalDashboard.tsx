import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Laptop, Ticket, Cpu, Layers, Send, CheckCircle2, Clock, 
  AlertTriangle, LogOut, ArrowLeft, RefreshCw, FileText, 
  ChevronRight, Plus, Search, ShieldCheck, ExternalLink, HelpCircle
} from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

// Interfaces
interface Ticket {
  id: string;
  subject: string;
  description: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'Under Review' | 'In Progress' | 'Resolved';
  createdAt: string;
}

interface Asset {
  id: string;
  name: string;
  category: string;
  serialNumber: string;
  specs: string;
  issuedDate: string;
  warrantyUntil: string;
  status: 'Active' | 'Under Repair' | 'Decommissioned';
}

interface UpgradeRequest {
  id: string;
  assetId: string;
  assetName: string;
  requestedSpecs: string;
  justification: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

// Sample fallback active assets data
const SAMPLE_ASSETS: Asset[] = [
  {
    id: 'AST-99482',
    name: 'Apple MacBook Pro 16"',
    category: 'Laptop',
    serialNumber: 'C02DF98XMD6M',
    specs: 'M3 Max CPU (16-Core), 36GB Unified RAM, 1TB NVMe SSD',
    issuedDate: '2024-10-12',
    warrantyUntil: '2027-10-12',
    status: 'Active'
  },
  {
    id: 'AST-88124',
    name: 'Dell UltraSharp 32" 4K Monitor',
    category: 'Display',
    serialNumber: 'CN-0H223R-74445',
    specs: 'IPS Black Panel, 3840x2160, 90W USB-C Power Delivery',
    issuedDate: '2024-10-15',
    warrantyUntil: '2026-10-15',
    status: 'Active'
  },
  {
    id: 'AST-55231',
    name: 'Logitech MX Master 3S Mouse',
    category: 'Peripheral',
    serialNumber: 'LZ32104523',
    specs: 'Ergonomic Wireless Mouse, 8K DPI Tracking, Quiet Clicks',
    issuedDate: '2024-10-15',
    warrantyUntil: '2025-09-15',
    status: 'Active'
  }
];

// Sample support tickets to pre-populate state
const SAMPLE_TICKETS: Ticket[] = [
  {
    id: 'TCK-3341',
    subject: 'Battery issues with MacBook Pro',
    description: 'Battery capacity drops from 100% to 20% in less than 2 hours of moderate software development use. Battery cycles are at 180.',
    priority: 'Medium',
    status: 'Under Review',
    createdAt: '2026-07-14 09:30'
  },
  {
    id: 'TCK-3312',
    subject: 'Requesting secondary monitor for dual-display configuration',
    description: 'Need a matching secondary Dell UltraSharp 32" monitor for my engineering workstation setup to improve visual multitasking.',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2026-07-09 14:15'
  }
];

// Sample Upgrade Requests
const SAMPLE_UPGRADES: UpgradeRequest[] = [
  {
    id: 'UPG-881',
    assetId: 'AST-99482',
    assetName: 'Apple MacBook Pro 16"',
    requestedSpecs: 'Upgrade memory to 64GB RAM for running complex virtualization containers.',
    justification: 'Docker development environments are running slow with the current 36GB memory capacity.',
    status: 'Approved',
    submittedAt: '2026-07-15 11:00'
  }
];

export default function CustomerPortalDashboard() {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string>('home');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Core Arrays in State
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [assets] = useState<Asset[]>(SAMPLE_ASSETS);
  const [upgrades, setUpgrades] = useState<UpgradeRequest[]>([]);

  // Ticket Form Input States
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [ticketSubmitSuccess, setTicketSubmitSuccess] = useState(false);

  // Upgrade Form Input States
  const [selectedAssetId, setSelectedAssetId] = useState(SAMPLE_ASSETS[0]?.id || '');
  const [requestedSpecs, setRequestedSpecs] = useState('');
  const [upgradeJustification, setUpgradeJustification] = useState('');
  const [upgradeSubmitSuccess, setUpgradeSubmitSuccess] = useState(false);

  // Read current user & synchronize data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setIsVerifying(true);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              uid: user.uid,
              ...userData
            });
            // If user has saved tickets, initialize state, otherwise set default samples
            if (userData.tickets && Array.isArray(userData.tickets)) {
              setTickets(userData.tickets);
            } else {
              // Pre-populate with sample tickets if empty in DB
              setTickets(SAMPLE_TICKETS);
            }
            // Load custom upgrades if saved in Firestore
            if (userData.upgrades && Array.isArray(userData.upgrades)) {
              setUpgrades(userData.upgrades);
            } else {
              setUpgrades(SAMPLE_UPGRADES);
            }
          } else {
            // Guest or unregistered user profile fallback
            setCurrentUser({
              uid: user.uid,
              email: user.email,
              fullName: user.displayName || user.email?.split('@')[0] || 'Client User',
              role: 'customer'
            });
            loadFromLocalStorage();
          }
        } catch (err) {
          console.error("Error reading portal credentials:", err);
          loadFromLocalStorage();
        }
      } else {
        // Mock / Guest profile fallback so it works without login immediately
        setCurrentUser({
          uid: 'GUEST-CLIENT-771',
          email: 'corporate.guest@enterprise.com',
          fullName: 'Acme Corp Client (Demo)',
          role: 'customer'
        });
        loadFromLocalStorage();
      }
      setIsVerifying(false);
    });

    return () => unsubscribe();
  }, []);

  // Sync state helpers
  const loadFromLocalStorage = () => {
    try {
      const savedTickets = localStorage.getItem('techshop_customer_tickets');
      if (savedTickets) {
        setTickets(JSON.parse(savedTickets));
      } else {
        setTickets(SAMPLE_TICKETS);
      }

      const savedUpgrades = localStorage.getItem('techshop_customer_upgrades');
      if (savedUpgrades) {
        setUpgrades(JSON.parse(savedUpgrades));
      } else {
        setUpgrades(SAMPLE_UPGRADES);
      }
    } catch {
      setTickets(SAMPLE_TICKETS);
      setUpgrades(SAMPLE_UPGRADES);
    }
  };

  const persistTickets = async (updatedTickets: Ticket[]) => {
    setTickets(updatedTickets);
    // Persist locally
    localStorage.setItem('techshop_customer_tickets', JSON.stringify(updatedTickets));
    // Try syncing to Firestore if authenticated with real user account
    if (currentUser && currentUser.uid && !currentUser.uid.startsWith('GUEST-')) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          tickets: updatedTickets
        }, { merge: true });
      } catch (err) {
        console.error("Firestore sync failed, fell back to client memory:", err);
      }
    }
  };

  const persistUpgrades = async (updatedUpgrades: UpgradeRequest[]) => {
    setUpgrades(updatedUpgrades);
    // Persist locally
    localStorage.setItem('techshop_customer_upgrades', JSON.stringify(updatedUpgrades));
    // Try syncing to Firestore if authenticated with real user account
    if (currentUser && currentUser.uid && !currentUser.uid.startsWith('GUEST-')) {
      try {
        await setDoc(doc(db, 'users', currentUser.uid), {
          upgrades: updatedUpgrades
        }, { merge: true });
      } catch (err) {
        console.error("Firestore upgrades sync failed:", err);
      }
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Form Submitter for Support Tickets
  const handleNewTicketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketDescription.trim()) return;

    const newTicket: Ticket = {
      id: `TCK-${Math.floor(Math.random() * 9000 + 1000)}`,
      subject: ticketSubject.trim(),
      description: ticketDescription.trim(),
      priority: ticketPriority,
      status: 'Open',
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updated = [newTicket, ...tickets];
    persistTickets(updated);

    // Reset fields & show success trigger
    setTicketSubject('');
    setTicketDescription('');
    setTicketPriority('Medium');
    setTicketSubmitSuccess(true);
    setTimeout(() => setTicketSubmitSuccess(false), 4000);
  };

  // Form Submitter for Hardware Upgrade Request
  const handleNewUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestedSpecs.trim() || !upgradeJustification.trim()) return;

    const assetObj = assets.find(a => a.id === selectedAssetId);
    const assetName = assetObj ? assetObj.name : 'Unknown Hardware';

    const newUpgrade: UpgradeRequest = {
      id: `UPG-${Math.floor(Math.random() * 900 + 100)}`,
      assetId: selectedAssetId,
      assetName,
      requestedSpecs: requestedSpecs.trim(),
      justification: upgradeJustification.trim(),
      status: 'Pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    const updated = [newUpgrade, ...upgrades];
    persistUpgrades(updated);

    // Reset fields & show success trigger
    setRequestedSpecs('');
    setUpgradeJustification('');
    setUpgradeSubmitSuccess(true);
    setTimeout(() => setUpgradeSubmitSuccess(false), 4000);
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center items-center">
        <RefreshCw className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Verifying Portal Access Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans" id="customer-portal-dashboard-root">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-6 shrink-0 flex flex-col gap-5 text-left h-auto md:h-screen sticky top-0" id="customer-portal-sidebar">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="text-left">
            <h1 className="text-xs font-black tracking-tight text-slate-900 uppercase">PCS Customer Portal</h1>
            <p className="text-[10px] text-slate-500 font-medium">Assets & Upgrade Hub</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5" id="customer-sidebar-links">
          <button 
            onClick={() => setActivePanel('home')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs transition-all cursor-pointer border ${
              activePanel === 'home'
                ? 'bg-slate-900 text-white border-slate-900 font-extrabold'
                : 'text-slate-600 hover:bg-slate-50 border-transparent font-medium'
            }`}
            id="nav-home-btn"
          >
            <span className="text-base">🏠</span>
            <span>Welcome Overview</span>
          </button>

          <button 
            onClick={() => setActivePanel('assets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs transition-all cursor-pointer border ${
              activePanel === 'assets'
                ? 'bg-slate-900 text-white border-slate-900 font-extrabold'
                : 'text-slate-600 hover:bg-slate-50 border-transparent font-medium'
            }`}
            id="nav-assets-btn"
          >
            <Laptop className={`w-4 h-4 ${activePanel === 'assets' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>My Active Assets</span>
          </button>

          <button 
            onClick={() => setActivePanel('tickets')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs transition-all cursor-pointer border ${
              activePanel === 'tickets'
                ? 'bg-slate-900 text-white border-slate-900 font-extrabold'
                : 'text-slate-600 hover:bg-slate-50 border-transparent font-medium'
            }`}
            id="nav-tickets-btn"
          >
            <Ticket className={`w-4 h-4 ${activePanel === 'tickets' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Support Tickets</span>
          </button>

          <button 
            onClick={() => setActivePanel('upgrades')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left text-xs transition-all cursor-pointer border ${
              activePanel === 'upgrades'
                ? 'bg-slate-900 text-white border-slate-900 font-extrabold'
                : 'text-slate-600 hover:bg-slate-50 border-transparent font-medium'
            }`}
            id="nav-upgrades-btn"
          >
            <Cpu className={`w-4 h-4 ${activePanel === 'upgrades' ? 'text-emerald-400' : 'text-slate-400'}`} />
            <span>Request Upgrades</span>
          </button>
        </nav>

        <div className="border-t border-slate-100 my-4 pt-4 flex-1 flex flex-col justify-end">
          {/* Sidebar Quick Reference Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left space-y-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-wider">Enterprise SLA</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Active Gold SLA ensures 4-hour target turnaround times on hardware repairs and priority review of upgrade requests.
            </p>
            <div className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
              <span>Support:</span>
              <span className="font-bold text-slate-600">1-800-PCS-GOLD</span>
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CANVAS COLUMN */}
      <div className="flex-1 flex flex-col min-h-screen bg-slate-50" id="customer-main-canvas">
        
        {/* 1. Standardized horizontal top Header bar stretching from the sidebar edge across to the right screen boundary */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm" id="customer-header-bar">
          <div className="flex items-center gap-3 text-left">
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 hover:border-slate-300 font-bold text-xs py-1.5 px-3.5 rounded-xl shadow-sm transition-all duration-150 active:scale-95 cursor-pointer"
              id="back-to-shop-btn"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit to Storefront</span>
            </button>
          </div>

          <div className="flex items-center gap-4">
            {/* Display the logged-in user's name on the right alongside a small circle avatar matching their name's first initial */}
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-xs border border-slate-800 uppercase">
                {(currentUser?.fullName || currentUser?.email || 'Client').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-xs font-bold text-slate-800">{currentUser?.fullName || 'Client User'}</span>
                <span className="block text-[9px] text-slate-500 font-mono mt-0.5">{currentUser?.email}</span>
              </div>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[8px] font-black uppercase tracking-wider rounded border border-emerald-100 ml-1">
                {currentUser?.role || 'customer'}
              </span>
            </div>

            {/* Clean, prominent text button aligned to the absolute top-right corner labeled "Sign Out 🚪" */}
            <button
              id="portal-signout-btn"
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              <span>Sign Out 🚪</span>
            </button>
          </div>
        </header>

        {/* 2. Main Portal Scrollable Workspace Module Panel */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto" id="portal-workspace-viewport">
          
          {/* ==========================================
              PANEL 1: HOME WELCOME SCREEN (CLUTTER-FREE)
              ========================================== */}
          {activePanel === 'home' && (
            <div className="space-y-6 text-left animate-in fade-in duration-300" id="panel-home">
              <div className="max-w-2xl">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-tight">
                  Welcome back to your spec dashboard.
                </h2>
                <p className="text-slate-500 mt-3 text-sm leading-relaxed">
                  PCS Corporate Portal gives your team immediate oversight of all assigned physical hardware specifications, Active IT configuration assets, live troubleshooting tickets, and corporate equipment upgrades requested for your workstation.
                </p>
              </div>

              <div className="border-t border-slate-100 my-8"></div>

              {/* Minimal navigation guide block */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div 
                  onClick={() => setActivePanel('assets')}
                  className="group p-5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 rounded-xl cursor-pointer transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-700 font-bold border border-slate-100 mb-3 shadow-sm">
                    💻
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Manage Assets</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Review active notebook specifications, accessories, and monitor serial tags.</p>
                </div>

                <div 
                  onClick={() => setActivePanel('tickets')}
                  className="group p-5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 rounded-xl cursor-pointer transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-700 font-bold border border-slate-100 mb-3 shadow-sm">
                    🎫
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">File Helpdesk Ticket</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Submit support requests directly into the active corporate service queue.</p>
                </div>

                <div 
                  onClick={() => setActivePanel('upgrades')}
                  className="group p-5 border border-slate-100 hover:border-slate-200 hover:bg-slate-50/50 rounded-xl cursor-pointer transition-all duration-200"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-50 group-hover:bg-white flex items-center justify-center text-slate-700 font-bold border border-slate-100 mb-3 shadow-sm">
                    🚀
                  </div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">Request Upgrades</h3>
                  <p className="text-[11px] text-slate-400 mt-1">Propose RAM, SSD, or device upgrade requests with justification.</p>
                </div>
              </div>
            </div>
          )}


          {/* ==========================================
              PANEL 2: MY ACTIVE ASSETS
              ========================================== */}
          {activePanel === 'assets' && (
            <div className="space-y-6 text-left animate-in fade-in duration-300" id="panel-assets">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>💻 My Assigned Enterprise Assets</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  List of registered technical hardware specifications issued to your user account under corporate inventory tracking.
                </p>
              </div>

              {/* Active assets list */}
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                {assets.map((asset) => (
                  <div key={asset.id} className="p-5 bg-slate-50/50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/90 transition-all duration-150">
                    <div className="space-y-1.5 text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider rounded">
                          {asset.category}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          ID: {asset.id}
                        </span>
                      </div>
                      <h3 className="text-sm font-extrabold text-slate-900">{asset.name}</h3>
                      <p className="text-xs font-medium text-slate-600 bg-white inline-block px-3 py-1 rounded-lg border border-slate-100">
                        {asset.specs}
                      </p>
                      <div className="flex items-center gap-4 pt-1.5 text-[11px] text-slate-400 font-medium">
                        <span>Serial: <span className="font-mono text-slate-600 font-bold">{asset.serialNumber}</span></span>
                        <span>•</span>
                        <span>Issued: <span className="text-slate-600 font-bold">{asset.issuedDate}</span></span>
                        <span>•</span>
                        <span>Warranty: <span className="text-slate-600 font-bold">{asset.warrantyUntil}</span></span>
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      <span className="text-xs font-extrabold text-emerald-600 uppercase tracking-widest">{asset.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}


          {/* ==========================================
              PANEL 3: SUPPORT TICKETS (WITH INTERACTIVE FORM AND DESK STATUS MIRRORING)
              ========================================== */}
          {activePanel === 'tickets' && (
            <div className="space-y-8 text-left animate-in fade-in duration-300" id="panel-tickets">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🎫 Corporate Helpdesk & Support Tickets</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Report configuration failures or logistics request. Submissions are live-appended to the tracked statuses array.
                </p>
              </div>

              {/* Status Board counters mirroring helpdesk categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-left">
                  <span className="text-lg font-black text-slate-800">{tickets.length}</span>
                  <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">Total Filed</span>
                </div>
                <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100/60 text-left">
                  <span className="text-lg font-black text-amber-700">
                    {tickets.filter(t => t.status === 'Open').length}
                  </span>
                  <span className="block text-[10px] text-amber-500 font-bold uppercase tracking-wider mt-1">Open Queue</span>
                </div>
                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100/60 text-left">
                  <span className="text-lg font-black text-blue-700">
                    {tickets.filter(t => t.status === 'In Progress' || t.status === 'Under Review').length}
                  </span>
                  <span className="block text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-1">Under Active Review</span>
                </div>
                <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100/60 text-left">
                  <span className="text-lg font-black text-emerald-700">
                    {tickets.filter(t => t.status === 'Resolved').length}
                  </span>
                  <span className="block text-[10px] text-emerald-500 font-bold uppercase tracking-wider mt-1">Resolved</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Submit New Support Ticket Form */}
                <form 
                  onSubmit={handleNewTicketSubmit} 
                  className="lg:col-span-5 bg-slate-50/55 p-5 border border-slate-200/80 rounded-2xl space-y-4"
                  id="ticket-creation-form"
                >
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <span>📝 Submit a Support Request</span>
                  </h3>

                  {ticketSubmitSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Ticket submitted and added to live queue!</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Subject / Issue Title</label>
                    <input 
                      type="text"
                      required
                      value={ticketSubject}
                      onChange={(e) => setTicketSubject(e.target.value)}
                      placeholder="e.g., Wireless peripheral signal drops"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Describe the issue</label>
                    <textarea 
                      required
                      rows={3}
                      value={ticketDescription}
                      onChange={(e) => setTicketDescription(e.target.value)}
                      placeholder="Provide precise details including hardware context, error messages, and step reproduce procedures..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Severity / Priority</label>
                    <select
                      value={ticketPriority}
                      onChange={(e: any) => setTicketPriority(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800"
                    >
                      <option value="Low">Low - Cosmetic issue / Question</option>
                      <option value="Medium">Medium - Standard operational request</option>
                      <option value="High">High - Impaired workstation core spec</option>
                      <option value="Critical">Critical - Production blocking blockages</option>
                    </select>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-95"
                    id="submit-ticket-btn"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Helpdesk Ticket</span>
                  </button>
                </form>

                {/* Tickets list mirroring helpdesk status */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">
                    Live Tickets Board
                  </h3>

                  {tickets.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-xs text-slate-400 italic">No tickets filed yet. Submit the form to file your first ticket.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[480px] overflow-y-auto pr-1">
                      {tickets.map((ticket) => {
                        // Badge style selectors
                        let priorityBadge = "bg-slate-100 text-slate-700 border-slate-200";
                        if (ticket.priority === 'Critical') priorityBadge = "bg-red-50 text-red-700 border-red-100 font-bold";
                        else if (ticket.priority === 'High') priorityBadge = "bg-orange-50 text-orange-700 border-orange-100 font-bold";
                        else if (ticket.priority === 'Medium') priorityBadge = "bg-yellow-50 text-yellow-800 border-yellow-100";

                        let statusBadge = "bg-slate-100 text-slate-600";
                        if (ticket.status === 'Resolved') statusBadge = "bg-emerald-100 text-emerald-800 font-extrabold";
                        else if (ticket.status === 'In Progress') statusBadge = "bg-blue-100 text-blue-800 font-extrabold";
                        else if (ticket.status === 'Under Review') statusBadge = "bg-purple-100 text-purple-800";
                        else if (ticket.status === 'Open') statusBadge = "bg-amber-100 text-amber-800";

                        return (
                          <div key={ticket.id} className="p-4 border border-slate-150 rounded-xl bg-white space-y-2.5 shadow-sm text-left hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                  {ticket.id}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${priorityBadge}`}>
                                  {ticket.priority} Severity
                                </span>
                              </div>
                              <span className={`text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full ${statusBadge}`}>
                                {ticket.status}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-xs font-black text-slate-950">{ticket.subject}</h4>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{ticket.description}</p>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 border-t border-slate-100 pt-2 font-mono">
                              <Clock className="w-3 h-3" />
                              <span>Filed on: {ticket.createdAt}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}


          {/* ==========================================
              PANEL 4: REQUEST SPEC UPGRADES
              ========================================== */}
          {activePanel === 'upgrades' && (
            <div className="space-y-6 text-left animate-in fade-in duration-300" id="panel-upgrades">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>🚀 Workstation Upgrade Requests</span>
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Submit hardware configuration upgrade proposals (RAM, SSD, screen real estate) to corporate procurement.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Upgrade Form */}
                <form 
                  onSubmit={handleNewUpgradeSubmit} 
                  className="lg:col-span-5 bg-slate-50/55 p-5 border border-slate-200/80 rounded-2xl space-y-4"
                  id="upgrade-creation-form"
                >
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-slate-200/60 pb-2">
                    <span>📋 Create Upgrade Proposal</span>
                  </h3>

                  {upgradeSubmitSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-bounce">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Upgrade request published to live specs!</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Select Assigned Hardware</label>
                    <select
                      value={selectedAssetId}
                      onChange={(e) => setSelectedAssetId(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800"
                    >
                      {assets.map(asset => (
                        <option key={asset.id} value={asset.id}>
                          {asset.name} ({asset.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Requested Upgrade Spec details</label>
                    <input 
                      type="text"
                      required
                      value={requestedSpecs}
                      onChange={(e) => setRequestedSpecs(e.target.value)}
                      placeholder="e.g., Upgrade to 64GB DDR5 memory or 2TB SSD"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider">Business Justification</label>
                    <textarea 
                      required
                      rows={3}
                      value={upgradeJustification}
                      onChange={(e) => setUpgradeJustification(e.target.value)}
                      placeholder="e.g. Local compiler speed requirements or virtualization workflow constraints..."
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-slate-800 resize-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm active:scale-95"
                    id="submit-upgrade-btn"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Publish Upgrade Spec</span>
                  </button>
                </form>

                {/* Upgrades tracking list */}
                <div className="lg:col-span-7 space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-left">
                    Procurement Decisions Tracking
                  </h3>

                  {upgrades.length === 0 ? (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-xs text-slate-400 italic">No upgrade requests proposed yet.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {upgrades.map((upg) => {
                        let statusBadge = "bg-amber-100 text-amber-800";
                        if (upg.status === 'Approved') statusBadge = "bg-emerald-100 text-emerald-800 font-extrabold";
                        if (upg.status === 'Rejected') statusBadge = "bg-red-100 text-red-800";

                        return (
                          <div key={upg.id} className="p-4 border border-slate-150 rounded-xl bg-white space-y-2 shadow-sm text-left hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-mono font-extrabold text-slate-700">
                                Request ID: {upg.id}
                              </span>
                              <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-full ${statusBadge}`}>
                                {upg.status}
                              </span>
                            </div>

                            <div className="text-xs">
                              <div className="text-slate-400 font-bold">Target Hardware:</div>
                              <div className="text-slate-800 font-extrabold">{upg.assetName} ({upg.assetId})</div>
                            </div>

                            <div className="text-xs">
                              <div className="text-slate-400 font-bold">Requested Enhancement:</div>
                              <div className="text-slate-900 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-mono text-[11px] mt-1">
                                {upg.requestedSpecs}
                              </div>
                            </div>

                            <div className="text-xs">
                              <div className="text-slate-400 font-bold">Justification:</div>
                              <div className="text-slate-600 italic mt-0.5">{upg.justification}</div>
                            </div>

                            <div className="text-[10px] text-slate-400 pt-1.5 border-t border-slate-100 font-mono flex items-center justify-between">
                              <span>Submitted on: {upg.submittedAt}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
      
      {/* Dynamic light visual footer */}
      <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 mt-auto">
        <p>© 2026 Professional Corporate Store. Authorized Access Only. Standard Security Protocols Monitored.</p>
      </footer>
    </div>
  );
}
