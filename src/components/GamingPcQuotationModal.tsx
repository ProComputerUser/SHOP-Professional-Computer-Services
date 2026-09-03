import React, { useState } from 'react';
import { 
  X, 
  Cpu, 
  Check, 
  Zap, 
  Wrench, 
  Send, 
  Flame, 
  Copy, 
  CheckCircle2, 
  HardDrive,
  Box,
  Layers,
  ChevronDown,
  FileText
} from 'lucide-react';
import { db, auth } from '../firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendQuoteRequestEmail } from '../utils/quoteEmailService';

interface GamingPcQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInlineView?: boolean;
}

export interface PresetBuildExample {
  id: string;
  title: string;
  badge: string;
  badgeColor: string;
  targetTarget: string;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  cooling: string;
  caseStyle: string;
  image: string;
  useCase: string[];
}

export const GAMING_PC_EXAMPLES: PresetBuildExample[] = [
  {
    id: 'esports-starter',
    title: 'The eSports Champion Rig',
    badge: 'Popular Entry',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    targetTarget: '1080p High-FPS Competitive Esports',
    cpu: 'AMD Ryzen 5 7600 (6-Core / 12-Thread 5.1GHz)',
    gpu: 'NVIDIA GeForce RTX 4060 8GB GDDR6',
    ram: '16GB (2x8GB) Corsair Vengeance DDR5 5600MHz',
    storage: '1TB Kingston NV2 M.2 PCIe 4.0 NVMe SSD',
    cooling: 'DeepCool AK400 Digital High-Airflow CPU Cooler',
    caseStyle: 'NZXT H5 Flow Tempered Glass Mid-Tower (Black)',
    image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80',
    useCase: ['Fortnite', 'Valorant', 'CS2', 'Apex Legends', 'Rocket League']
  },
  {
    id: 'streamer-creator',
    title: 'Streamer & Creator Workstation',
    badge: 'Best All-Rounder',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    targetTarget: '1440p High FPS Gaming + 1080p60 Live Streaming',
    cpu: 'Intel Core i7-14700F (20 Cores / 28 Threads)',
    gpu: 'NVIDIA GeForce RTX 4070 Super 12GB GDDR6X',
    ram: '32GB (2x16GB) G.Skill Trident Z5 DDR5 6000MHz',
    storage: '2TB Crucial T500 Gen4 M.2 NVMe SSD (7,300 MB/s)',
    cooling: 'Thermalright Frozen Prism 240mm AIO Liquid Cooler',
    caseStyle: 'Lian Li LANCOOL 216 Mesh Case w/ RGB Fans',
    image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&w=800&q=80',
    useCase: ['OBS Studio', 'Twitch 1080p60', 'Call of Duty', 'GTA V', 'Premiere Pro']
  },
  {
    id: '1440p-beast',
    title: '4K & Ray-Tracing Dominator',
    badge: 'Best Value Powerhouse',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    targetTarget: '1440p & 4K Ultra Settings w/ DLSS 3 & Ray Tracing',
    cpu: 'AMD Ryzen 7 7800X3D (World\'s Premier Gaming CPU)',
    gpu: 'NVIDIA GeForce RTX 4070 Ti Super 16GB GDDR6X',
    ram: '32GB (2x16GB) TeamGroup T-Force Delta DDR5 6000MHz CL30',
    storage: '2TB Samsung 990 PRO Gen4 NVMe M.2 SSD',
    cooling: 'DeepCool LT720 360mm High-Performance AIO Cooler',
    caseStyle: 'HYTE Y60 Panoramic Dual Tempered Glass Case',
    image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?auto=format&fit=crop&w=800&q=80',
    useCase: ['Cyberpunk 2077', 'Black Myth: Wukong', 'Starfield', 'GTA VI Ready', 'Flight Sim 2024']
  }
];

