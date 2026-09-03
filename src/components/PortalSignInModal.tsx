import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Shield, User, Key, ArrowRight, RefreshCw, LogOut, CheckCircle, Clock, FileText, Server, AlertCircle } from 'lucide-react';
import { auth, db } from '../firebaseConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

interface PortalSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PortalSignInModal({ isOpen, onClose }: PortalSignInModalProps) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'customer' | 'employee'>('customer');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [currentUser, setCurrentUser] = useState<{
    uid: string;
    email: string;
    fullName: string;
    role: 'customer' | 'employee';
    createdAt: string;
    employeeId?: string;
  } | null>(null);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (activeTab === 'employee') {
      if (!email || !password) {
        setLoginError('Please fill in all employee security credentials.');
        return;
      }
    } else {
      if (authMode === 'signup') {
        if (!fullName || !email || !password || !confirmPassword) {
          setLoginError('Please fill in all registration fields.');
          return;
        }
        if (password !== confirmPassword) {
          setLoginError('Passwords do not match.');
          return;
        }
      } else {
        if (!email || !password) {
          setLoginError('Please fill in all security credentials.');
          return;
        }
      }
    }

    setLoginError('');
    setIsLoading(true);

    try {
      // Force Firebase to persist the session in the local browser storage
      await setPersistence(auth, browserLocalPersistence);

      if (activeTab === 'customer') {
        if (authMode === 'signup') {
          // Create user in Firebase Authentication
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Save Customer Profile in Firestore using the Auth UID
          const userProfile = {
            uid: user.uid,
            fullName: fullName,
            email: email,
            role: 'customer' as const,
            createdAt: new Date().toISOString()
          };

          await setDoc(doc(db, "users", user.uid), userProfile);
          setCurrentUser(userProfile);
          setIsLoggedIn(true);
          onClose();
          navigate('/customer/dashboard');
        } else {
          // Customer login
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role !== 'customer') {
              await signOut(auth);
              setLoginError('This account is registered as staff. Please use the Employee Gate.');
              setIsLoading(false);
              return;
            }
            setCurrentUser({
              uid: userData.uid,
              email: userData.email,
              fullName: userData.fullName,
              role: userData.role as 'customer' | 'employee',
              createdAt: userData.createdAt
            });
          } else {
            // Fallback if firestore document doesn't exist yet but user is authenticated
            const userProfile = {
              uid: user.uid,
              fullName: email.split('@')[0],
              email: email,
              role: 'customer' as const,
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", user.uid), userProfile);
            setCurrentUser(userProfile);
          }
          setIsLoggedIn(true);
          onClose();
          navigate('/customer/dashboard');
        }
      } else {
        // Employee login
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Fetch user profile from Firestore
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role !== 'employee') {
              await signOut(auth);
              setLoginError('Access denied. This account is not authorized as staff.');
              setIsLoading(false);
              return;
            }
            setCurrentUser({
              uid: userData.uid,
              email: userData.email,
              fullName: userData.fullName,
              role: userData.role as 'customer' | 'employee',
              createdAt: userData.createdAt,
              employeeId: userData.employeeId || employeeId
            });
          } else {
            // If authenticated but no firestore document, create one
            const userProfile = {
              uid: user.uid,
              fullName: 'Field Agent ' + (employeeId || 'PCS-401'),
              email: email,
              role: 'employee' as const,
              employeeId: employeeId || 'PCS-401',
              createdAt: new Date().toISOString()
            };
            await setDoc(doc(db, "users", user.uid), userProfile);
            setCurrentUser(userProfile);
          }
          setIsLoggedIn(true);
          onClose();
          navigate('/employee/dashboard');
        } catch (err: any) {
          // If default employee credentials are used and it's the first time
          if (email === 'staff@yourcompany.com' && password === 'password123') {
            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;
              const userProfile = {
                uid: user.uid,
                fullName: 'Field Agent PCS-401',
                email: email,
                role: 'employee' as const,
                employeeId: 'PCS-401',
                createdAt: new Date().toISOString()
              };
              await setDoc(doc(db, "users", user.uid), userProfile);
              setCurrentUser(userProfile);
              setIsLoggedIn(true);
              onClose();
              navigate('/employee/dashboard');
            } catch (createErr: any) {
              setLoginError(createErr.message || 'Error creating default staff account.');
            }
          } else {
            throw err;
          }
        }
      }
    } catch (error: any) {
      console.error("Auth Error:", error);
      let friendlyMessage = error.message || 'Authentication failed. Please try again.';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or passcode. Please check your credentials.';
      } else if (error.code === 'auth/user-not-found') {
        friendlyMessage = 'No account associated with this email.';
      } else if (error.code === 'auth/email-already-in-use') {
        friendlyMessage = 'This email address is already in use.';
      } else if (error.code === 'auth/weak-password') {
        friendlyMessage = 'The password must be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        friendlyMessage = 'Please enter a valid email address.';
      }
      setLoginError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Sign out error", error);
    }
    setIsLoggedIn(false);
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFullName('');
    setEmployeeId('');
    setAuthMode('login');
    setIsLoading(false);
  };


  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fade-in" id="portal-modal-overlay">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full overflow-hidden text-left relative flex flex-col max-h-[90vh]">
        
        {/* Header Ribbon */}
        <div className="bg-[#0c1a30] text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-blue-500/20 p-2 rounded-xl border border-blue-500/30">
              <Shield className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold tracking-wider uppercase text-blue-400">PCS Corporate Gate</h3>
              <p className="text-xs text-slate-300">
                {activeTab === 'customer' 
                  ? (authMode === 'login' ? 'Customer Space Login' : 'Customer Account Registration') 
                  : 'Authorized Staff Workspace'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Close Gate"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {!isLoggedIn ? (
            <>
              {/* Tabs selector */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('customer');
                    setAuthMode('login');
                    setLoginError('');
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'customer'
                      ? 'bg-white text-[#0c1a30] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  <User className="w-4 h-4 text-blue-500" />
                  <span>Customer Portal</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('employee');
                    setAuthMode('login');
                    setLoginError('');
                  }}
                  className={`py-2.5 px-4 rounded-xl text-xs font-black tracking-wide uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === 'employee'
                      ? 'bg-white text-[#0c1a30] shadow-sm'
                      : 'text-slate-500 hover:text-slate-800 hover:bg-white/40'
                  }`}
                >
                  <Server className="w-4 h-4 text-slate-700" />
                  <span>Employee Gate</span>
                </button>
              </div>



              {/* Error feedback */}
              {loginError && (
                <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* Credentials Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                
                {/* Full Name Input for Customer Signup only */}
                {activeTab === 'customer' && authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 pl-10 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">
                    {activeTab === 'customer' ? 'Corporate Email / Client ID' : 'Staff Email Address'}
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder={activeTab === 'customer' ? 'partner@enterprise.com' : 'staff@yourcompany.com'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 pl-10 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Secure Passcode / Password</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 pl-10 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                {/* Confirm Password Input for Customer Signup only */}
                {activeTab === 'customer' && authMode === 'signup' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-extrabold text-slate-600 uppercase tracking-wider block">Confirm Passcode</label>
                    <div className="relative">
                      <Key className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 pl-10 text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Remember me & Forgot passcode (only shown in login modes) */}
                {authMode === 'login' && (
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Remember this session</span>
                    </label>
                    <a href="#forgot" className="text-xs text-blue-500 hover:underline font-bold" onClick={(e) => e.preventDefault()}>
                      Forgot passcode?
                    </a>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full text-white font-extrabold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md text-xs uppercase tracking-wider mt-2 ${
                    activeTab === 'customer' 
                      ? 'bg-[#0c1a30] hover:bg-blue-600' 
                      : 'bg-slate-800 hover:bg-slate-900'
                  }`}
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Security Matrix...</span>
                    </>
                  ) : (
                    <>
                      <span>{authMode === 'login' ? 'Unlock Portal Access' : 'Create Secure Account'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Navigation toggle */}
              {activeTab === 'customer' ? (
                <div className="text-center text-xs text-slate-500 mt-4">
                  <span>
                    {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setAuthMode(authMode === 'login' ? 'signup' : 'login');
                      setLoginError('');
                    }}
                    className="text-blue-500 hover:underline font-extrabold cursor-pointer ml-1"
                  >
                    {authMode === 'login' ? 'Create Account' : 'Sign In'}
                  </button>
                </div>
              ) : (
                <div className="text-center text-xs text-slate-400 mt-4">
                  🔒 System access is logged. For account issues, contact internal IT support.
                </div>
              )}
            </>
          ) : (
            /* Logged-In Portal Experience */
            <div className="space-y-6 animate-fade-in">
              {/* User Bio Badge */}
              <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl">
                <div className="bg-blue-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-black text-lg shadow-sm">
                  {currentUser?.fullName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 text-left">
                  <span className="text-[10px] font-extrabold text-blue-500 uppercase tracking-wider block">Active Session</span>
                  <h4 className="text-sm font-extrabold text-slate-800">{currentUser?.fullName}</h4>
                  <p className="text-[11px] text-slate-500 font-medium">{currentUser?.email}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Role: {currentUser?.role === 'customer' ? 'Primary Commercial Account Manager' : 'Field Operations Tier II Engineer'}
                    {currentUser?.employeeId && ` (Badge: ${currentUser.employeeId})`}
                  </p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors cursor-pointer animate-pulse-subtle"
                  title="Secure Lock & Exit"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>

              {activeTab === 'customer' ? (
                /* Customer Portal View */
                <div className="space-y-4">
                  {/* Redirect Banner Callout */}
                  <div className="bg-gradient-to-r from-slate-900 to-[#0c1a30] p-4.5 rounded-2xl border border-emerald-500/30 text-left space-y-3 shadow-md">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block font-mono">Secure Client Portal</span>
                      <h4 className="text-white text-xs font-extrabold">Full Customer Spec Workspace is active</h4>
                      <p className="text-[11px] text-slate-300">Track all assigned workstation assets, file support tickets, and request hardware specification upgrades.</p>
                    </div>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate('/customer/dashboard');
                      }}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10"
                    >
                      <span>Enter Customer Workspace</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Active Procurement contracts</h4>
                    <div className="space-y-2">
                      <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">Acme Corp Fleet Hardware (Contract #AC-294)</span>
                          <span className="text-[11px] text-slate-400">QuantumBook Air 14 units @ $1,099 static contract rate</span>
                        </div>
                        <span className="bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2 py-1 rounded-full">ACTIVE</span>
                      </div>
                      <div className="bg-white border border-slate-100 rounded-xl p-3 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 block">High-Speed Fiber Switch Deployment (Order #INV-8829)</span>
                          <span className="text-[11px] text-slate-400">6x Apex Core 24P Switches, installation booked on July 20th</span>
                        </div>
                        <span className="bg-cyan-50 text-cyan-600 text-[10px] font-extrabold px-2 py-1 rounded-full">SHIPPED</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">Priority Support Tickets</h4>
                    <div className="space-y-2">
                      <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 text-xs space-y-2 text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-blue-500" />
                            <span>#PCS-9021: Server Rack cooling question</span>
                          </span>
                          <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded">In Queue</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Tier II engineer assigned. Scheduled diagnostic call on July 16, 10:00 AM.</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-100 flex items-center justify-between">
                    <div className="text-left space-y-0.5">
                      <span className="font-bold text-blue-900 text-xs block">Need immediate assistance?</span>
                      <span className="text-[11px] text-blue-600">Secure client direct line: 1-800-PCS-HIGH</span>
                    </div>
                    <button className="bg-blue-600 text-white font-extrabold text-[10px] tracking-wide uppercase px-3.5 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                      Chat Now
                    </button>
                  </div>
                </div>
              ) : (
                /* Employee Portal View */
                <div className="space-y-4">
                  {/* Redirect Banner Callout */}
                  <div className="bg-gradient-to-r from-slate-900 to-[#0c1a30] p-4.5 rounded-2xl border border-blue-500/30 text-left space-y-3 shadow-md">
                    <div className="space-y-1">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest block font-mono">Operations Management Console</span>
                      <h4 className="text-white text-xs font-extrabold">Full-screen Diagnostic Hub is active</h4>
                      <p className="text-[11px] text-slate-300">Access full dispatch registers, Smart Panel IP logs, and customer directory profiles.</p>
                    </div>
                    <button 
                      onClick={() => {
                        onClose();
                        navigate('/employee/dashboard');
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] uppercase tracking-wider py-2.5 px-4 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/10"
                    >
                      <span>Enter Diagnostics Hub</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">My Dispatch Schedule (Today)</h4>
                    <div className="space-y-2">
                      <div className="bg-white border border-slate-100 rounded-xl p-3.5 text-xs space-y-2 hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">1. Greenview Academic High School</span>
                          <span className="bg-amber-50 text-amber-600 text-[10px] font-extrabold px-2 py-0.5 rounded">09:00 AM</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Unpack and secure wall-mount installation for 2x Promethean ActivPanel 10 smart screens in Room 102 and 104.</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>Status:</span>
                          <span className="font-bold text-emerald-500 flex items-center gap-0.5">
                            <CheckCircle className="w-3 h-3" /> Completed
                          </span>
                        </div>
                      </div>

                      <div className="bg-white border border-slate-100 rounded-xl p-3.5 text-xs space-y-2 hover:bg-slate-50 transition-colors text-left">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">2. Vertex Corp Headquarters</span>
                          <span className="bg-blue-50 text-blue-600 text-[10px] font-extrabold px-2 py-0.5 rounded">02:30 PM</span>
                        </div>
                        <p className="text-[11px] text-slate-500">Upgrade core server cabinet switches. Verify 10Gbps optical fiber uplink to structural patch panel.</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <span>Status:</span>
                          <span className="font-bold text-blue-500 flex items-center gap-0.5">
                            <Clock className="w-3 h-3" /> Next Dispatch
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block mb-2">My Tools & Inventory</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-slate-600">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Vehicle Stock</span>
                        <span className="font-extrabold text-slate-800">Van #7 - Clean</span>
                      </div>
                      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-slate-600">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wide">Assigned Panels</span>
                        <span className="font-extrabold text-slate-800">3x Promethean ActivPanel 10</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0c1a30] text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="text-left space-y-0.5">
                      <span className="font-bold text-blue-300 text-xs block">Need urgent support?</span>
                      <span className="text-[11px] text-slate-400">PCS Tech Hotline: Ext. 401</span>
                    </div>
                    <button className="bg-blue-600 text-white font-extrabold text-[10px] tracking-wide uppercase px-3.5 py-2 rounded-xl hover:bg-blue-700 transition-colors">
                      Call Dispatch
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-100 text-center flex items-center justify-between text-[11px] text-slate-400 font-medium">
          <div className="flex items-center gap-1 text-slate-500">
            <Shield className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit SSL Encrypted Gate</span>
          </div>
          <span>ID: PCS-SEC-{activeTab.toUpperCase()}</span>
        </div>

      </div>
    </div>
  );
}
