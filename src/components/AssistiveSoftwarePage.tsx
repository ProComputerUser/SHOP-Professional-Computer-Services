import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  User, 
  Mail, 
  Phone, 
  Building2, 
  Layers, 
  Laptop, 
  Key, 
  Copy, 
  Check, 
  HelpCircle,
  Award,
  BookOpen,
  Mic,
  Cpu,
  ShieldAlert,
  ChevronDown
} from 'lucide-react';
import { db } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendQuoteRequestEmail } from '../utils/quoteEmailService';

export interface SoftwareCardData {
  id: string;
  name: string;
  badgeText: string;
  badgeIcon: string;
  badgeBg?: string;
  badgeTextColor?: string;
  subtitle: string;
  coreFocus: string;
  features: string[];
  licensing: string;
}

export const softwareProducts: SoftwareCardData[] = [
  {
    id: "read-write-gold",
    name: "Read&Write Gold",
    badgeText: "ACCESSIBILITY & LITERACY",
    badgeIcon: "📖",
    badgeBg: "bg-purple-500/20 border-purple-500/40",
    badgeTextColor: "text-purple-300",
    subtitle: "Empowering literacy and confidence booster toolbar for schools, higher education, and diverse learning needs.",
    coreFocus: "Text-to-Speech, Picture Dictionary, Highlighting & Audio Maker",
    features: [
      "Read-aloud support for emails, PDFs, web pages & class documents",
      "Tailored for English Language Learners, dyslexia & learning difficulties",
      "Smart text prediction, phonetic spellchecker & vocabulary builder",
      "Summary highlighters & instant MP3 audio conversion tools"
    ],
    licensing: "Single User / Educational Org / Multi-seat Site License"
  },
  {
    id: "dragon-speech-recognition",
    name: "Dragon Speech Recognition",
    badgeText: "SPEECH-TO-TEXT & VOICE CONTROL",
    badgeIcon: "🎙️",
    badgeBg: "bg-teal-500/20 border-teal-500/40",
    badgeTextColor: "text-teal-300",
    subtitle: "AI-powered voice dictation & hands-free workstation control software.",
    coreFocus: "Ultra-fast voice dictation, hands-free navigation & document creation",
    features: [
      "Up to 99% out-of-the-box speech recognition accuracy",
      "Custom voice commands & industry-specific vocabulary",
      "Deep learning technology adapting to individual speech patterns",
      "Seamless integration with MS Word, Outlook & Web browsers"
    ],
    licensing: "Individual Professional / Enterprise Volume Licensing"
  },
  {
    id: "ms-office-home-student-2021",
    name: "Microsoft Office Home & Student 2021",
    badgeText: "PRODUCTIVITY SUITE",
    badgeIcon: "⚙️",
    badgeBg: "bg-blue-500/20 border-blue-500/40",
    badgeTextColor: "text-blue-300",
    subtitle: "Essential classic desktop applications for students, families & schools.",
    coreFocus: "Classic 2021 desktop versions of Word, Excel, PowerPoint & OneNote",
    features: [
      "One-time purchase for 1 PC or Mac (No recurring subscription)",
      "Built-in Immersive Reader & accessibility checker",
      "Accessible templates, math equations & translation tools",
      "Full offline access to all documents and desktop features"
    ],
    licensing: "Perpetual Desktop License / ESD Digital Delivery"
  },
  {
    id: "eset-antivirus",
    name: "ESET Antivirus Security",
    badgeText: "CYBERSECURITY & THREAT PROTECTION",
    badgeIcon: "🛡️",
    badgeBg: "bg-emerald-500/20 border-emerald-500/40",
    badgeTextColor: "text-emerald-300",
    subtitle: "Proactive multi-layered endpoint security & real-time malware defense.",
    coreFocus: "Light footprint real-time antivirus, anti-phishing & ransomware shield",
    features: [
      "Advanced machine learning threat detection engine",
      "Banking & payment protection with secure browser",
      "Low system resource impact with Gamer / Silent mode",
      "Exploit blocker & ransomware shield for network endpoints"
    ],
    licensing: "1 - 50+ Nodes / Educational & Volume Discounts"
  }
];

