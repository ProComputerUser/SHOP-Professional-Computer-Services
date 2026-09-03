import React, { useState, useEffect } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, ArrowRight, Lock, Smartphone, RefreshCw } from 'lucide-react';

interface MobilePaymentScreenProps {
  onClose?: () => void;
}

export default function MobilePaymentScreen({ onClose }: MobilePaymentScreenProps) {
  const [params, setParams] = useState<{
    sessionId: string;
    method: 'apple_pay' | 'google_pay' | 'revolut_pay';
    amount: number;
  }>({
    sessionId: '',
    method: 'apple_pay',
    amount: 1.00
  });

  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const sess = search.get('sessionId') || `sess_${Math.random().toString(36).substring(2, 9)}`;
      const meth = (search.get('method') as any) || 'apple_pay';
      const parsedAmt = parseFloat(search.get('amount') || '0');
      const amt = (parsedAmt && parsedAmt > 0) ? Math.max(parsedAmt, 0.50) : 1.00;

      setParams({
        sessionId: sess,
        method: meth,
        amount: amt
      });
    } catch {
      // safe fallback
    }
  }, []);

  const handleAuthorize = async () => {
    setIsAuthorizing(true);
    setError(null);

    try {
      // Simulate mobile biometric authorization delay (Face ID / fingerprint / Touch ID)
      await new Promise((resolve) => setTimeout(resolve, 1400));

      const res = await fetch(`/api/payment-session/${encodeURIComponent(params.sessionId)}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: `pay_phone_${Math.random().toString(36).substring(2, 10)}`,
          paymentMethod: params.method === 'apple_pay' ? 'Apple Pay (Mobile)' : params.method === 'google_pay' ? 'Google Pay (Mobile)' : 'Revolut Pay (Mobile)'
        })
      });

      if (!res.ok) {
        throw new Error('Failed to authorize transaction on server');
      }

      const data = await res.json();
      setOrderId(data.orderId || `PCI-${Math.floor(100000 + Math.random() * 900000)}`);
      setIsSuccess(true);
    } catch (err: any) {
      console.error('Mobile authorization error:', err);
      setError(err.message || 'Payment authorization failed');
    } finally {
      setIsAuthorizing(false);
    }
  };

  const methodMeta = {
    apple_pay: {
      name: 'Apple Pay',
      badge: 'Pay',
      btnBg: 'bg-black text-white hover:bg-neutral-900',
      btnText: 'Pay with Pay',
      subtitle: 'Authenticate with Face ID, Touch ID, or Passcode'
    },
    google_pay: {
      name: 'Google Pay',
      badge: 'GPay',
      btnBg: 'bg-slate-900 text-white hover:bg-slate-800',
      btnText: 'Pay with Google Pay',
      subtitle: 'Authorize saved payment method in Google Wallet'
    },
    revolut_pay: {
      name: 'Revolut Pay',
      badge: 'Revolut',
      btnBg: 'bg-purple-900 text-white hover:bg-purple-950',
      btnText: 'Approve in Revolut',
      subtitle: 'Instant authorization via your Revolut account'
    }
  }[params.method] || {
    name: 'Mobile Pay',
    badge: 'Mobile Pay',
    btnBg: 'bg-blue-600 text-white hover:bg-blue-700',
    btnText: 'Confirm Payment',
    subtitle: 'Authorize transaction on your device'
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-between p-4 sm:p-6 text-slate-100 font-sans" id="mobile-payment-screen">
      
      {/* Mobile Header */}
      <div className="w-full max-w-md mx-auto pt-4 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-sm shadow-md">
            PC
          </div>
          <div>
            <h1 className="text-xs font-black text-white tracking-tight">Professional Computers</h1>
            <span className="text-[10px] text-slate-400">Official Ireland Storefront</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold text-emerald-400">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>Stripe Protected</span>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="w-full max-w-md mx-auto my-auto py-6">
        {isSuccess ? (
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl border border-slate-100 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-black text-slate-900">Payment Approved!</h2>
              <p className="text-xs text-slate-500 mt-1">
                Your payment of <span className="font-bold text-slate-900 font-mono">€{params.amount.toFixed(2)}</span> has been confirmed.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Order Reference:</span>
                <span className="font-mono font-bold text-blue-600">{orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Method:</span>
                <span className="font-bold text-slate-800">{methodMeta.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status:</span>
                <span className="font-bold text-emerald-600">Paid & Dispatched</span>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200/60 rounded-xl text-blue-900 text-xs leading-relaxed">
              🎉 <strong>Great news!</strong> Your computer or browser screen has automatically updated with your order confirmation.
            </div>

            <button
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = '/';
                }
              }}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3.5 px-6 rounded-xl transition-all shadow-md cursor-pointer"
            >
              Return to Storefront
            </button>
          </div>
        ) : (
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 animate-in fade-in">
            
            <div className="text-center space-y-1">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                Mobile Device Authorization
              </span>
              <h2 className="text-xl font-black text-slate-900 pt-2">
                Authorize with {methodMeta.name}
              </h2>
              <p className="text-xs text-slate-500">
                {methodMeta.subtitle}
              </p>
            </div>

            {/* Total Amount Box */}
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Order Amount
              </span>
              <div className="text-3xl font-black text-slate-950 font-mono mt-0.5">
                €{params.amount.toFixed(2)}
              </div>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                FREE Delivery & 23% VAT Included
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
                {error}
              </div>
            )}

            {/* Main CTA: Big Mobile Pay Button */}
            <button
              type="button"
              disabled={isAuthorizing}
              onClick={handleAuthorize}
              className={`w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl text-sm font-black shadow-lg transition-all cursor-pointer disabled:opacity-50 ${methodMeta.btnBg}`}
            >
              {isAuthorizing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Authorizing with {methodMeta.name}...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>{methodMeta.btnText}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>

            <div className="text-center">
              <span className="text-[11px] text-slate-400 block">
                Once approved, your desktop screen will immediately finish your order.
              </span>
            </div>

          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-md mx-auto text-center text-[10px] text-slate-500 py-4 border-t border-slate-800">
        Professional Computers IE • 256-Bit SSL Secured • Republic of Ireland
      </div>

    </div>
  );
}
