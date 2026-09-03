import React, { useState } from 'react';
import PrometheanQuoteForm from './PrometheanQuoteForm';
import { Product } from '../types';
import { Sparkles, Package, FileText, CheckCircle2, ShieldCheck, Monitor, PenTool, Radio, Camera, Cpu, ChevronDown, Sliders } from 'lucide-react';

interface PrometheanPageProps {
  selectedProduct?: Product | null;
  onClearSelectedProduct?: () => void;
}

interface SpecItem {
  text: string;
  isHighlighted?: boolean;
}

interface PrometheanProductDetail {
  id: string;
  name: string;
  badgeText: string;
  badgeColor: string;
  sizes: string;
  subtitle: string;
  screenGradient: string;
  screenTitle: string;
  screenSizes: string;
  hasCamera?: boolean;
  hasFlameLogo?: boolean;
  hasAppBadges?: boolean;
  specifications: SpecItem[];
  uniqueFeatures: SpecItem[];
  includedPeripherals: SpecItem[];
}

const prometheanProducts: PrometheanProductDetail[] = [
  {
    id: "promethean-activpanel-le",
    name: "Promethean ActivPanel LE 75\"",
    badgeText: "ESSENTIAL ENTRY",
    badgeColor: "#2563eb", // blue-600
    sizes: "65\" / 75\" / 86\"",
    subtitle: "⚡ 4K UHD / Android 14 OS / EDLA Certified",
    screenGradient: "from-pink-500 via-rose-500 to-purple-600",
    screenTitle: "ActivPanel LE",
    screenSizes: "65\" / 75\" / 86\"",
    hasAppBadges: true,
    specifications: [
      { text: "Heat tempered glass" },
      { text: "4K Screen" },
      { text: "USB-C (65W)" },
      { text: "2 USB-xC ports" },
      { text: "2 x 20W speakers" },
      { text: "400 nits brightness" }
    ],
    uniqueFeatures: [
      { text: "Up to 40 Points of touch" },
      { text: "Pen / Touch / Palm Differentiation" },
      { text: "Touch enabled Picture-in-Picture" },
      { text: "Built in Android 14 OS (8GB RAM / 64GB Storage)", isHighlighted: true },
      { text: "EDLA Certified", isHighlighted: true },
      { text: "5 Year On-Site Warranty" }
    ],
    includedPeripherals: [
      { text: "2m USB-C cable" },
      { text: "2 Passive Pens" },
      { text: "Promethean Remote" }
    ]
  },
  {
    id: "promethean-activpanel-10",
    name: "Promethean ActivPanel 10 75\"",
    badgeText: "BEST ALL-ROUNDER",
    badgeColor: "#7c3aed", // violet-600
    sizes: "65\" / 75\" / 86\"",
    subtitle: "⚡ Bonded Glass / 100W USB-C / Proximity Sensors",
    screenGradient: "from-sky-400 via-blue-500 to-indigo-600",
    screenTitle: "ActivPanel 10",
    screenSizes: "65\" / 75\" / 86\"",
    hasFlameLogo: true,
    specifications: [
      { text: "Bonded glass", isHighlighted: true },
      { text: "4K Screen" },
      { text: "USB-C (100W)", isHighlighted: true },
      { text: "2 USB-C ports" },
      { text: "2 x 20W speakers" },
      { text: "Proximity sensors", isHighlighted: true },
      { text: "500-565 nits brightness", isHighlighted: true }
    ],
    uniqueFeatures: [
      { text: "40 Points of touch", isHighlighted: true },
      { text: "Pen / Touch / Palm Differentiation" },
      { text: "Touch enabled Picture-in-Picture" },
      { text: "5 Year On-Site Warranty" }
    ],
    includedPeripherals: [
      { text: "3m USB-C cable", isHighlighted: true },
      { text: "2 Promethean Passive Pens", isHighlighted: true },
      { text: "Promethean Remote" }
    ]
  },
  {
    id: "promethean-activpanel-10-premium",
    name: "Promethean ActivPanel 10 Premium 75\"",
    badgeText: "FLAGSHIP ENTERPRISE",
    badgeColor: "#059669", // emerald-600
    sizes: "65\" / 75\" / 86\"",
    subtitle: "⚡ QLED Quantum Dot / 1000 Nits / 50 Touch Points",
    screenGradient: "from-fuchsia-500 via-pink-600 to-purple-700",
    screenTitle: "ActivPanel 10 Premium",
    screenSizes: "65\" / 75\" / 86\"",
    hasCamera: true,
    hasFlameLogo: true,
    specifications: [
      { text: "Optically Bonded glass", isHighlighted: true },
      { text: "4k Screen" },
      { text: "Side USB-C with 100W charging" },
      { text: "Front USB-C", isHighlighted: true },
      { text: "2 USB-C ports" },
      { text: "USB-C video output", isHighlighted: true },
      { text: "Proximity sensors" },
      { text: "8 array microphone", isHighlighted: true },
      { text: "2 x 25W speakers", isHighlighted: true },
      { text: "20W subwoofer", isHighlighted: true },
      { text: "USB-C top mounting camera port", isHighlighted: true },
      { text: "1000 nits brightness", isHighlighted: true }
    ],
    uniqueFeatures: [
      { text: "50 Points of touch", isHighlighted: true },
      { text: "FALD (Full Array Local Dimming)", isHighlighted: true },
      { text: "QLED – Quantum Dot LED backlight", isHighlighted: true },
      { text: "Twice as bright 2/3 the cost", isHighlighted: true },
      { text: "Pen / Touch / Palm Differentiation" },
      { text: "Touch enabled Picture-in-Picture" }
    ],
    includedPeripherals: [
      { text: "3m USB-C cable" },
      { text: "Promethean Remote" },
      { text: "Promethean Passive Pen x2" },
      { text: "Promethean ActivPen 2 x 1", isHighlighted: true },
      { text: "4K ePTZ Cam optional", isHighlighted: true }
    ]
  }
];

