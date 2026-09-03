import React, { useState, useRef } from 'react';
import {
  PhoneCall,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Phone,
  Mail,
  Building2,
  User,
  Send,
  Copy,
  Check,
  Smartphone,
  TrendingDown,
  GitBranch,
  MessageSquare,
  Server,
  Layers,
  ArrowRight,
  Headphones,
  Check as CheckIcon,
  X as XIcon,
  PhoneForwarded,
  Clock,
  Radio
} from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendQuoteRequestEmail } from '../utils/quoteEmailService';

interface ComparisonRow {
  feature: string;
  threeCX: string;
  traditional: string;
  highlight?: boolean;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "Pricing & Licensing Model",
    threeCX: "Zero per-user monthly fees. Low annual license based on simultaneous calls. Unlimited extensions for all staff.",
    traditional: "Expensive €15–€35+ per user every month. Bills increase every time you hire or add a phone.",
    highlight: true
  },
  {
    feature: "Mobility & Remote Work",
    threeCX: "Free iOS & Android apps, Windows/Mac desktop softphones & browser web client. Work from anywhere seamlessly.",
    traditional: "Strictly tied to physical copper wall sockets and proprietary desk phones in one fixed room."
  },
  {
    feature: "Line Rental & Copper Lines",
    threeCX: "No physical copper line rental. Uses your high-speed internet with robust Irish SIP trunks.",
    traditional: "Mandatory recurring monthly line rental per physical line + steep ISDN maintenance charges.",
    highlight: true
  },
  {
    feature: "Voicemail & Call Routing",
    threeCX: "Voicemail-to-Email (audio attachment + text), multi-level IVR auto-attendants, intelligent call queues & ring groups.",
    traditional: "Basic answering machine tape or dial-in voicemail. Complex routing requires costly hardware add-ons."
  },
  {
    feature: "Omnichannel & Customer Chat",
    threeCX: "Unified live website chat, WhatsApp business messaging, and SMS directly in your 3CX desktop and mobile app.",
    traditional: "Voice calls only. No digital customer messaging, website live chat, or WhatsApp capability.",
    highlight: true
  },
  {
    feature: "CRM & Productivity Integration",
    threeCX: "Instant caller ID screen pops & auto call logging with Zoho CRM, Microsoft 365, Google Contacts & Webhooks.",
    traditional: "Manual keypad dialling. Completely disconnected from your customer databases and software."
  },
  {
    feature: "Hardware & Setup Flexibility",
    threeCX: "Use low-cost Yealink/Fanvil IP phones, USB/Bluetooth headsets, or existing smartphones and laptops.",
    traditional: "Locked to proprietary, high-cost PBX manufacturer hardware and vendor lock-in."
  }
];

