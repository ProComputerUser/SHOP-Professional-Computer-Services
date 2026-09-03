import React from 'react';
import { Mail, Phone, Clock, ArrowUpRight, Heart, MapPin } from 'lucide-react';
import { Category } from '../types';
import Logo from './Logo';

interface FooterProps {
  onSelectCategory: (category: Category | 'All' | 'All Tech' | null) => void;
}

export default function Footer({ onSelectCategory }: FooterProps) {
  const categories: Category[] = [
    'Laptops',
    'Monitors',
    'Tablets',
    'Promethean',
    'Assistive Software',
    '3CX Phone System',
    'Peripherals & Audio',
    'Printer & Supplies',
    'Network & Connectivity',
    'Adapters & Accessories'
  ];

  return (
    <footer className="bg-white border-t border-slate-200 text-slate-600 pt-16 pb-8 px-4 sm:px-6 lg:px-8 text-left shadow-xs" id="main-app-footer">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10 lg:gap-14">
        
        {/* Column 1: Brand & Overview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => onSelectCategory('All Tech')}>
            <Logo className="h-14 sm:h-16 md:h-20 w-auto object-contain cursor-pointer transition-transform group-hover:scale-105" />
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Professional Computer Services — delivering certified IT hardware, enterprise infrastructure, educational solutions, and expert tech support across Ireland.
          </p>
        </div>

        {/* Column 2: Direct Contact & Hours */}
        <div className="space-y-4">
          <h4 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider">Contact & Hours</h4>
          <div className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <a 
                href="tel:+353906452550" 
                className="hover:text-blue-600 transition-colors font-semibold flex items-center gap-1.5"
                title="Click to dial landline on your phone"
              >
                <span>+353 90 645 2550</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded font-mono">Landline</span>
              </a>
            </div>
            <div className="flex items-center gap-2 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <a href="mailto:sales@procomputer.ie" className="hover:text-blue-600 transition-colors font-medium">
                sales@procomputer.ie
              </a>
            </div>
            <div className="flex items-start gap-2 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>Unit 1, Athlone Rd. Industrial Estate, Ballymahon, Co. Longford, N39 KH63</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="font-medium text-slate-700">Monday – Friday: 9:00 AM – 5:00 PM</span>
            </div>
          </div>
        </div>

        {/* Column 3: Device Catalogs */}
        <div className="space-y-4">
          <h4 className="text-slate-900 font-extrabold text-xs uppercase tracking-wider">Device Catalogs</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => onSelectCategory(cat)}
                className="text-slate-600 hover:text-blue-600 transition-colors cursor-pointer flex items-center justify-between group text-left py-0.5"
              >
                <span>{cat}</span>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Trademark row */}
      <div className="max-w-7xl mx-auto border-t border-slate-100 pt-8 mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
        <p>© 2026 Professional Computer Services Inc. All specifications certified under laboratory stress testing.</p>
        <div className="flex items-center gap-1">
          <span>Engineered with passion for precision computing</span>
          <Heart className="w-3.5 h-3.5 text-red-500 fill-current animate-pulse" />
        </div>
      </div>
    </footer>
  );
}
