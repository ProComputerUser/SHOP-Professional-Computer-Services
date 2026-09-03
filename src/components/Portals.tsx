import React, { useState } from 'react';
import { BookOpen, Briefcase, GraduationCap, ShieldCheck, Check, Calendar, ArrowRight, UserCheck, Calculator, Sparkles, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Product } from '../types';
import { SERVICES_DATA, BUSINESS_DATA, SCHOOLS_DATA, HELP_ADVICE_DATA } from '../portalData';

interface PortalsProps {
  category: 'Help & Advice' | 'Business' | 'Schools' | 'Services';
  products: Product[];
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export default function Portals({ category, products, onQuickView, onAddToCart }: PortalsProps) {
  
  // === HELPER STATES ===
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(null);

  // === DYNAMIC WIZARD STATE (HELP & ADVICE) ===
  const [wizardStep, setWizardStep] = useState(1);
  const [wizardAnswers, setWizardAnswers] = useState({
    workload: 'gaming', // gaming | productivity | office
    portability: 'laptop', // laptop | desktop | monitor
    budget: 'high' // high | medium | low
  });
  const [wizardResult, setWizardResult] = useState<Product | null>(null);

  // === BUSINESS CALCULATOR STATE ===
  const [businessForm, setBusinessForm] = useState({
    companyName: '',
    deviceCount: 15,
    selectedBase: 'QuantumBook Air 14'
  });
  const [businessQuote, setBusinessQuote] = useState<{ originalTotal: number, discountedTotal: number, savings: number } | null>(null);
  const [quoteAccepted, setQuoteAccepted] = useState(false);

  // === EDUCATION DISCOUNTS STATE ===
  const [eduVerified, setEduVerified] = useState(false);
  const [eduCode, setEduCode] = useState('');
  const [eduForm, setEduForm] = useState({ name: '', schoolName: '', email: '' });
  const [preOrderSuccessName, setPreOrderSuccessName] = useState<string | null>(null);

  // === SERVICES BOOKING STATE ===
  const [bookingForm, setBookingForm] = useState({ serviceTitle: '', date: '', time: '', notes: '' });
  const [bookingConfirmed, setBookingConfirmed] = useState(false);

  // === 1. PROCESS DEVICE RECOMMENDATION WIZARD ===
  const handleWizardSubmit = () => {
    // Find the closest product that matches the workload / budget criteria
    let result = products[0];

    if (wizardAnswers.portability === 'monitor') {
      result = products.find(p => p.category === 'Monitors') || products[0];
    } else if (wizardAnswers.portability === 'desktop') {
      if (wizardAnswers.workload === 'office') {
        result = products.find(p => p.id === 'dt-1') || products[0];
      } else if (wizardAnswers.workload === 'gaming') {
        result = products.find(p => p.id === 'gam-2' || p.id === 'gam-1') || products[0];
      } else {
        result = products.find(p => p.id === 'wk-1') || products[0];
      }
    } else {
      // Laptop category
      if (wizardAnswers.workload === 'productivity') {
        result = products.find(p => p.id === 'lap-2') || products[0];
      } else if (wizardAnswers.workload === 'office') {
        result = products.find(p => p.id === 'lap-3') || products[0];
      } else {
        result = products.find(p => p.id === 'lap-1') || products[0];
      }
    }

    setWizardResult(result);
    setWizardStep(3);
  };

  // === 2. DYNAMIC BUSINESS QUOTE PROCESS ===
  const handleCalculateQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteAccepted(false);
    const unitPrice = businessForm.selectedBase === 'QuantumBook Air 14' ? 999 : 1599;
    const count = Number(businessForm.deviceCount);
    
    const originalTotal = unitPrice * count;
    // Apply progressive bulk volume discount: 15% off for 10-20, 25% off for 20+
    const discountRate = count >= 20 ? 0.25 : 0.15;
    const discountedTotal = originalTotal * (1 - discountRate);
    const savings = originalTotal - discountedTotal;

    setBusinessQuote({ originalTotal, discountedTotal, savings });
  };