export default function AssistiveSoftwarePage() {
  const formRef = useRef<HTMLDivElement>(null);

  // Form State
  const [selectedDevice, setSelectedDevice] = useState('');
  const [selectedSoftware, setSelectedSoftware] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  // Expandable Specs State per card (collapsed by default as shown in screenshot)
  const [openSpecs, setOpenSpecs] = useState<Record<string, boolean>>({
    'read-write-gold': false,
    'dragon-speech': false,
    'ms-office-2021': false,
    'eset-antivirus': false
  });

  const toggleSpecs = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setOpenSpecs((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleRequestQuote = (softwareName: string) => {
    setSelectedSoftware(softwareName);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !organization) return;

    setSubmitting(true);

    const generatedRef = `SOFT-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      if (db) {
        await addDoc(collection(db, 'software_quotes'), {
          referenceId: generatedRef,
          selectedDevice: selectedDevice || 'Not specified',
          device: selectedDevice || 'Not specified',
          softwareName: selectedSoftware || 'General Quote Request',
          softwarePackages: selectedSoftware ? [selectedSoftware] : ['General Quote Request'],
          fullName,
          email,
          phone,
          organization: organization || 'N/A',
          additionalNotes: additionalNotes || 'N/A',
          createdAt: serverTimestamp(),
          status: 'pending'
        });
      }
    } catch (err) {
      console.warn('Firestore write omitted or offline:', err);
    }

    // Send email notification to sales@procomputer.ie
    await sendQuoteRequestEmail({
      type: 'assistive_software',
      referenceId: generatedRef,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      organization: organization || undefined,
      details: {
        'Selected Device': selectedDevice || 'Not specified',
        'Software Package': selectedSoftware || 'General Quote Request'
      },
      notes: additionalNotes
    });

    setReferenceId(generatedRef);
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleCopySummary = () => {
    const text = `Assistive Software Quote Request (${referenceId})\nSelected Device: ${selectedDevice || 'None selected'}\nSoftware Package: ${selectedSoftware || 'None selected'}\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nOrganization: ${organization || 'N/A'}\nNotes: ${additionalNotes || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="w-full space-y-12 animate-in fade-in duration-300 pb-12" id="assistive-software-page">
      
      {/* HEADER BANNER SECTION */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-10 border border-slate-800 text-white relative overflow-hidden shadow-2xl">
        {/* Background Decorative Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
            <span>SOFTWARE & ASSISTIVE TECHNOLOGY</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
            Educational Software & Assistive Technology
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-3xl font-normal">
            Help students learn and communicate with easy-to-use reading pens, voice tools, learning software, and school computer programs. We provide genuine school hardware, discounted multi-user licenses, and full setup support.
          </p>

          {/* Quick Badges Bar */}
          <div className="flex flex-wrap items-center gap-4 pt-2 text-xs font-semibold text-slate-300">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Approved School Partner</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" />
              <span>School & Bulk Discounts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-violet-400" />
              <span>Fast Delivery & Easy Setup</span>
            </div>
          </div>
        </div>
      </div>

      {/* 1. CARDS GRID: 4 Dark Navy Blue (#0c152b) Cards in a 4-Column Layout */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Featured Software & Assistive Solutions</h2>
            <p className="text-xs text-slate-500">Explore accredited accessibility devices, specialized tools, and productivity licenses.</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 bg-violet-100 text-violet-700 rounded-full">4 Tier-1 Solutions</span>
        </div>

        {/* 4-COLUMN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {softwareProducts.map((prod) => (
            <div 
              key={prod.id}
              onClick={() => handleRequestQuote(prod.name)}
              className="bg-[#0c152b] rounded-2xl p-6 border border-slate-800 text-white shadow-xl flex flex-col justify-between h-full hover:border-violet-500/80 hover:bg-[#0f1b36] transition-all duration-300 group cursor-pointer"
              id={`card-${prod.id}`}
            >
              <div className="flex-1 flex flex-col justify-between">
                {/* Card Title & Subtitle with consistent min-height for uniform horizontal alignment */}
                <div className="mb-4">
                  <h3 className="text-lg font-black text-white group-hover:text-violet-300 transition-colors leading-snug min-h-[3.25rem] flex items-start">
                    {prod.name}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1.5 leading-relaxed font-normal min-h-[3.75rem]">
                    {prod.subtitle}
                  </p>
                </div>

                {/* Dropdown Toggle for Core Focus & Underlying Specifications - aligned at bottom */}
                <div className="pt-3 border-t border-slate-800/80 mt-auto">
                  <button
                    type="button"
                    onClick={(e) => toggleSpecs(prod.id, e)}
                    className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 hover:border-violet-500/60 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-violet-300 transition-all cursor-pointer shadow-sm group/btn"
                    id={`toggle-specs-${prod.id}`}
                    title={openSpecs[prod.id] ? "Collapse details" : "Expand core focus & features"}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-xs">🎯</span>
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-300 group-hover/btn:text-white truncate">
                        Core Focus & Specs
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-400 text-[11px] font-medium shrink-0 ml-2">
                      <span className="text-[10px] hidden sm:inline">{openSpecs[prod.id] ? 'Hide' : 'View'}</span>
                      <ChevronDown 
                        className={`w-4 h-4 text-violet-400 transition-transform duration-300 ${
                          openSpecs[prod.id] ? 'rotate-180 text-violet-300' : ''
                        }`} 
                      />
                    </div>
                  </button>

                  {/* Specification Details Underneath (Expandable / Collapsible) */}
                  {openSpecs[prod.id] && (
                    <div className="space-y-3 pt-3 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* Core Focus */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">
                          🎯 Core Focus
                        </span>
                        <p className="text-slate-200 font-medium text-[11px] leading-tight">
                          {prod.coreFocus}
                        </p>
                      </div>

                      {/* Key Features */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">
                          ⚡ Key Features
                        </span>
                        <ul className="space-y-1 text-slate-300 text-[11px]">
                          {prod.features.map((feat, idx) => (
                            <li key={idx} className="flex items-start gap-1.5 leading-tight">
                              <span className="text-violet-400 font-bold shrink-0">•</span>
                              <span>{feat}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Licensing */}
                      <div className="space-y-1">
                        <span className="text-[11px] font-bold text-violet-300 uppercase tracking-wider block">
                          🔑 Licensing
                        </span>
                        <p className="text-slate-300 text-[11px] font-medium">
                          {prod.licensing}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. QUOTE FORM: "Request a Software Quote" form directly underneath */}
      <div 
        ref={formRef} 
        id="request-software-quote-form" 
        className="bg-slate-900 rounded-2xl p-5 sm:p-7 border border-slate-800 text-white shadow-xl relative overflow-hidden"
      >
        {/* Subtle Background Glow */}
        <div className="absolute top-0 right-1/4 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto">
          {!submitted ? (
            <div className="space-y-4">
              <div className="text-center border-b border-slate-800 pb-3.5">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Request a Quote
                </h2>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-3.5">
                {/* 0. Device Selection */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-indigo-400 uppercase mb-1.5">
                    Device Selection
                  </label>
                  <div className="relative">
                    <select
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="">Select option</option>
                      <option value="Laptop">Laptop</option>
                      <option value="iPad">iPad</option>
                      <option value="Chromebook">Chromebook</option>
                    </select>
                    {/* Custom Chevron Icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 1. Software Package Selection Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold tracking-wider text-indigo-400 uppercase mb-1.5">
                    Software Package
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSoftware}
                      onChange={(e) => setSelectedSoftware(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3.5 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none cursor-pointer"
                    >
                      <option value="">Select option</option>
                      {softwareProducts.map((prod) => (
                        <option key={prod.id} value={prod.name}>
                          {prod.name}
                        </option>
                      ))}
                    </select>
                    {/* Custom Chevron Icon */}
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* 2. Contact Details: Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Full Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. Sarah Jenkins"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Email Address <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="email"
                        placeholder="e.g. s.jenkins@academy.edu"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Organization & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                      Organization / School Name <span className="text-rose-400">*</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        placeholder="e.g. St. Jude High School / Acme Corp"
                        value={organization}
                        onChange={(e) => setOrganization(e.target.value)}
                        required
                        className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
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
                        className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 text-white text-xs rounded-lg py-2.5 pl-9 pr-3 focus:outline-none transition-all placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Additional Details */}
                <div className="space-y-1">
                  <label className="text-[11px] font-extrabold text-slate-300 uppercase tracking-wider block">
                    Additional Requirements / Special Deployment Notes
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide any specific details (e.g. license count required, target OS, tax exemption status, delivery timeframe)..."
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 focus:border-violet-500 text-white text-xs rounded-lg p-2.5 focus:outline-none transition-all placeholder-slate-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black py-3 px-5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-violet-900/40 transition-all cursor-pointer text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                  id="submit-software-quote-btn"
                >
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Processing Request...</span>
                    </div>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-violet-200" />
                      <span>Submit Quote</span>
                    </>
                  )}
                </button>

                {/* Direct Dial Landline Assistance */}
                <p className="text-center text-[11px] text-slate-400 mt-2">
                  Need immediate advice? Call our landline directly at{' '}
                  <a 
                    href="tel:+353906452550" 
                    className="text-violet-400 font-bold hover:underline inline-flex items-center gap-1"
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
                <span className="text-[11px] font-mono bg-violet-950 text-violet-300 border border-violet-800 px-2.5 py-0.5 rounded-full inline-block">
                  Reference: {referenceId}
                </span>
                <h3 className="text-xl font-black text-white">
                  Software Quote Request Submitted!
                </h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                  Thank you, <span className="text-white font-bold">{fullName}</span>. We have logged your quote request for the selected software packages.
                </p>
              </div>

              {/* Summary Box */}
              <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-4 text-left text-xs space-y-2 max-w-lg mx-auto">
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Selected Device:</span>
                  <span className="font-bold text-indigo-300">{selectedDevice || 'None selected'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Software Package:</span>
                  <span className="font-bold text-violet-300">{selectedSoftware || 'None selected (General Inquiry)'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Contact Email:</span>
                  <span className="font-bold text-white">{email}</span>
                </div>
                <div className="flex justify-between border-b border-slate-700/80 pb-1.5">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-bold text-white">{phone}</span>
                </div>
                {organization && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Organization:</span>
                    <span className="font-bold text-white">{organization}</span>
                  </div>
                )}
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
                    setSelectedDevice('');
                    setSelectedSoftware('');
                    setFullName('');
                    setEmail('');
                    setPhone('');
                    setOrganization('');
                    setAdditionalNotes('');
                  }}
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all cursor-pointer"
                >
                  Submit Another Software Quote
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
