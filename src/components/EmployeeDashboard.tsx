import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, LogOut, Calendar, HardDrive, Database, Shield, Check, 
  RefreshCw, AlertCircle, MapPin, Send, Plus, Trash2, CheckCircle, Phone
} from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { motion } from 'motion/react';

interface EmployeeDashboardProps {
  products?: any[];
  setProducts?: React.Dispatch<React.SetStateAction<any[]>>;
  categoryConfig?: Record<string, string[]>;
}

interface DispatchJob {
  id: string;
  client: string;
  address: string;
  time: string;
  task: string;
  status: 'pending' | 'inprogress' | 'completed' | 'blocked';
}

interface PanelConfig {
  id: string;
  clientName: string;
  roomNumber: string;
  panelModel: string;
  serialNumber: string;
  ipAddress: string;
  subnetMask: string;
  gateway: string;
  status: 'configuring' | 'active' | 'testing';
  notes: string;
  loggedAt: string;
}

export default function EmployeeDashboard({ products = [], setProducts, categoryConfig = {} }: EmployeeDashboardProps) {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState<string>('profile');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(true);

  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [eircode, setEircode] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Dispatch Operational States
  const [schedule, setSchedule] = useState<DispatchJob[]>([
    {
      id: 'disp_1',
      client: 'Greenview Academic High School',
      address: '100 School Road, Dublin 4',
      time: '09:00 AM',
      task: 'Secure wall-mount installation for 2x Promethean ActivPanel 10 smart screens in Room 102 and Room 104.',
      status: 'completed'
    },
    {
      id: 'disp_2',
      client: 'Vertex Corp Headquarters',
      address: 'Suite 401, Grand Canal Dock, Dublin 2',
      time: '02:30 PM',
      task: 'Upgrade core server cabinet switches. Verify 10Gbps optical fiber uplink.',
      status: 'inprogress'
    },
    {
      id: 'disp_3',
      client: 'St. Jude Primary School',
      address: 'St. Jude Road, Dublin 6',
      time: '04:45 PM',
      task: 'Field diagnosis of ActivPanel touch input latency reported by teacher.',
      status: 'pending'
    }
  ]);

  // ActivPanel Setup States
  const [clientName, setClientName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [panelModel, setPanelModel] = useState('Promethean ActivPanel 10');
  const [serialNumber, setSerialNumber] = useState('');
  const [ipAddress, setIpAddress] = useState('192.168.1.100');
  const [subnetMask, setSubnetMask] = useState('255.255.255.0');
  const [gateway, setGateway] = useState('192.168.1.1');
  const [panelStatus, setPanelStatus] = useState<'configuring' | 'active' | 'testing'>('configuring');
  const [notes, setNotes] = useState('');
  const [savedConfigs, setSavedConfigs] = useState<PanelConfig[]>([]);
  const [isSubmittingConfig, setIsSubmittingConfig] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);
  const [configError, setConfigError] = useState('');

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([
    { id: 'log-1', timestamp: new Date().toISOString(), operator: 'customer@procomputer.ie', action: 'PROFILE_ACCESSED', details: 'Employee profile details initialized and synchronized.' }
  ]);

  // Auth monitoring & Profile Fetch
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        // Fetch custom user parameters from Firestore
        setIsLoadingProfile(true);
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setFullName(data.fullName || user.displayName || '');
            setPhone(data.phone || '');
            setAddress(data.address || '');
            setEircode(data.eircode || '');
          } else {
            setFullName(user.displayName || 'Field Operations Specialist');
          }
        } catch (err) {
          console.error("Error reading employee profile properties from Firestore:", err);
        } finally {
          setIsLoadingProfile(false);
          setIsVerifying(false);
        }
        // Load custom smart panel installations
        loadSavedConfigs();
      } else {
        // Redirect if logged out
        navigate('/');
        setIsVerifying(false);
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // Fetch Panel configs from Firestore
  const loadSavedConfigs = async () => {
    try {
      const qSnap = await getDocs(collection(db, "employeeData"));
      const configs: PanelConfig[] = [];
      qSnap.forEach((doc) => {
        const data = doc.data();
        if (doc.id.startsWith('panel_config_')) {
          configs.push({
            id: doc.id,
            clientName: data.clientName || '',
            roomNumber: data.roomNumber || '',
            panelModel: data.panelModel || '',
            serialNumber: data.serialNumber || '',
            ipAddress: data.ipAddress || '',
            subnetMask: data.subnetMask || '',
            gateway: data.gateway || '',
            status: data.status || 'configuring',
            notes: data.notes || '',
            loggedAt: data.loggedAt || ''
          });
        }
      });
      setSavedConfigs(configs);
    } catch (err) {
      console.error("Error loading panel installations from Firestore:", err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (err) {
      console.error("Authentication Sign Out error:", err);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    setIsSavingProfile(true);
    setProfileSuccess('');
    setProfileError('');

    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const uppercaseEircode = eircode.toUpperCase().trim();
      const updatedData = {
        fullName,
        phone,
        address,
        eircode: uppercaseEircode,
        updatedAt: new Date().toISOString()
      };
      
      await setDoc(userDocRef, updatedData, { merge: true });
      setEircode(uppercaseEircode); // Keep state pristine uppercase
      setProfileSuccess('Your profile settings have been securely bound to the Firestore matrix.');
      
      // Update local Audit Log
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: currentUser.email || 'employee',
          action: 'PROFILE_UPDATED',
          details: `Full Name, Phone Contact, Address and Eircode (${uppercaseEircode}) saved.`
        },
        ...prev
      ]);
    } catch (err: any) {
      console.error("Firestore Write Error on profile collection:", err);
      setProfileError('Failed to save parameters: ' + (err.message || 'Permissions Denied'));
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleJobStatusChange = (jobId: string, newStatus: any) => {
    setSchedule(prev => prev.map(job => job.id === jobId ? { ...job, status: newStatus } : job));
    setAuditLogs(prev => [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        operator: currentUser?.email || 'employee',
        action: 'JOB_STATUS_CHANGE',
        details: `Dispatched Job ID ${jobId} status transitioned to "${newStatus.toUpperCase()}"`
      },
      ...prev
    ]);
  };

  const handleSubmitPanelConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serialNumber || !clientName || !roomNumber) {
      setConfigError('Please provide all mandatory hardware parameters.');
      return;
    }

    setIsSubmittingConfig(true);
    setConfigError('');
    setConfigSuccess(false);

    try {
      const configId = `panel_config_${serialNumber.replace(/\s+/g, '_').toLowerCase()}`;
      const payload = {
        clientName,
        roomNumber,
        panelModel,
        serialNumber,
        ipAddress,
        subnetMask,
        gateway,
        status: panelStatus,
        notes,
        loggedAt: new Date().toISOString()
      };

      await setDoc(doc(db, "employeeData", configId), payload);
      
      setConfigSuccess(true);
      setSerialNumber('');
      setNotes('');
      
      // Update logs
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: currentUser?.email || 'employee',
          action: 'HARDWARE_CONFIG_LOGGED',
          details: `Registered Promethean panel SN: ${serialNumber} at client ${clientName}.`
        },
        ...prev
      ]);

      await loadSavedConfigs();
    } catch (err: any) {
      console.error("Firestore error registering panel:", err);
      setConfigError('Failed to record configuration: ' + (err.message || 'Write Rejected.'));
    } finally {
      setIsSubmittingConfig(false);
    }
  };

  const handleRemovePanelConfig = async (id: string) => {
    if (!window.confirm("Verify hardware database deletion. Are you sure?")) return;
    try {
      await deleteDoc(doc(db, "employeeData", id));
      setAuditLogs(prev => [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          operator: currentUser?.email || 'employee',
          action: 'HARDWARE_CONFIG_DELETED',
          details: `Deleted Promethean configuration reference ${id}.`
        },
        ...prev
      ]);
      await loadSavedConfigs();
    } catch (err) {
      console.error("Error deleting panel:", err);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center space-y-4" id="verifying-auth-screen">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-xs font-mono tracking-wider text-slate-500 uppercase">Verifying Staff Security Credentials...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans selection:bg-blue-600 selection:text-white" id="employee-dashboard-root">
      
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 p-5 shrink-0 flex flex-col gap-5 text-left h-auto md:h-screen sticky top-0" id="dashboard-sidebar-menu">
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 p-2 rounded-xl border border-blue-100">
            <Shield className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
                Staff Terminal
              </span>
              <span className="text-[10px] font-mono text-slate-400">v4.0-Standard</span>
            </div>
            <h1 className="text-xs font-black text-slate-900 tracking-tight">PCS Staff Operations</h1>
          </div>
        </div>

        <div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Navigation Workspace</span>
          <h2 className="text-[11px] font-extrabold text-slate-700">Select active panel controller</h2>
        </div>

        <nav className="flex flex-col gap-1.5" id="sidebar-navigation-links">
          {/* Requirement 3: Primary view option labeled "👤 My Profile Details" */}
          <button
            id="nav-profile-btn"
            onClick={() => setActivePanel('profile')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-xs cursor-pointer border ${
              activePanel === 'profile'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>👤 My Profile Details</span>
          </button>

          <button
            id="nav-schedule-btn"
            onClick={() => setActivePanel('schedule')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-xs cursor-pointer border ${
              activePanel === 'schedule'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>📅 Dispatch Schedule</span>
          </button>

          <button
            id="nav-installer-btn"
            onClick={() => setActivePanel('installer')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-xs cursor-pointer border ${
              activePanel === 'installer'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <HardDrive className="w-4 h-4 shrink-0" />
            <span>🛠️ ActivPanel Installer</span>
          </button>

          <button
            id="nav-inventory-btn"
            onClick={() => setActivePanel('inventory')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-xs cursor-pointer border ${
              activePanel === 'inventory'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Database className="w-4 h-4 shrink-0" />
            <span>📊 Store Inventory</span>
          </button>

          <button
            id="nav-audit-btn"
            onClick={() => setActivePanel('audit')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left text-xs cursor-pointer border ${
              activePanel === 'audit'
                ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/10'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-transparent'
            }`}
          >
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>📋 Audit Logs</span>
          </button>
        </nav>

        <div className="border-t border-slate-100 pt-4 mt-auto">
          <button
            id="btn-back-storefront"
            onClick={() => navigate('/')}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-700 transition-colors cursor-pointer"
          >
            <span>🏪 Exit to Storefront</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CANVAS COLUMN */}
      <div className="flex-1 flex flex-col bg-slate-50 min-h-screen" id="employee-main-canvas">
        
        {/* 1. Standardized horizontal top Header bar stretching from the sidebar edge across to the right screen boundary */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 shadow-sm" id="dashboard-header-bar">
          <div className="flex items-center gap-3 text-left">
            <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded">
              Active Terminal
            </span>
            <span className="text-[10px] font-mono text-slate-400">Secure Staff Connection</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Display the logged-in user's name on the right alongside a small circle avatar matching their name's first initial */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-lg border border-slate-200">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center uppercase">
                {(fullName || currentUser?.displayName || 'Operator').charAt(0).toUpperCase()}
              </div>
              <div className="text-left hidden sm:block">
                <span className="block text-[11px] font-black leading-none text-slate-800">{fullName || 'Operator'}</span>
                <span className="block text-[9px] text-slate-500 font-mono mt-0.5">{currentUser?.email}</span>
              </div>
            </div>

            {/* Clean, prominent text button aligned to the absolute top-right corner labeled "Sign Out 🚪" */}
            <button 
              id="sign-out-btn"
              onClick={handleSignOut} 
              className="flex items-center gap-1.5 text-xs font-extrabold text-white bg-slate-900 hover:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-800 transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
            >
              <span>Sign Out 🚪</span>
            </button>
          </div>
        </header>

        {/* Workspace Body Area below the Header */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto" id="dashboard-main-content">
          
          {/* Panel: Profile Details */}
          {activePanel === 'profile' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="panel-profile-view"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900">👤 User Profile Details</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Manage your personal staff contact data and enterprise attributes safely cataloged inside Firestore.
                </p>
              </div>

              {isLoadingProfile ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                  <span className="text-xs font-semibold text-slate-400">Loading custom values...</span>
                </div>
              ) : (
                <form onSubmit={handleProfileSubmit} className="space-y-5 max-w-xl" id="profile-details-form">
                  {profileSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>{profileSuccess}</span>
                    </div>
                  )}

                  {profileError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{profileError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Requirement 4: Full Name */}
                    <div className="space-y-1.5">
                      <label htmlFor="fullName-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Full Name / Operator Alias
                      </label>
                      <input
                        id="fullName-input"
                        type="text"
                        required
                        placeholder="e.g. Cristina Ene"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Requirement 4: Phone contact row */}
                    <div className="space-y-1.5">
                      <label htmlFor="phone-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Phone Contact Row
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                        <input
                          id="phone-input"
                          type="tel"
                          required
                          placeholder="e.g. +353 (87) 123-4567"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl py-3 pl-10 pr-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Requirement 4: Address parameters */}
                    <div className="space-y-1.5">
                      <label htmlFor="address-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Address Parameters
                      </label>
                      <input
                        id="address-input"
                        type="text"
                        required
                        placeholder="e.g. Unit 4, Ballymahon Enterprise Park, Longford"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      />
                    </div>

                    {/* Requirement 4: Uppercase Irish Structural Eircode text input string */}
                    <div className="space-y-1.5">
                      <label htmlFor="eircode-input" className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Irish Structural Eircode
                      </label>
                      <input
                        id="eircode-input"
                        type="text"
                        required
                        maxLength={8}
                        placeholder="e.g. N39 Y2V9"
                        value={eircode}
                        onChange={(e) => setEircode(e.target.value.toUpperCase())}
                        className="w-full bg-slate-50 hover:bg-slate-100/50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-bold tracking-widest focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all placeholder:font-sans placeholder:tracking-normal placeholder:font-medium"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Must be formatted exactly as 7 structural alphanumeric characters (auto-uppercased).</p>
                    </div>
                  </div>

                  <button
                    id="save-profile-btn"
                    type="submit"
                    disabled={isSavingProfile}
                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 text-white font-black text-xs px-6 py-3.5 rounded-xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-95"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving custom variables...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Save Profile Details</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          )}

          {/* Panel: Dispatch Schedule */}
          {activePanel === 'schedule' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="panel-schedule-view"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900">📅 Daily Dispatch Operational Board</h2>
                <p className="text-xs text-slate-500 mt-1">Manage physical hardware drop-offs, touch smart display setup, and status updates.</p>
              </div>

              <div className="space-y-4" id="dispatch-schedule-list">
                {schedule.map((job) => (
                  <div 
                    key={job.id} 
                    className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                  >
                    <div className="space-y-2 flex-1 text-left">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded font-mono">
                          {job.time}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-sm">{job.client}</h3>
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                          job.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          job.status === 'inprogress' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          job.status === 'blocked' ? 'bg-rose-100 text-rose-800 border border-rose-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {job.status}
                        </span>
                      </div>
                      
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{job.address}</span>
                      </p>
                      
                      <p className="text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200/60 mt-1">
                        {job.task}
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 shrink-0 md:text-right">
                      <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest text-left md:text-right">Action status:</span>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleJobStatusChange(job.id, 'inprogress')}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            job.status === 'inprogress' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleJobStatusChange(job.id, 'completed')}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            job.status === 'completed' ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Complete
                        </button>
                        <button
                          onClick={() => handleJobStatusChange(job.id, 'blocked')}
                          className={`text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                            job.status === 'blocked' ? 'bg-rose-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          Blocked
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Panel: ActivPanel Setup Installer */}
          {activePanel === 'installer' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="panel-installer-view"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900">🛠️ Promethean ActivPanel Setup IP Logger</h2>
                <p className="text-xs text-slate-500 mt-1">Configure Smart Displays and log Static IP bindings synchronously to Firestore.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                
                {/* Form */}
                <form onSubmit={handleSubmitPanelConfig} className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200" id="panel-installer-form">
                  <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    <span>Hardware Config Log</span>
                  </h3>

                  {configSuccess && (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4 shrink-0" />
                      <span>Panel Registration complete. Saved to cloud database.</span>
                    </div>
                  )}

                  {configError && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{configError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-left">
                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Client Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Greenview Academic High School"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Room Number</label>
                      <input
                        type="text"
                        required
                        placeholder="Room 102"
                        value={roomNumber}
                        onChange={(e) => setRoomNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Display Model</label>
                      <select
                        value={panelModel}
                        onChange={(e) => setPanelModel(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="Promethean ActivPanel 10">Promethean ActivPanel 10</option>
                        <option value="Promethean ActivPanel LE">Promethean ActivPanel LE</option>
                        <option value="Apex Core SmartDisplay">Apex Core SmartDisplay</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Display Serial Number</label>
                      <input
                        type="text"
                        required
                        placeholder="SN-PR10-882194"
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Static IP Allocation</label>
                      <input
                        type="text"
                        required
                        placeholder="192.168.1.100"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Subnet Mask</label>
                      <input
                        type="text"
                        required
                        placeholder="255.255.255.0"
                        value={subnetMask}
                        onChange={(e) => setSubnetMask(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Default Gateway</label>
                      <input
                        type="text"
                        required
                        placeholder="192.168.1.1"
                        value={gateway}
                        onChange={(e) => setGateway(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 font-mono transition-colors"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Diagnostic Status</label>
                      <select
                        value={panelStatus}
                        onChange={(e: any) => setPanelStatus(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="configuring">Configuring / Pre-Install</option>
                        <option value="testing">Testing Network Link</option>
                        <option value="active">Active & Handed Over</option>
                      </select>
                    </div>

                    <div className="space-y-1 col-span-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Operations Log Notes</label>
                      <textarea
                        placeholder="Installed clean, configured HDMI loopback, confirmed 10-point touch functionality."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={2}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingConfig}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-black text-xs py-3 px-4 rounded-xl shadow transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmittingConfig ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Saving Registration matrix...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Commit Config Log</span>
                      </>
                    )}
                  </button>
                </form>

                {/* List of installations */}
                <div className="space-y-4">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest block text-left">
                    Cloud Registrations ({savedConfigs.length})
                  </h3>

                  {savedConfigs.length === 0 ? (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center text-slate-400">
                      <HardDrive className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-medium">No smart panels registered in corporate database.</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {savedConfigs.map((cfg) => (
                        <div key={cfg.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2 text-left relative hover:border-slate-300 transition-colors">
                          <button
                            onClick={() => handleRemovePanelConfig(cfg.id)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Configuration"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div>
                            <span className="font-extrabold text-slate-800 block text-sm">{cfg.clientName}</span>
                            <span className="text-[10px] text-slate-500 font-semibold">{cfg.panelModel} ({cfg.roomNumber})</span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[10px]">
                            <div>
                              <span className="text-slate-400 block font-black text-[8px] uppercase">Serial</span>
                              <span className="text-slate-700 font-bold">{cfg.serialNumber}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block font-black text-[8px] uppercase">IP Address</span>
                              <span className="text-slate-700 font-bold">{cfg.ipAddress}</span>
                            </div>
                          </div>

                          {cfg.notes && (
                            <p className="text-[11px] text-slate-500 italic bg-white/50 p-2 rounded-lg border border-slate-100">
                              "{cfg.notes}"
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[9px] text-slate-400 font-mono">Logged: {new Date(cfg.loggedAt).toLocaleDateString()}</span>
                            <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              cfg.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                              cfg.status === 'testing' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {cfg.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Panel: Store Inventory */}
          {activePanel === 'inventory' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="panel-inventory-view"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900">📊 Store Inventory Safety Dashboard</h2>
                <p className="text-xs text-slate-500 mt-1">Review live products stock levels, pricing points and critical replenishment boundaries.</p>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl" id="inventory-table-container">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-black text-[10px] uppercase tracking-wider border-b border-slate-200">
                      <th className="p-4">Product Model</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 text-right">Price</th>
                      <th className="p-4 text-center">Safety Level</th>
                      <th className="p-4 text-center">Current Stock</th>
                      <th className="p-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">No active products loaded in general catalog.</td>
                      </tr>
                    ) : (
                      products.map((item) => {
                        const isLow = (item.stock ?? 0) <= (item.minThreshold ?? 3);
                        return (
                          <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors text-xs text-slate-700">
                            <td className="p-4 font-bold text-slate-900">{item.name}</td>
                            <td className="p-4 text-slate-500">{item.category}</td>
                            <td className="p-4 text-right font-mono font-bold text-slate-800">€{item.price}</td>
                            <td className="p-4 text-center font-bold text-slate-500">{item.minThreshold ?? 3} units</td>
                            <td className={`p-4 text-center font-mono font-black ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                              {item.stock ?? 0}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                                isLow ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isLow ? 'REPLENISH' : 'OK'}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Panel: Audit Logs */}
          {activePanel === 'audit' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              id="panel-audit-view"
            >
              <div>
                <h2 className="text-xl font-black text-slate-900">📋 Operations Audit & System Logs</h2>
                <p className="text-xs text-slate-500 mt-1">Real-time log registry tracking security updates and profile mutations securely.</p>
              </div>

              <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1" id="audit-logs-list">
                {auditLogs.map((log) => (
                  <div key={log.id} className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs flex flex-col gap-1.5 text-left font-mono">
                    <div className="flex justify-between items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {log.action}
                      </span>
                      <span className="text-[9px] text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-slate-700 font-medium">
                      {log.details}
                    </p>
                    <div className="text-[9px] text-slate-400">
                      Operator: <span className="font-bold text-slate-500">{log.operator}</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

        </main>
      </div>

    </div>
  );
}