export default function PrometheanPage({ selectedProduct, onClearSelectedProduct }: PrometheanPageProps) {
  const [selectedModel, setSelectedModel] = useState<string>(
    selectedProduct?.name || 'Promethean ActivPanel 10 75"'
  );

  // State to track mobile dropdown toggle for specifications per card
  const [openMobileSpecs, setOpenMobileSpecs] = useState<Record<string, boolean>>({});

  const toggleMobileSpecs = (id: string) => {
    setOpenMobileSpecs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleSelectQuote = (productName: string) => {
    setSelectedModel(productName);
    const formElement = document.getElementById('promethean-panel-quote-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 text-left">
      {/* 1. TOP HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Promethean ActivPanel Interactive Displays 🔥
            </h2>
          </div>
          <p className="text-sm sm:text-base text-slate-600">
            Select an ActivPanel configuration below to auto-populate your official quote request.
          </p>
        </div>
        <div className="shrink-0">
          <span className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 border border-violet-200 px-3.5 py-1.5 rounded-xl text-xs font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-violet-600" />
            <span>3 Featured Configurations</span>
          </span>
        </div>
      </div>

      {/* 2. THE 3 DETAILED PROMETHEAN CARDS */}
      <div className="space-y-10">
        {prometheanProducts.map((item) => (
          <div 
            key={item.id} 
            className="bg-[#0c152b] rounded-3xl overflow-hidden border border-slate-800 shadow-2xl hover:border-violet-500/50 transition-all duration-300 flex flex-col xl:flex-row"
          >
            {/* LEFT / TOP: PHYSICAL DISPLAY GRAPHIC & HERO BADGE */}
            <div className="xl:w-5/12 bg-[#080d1a] p-6 sm:p-8 flex flex-col justify-between relative min-h-[320px] overflow-hidden border-b xl:border-b-0 xl:border-r border-slate-800">
              {/* Badge Top Left */}
              <div className="flex justify-between items-start gap-2 z-10 mb-4">
                <span 
                  className="text-white text-[11px] font-black px-3 py-1 rounded-lg tracking-wider uppercase shadow-md border border-white/20"
                  style={{ backgroundColor: item.badgeColor }}
                >
                  {item.badgeText}
                </span>
                <span className="bg-slate-900/90 text-slate-300 text-xs font-bold px-2.5 py-1 rounded-lg border border-slate-700">
                  {item.sizes}
                </span>
              </div>

              {/* Physical Panel Mockup frame */}
              <div className="relative my-auto py-4">
                {/* Optional Top Camera Module */}
                {item.hasCamera && (
                  <div className="mx-auto w-10 h-3 bg-slate-900 border border-slate-700 rounded-t-md flex items-center justify-center shadow-md">
                    <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
                  </div>
                )}

                {/* Panel Frame */}
                <div className="w-full bg-slate-950 p-2 sm:p-3 rounded-2xl border-4 border-slate-800 shadow-2xl relative">
                  {/* Glass Screen Display */}
                  <div className={`w-full aspect-[16/9] rounded-xl bg-gradient-to-br ${item.screenGradient} flex flex-col items-center justify-center p-4 text-center text-white shadow-inner relative overflow-hidden`}>
                    {/* Screen glare effect */}
                    <div className="absolute -top-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
                    
                    <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-md">
                      {item.screenTitle}
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-white/90 mt-1 drop-shadow-sm">
                      {item.screenSizes}
                    </p>

                    {/* Floating Flame / App badges */}
                    {item.hasFlameLogo && (
                      <div className="absolute bottom-2 right-2 bg-white/95 p-1.5 rounded-xl shadow-lg border border-slate-200">
                        <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white text-[10px] font-black">
                          🔥
                        </div>
                      </div>
                    )}
                    {item.hasAppBadges && (
                      <div className="absolute bottom-2 right-2 flex gap-1">
                        <span className="bg-white/90 p-1 rounded-lg shadow-sm text-[10px]">📱</span>
                        <span className="bg-white/90 p-1 rounded-lg shadow-sm text-[10px]">✏️</span>
                      </div>
                    )}
                  </div>

                  {/* Bottom Bezel with Pen Tray */}
                  <div className="mt-2 pt-1 border-t border-slate-800 flex justify-between items-center px-2 text-[10px] text-slate-500 font-mono">
                    <span>Promethean</span>
                    <div className="flex gap-2">
                      <span className="w-8 h-1 bg-slate-700 rounded-full" />
                      <span className="w-8 h-1 bg-slate-700 rounded-full" />
                    </div>
                  </div>
                </div>

                {/* Peripherals below panel mockup */}
                <div className="mt-3 flex justify-between items-center px-1 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-violet-400" />
                    <span>Remote Included</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <PenTool className="w-3.5 h-3.5 text-violet-400" />
                    <span>Passive Stylus Pens</span>
                  </div>
                </div>
              </div>

              {/* Title & Subtitle */}
              <div className="mt-4 pt-4 border-t border-slate-800/80">
                <h3 className="text-xl font-extrabold text-white">{item.name}</h3>
                <p className="text-xs text-sky-400 font-bold mt-1">{item.subtitle}</p>
              </div>
            </div>

            {/* RIGHT: SPECIFICATIONS, UNIQUE FEATURES & INCLUDED PERIPHERALS COLUMNS */}
            <div className="xl:w-7/12 p-6 sm:p-8 flex flex-col justify-between space-y-6">
              
              {/* DESKTOP FULL SPECIFICATIONS GRID */}
              <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {/* Column 1: Specifications */}
                <div className="space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider underline underline-offset-4 decoration-violet-500">
                      Specifications
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {item.specifications.map((spec, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 mt-0.5">•</span>
                        <span className={spec.isHighlighted ? "text-pink-400 font-extrabold" : "text-slate-300 font-medium"}>
                          {spec.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 2: Unique Features */}
                <div className="space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider underline underline-offset-4 decoration-pink-500">
                      Unique Features
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {item.uniqueFeatures.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 mt-0.5">•</span>
                        <span className={feat.isHighlighted ? "text-pink-400 font-extrabold" : "text-slate-300 font-medium"}>
                          {feat.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Column 3: Included Peripherals */}
                <div className="space-y-3">
                  <div className="border-b border-slate-800 pb-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider underline underline-offset-4 decoration-violet-500">
                      Included Peripherals
                    </h4>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {item.includedPeripherals.map((perip, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-slate-500 mt-0.5">•</span>
                        <span className={perip.isHighlighted ? "text-pink-400 font-extrabold" : "text-slate-300 font-medium"}>
                          {perip.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* MOBILE DROPDOWN MENU FOR FULL SPECIFICATIONS */}
              <div className="block md:hidden space-y-3 text-left">
                <button
                  type="button"
                  onClick={() => toggleMobileSpecs(item.id)}
                  className="w-full bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 active:border-violet-500 p-3.5 rounded-2xl flex items-center justify-between text-xs font-extrabold text-violet-300 transition-all shadow-md cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-violet-400" />
                    <span>Full Specifications & Features</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-medium">
                    <span>{openMobileSpecs[item.id] ? 'Hide' : 'View'}</span>
                    <ChevronDown className={`w-4 h-4 text-violet-400 transition-transform duration-300 ${openMobileSpecs[item.id] ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                {openMobileSpecs[item.id] && (
                  <div className="bg-slate-900/80 rounded-2xl p-4 border border-slate-800/80 space-y-5 text-left animate-fadeIn shadow-inner">
                    {/* Column 1: Specifications */}
                    <div className="space-y-2">
                      <div className="border-b border-slate-800 pb-1.5">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider text-violet-400">
                          ⚙️ Specifications
                        </h4>
                      </div>
                      <ul className="space-y-1 text-xs">
                        {item.specifications.map((spec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-slate-500 mt-0.5">•</span>
                            <span className={spec.isHighlighted ? "text-pink-400 font-extrabold" : "text-slate-300 font-medium"}>
                              {spec.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 2: Unique Features */}
                    <div className="space-y-2">
                      <div className="border-b border-slate-800 pb-1.5">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider text-pink-400">
                          🔥 Unique Features
                        </h4>
                      </div>
                      <ul className="space-y-1 text-xs">
                        {item.uniqueFeatures.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-slate-500 mt-0.5">•</span>
                            <span className={feat.isHighlighted ? "text-pink-400 font-extrabold" : "text-slate-300 font-medium"}>
                              {feat.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Column 3: Included Peripherals */}
                    <div className="space-y-2">
                      <div className="border-b border-slate-800 pb-1.5">
                        <h4 className="text-xs font-black text-white uppercase tracking-wider text-violet-400">
                          📦 Included Peripherals
                        </h4>
                      </div>
                      <ul className="space-y-1 text-xs">
                        {item.includedPeripherals.map((perip, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <span className="text-slate-500 mt-0.5">•</span>
                            <span className={perip.isHighlighted ? "text-pink-400 font-extrabold" : "text-slate-300 font-medium"}>
                              {perip.text}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* ACTION ROW */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-slate-400 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Includes 5-Year On-Site Manufacturer Warranty</span>
                </div>
                <button 
                  type="button"
                  onClick={() => handleSelectQuote(item.name)} 
                  className="w-full sm:w-auto bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white font-extrabold text-xs sm:text-sm py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer tracking-wide"
                >
                  <span>Request a Quote ✉️</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. QUOTE FORM DIRECTLY UNDERNEATH */}
      <div id="promethean-panel-quote-form" className="pt-6">
        <PrometheanQuoteForm 
          selectedProduct={selectedProduct}
          selectedModel={selectedModel}
          onClearSelectedProduct={onClearSelectedProduct}
        />
      </div>
    </div>
  );
}