export default function GamingPcQuotationModal({ isOpen, onClose, isInlineView = false }: GamingPcQuotationModalProps) {
  const [selectedExample, setSelectedExample] = useState<PresetBuildExample | null>(null);

  // Mobile specs dropdown state per rig
  const [openMobileSpecs, setOpenMobileSpecs] = useState<Record<string, boolean>>({});

  const toggleMobileSpecs = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMobileSpecs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Form State
  const [specialRequests, setSpecialRequests] = useState<string>('');

  // Contact Info State
  const [fullName, setFullName] = useState<string>(auth.currentUser?.displayName || '');
  const [email, setEmail] = useState<string>(auth.currentUser?.email || '');
  const [phone, setPhone] = useState<string>('');

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedQuote, setSubmittedQuote] = useState<{
    quoteId: string;
    summary: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen && !isInlineView) return null;

  const handleSelectExample = (example: PresetBuildExample) => {
    setSelectedExample(example);
    setSpecialRequests(`Requesting quote for build: ${example.title}. Target: ${example.targetTarget}. CPU: ${example.cpu}, GPU: ${example.gpu}`);
    
    // Smooth scroll down to quotation form on the same page
    const formElement = document.getElementById('custom-pc-quote-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleSubmitQuotation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;

    setIsSubmitting(true);
    const generatedQuoteId = `GPC-${Math.floor(100000 + Math.random() * 900000)}`;

    const quoteData = {
      quoteId: generatedQuoteId,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      selectedBuild: selectedExample ? selectedExample.title : 'Custom Build',
      specialRequests,
      status: 'pending_review',
      createdAt: new Date().toISOString()
    };

    try {
      if (db) {
        await addDoc(collection(db, 'gaming_pc_quotes'), {
          ...quoteData,
          createdAtServer: serverTimestamp(),
          userId: auth.currentUser?.uid || 'guest'
        });
      }
    } catch (err) {
      console.warn("Firestore quote saving fallback to local state", err);
    }

    try {
      const existingQuotes = JSON.parse(localStorage.getItem('pcs_gaming_quotes') || '[]');
      existingQuotes.unshift(quoteData);
      localStorage.setItem('pcs_gaming_quotes', JSON.stringify(existingQuotes));
    } catch {
      // ignore
    }

    // Dispatch email notification to sales@procomputer.ie
    await sendQuoteRequestEmail({
      type: 'gaming_pc',
      referenceId: generatedQuoteId,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      details: {
        'Selected Build Tier': selectedExample ? selectedExample.title : 'Custom Build',
        'Target Resolution / FPS': selectedExample?.targetTarget || 'Custom Requirements',
        'Processor (CPU)': selectedExample?.cpu || 'Custom Specification',
        'Graphics Card (GPU)': selectedExample?.gpu || 'Custom Specification',
        'Memory (RAM)': selectedExample?.ram || 'Custom Specification',
        'Primary Storage': selectedExample?.storage || 'Custom Specification',
        'Cooling System': selectedExample?.cooling || 'Custom Specification',
        'Chassis Style': selectedExample?.caseStyle || 'Custom Specification'
      },
      notes: specialRequests
    });

    setIsSubmitting(false);
    setSubmittedQuote({
      quoteId: generatedQuoteId,
      summary: `${fullName} requested a Gaming PC quote${selectedExample ? ` for ${selectedExample.title}` : ''}.`
    });
  };

  const handleCopyQuoteId = () => {
    if (submittedQuote) {
      navigator.clipboard.writeText(submittedQuote.quoteId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // INNER MAIN CONTENT
  const mainContent = (
    <div className="space-y-5 text-left">
      
      {/* HEADER HERO BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-2xl border border-indigo-500/30 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1.5 relative z-[2] max-w-2xl">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Custom Gaming PC Builds & Quotations
          </h1>

          <p className="text-xs text-slate-300 leading-relaxed mb-0">
            Configure one of our benchmarked gaming PC rigs or submit a request for custom tailored build specifications. Hand-built, wire-laced, and stress tested.
          </p>
        </div>

        {onClose && !isInlineView && (
          <button
            onClick={onClose}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full transition-colors cursor-pointer self-start md:self-auto shrink-0 border border-slate-700"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* SUCCESSFUL SUBMISSION CONFIRMATION SCREEN */}
      {submittedQuote ? (
        <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-6 sm:p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider rounded-full inline-block">
              Quotation Submitted Successfully
            </span>
            <h3 className="text-xl font-black text-white tracking-tight">Your Custom PC Spec Sheet Is Registered!</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Our hardware engineers are reviewing your request. An itemized official quote PDF will be sent to your email within 2 business hours.
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 max-w-md mx-auto space-y-3 text-left">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs text-slate-400 font-medium">Quotation Reference ID</span>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-xs text-indigo-400">{submittedQuote.quoteId}</span>
                <button
                  onClick={handleCopyQuoteId}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy Reference ID"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Custom Precision Cable Lacing & Airflow Tuning</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Full BIOS XMP/EXPO Memory Profile Calibration</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>3-Year On-Site Express Parts & Labor Warranty</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <button
              onClick={() => {
                setSubmittedQuote(null);
                if (onClose) onClose();
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/20"
            >
              Return to Main Catalog
            </button>
            <button
              onClick={() => setSubmittedQuote(null)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer border border-slate-700"
            >
              Submit Another Quote
            </button>
          </div>
        </div>
      ) : (
        /* BOTH SECTIONS ON THE SAME PAGE */
        <div className="space-y-4">
          
          {/* SECTION 1: 3 PRESET GAMING PC EXAMPLES */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                  <span>Example Gaming PC Rigs & Specifications</span>
                  <Flame className="w-4 h-4 text-amber-500" />
                </h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  High-performance preset builds. Click any build to populate your quote request.
                </p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-3 py-0.5 rounded-lg self-start sm:self-auto">
                3 Featured Configurations
              </span>
            </div>

            {/* GRID OF 3 PRESET BUILDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {GAMING_PC_EXAMPLES.map((example) => (
                <div
                  key={example.id}
                  onClick={() => handleSelectExample(example)}
                  className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/60 transition-all duration-300 group flex flex-col justify-between shadow-lg hover:shadow-indigo-500/10 cursor-pointer"
                >
                  {/* GAMING PC PICTURE */}
                  <div className="relative h-40 w-full overflow-hidden bg-slate-900">
                    <img
                      src={example.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'}
                      alt={example.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                    
                    {/* Floating Badge */}
                    <div className="absolute top-2.5 left-2.5 pointer-events-none">
                      <span className={`px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md border backdrop-blur-md shadow-md ${example.badgeColor}`}>
                        {example.badge}
                      </span>
                    </div>

                    {/* Title & Target Resolution on image bottom */}
                    <div className="absolute bottom-2.5 left-3 right-3">
                      <h3 className="text-sm font-black text-white group-hover:text-indigo-300 transition-colors drop-shadow-md">
                        {example.title}
                      </h3>
                      <div className="flex items-center gap-1 text-[11px] text-indigo-300 font-medium mt-0.5">
                        <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                        <span className="truncate">{example.targetTarget}</span>
                      </div>
                    </div>
                  </div>

                  {/* SEPARATED HARDWARE SPECS BREAKDOWN */}
                  <div className="p-3.5 space-y-3 flex-1">
                    {/* DESKTOP FULL SPECS DISPLAY */}
                    <div className="hidden md:block">
                      <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 block mb-1.5">
                        📋 Hardware Specifications
                      </span>

                      <div className="bg-slate-900/90 rounded-xl p-2.5 space-y-1.5 border border-slate-800 text-[11px]">
                        {/* CPU */}
                        <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Cpu className="w-3 h-3 text-indigo-400" /> CPU:
                          </span>
                          <span className="font-mono font-bold text-slate-100 text-right">{example.cpu}</span>
                        </div>

                        {/* GPU */}
                        <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Zap className="w-3 h-3 text-amber-400" /> GPU:
                          </span>
                          <span className="font-mono font-bold text-slate-100 text-right">{example.gpu}</span>
                        </div>

                        {/* RAM */}
                        <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Layers className="w-3 h-3 text-emerald-400" /> RAM:
                          </span>
                          <span className="font-mono font-bold text-slate-100 text-right">{example.ram}</span>
                        </div>

                        {/* Storage */}
                        <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <HardDrive className="w-3 h-3 text-cyan-400" /> Storage:
                          </span>
                          <span className="font-mono font-bold text-slate-100 text-right">{example.storage}</span>
                        </div>

                        {/* Cooling */}
                        <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Wrench className="w-3 h-3 text-purple-400" /> Cooling:
                          </span>
                          <span className="font-mono text-slate-300 text-right">{example.cooling}</span>
                        </div>

                        {/* Case */}
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                            <Box className="w-3 h-3 text-slate-400" /> Chassis:
                          </span>
                          <span className="font-mono text-slate-300 text-right">{example.caseStyle}</span>
                        </div>
                      </div>
                    </div>

                    {/* MOBILE DROPDOWN MENU FOR HARDWARE SPECS */}
                    <div className="block md:hidden space-y-1.5 text-left">
                      <button
                        type="button"
                        onClick={(e) => toggleMobileSpecs(example.id, e)}
                        className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 active:border-indigo-500 p-2.5 rounded-xl flex items-center justify-between text-xs font-bold text-indigo-300 transition-all cursor-pointer shadow-md"
                      >
                        <div className="flex items-center gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Hardware Specifications</span>
                        </div>
                        <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                          <span>{openMobileSpecs[example.id] ? 'Hide' : 'View Specs'}</span>
                          <ChevronDown className={`w-3.5 h-3.5 text-indigo-400 transition-transform duration-300 ${openMobileSpecs[example.id] ? 'rotate-180' : ''}`} />
                        </div>
                      </button>

                      {openMobileSpecs[example.id] && (
                        <div className="bg-slate-900/95 rounded-xl p-2.5 space-y-1.5 border border-slate-800 text-[11px] animate-fadeIn shadow-inner">
                          {/* CPU */}
                          <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <Cpu className="w-3 h-3 text-indigo-400" /> Processor:
                            </span>
                            <span className="font-mono font-bold text-slate-100 text-right">{example.cpu}</span>
                          </div>

                          {/* GPU */}
                          <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <Zap className="w-3 h-3 text-amber-400" /> Graphics:
                            </span>
                            <span className="font-mono font-bold text-slate-100 text-right">{example.gpu}</span>
                          </div>

                          {/* RAM */}
                          <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <Layers className="w-3 h-3 text-emerald-400" /> RAM:
                            </span>
                            <span className="font-mono font-bold text-slate-100 text-right">{example.ram}</span>
                          </div>

                          {/* Storage */}
                          <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <HardDrive className="w-3 h-3 text-cyan-400" /> Storage:
                            </span>
                            <span className="font-mono font-bold text-slate-100 text-right">{example.storage}</span>
                          </div>

                          {/* Cooling */}
                          <div className="flex items-start justify-between gap-1.5 border-b border-slate-800/80 pb-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <Wrench className="w-3 h-3 text-purple-400" /> Cooling:
                            </span>
                            <span className="font-mono text-slate-300 text-right">{example.cooling}</span>
                          </div>

                          {/* Case */}
                          <div className="flex items-start justify-between gap-1.5">
                            <span className="text-slate-400 font-bold flex items-center gap-1 shrink-0">
                              <Box className="w-3 h-3 text-slate-400" /> Chassis:
                            </span>
                            <span className="font-mono text-slate-300 text-right">{example.caseStyle}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card remains fully clickable */}
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 2: REQUEST A QUOTE FORM */}
          <div className="pt-0" id="custom-pc-quote-form">
            <div className="mb-2 space-y-0.5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                <span>Request a Gaming PC Quote</span>
                <Send className="w-4 h-4 text-indigo-600" />
              </h2>
              <p className="text-xs text-slate-600">
                Fill in your contact details and desired specifications or questions below. Our tech specialists will reply with an official quote.
              </p>
            </div>

            <form onSubmit={handleSubmitQuotation} className="space-y-3.5">
              
              {/* SELECTED PRESET BANNER (ONLY SHOWS IF A RIG IS SELECTED) */}
              {selectedExample && (
                <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-950 border border-indigo-500/50 rounded-xl p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={selectedExample.image || 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=800&q=80'}
                      alt={selectedExample.title}
                      className="w-12 h-12 rounded-lg object-cover border border-indigo-500/30 shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-black uppercase rounded">
                          Selected Rig
                        </span>
                      </div>
                      <h4 className="text-xs font-black text-white">{selectedExample.title}</h4>
                      <p className="text-[10px] text-slate-400 truncate max-w-md">
                        CPU: {selectedExample.cpu} | GPU: {selectedExample.gpu}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedExample(null);
                      setSpecialRequests('');
                    }}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition-colors cursor-pointer shrink-0"
                  >
                    Clear Selected Rig
                  </button>
                </div>
              )}

              {/* CONTACT & MESSAGE */}
              <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-indigo-500/30 rounded-xl p-4 sm:p-5 space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="jane@example.com"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-300 block mb-1">Phone Number (Optional)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-300 block mb-1">
                    Special Requests, Target Budget, or Desired Specifications
                  </label>
                  <textarea
                    rows={3}
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    placeholder="Describe your target budget, resolution, games, preferred parts, or any specific questions..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
                  <div className="text-left">
                    <span className="text-[11px] font-semibold text-emerald-400">Custom Spec Quote — Free Consultation</span>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs px-6 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-50"
                    id="submit-gaming-pc-quote-btn"
                  >
                    {isSubmitting ? (
                      <span>Submitting Quote Request...</span>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Gaming PC Quote Request</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  // IF INLINE VIEW: RENDER DIRECTLY IN PAGE
  if (isInlineView) {
    return (
      <div className="w-full max-w-7xl mx-auto py-2 animate-in fade-in duration-200" id="gaming-pc-quote-page-view">
        {mainContent}
      </div>
    );
  }

  // IF MODAL VIEW: RENDER OVERLAY CONTAINER
  return (
    <div className="fixed inset-0 z-[1100] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200" id="gaming-pc-quote-modal-overlay">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-5xl w-full text-white shadow-2xl overflow-hidden my-auto p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
        {mainContent}
      </div>
    </div>
  );
}