export default function ThreeCXPage() {
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [companyName, setCompanyName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [numberOfExtensions, setNumberOfExtensions] = useState('6 - 15 Users');
  const [hardwareSetup, setHardwareSetup] = useState('Mix of IP Desk Phones & Softphones');
  const [numberPorting, setNumberPorting] = useState('Port existing Irish numbers (Keep 01, 090, 021, etc.)');
  const [notes, setNotes] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const scrollToQuoteForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName || !contactPerson || !email || !phone) return;

    setSubmitting(true);

    const generatedRef = `3CX-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      if (db) {
        await addDoc(collection(db, '3cx_quotes'), {
          referenceId: generatedRef,
          companyName,
          contactPerson,
          email,
          phone,
          numberOfExtensions,
          hardwareSetup,
          numberPorting,
          notes: notes || 'N/A',
          createdAt: serverTimestamp(),
          status: 'pending'
        });
      }
    } catch (err) {
      console.warn('Firestore write omitted or offline:', err);
    }

    // Send email notification to sales@procomputer.ie
    await sendQuoteRequestEmail({
      type: '3cx',
      referenceId: generatedRef,
      customerName: contactPerson,
      customerEmail: email,
      customerPhone: phone,
      organization: companyName,
      details: {
        'Company/School': companyName,
        'Extensions Required': numberOfExtensions,
        'Hardware Setup': hardwareSetup,
        'Irish Number Porting': numberPorting
      },
      notes
    });

    setReferenceId(generatedRef);
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleCopySummary = () => {
    const text = `3CX Phone System Quote Request (${referenceId})\nCompany/School: ${companyName}\nContact: ${contactPerson}\nEmail: ${email}\nPhone: ${phone}\nExtensions: ${numberOfExtensions}\nHardware Setup: ${hardwareSetup}\nNumber Porting: ${numberPorting}\nNotes: ${notes || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-300 pb-12" id="threecx-presentation-page">
      
      {/* 1. TOP HERO BANNER SECTION */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 text-white relative overflow-hidden shadow-2xl">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-xs font-bold tracking-wider uppercase">
            <PhoneCall className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>3CX CLOUD & ON-PREMISE IP PBX</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Next-Generation 3CX Business Phone System
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl font-normal">
            Slash your company's telecoms bills by up to 80% and say goodbye to expensive per-user monthly seat licenses. 
            3CX provides full mobility with free iOS & Android softphone apps, professional IVR digital receptionists, 
            instant Irish number porting, and native Zoho CRM & Microsoft 365 integration.
          </p>

          {/* Quick Badges & Ireland Contact Bar */}
          <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Zero Per-User Licensing</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Free iOS & Android Softphones</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <Layers className="w-4 h-4 text-violet-400" />
              <span>Zoho & MS 365 CRM Sync</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
              <TrendingDown className="w-4 h-4 text-amber-400" />
              <span>Up to 80% Telecoms Savings</span>
            </div>
          </div>

          {/* Action CTAs & Ireland Phone Direct Line */}
          <div className="pt-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              type="button"
              onClick={scrollToQuoteForm}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-extrabold text-xs sm:text-sm py-3.5 px-7 rounded-xl shadow-lg shadow-blue-900/40 transition-all flex items-center gap-2 cursor-pointer uppercase tracking-wider"
              id="hero-request-quote-btn"
            >
              <span>Get a Customized 3CX Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 text-xs bg-slate-800/90 border border-slate-700 px-4 py-3 rounded-xl">
              <span className="text-slate-400">Direct Irish Support:</span>
              <a 
                href="tel:+353906452550" 
                className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
                title="Click to dial on phone keypad"
              >
                <Phone className="w-3.5 h-3.5 inline" />
                +353 90 645 2550
              </a>
              <span className="text-slate-600">|</span>
              <a 
                href="mailto:sales@procomputer.ie" 
                className="text-slate-300 hover:text-white flex items-center gap-1"
              >
                <Mail className="w-3.5 h-3.5 text-slate-400 inline" />
                sales@procomputer.ie
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 4-COLUMN BENEFIT GRID */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Why Irish Businesses & Schools Choose 3CX</h2>
            <p className="text-xs text-slate-500">Transform your communications with an all-in-one IP PBX designed for high performance and low total cost of ownership.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-blue-100 text-blue-700 rounded-full">Enterprise Grade VoIP</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Column 1: Work Anywhere Softphones */}
          <div className="bg-[#0c152b] rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col justify-between hover:border-cyan-500/80 hover:bg-[#0f1b36] transition-all duration-300 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Smartphone className="w-6 h-6 text-cyan-400" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-cyan-300 transition-colors">
                Work Anywhere Softphones
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Take your office extension wherever you go. Native apps for iOS, Android, Windows, Mac, and Chrome allow staff to make & answer company calls from anywhere with zero mobile roaming surcharges.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-semibold text-cyan-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>iOS, Android & Web Client Included</span>
            </div>
          </div>

          {/* Column 2: Up to 80% Telephony Savings */}
          <div className="bg-[#0c152b] rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col justify-between hover:border-emerald-500/80 hover:bg-[#0f1b36] transition-all duration-300 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <TrendingDown className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                Up to 80% Telephony Savings
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                No per-user monthly seat licenses. Unlike Teams Phone or legacy providers charging €25+/user, 3CX charges a single predictable annual fee based solely on simultaneous call channels.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Per-Extension Monthly Fees</span>
            </div>
          </div>

          {/* Column 3: Smart IVR Call Routing */}
          <div className="bg-[#0c152b] rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col justify-between hover:border-violet-500/80 hover:bg-[#0f1b36] transition-all duration-300 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <GitBranch className="w-6 h-6 text-violet-400" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors">
                Smart IVR & Call Routing
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Build professional multi-level auto-attendants (Press 1 for Sales, 2 for Accounts), skill-based ring groups, custom queue strategies, call recording, and automated out-of-hours voicemail routing.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-semibold text-violet-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Auto-Attendants & Call Queues</span>
            </div>
          </div>

          {/* Column 4: Omnichannel & Live Chat */}
          <div className="bg-[#0c152b] rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col justify-between hover:border-amber-500/80 hover:bg-[#0f1b36] transition-all duration-300 group">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white group-hover:text-amber-300 transition-colors">
                Omnichannel & Live Chat
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Integrate website live chat, WhatsApp business messaging, and Facebook Messenger into one unified agent console. Connect directly with Zoho CRM and Microsoft 365 for automated call logging.
              </p>
            </div>
            <div className="pt-4 mt-4 border-t border-slate-800/80 text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>WhatsApp, Live Chat & CRM Sync</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SIDE-BY-SIDE COMPARISON TABLE: 3CX VoIP vs Traditional Copper Landlines */}
      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              3CX VoIP vs. Traditional Copper Landlines & ISDN
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              See how modern Cloud VoIP outperforms legacy copper phone lines in cost, flexibility, and features.
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Guaranteed Cost Reduction</span>
          </span>
        </div>

        {/* Table Container */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[640px]">
            <thead>
              <tr className="border-b-2 border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-1/4">Feature / Capability</th>
                <th className="py-3.5 px-4 w-3/8 bg-blue-50/80 text-blue-900 rounded-t-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>3CX Next-Gen VoIP PBX</span>
                  </div>
                </th>
                <th className="py-3.5 px-4 w-3/8 text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-400" />
                    <span>Traditional Copper Landlines / ISDN</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {comparisonData.map((row, idx) => (
                <tr 
                  key={idx} 
                  className={`hover:bg-slate-50/80 transition-colors ${row.highlight ? 'bg-blue-50/30' : ''}`}
                >
                  <td className="py-4 px-4 font-bold text-slate-800 align-top">
                    {row.feature}
                  </td>
                  <td className="py-4 px-4 text-slate-800 bg-blue-50/40 font-medium align-top leading-relaxed">
                    <div className="flex items-start gap-2">
                      <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{row.threeCX}</span>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-slate-600 align-top leading-relaxed">
                    <div className="flex items-start gap-2">
                      <XIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{row.traditional}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. DEDICATED LEAD-CAPTURE QUOTE FORM */}
      <div 
        ref={formRef} 
        id="request-3cx-quote-form" 
        className="bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-800 text-white shadow-xl relative overflow-hidden"
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {!submitted ? (
            <div className="space-y-4">
              <div className="text-center border-b border-slate-800 pb-3.5 space-y-1">
                <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-0.5">
                  <PhoneCall className="w-3 h-3 text-cyan-400" />
                  <span>Tailored Telecom Proposal</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Request an Official 3CX Phone System Quote
                </h2>
                <p className="text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Provide your organization details below. Our certified Irish VoIP engineers will calculate your annual savings, phone hardware packages, and number porting roadmap.
                </p>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-3.5">
                {/* 1. Organization & Contact Person */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Company / School Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Athlone Medical Clinic / St. Mary's School"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Contact Person <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Liam O'Connor"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="e.g. liam@company.ie"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Phone Number <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="tel"
                        placeholder="e.g. 090 645 2550 or 087 123 4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Sizing & Hardware Configuration Options */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider block">
                      Number of Extensions / Users
                    </label>
                    <div className="relative">
                      <select
                        value={numberOfExtensions}
                        onChange={(e) => setNumberOfExtensions(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="1 - 5 Users">1 - 5 Users (Small Office / Clinic)</option>
                        <option value="6 - 15 Users">6 - 15 Users (Growing Business / Department)</option>
                        <option value="16 - 30 Users">16 - 30 Users (Mid-Size Business / Primary School)</option>
                        <option value="31 - 50 Users">31 - 50 Users (Secondary School / Commercial)</option>
                        <option value="51 - 100 Users">51 - 100 Users (Large Enterprise / Multi-site)</option>
                        <option value="100+ Users">100+ Users (Large Campus / Corporate Call Center)</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider block">
                      Preferred Hardware Setup
                    </label>
                    <div className="relative">
                      <select
                        value={hardwareSetup}
                        onChange={(e) => setHardwareSetup(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                      >
                        <option value="Mix of IP Desk Phones & Softphones">Mix of IP Desk Phones & Mobile Softphones</option>
                        <option value="Softphones & Mobile Apps Only">Softphones & Mobile Apps Only (Zero hardware cost)</option>
                        <option value="Full IP Desk Phones Setup (Yealink / Fanvil)">Full IP Desk Phones (Yealink / Fanvil / Snom)</option>
                        <option value="Use Existing IP Phones / SIP Hardware">Use Existing IP Hardware / SIP Phones</option>
                        <option value="Recommend Best Option">Please advise & recommend best setup</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Number Porting Preference */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-cyan-300 uppercase tracking-wider block">
                    Irish Number Porting & Line Preference
                  </label>
                  <div className="relative">
                    <select
                      value={numberPorting}
                      onChange={(e) => setNumberPorting(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                    >
                      <option value="Port existing Irish numbers (Keep 01, 090, 021, etc.)">Keep Existing Irish Numbers (Port 01, 090, 021, 061, etc.)</option>
                      <option value="Need new Irish geographic / national numbers">Need Brand New Geographic / 1800 Freephone Numbers</option>
                      <option value="Both (Port existing + Add new lines)">Both (Port Existing Lines + Provision Extra Numbers)</option>
                      <option value="Not sure / Need consultation">Not sure / Please review our current telecoms bill</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 5. Additional Notes */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                    Additional Notes / Current Telecoms Provider / CRM Details
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Tell us about your current provider (e.g. Eir, Vodafone, Virgin), existing broadband connection, CRM system (Zoho, MS 365), call recording needs, or specific timelines..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-blue-500 text-white text-xs rounded-lg p-2.5 focus:outline-none transition-all placeholder-slate-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 transition-all cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  id="submit-3cx-quote-btn"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generating Telecom Proposal...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-cyan-200" />
                      <span>Submit 3CX Quote Request</span>
                    </>
                  )}
                </button>

                {/* Direct Dial Landline Assistance */}
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Questions? Speak directly with our telecoms engineering team at{' '}
                  <a 
                    href="tel:+353906452550" 
                    className="text-cyan-400 font-bold hover:underline inline-flex items-center gap-1"
                    title="Click to dial on phone keypad"
                  >
                    <Phone className="w-2.5 h-2.5 inline" />
                    +353 90 645 2550
                  </a>
                </p>
              </form>
            </div>
          ) : (
            /* SUBMISSION CONFIRMATION STATE */
            <div className="text-center py-6 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-md shadow-emerald-900/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-mono bg-blue-950 text-cyan-300 border border-blue-800 px-2.5 py-0.5 rounded-full inline-block">
                  Reference: {referenceId}
                </span>
                <h3 className="text-xl font-black text-white">
                  3CX Phone System Quote Request Submitted!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="text-white font-bold">{contactPerson}</span>. We have logged your request for <span className="text-cyan-300 font-semibold">{companyName}</span>. One of our senior telecoms specialists will prepare your tailored 3CX proposal and contact you shortly.
                </p>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 text-left text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Company / School:</span>
                  <span className="font-bold text-white">{companyName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">System Sizing:</span>
                  <span className="font-bold text-cyan-300">{numberOfExtensions}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Hardware Preference:</span>
                  <span className="font-bold text-slate-200">{hardwareSetup}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Number Porting:</span>
                  <span className="font-bold text-slate-200">{numberPorting}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Contact Email:</span>
                  <span className="font-bold text-white">{email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold text-white">{phone}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1.5">
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Summary Copied!' : 'Copy Quote Details'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setCompanyName('');
                    setContactPerson('');
                    setEmail('');
                    setPhone('');
                    setNotes('');
                  }}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                >
                  Submit Another Quote Request
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
