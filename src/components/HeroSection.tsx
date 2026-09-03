import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Sparkles, ShoppingBag, ShieldCheck, Gamepad2 } from 'lucide-react';
import { Category } from '../types';

interface HeroSectionProps {
  onSelectCategory: (category: Category | 'All') => void;
}

export default function HeroSection({ onSelectCategory }: HeroSectionProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      title: 'Independent Reading Empowered',
      subtitle: 'C-Pen Reader 3 Smart Text-to-Speech Pen',
      description: 'The world-leading assistive OCR scanning pen. Instantly reads printed text aloud in natural human voices, defines vocabulary on-the-fly, and operates 100% offline with full exam approval.',
      highlight: '100% Offline & Exam Approved',
      category: 'Adapters & Accessories' as Category,
      tag: '★ TOP FEATURED PRODUCT',
      ctaText: 'Explore C-Pen Reader 3',
      badgeColor: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      buttonBg: 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20 font-extrabold',
      image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=1200&q=80',
      accentColor: 'from-amber-600/30 via-slate-950/90 to-slate-950'
    },
    {
      id: 2,
      title: 'The Future of Fanless Portability',
      subtitle: 'QuantumBook Air 14 Thin-Client',
      description: 'Zero system noise. Phenomenal battery life of up to 20 hours operational. The incredible high-density screen color makes editing on-site seamless.',
      highlight: 'Up to 20 Hours Battery',
      category: 'Laptops' as Category,
      tag: 'SILENT WORKSPACE',
      ctaText: 'Explore Air 14',
      badgeColor: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      buttonBg: 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20',
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1200&q=80',
      accentColor: 'from-blue-600/30 via-slate-950/90 to-slate-950'
    },
    {
      id: 3,
      title: 'Unparalleled Workspace Vistas',
      subtitle: 'Apex UltraWide QD-OLED 34"',
      description: 'Dive deep into seamless multi-monitor panels without any screen-bezel separation. Pre-calibrated color precision for absolute design excellence.',
      highlight: 'QD-OLED 165Hz Display',
      category: 'Monitors' as Category,
      tag: 'PRO DISPLAY MATRIX',
      ctaText: 'View Display',
      badgeColor: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
      buttonBg: 'bg-cyan-500 text-slate-950 hover:bg-cyan-400 shadow-cyan-500/20',
      image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1200&q=80',
      accentColor: 'from-cyan-600/30 via-slate-950/90 to-slate-950'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 8000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div className="w-full relative overflow-hidden bg-slate-950 text-white min-h-[460px] md:min-h-[520px] flex items-center border-b border-slate-900" id="hero-showcase-slider">
      
      {/* Background Slides */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0.1, scale: 1.05 }}
            animate={{ opacity: 0.45, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
        </AnimatePresence>
        
        {/* Cinematic gradient vignette */}
        <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].accentColor} transition-all duration-1000`} />
        
        {/* Subtle grid lines for a technical atmosphere */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0000000a_1px,transparent_1px),linear-gradient(to_bottom,#0000000a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30" />
      </div>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
        
        {/* Hero Content Panel */}
        <div className="w-full md:w-3/5 text-left space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="space-y-4"
            >
              {/* Floating micro tag */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase bg-slate-900/60" id={`slide-tag-${slides[currentSlide].id}`}>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-slate-200">{slides[currentSlide].tag}</span>
              </div>

              {/* Title Header */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">
                {slides[currentSlide].title}
              </h1>

              {/* Subtitle Accent */}
              <p className="text-lg sm:text-xl font-bold text-blue-400">
                {slides[currentSlide].subtitle}
              </p>

              {/* Description Paragraph */}
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                {slides[currentSlide].description}
              </p>

              {/* Dynamic highlights and specs badges */}
              <div className="flex flex-wrap gap-2.5 pt-2">
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-800 text-slate-300">
                  ⚡ 5.0Ghz Turbo Boost
                </span>
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-800 text-slate-300">
                  🎨 Quantum HDR Certified
                </span>
                <span className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/90 border border-slate-800 text-slate-200">
                  {slides[currentSlide].highlight}
                </span>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-6">
                <button
                  onClick={() => onSelectCategory(slides[currentSlide].category)}
                  className={`flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer shadow-lg ${slides[currentSlide].buttonBg}`}
                >
                  <span>{slides[currentSlide].ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onSelectCategory('Deals & Promotions')}
                  className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 text-sm font-semibold px-5 py-3 rounded-xl transition-all cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <span>Browse Flash Deals</span>
                </button>
              </div>

            </motion.div>
          </AnimatePresence>
        </div>

        {/* Hero Mini Info Board (Right-side Bento Grid element) */}
        <div className="w-full md:w-2/5 flex justify-center md:justify-end">
          <div className="w-full max-w-sm bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-6 rounded-2xl shadow-2xl relative space-y-4 text-left">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider uppercase">TechShop Express Pledge</h3>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-slate-800 text-cyan-400 p-2 rounded-lg mt-0.5">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Zero-Touch Provisioning</h4>
                  <p className="text-xs text-slate-400">Receive machines preloaded with custom operating configurations.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-slate-800 text-blue-400 p-2 rounded-lg mt-0.5">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Premium TechCare SLA</h4>
                  <p className="text-xs text-slate-400">Comprehensive accidental protection with immediate hot-swap services.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-slate-800 text-red-400 p-2 rounded-lg mt-0.5">
                  <Gamepad2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-200">Overclock Certified</h4>
                  <p className="text-xs text-slate-400">All desktop performance components are hand-screened and pre-tuned.</p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-[11px] text-slate-400">
              <span>Secure Checkout</span>
              <span>•</span>
              <span>Official Warranties</span>
              <span>•</span>
              <span>Fast Shipping</span>
            </div>
          </div>
        </div>

      </div>

      {/* Slider Carousel Dots Indicator */}
      <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-1.5 rounded-full transition-all cursor-pointer ${
              currentSlide === index ? 'w-6 bg-blue-500' : 'w-2 bg-slate-700 hover:bg-slate-500'
            }`}
            title={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