  // === 3. SUBMIT ACADEMIC VERIFICATION ===
  const handleEduVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (eduForm.name && eduForm.schoolName && eduForm.email.includes('.edu')) {
      setEduVerified(true);
      setEduCode(`EDU-PASS-${Math.floor(Math.random() * 90000 + 10000)}`);
    } else {
      // Force pass for sandbox template demo ease-of-use
      setEduVerified(true);
      setEduCode(`EDUTECH15`);
    }
  };

  // === 4. BOOK SERVICES EVENT ===
  const handleBookService = (title: string) => {
    setBookingForm({ ...bookingForm, serviceTitle: title });
    setBookingConfirmed(false);
  };

  const handleConfirmBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (bookingForm.date && bookingForm.time) {
      setBookingConfirmed(true);
    }
  };

  return (
    <div className="w-full space-y-12 py-10" id="portal-workspace-views">
      
      {/* ==============================================
          A. HELP & ADVICE PORTAL
          ============================================== */}
      {category === 'Help & Advice' && (
        <div className="max-w-5xl mx-auto px-4 space-y-10" id="portal-help-advice">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full border border-blue-100 text-xs font-bold uppercase tracking-wider">
              <BookOpen className="w-4 h-4" />
              <span>Knowledge Hub</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900">{HELP_ADVICE_DATA.title}</h2>
            <p className="text-slate-500 max-w-2xl mx-auto text-sm">{HELP_ADVICE_DATA.tagline}</p>
          </div>

          {/* Interactive Component: Device Matchmaker Wizard */}
          <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden" id="matchmaker-wizard-module">
            {/* Background design accents */}
            <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute left-0 bottom-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-3xl mx-auto text-left space-y-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                <span className="text-xs font-black text-slate-300 uppercase tracking-widest block">AI-Guided Matchmaker Wizard</span>
              </div>

              {/* Wizard Title */}
              <div>
                <h3 className="text-xl font-extrabold text-white">Find Your Ultimate Device</h3>
                <p className="text-xs text-slate-400 mt-1">Answer 3 brief workspace preference questions to isolate the best matching model from our benchmarked catalog.</p>
              </div>

              {/* STEP 1: Question selectors */}
              {wizardStep === 1 && (
                <div className="space-y-6">
                  {/* Q1: Workload type */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wide block">1. What is your primary workload task?</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {[
                        { val: 'gaming', title: 'High-FPS Gaming', desc: 'Real-time raytracing, esports refresh rates.' },
                        { val: 'productivity', title: 'Professional Production', desc: 'Video compiling, CAD designs, scientific parsing.' },
                        { val: 'office', title: 'Daily Office/Study', desc: 'Spreadsheets, drafts, zoom meetings, heavy browsing.' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setWizardAnswers({ ...wizardAnswers, workload: opt.val })}
                          className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                            wizardAnswers.workload === opt.val
                              ? 'border-blue-500 bg-blue-500/10 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <span className="font-extrabold text-xs block mb-1">{opt.title}</span>
                          <span className="text-[10px] leading-relaxed block">{opt.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nav */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setWizardStep(2)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <span>Next Aspect</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 2: Preferences */}
              {wizardStep === 2 && (
                <div className="space-y-6">
                  {/* Q2: Portability */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wide block">2. Preferred Form Factor?</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { val: 'laptop', title: 'On-The-Go Laptop' },
                        { val: 'desktop', title: 'Stationary Desktop' },
                        { val: 'monitor', title: 'Display Monitor Only' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setWizardAnswers({ ...wizardAnswers, portability: opt.val })}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            wizardAnswers.portability === opt.val
                              ? 'border-blue-500 bg-blue-500/10 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <span className="font-extrabold text-xs block">{opt.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Budget scale */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-300 uppercase tracking-wide block">3. Budget Focus?</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { val: 'low', title: 'Value First (Under $800)' },
                        { val: 'medium', title: 'Performance Sweet Spot' },
                        { val: 'high', title: 'Extreme Tier (Ultimate)' }
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setWizardAnswers({ ...wizardAnswers, budget: opt.val })}
                          className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                            wizardAnswers.budget === opt.val
                              ? 'border-blue-500 bg-blue-500/10 text-white'
                              : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                          }`}
                        >
                          <span className="font-extrabold text-xs block">{opt.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Nav */}
                  <div className="flex justify-between pt-2">
                    <button
                      onClick={() => setWizardStep(1)}
                      className="border border-slate-700 hover:bg-slate-800 text-slate-300 font-extrabold text-xs py-2.5 px-6 rounded-xl cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleWizardSubmit}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg"
                    >
                      <span>Generate Ideal Model</span>
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: Result Card */}
              {wizardStep === 3 && wizardResult && (
                <div className="bg-slate-800/80 border border-slate-700/60 p-5 rounded-2xl flex flex-col sm:flex-row items-center gap-6 animate-in zoom-in-95 duration-200">
                  <img
                    src={wizardResult?.images?.[0] || (wizardResult as any)?.image || 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&q=80&w=800'}
                    alt={wizardResult?.name || 'Wizard Result'}
                    className="w-32 h-32 object-contain bg-white p-2 rounded-xl shrink-0"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded uppercase">Your Ideal Fit</span>
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">{wizardResult.brand} • {wizardResult.category}</span>
                    </div>
                    <h4 className="text-lg font-black text-white">{wizardResult.name}</h4>
                    <p className="text-xs text-slate-300 leading-normal line-clamp-2">{wizardResult.description}</p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <span className="text-lg font-black text-blue-400">${wizardResult.price}</span>
                      <button
                        onClick={() => onQuickView(wizardResult)}
                        className="bg-white hover:bg-slate-100 text-slate-950 text-[11px] font-black px-4 py-1.5 rounded-lg cursor-pointer"
                      >
                        Inspect Specifications
                      </button>
                      <button
                        onClick={() => onAddToCart(wizardResult)}
                        className="bg-blue-600 hover:bg-blue-700 text-slate-950 text-[11px] font-black px-4 py-1.5 rounded-lg cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-slate-400 hover:text-white text-xs font-bold border-l border-slate-700 pl-4 py-2 hover:underline cursor-pointer shrink-0"
                  >
                    Reset Quiz
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Articles & Guides Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-extrabold text-slate-800 text-left">Researched Buying Guides</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {HELP_ADVICE_DATA.articles.map((art) => (
                <div key={art.id} className="bg-white p-5 rounded-2xl border border-gray-100 text-left flex flex-col justify-between hover:shadow-md transition-shadow">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                      <span>{art.category}</span>
                      <span>{art.readTime}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-800 text-sm leading-snug">{art.title}</h4>
                    <p className="text-slate-500 text-xs leading-normal">{art.summary}</p>
                  </div>
                  <button className="text-blue-500 hover:text-blue-600 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer pt-4 mt-auto">
                    <span>Read Article</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Interactive FAQs Accordion */}
          <div className="space-y-4 border-t border-gray-100 pt-10">
            <h3 className="text-lg font-extrabold text-slate-800 text-left">Frequently Asked Questions</h3>
            <div className="space-y-2">
              {HELP_ADVICE_DATA.faqs.map((faq, idx) => (
                <div key={idx} className="border border-gray-100 rounded-xl overflow-hidden bg-white text-left shadow-sm">
                  <button
                    onClick={() => setFaqOpenIndex(faqOpenIndex === idx ? null : idx)}
                    className="w-full p-4 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-colors font-bold text-xs sm:text-sm text-slate-700 focus:outline-none cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 text-blue-500" />
                      <span>{faq.q}</span>
                    </span>
                    {faqOpenIndex === idx ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {faqOpenIndex === idx && (
                    <div className="p-4 border-t border-gray-100 text-xs text-slate-500 leading-relaxed bg-white animate-in fade-in duration-100">
                      {faq.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ==============================================
          B. BUSINESS PORTAL
          ============================================== */}
      {category === 'Business' && (
        <div className="max-w-5xl mx-auto px-4 space-y-12 animate-in fade-in duration-300" id="portal-business">
          
          {/* Header hero */}
          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden relative flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-8 md:p-12 text-left space-y-4 relative z-10">
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest inline-block">Enterprise Solutions</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">{BUSINESS_DATA.title}</h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{BUSINESS_DATA.tagline}</p>
            </div>
            <div className="w-full md:w-1/2 h-56 md:h-80 relative">
              <img src={BUSINESS_DATA.heroImage} alt="business workspace" className="absolute inset-0 w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent hidden md:block" />
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-left">
            {BUSINESS_DATA.benefits.map((ben, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className="text-blue-500 bg-blue-50 p-2.5 rounded-xl inline-block mb-3">
                  <Briefcase className="w-5 h-5" />
                </div>
                <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{ben.title}</h4>
                <p className="text-slate-500 text-xs leading-normal mt-1">{ben.desc}</p>
              </div>
            ))}
          </div>

          {/* Interactive Calculator widget */}
          <div className="bg-slate-50 border border-gray-200/60 p-6 md:p-8 rounded-3xl text-left grid grid-cols-1 md:grid-cols-2 gap-8 items-center" id="business-contract-calculator">
            
            <div className="space-y-4">
              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                <Calculator className="w-4 h-4 text-blue-500" />
                <span>Volume Quote Generator</span>
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">Dynamic Contract Pricing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your company specifications to retrieve an immediately authenticated tax-exempt volume package estimate, complete with SLA replacement terms.
              </p>

              {/* Form */}
              <form onSubmit={handleCalculateQuote} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Company Legal Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Quantum Analytics Ltd"
                    value={businessForm.companyName}
                    onChange={(e) => setBusinessForm({ ...businessForm, companyName: e.target.value })}
                    required
                    className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Select Base Model</label>
                    <select
                      value={businessForm.selectedBase}
                      onChange={(e) => setBusinessForm({ ...businessForm, selectedBase: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="QuantumBook Air 14">QuantumBook Air 14 ($999)</option>
                      <option value="Aegis Vanguard RTX 4070">Aegis Vanguard RTX 4070 ($1599)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Target Quantity</label>
                    <input
                      type="number"
                      min={10}
                      max={200}
                      value={businessForm.deviceCount}
                      onChange={(e) => setBusinessForm({ ...businessForm, deviceCount: Math.max(10, Number(e.target.value)) })}
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                >
                  Generate Bulk Quote Invoice
                </button>
              </form>
            </div>

            {/* Quote result */}
            <div className="h-full flex items-center justify-center">
              {businessQuote ? (
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm w-full space-y-4 animate-in zoom-in-95 duration-150">
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Quote Result</span>
                    <span className="bg-emerald-50 text-emerald-600 text-[9px] font-black px-1.5 py-0.5 rounded">TAX-EXEMPT APPROVED</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Recipient Org:</span>
                      <span className="font-extrabold text-slate-800">{businessForm.companyName || 'Corporate Client'}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Total Units:</span>
                      <span className="font-bold text-slate-800">{businessForm.deviceCount}x</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Standard Base Price:</span>
                      <span className="font-semibold text-slate-500">${businessQuote.originalTotal}</span>
                    </div>
                    <div className="flex justify-between text-xs text-emerald-600 font-bold">
                      <span>Volume Savings ({businessForm.deviceCount >= 20 ? '25%' : '15%'}):</span>
                      <span>-${businessQuote.savings}</span>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-gray-100 pt-3">
                      <span className="font-extrabold text-slate-800 text-sm">Contract Total:</span>
                      <span className="text-xl font-black text-slate-950">${businessQuote.discountedTotal}</span>
                    </div>
                  </div>

                  {quoteAccepted ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-center space-y-1.5">
                      <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto animate-bounce" />
                      <span className="text-xs font-black text-slate-800 block">SLA Quote Accepted & Saved!</span>
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Our dedicated account manager will reach out to verify tax-exemption files shortly.
                      </p>
                      <button
                        onClick={() => {
                          setBusinessQuote(null);
                          setQuoteAccepted(false);
                        }}
                        className="text-[10px] text-blue-600 font-black underline cursor-pointer"
                      >
                        Calculate Another Estimate
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setQuoteAccepted(true)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer transition-colors text-center block shadow-md"
                    >
                      Accept Quote & Lock SLA Price
                    </button>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-gray-300 rounded-2xl p-8 text-center text-slate-400 bg-white flex flex-col items-center justify-center min-h-[220px] w-full">
                  <Briefcase className="w-10 h-10 mb-2 opacity-50" />
                  <span className="text-xs font-bold uppercase tracking-wider block">Quote Output Stream</span>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mt-1 mx-auto">Fill out the volume query inputs to compute legal discounts.</p>
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ==============================================
          C. SCHOOLS PORTAL
          ============================================== */}
      {category === 'Schools' && (
        <div className="max-w-5xl mx-auto px-4 space-y-12 animate-in fade-in duration-300" id="portal-schools">
          {/* Header hero */}
          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden relative flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-8 md:p-12 text-left space-y-4 relative z-10">
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest inline-block">Academic Discounts</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">{SCHOOLS_DATA.title}</h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{SCHOOLS_DATA.tagline}</p>
            </div>
            <div className="w-full md:w-1/2 h-56 md:h-80 relative">
              <img src={SCHOOLS_DATA.heroImage} alt="classroom students" className="absolute inset-0 w-full h-full object-cover opacity-65" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent hidden md:block" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            
            {/* Eligibility Programs column */}
            <div className="space-y-4 text-left">
              <h3 className="text-lg font-extrabold text-slate-800">Available Reward Frameworks</h3>
              <div className="space-y-4">
                {SCHOOLS_DATA.programs.map((prog, i) => (
                  <div key={i} className="bg-white p-4.5 border border-gray-100 rounded-2xl flex items-start gap-3">
                    <div className="bg-blue-50 text-blue-500 p-2.5 rounded-xl shrink-0">
                      <GraduationCap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm">{prog.title}</h4>
                        <span className="bg-blue-600 text-white text-[9px] font-black px-1.5 rounded">{prog.discount}</span>
                      </div>
                      <p className="text-slate-500 text-xs leading-normal mt-1">{prog.eligibility}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive student card uploader card */}
            <div className="bg-slate-50 border border-gray-200 p-6 rounded-3xl text-left space-y-4" id="schools-verify-coupon-module">
              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                <UserCheck className="w-4 h-4 text-blue-500" />
                <span>Academic Verification</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">Claim Academic Coupon</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Submit your registrar credentials below. Once verified, we will generate a customized student-rate promo code for use on checkouts.
              </p>

              {eduVerified ? (
                <div className="bg-white p-5 border border-emerald-100 rounded-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
                  <div className="text-emerald-500 bg-emerald-50 p-3 rounded-full inline-block">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Academic Credentials Certified!</h4>
                    <p className="text-xs text-slate-500 mt-1">Here is your student voucher. Apply this at checkout to deduct 15% off standard laptop hardware:</p>
                  </div>
                  <div className="bg-slate-50 p-3 border border-gray-100 rounded-xl">
                    <span className="font-black text-slate-800 text-lg tracking-widest font-mono select-all block">{eduCode}</span>
                  </div>
                  <button
                    onClick={() => setEduVerified(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs hover:underline cursor-pointer"
                  >
                    Verify another account
                  </button>
                </div>
              ) : (
                <form onSubmit={handleEduVerify} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Your Full Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Logan Vance"
                      value={eduForm.name}
                      onChange={(e) => setEduForm({ ...eduForm, name: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">School / University</label>
                    <input
                      type="text"
                      placeholder="e.g. University of Washington"
                      value={eduForm.schoolName}
                      onChange={(e) => setEduForm({ ...eduForm, schoolName: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Academic Email (.edu preferred)</label>
                    <input
                      type="email"
                      placeholder="e.g. logan@uw.edu"
                      value={eduForm.email}
                      onChange={(e) => setEduForm({ ...eduForm, email: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Authenticate Student ID
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Education products list */}
          <div className="space-y-4 border-t border-gray-100 pt-10">
            <h3 className="text-lg font-extrabold text-slate-800 text-left">Custom Student-Ready Hardware</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SCHOOLS_DATA.educationLaptops.map((lap, i) => (
                <div key={i} className="bg-white p-5 border border-gray-100 rounded-2xl text-left flex flex-col justify-between hover:shadow-sm">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest block">SCHOOL SPECIAL</span>
                    <h4 className="font-extrabold text-slate-800 text-sm">{lap.name}</h4>
                    <p className="text-slate-500 text-xs leading-normal mt-1">{lap.desc}</p>
                  </div>
                  <div className="flex justify-between items-center mt-6 pt-4 border-t border-slate-50">
                    <span className="font-black text-slate-900 text-base">${lap.price}</span>
                    {preOrderSuccessName === lap.name ? (
                      <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-lg">Pre-ordered (Code: EDUTECH15)</span>
                    ) : (
                      <button
                        onClick={() => setPreOrderSuccessName(lap.name)}
                        className="bg-slate-900 hover:bg-blue-600 text-white font-bold text-xs py-1.5 px-4 rounded-lg cursor-pointer transition-all"
                      >
                        Pre-Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ==============================================
          D. SERVICES PORTAL
          ============================================== */}
      {category === 'Services' && (
        <div className="max-w-5xl mx-auto px-4 space-y-12 animate-in fade-in duration-300" id="portal-services">
          {/* Header hero */}
          <div className="bg-slate-900 text-white rounded-3xl overflow-hidden relative flex flex-col md:flex-row items-center">
            <div className="w-full md:w-1/2 p-8 md:p-12 text-left space-y-4 relative z-10">
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full uppercase tracking-widest inline-block">IT Technical Services</span>
              <h2 className="text-2xl sm:text-4xl font-extrabold leading-tight">{SERVICES_DATA.title}</h2>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">{SERVICES_DATA.tagline}</p>
            </div>
            <div className="w-full md:w-1/2 h-56 md:h-80 relative">
              <img src={SERVICES_DATA.heroImage} alt="it engineer server" className="absolute inset-0 w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-transparent to-transparent hidden md:block" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
            
            {/* Services offerings list column - spans 2 cols */}
            <div className="space-y-4 text-left md:col-span-2">
              <h3 className="text-lg font-extrabold text-slate-800">Support Offerings</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SERVICES_DATA.offerings.map((srv) => (
                  <div key={srv.id} className="bg-white p-5 border border-gray-100 rounded-2xl flex flex-col justify-between hover:shadow-md transition-shadow relative">
                    {srv.popular && (
                      <span className="absolute -top-2 right-4 bg-blue-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                        POPULAR PROTECTION
                      </span>
                    )}
                    <div className="space-y-2">
                      <div className="text-blue-500 bg-blue-50 p-2 rounded-lg inline-block">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-xs sm:text-sm leading-snug">{srv.title}</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed">{srv.description}</p>
                    </div>
                    <div className="flex justify-between items-baseline border-t border-slate-50 pt-4 mt-6">
                      <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Standard Fee</span>
                      <span className="font-black text-slate-900 text-sm">{srv.price}</span>
                    </div>
                    <button
                      onClick={() => handleBookService(srv.title)}
                      className="w-full bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold py-2 rounded-lg cursor-pointer transition-colors mt-3"
                    >
                      Book Service
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Scheduler widget */}
            <div className="bg-slate-50 border border-gray-200 p-6 rounded-3xl text-left space-y-4" id="services-appointment-booking-module">
              <div className="flex items-center gap-1.5 text-blue-600 font-extrabold text-xs uppercase tracking-wider">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>Appointment Scheduler</span>
              </div>
              <h3 className="text-lg font-extrabold text-slate-800">Reserve Service Slot</h3>
              <p className="text-xs text-slate-400 leading-normal">
                Choose a specialized field audit, custom assembly or retrieval service and lock a diagnostic window with our IT dispatch crew.
              </p>

              {bookingConfirmed ? (
                <div className="bg-white p-5 border border-emerald-100 rounded-2xl space-y-4 text-center animate-in zoom-in-95 duration-150">
                  <div className="text-emerald-500 bg-emerald-50 p-3 rounded-full inline-block">
                    <Check className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">Diagnostic Window Confirmed!</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Our dispatcher will contact you at your primary number regarding details.</p>
                  </div>
                  
                  {/* Summary ticket */}
                  <div className="bg-slate-50 p-3 border border-gray-100 rounded-xl text-left space-y-1 text-xs">
                    <div>
                      <span className="font-bold text-slate-400">Task:</span>
                      <span className="font-extrabold text-slate-700 block text-[11px] truncate">{bookingForm.serviceTitle || 'General Consult'}</span>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="font-bold text-slate-400">Date/Time:</span>
                      <span className="font-mono text-slate-700 text-[11px] font-semibold">{bookingForm.date} @ {bookingForm.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setBookingConfirmed(false)}
                    className="text-slate-400 hover:text-slate-600 text-xs hover:underline cursor-pointer"
                  >
                    Schedule another slot
                  </button>
                </div>
              ) : (
                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  
                  {/* Service selection name */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Service Target</label>
                    <select
                      value={bookingForm.serviceTitle}
                      onChange={(e) => setBookingForm({ ...bookingForm, serviceTitle: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Choose Support Target --</option>
                      <option value="Premium Shield Warranty Plan">Premium Shield Plan</option>
                      <option value="Acoustic Custom PC Building & Wiring">Custom PC Assembly</option>
                      <option value="Full Home Wi-Fi Audit & Mesh Deployment">On-Site WiFi Mesh Survey</option>
                      <option value="Express Data Recovery & Security Sanctum">Data Recovery</option>
                    </select>
                  </div>

                  {/* Date picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Select Workdate</label>
                    <input
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none"
                    />
                  </div>

                  {/* Time picker */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">Select Time Window</label>
                    <select
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      required
                      className="w-full bg-white border border-gray-200 rounded-lg p-2.5 text-xs focus:outline-none cursor-pointer"
                    >
                      <option value="">-- Select Hours Slot --</option>
                      <option value="09:00 AM">09:00 AM - 11:00 AM</option>
                      <option value="11:30 AM">11:30 AM - 01:30 PM</option>
                      <option value="02:00 PM">02:00 PM - 04:00 PM</option>
                      <option value="04:30 PM">04:30 PM - 06:30 PM</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-blue-600 text-white font-extrabold text-xs py-2.5 rounded-lg cursor-pointer transition-colors"
                  >
                    Schedule Diagnostic Reservation
                  </button>
                </form>
              )}
            </div>

          </div>

          {/* Customer Reviews for services */}
          <div className="space-y-4 border-t border-gray-100 pt-10">
            <h3 className="text-lg font-extrabold text-slate-800 text-left font-sans">Client Feedback</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SERVICES_DATA.reviews.map((rev, i) => (
                <div key={i} className="bg-slate-50/50 p-5 rounded-2xl border border-gray-100 text-left space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">{rev.name}</span>
                    <span className="text-amber-400">★★★★★</span>
                  </div>
                  <p className="text-slate-500 italic text-xs leading-normal">"{rev.text}"</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
