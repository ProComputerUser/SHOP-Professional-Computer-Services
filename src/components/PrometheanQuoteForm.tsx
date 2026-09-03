import React, { useState, useEffect } from 'react';
import { Monitor, Send, CheckCircle2, Building2, User, Mail, Phone, Sliders, Truck, Copy, Check, Sparkles } from 'lucide-react';
import { Product } from '../types';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { sendQuoteRequestEmail } from '../utils/quoteEmailService';

interface PrometheanQuoteFormProps {
  selectedProduct?: Product | null;
  selectedModel?: string;
  onClearSelectedProduct?: () => void;
}

export default function PrometheanQuoteForm({
  selectedProduct,
  selectedModel,
  onClearSelectedProduct
}: PrometheanQuoteFormProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institution, setInstitution] = useState('');
  const [panelModel, setPanelModel] = useState('Promethean ActivPanel 10 75"');
  const [trolleyPreference, setTrolleyPreference] = useState('Heavy Duty Mobile Trolley with Castors');
  const [sizingPreferences, setSizingPreferences] = useState('');
  
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  // Update selected model when selectedModel or selectedProduct prop changes
  useEffect(() => {
    if (selectedModel) {
      setPanelModel(selectedModel);
    } else if (selectedProduct && (selectedProduct.category === 'Promethean' || selectedProduct.brand === 'Promethean')) {
      setPanelModel(selectedProduct.name);
      // Auto scroll to form
      const formEl = document.getElementById('promethean-panel-quote-form');
      if (formEl) {
        formEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [selectedModel, selectedProduct]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !phone || !institution) return;

    setSubmitting(true);
    const generatedId = `PROM-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      if (db) {
        await addDoc(collection(db, 'promethean_quotes'), {
          referenceId: generatedId,
          customerName: fullName,
          customerEmail: email,
          customerPhone: phone,
          institution,
          panelModel,
          trolleyPreference,
          sizingPreferences: sizingPreferences || 'N/A',
          createdAt: serverTimestamp(),
          status: 'pending'
        });
      }
    } catch (err) {
      console.warn('Firestore write omitted or offline:', err);
    }

    // Send email notification to sales@procomputer.ie
    await sendQuoteRequestEmail({
      type: 'promethean',
      referenceId: generatedId,
      customerName: fullName,
      customerEmail: email,
      customerPhone: phone,
      organization: institution,
      details: {
        'Panel Model': panelModel,
        'Mounting & Trolley': trolleyPreference,
        'Sizing Preferences': sizingPreferences || 'Standard Deployment'
      },
      notes: sizingPreferences
    });

    setReferenceId(generatedId);
    setSubmitting(false);
    setSubmitted(true);
  };

  const handleCopySummary = () => {
    const text = `Promethean Panel Quote Request (${referenceId})\nName: ${fullName}\nEmail: ${email}\nPhone: ${phone}\nInstitution: ${institution}\nModel: ${panelModel}\nTrolley/Mounting: ${trolleyPreference}\nPreferences: ${sizingPreferences || 'N/A'}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReset = () => {
    setSubmitted(false);
    setFullName('');
    setEmail('');
    setPhone('');
    setInstitution('');
    setSizingPreferences('');
    if (onClearSelectedProduct) {
      onClearSelectedProduct();
    }
  };

  return (
    <div 
      className="bg-white border border-slate-200/90 rounded-2xl shadow-lg p-5 sm:p-6 mt-6 text-left relative overflow-hidden"
      id="promethean-panel-quote-form"
    >
      {/* Decorative background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-violet-100 text-violet-700 rounded-lg">
              <Monitor className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
              Request a Promethean Panel Quote
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
            Tailored enterprise & educational solutions. Submit your contact details, deployment sizing, and trolley preferences below for an official quotation.
          </p>
        </div>

        {selectedProduct && (
          <div className="bg-violet-50 border border-violet-200 rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs shrink-0 self-start sm:self-auto">
            <div>
              <span className="text-[9px] font-bold text-violet-600 uppercase tracking-wider block">Selected Model</span>
              <span className="font-extrabold text-slate-800 text-xs">{selectedProduct.name}</span>
            </div>
            {onClearSelectedProduct && (
              <button 
                type="button" 
                onClick={onClearSelectedProduct}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold px-1 py-0.5 rounded hover:bg-violet-100 transition-colors"
                title="Clear selected product"
              >
                ×
              </button>
            )}
          </div>
        )}
      </div>

      {submitted ? (
        /* Submission Confirmation View */
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 sm:p-6 text-center space-y-4 animate-fadeIn">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1.5 max-w-lg mx-auto">
            <h3 className="text-lg font-black text-slate-900">Promethean Quote Request Received!</h3>
            <p className="text-xs text-slate-600">
              Thank you, <span className="font-bold text-slate-900">{fullName}</span>. Reference ID:{' '}
              <span className="font-mono font-bold text-violet-700 bg-violet-100 px-1.5 py-0.5 rounded">{referenceId}</span>
            </p>
            <p className="text-[11px] text-slate-500">
              Our education and enterprise panel installation team will prepare a formal quote for <span className="font-semibold">{institution}</span> and contact you at <span className="font-semibold">{email}</span> within 24 hours.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-3.5 text-left text-xs max-w-xl mx-auto space-y-1.5">
            <div className="font-extrabold text-slate-700 pb-1 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[11px]">Request Summary</span>
              <button
                type="button"
                onClick={handleCopySummary}
                className="flex items-center gap-1 text-[10px] text-violet-600 hover:text-violet-800 font-bold transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Summary'}</span>
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-slate-600 text-[11px]">
              <div><span className="font-semibold text-slate-500">Institution:</span> {institution}</div>
              <div><span className="font-semibold text-slate-500">Phone:</span> {phone}</div>
              <div><span className="font-semibold text-slate-500">Model:</span> {panelModel}</div>
              <div><span className="font-semibold text-slate-500">Mount/Trolley:</span> {trolleyPreference}</div>
            </div>
            {sizingPreferences && (
              <div className="pt-1 border-t border-slate-100 text-slate-600 text-[11px]">
                <span className="font-semibold text-slate-500">Sizing & Deployment Preferences:</span>
                <p className="italic mt-0.5 text-slate-700">{sizingPreferences}</p>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleReset}
              className="bg-slate-900 hover:bg-violet-700 text-white font-extrabold text-xs py-2 px-5 rounded-lg transition-all shadow-md cursor-pointer"
            >
              Submit Another Quote Request
            </button>
          </div>
        </div>
      ) : (
        /* Form View */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <User className="w-3 h-3 text-slate-400" />
                <span>Full Name *</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Sarah Jenkins"
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg px-3 py-2 text-xs text-slate-800 transition-all outline-none"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Email Address *</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. s.jenkins@academy.edu"
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg px-3 py-2 text-xs text-slate-800 transition-all outline-none"
              />
            </div>

            {/* Contact Phone */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" />
                <span>Contact Phone *</span>
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 090 645 2550 or 087 123 4567"
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg px-3 py-2 text-xs text-slate-800 transition-all outline-none"
              />
            </div>

            {/* Institution / Business Name */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-400" />
                <span>Institution / Business Name *</span>
              </label>
              <input
                type="text"
                required
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. St. Jude High School / Acme Corp"
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg px-3 py-2 text-xs text-slate-800 transition-all outline-none"
              />
            </div>

            {/* Target Panel Model */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-slate-400" />
                <span>Preferred Panel Model & Screen Size</span>
              </label>
              <select
                value={panelModel}
                onChange={(e) => setPanelModel(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg px-3 py-2 text-xs text-slate-800 transition-all outline-none cursor-pointer"
              >
                <optgroup label="ActivPanel LE Series">
                  <option value='Promethean ActivPanel LE 65"'>Promethean ActivPanel LE 65"</option>
                  <option value='Promethean ActivPanel LE 75"'>Promethean ActivPanel LE 75"</option>
                  <option value='Promethean ActivPanel LE 86"'>Promethean ActivPanel LE 86"</option>
                </optgroup>
                <optgroup label="ActivPanel 10 Series">
                  <option value='Promethean ActivPanel 10 65"'>Promethean ActivPanel 10 65"</option>
                  <option value='Promethean ActivPanel 10 75"'>Promethean ActivPanel 10 75"</option>
                  <option value='Promethean ActivPanel 10 86"'>Promethean ActivPanel 10 86"</option>
                </optgroup>
                <optgroup label="ActivPanel 10 Premium Series">
                  <option value='Promethean ActivPanel 10 Premium 65"'>Promethean ActivPanel 10 Premium 65"</option>
                  <option value='Promethean ActivPanel 10 Premium 75"'>Promethean ActivPanel 10 Premium 75"</option>
                  <option value='Promethean ActivPanel 10 Premium 86"'>Promethean ActivPanel 10 Premium 86"</option>
                </optgroup>
              </select>
            </div>

            {/* Deployment Trolley / Mount Preference */}
            <div className="space-y-1">
              <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
                <Truck className="w-3 h-3 text-slate-400" />
                <span>Mounting & Mobile Trolley Option</span>
              </label>
              <select
                value={trolleyPreference}
                onChange={(e) => setTrolleyPreference(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg px-3 py-2 text-xs text-slate-800 transition-all outline-none cursor-pointer"
              >
                <option value="Heavy Duty Mobile Trolley with Castors">Heavy Duty Mobile Trolley with Castors</option>
                <option value="Electric Motorized Height-Adjustable Stand">Electric Motorized Height-Adjustable Stand</option>
                <option value="Fixed Heavy Duty Wall Mount Bracket">Fixed Heavy Duty Wall Mount Bracket</option>
                <option value="Extended Mobile Cart with Storage Shelf">Extended Mobile Cart with Storage Shelf</option>
                <option value="Recommendation Requested based on Room Size">Recommendation Requested based on Room Size</option>
              </select>
            </div>
          </div>

          {/* Deployment Trolley & Sizing Preferences (Textarea) */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-600" />
              <span>Deployment Trolley or Sizing Preferences & Special Notes</span>
            </label>
            <textarea
              rows={2}
              value={sizingPreferences}
              onChange={(e) => setSizingPreferences(e.target.value)}
              placeholder="Specify room counts, ceiling height constraints, mobility trolley needs, preferred installation schedule, or custom AV connectivity requirements..."
              className="w-full bg-slate-50 border border-slate-200 focus:border-violet-600 focus:bg-white focus:ring-2 focus:ring-violet-600/10 rounded-lg p-2.5 text-xs text-slate-800 transition-all outline-none resize-y"
            />
          </div>

          {/* Submit Action Row */}
          <div className="pt-1.5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-[10px] text-slate-400">
              * Official quotes are issued with 30-day educational or corporate price locks.
            </p>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-extrabold text-xs py-2.5 px-6 rounded-lg transition-all duration-200 shadow-md shadow-violet-600/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{submitting ? 'Processing Request...' : 'Submit Promethean Quote Request ✉️'}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
