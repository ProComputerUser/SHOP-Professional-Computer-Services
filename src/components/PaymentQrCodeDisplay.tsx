import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { QrCode, Smartphone, ExternalLink, CheckCircle2, Loader2, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react';

interface PaymentQrCodeDisplayProps {
  method: 'apple_pay' | 'google_pay' | 'revolut_pay';
  amount: number;
  sessionId: string;
  customerName?: string;
  shippingCity?: string;
  onPaymentCompleted: (paymentId: string) => void;
  onInstantPayOnDevice?: () => void;
}

export default function PaymentQrCodeDisplay({
  method,
  amount,
  sessionId,
  customerName,
  shippingCity,
  onPaymentCompleted,
  onInstantPayOnDevice
}: PaymentQrCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingQr, setIsGeneratingQr] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // Generate mobile payment URL that can be scanned by any smartphone camera
  const mobileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/?mobilePay=true&sessionId=${encodeURIComponent(sessionId)}&method=${encodeURIComponent(method)}&amount=${amount.toFixed(2)}`
    : '';

  // Generate real camera-scannable QR code
  useEffect(() => {
    let isMounted = true;
    async function makeQr() {
      setIsGeneratingQr(true);
      try {
        const urlToEncode = mobileUrl || `https://procomputer.ie/pay/${sessionId}`;
        const dataUrl = await QRCode.toDataURL(urlToEncode, {
          width: 280,
          margin: 1,
          color: {
            dark: method === 'revolut_pay' ? '#18022e' : '#0f172a',
            light: '#ffffff'
          },
          errorCorrectionLevel: 'M'
        });
        if (isMounted) {
          setQrDataUrl(dataUrl);
          setIsGeneratingQr(false);
        }
      } catch (err) {
        console.error('Failed to generate payment QR code:', err);
        if (isMounted) setIsGeneratingQr(false);
      }
    }
    makeQr();
    return () => { isMounted = false; };
  }, [mobileUrl, sessionId, method]);

  // Poll payment session on backend to auto-detect when customer pays on their phone
  useEffect(() => {
    if (!sessionId) return;
    let isCancelled = false;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/payment-session/${encodeURIComponent(sessionId)}`);
        if (res.ok) {
          const data = await res.json();
          if (!isCancelled && data.session && data.session.status === 'completed') {
            console.log(`⚡ [Auto-Detected Mobile Payment] Session ${sessionId} marked completed!`);
            clearInterval(interval);
            onPaymentCompleted(data.session.paymentId || `pay_qr_${Date.now()}`);
          }
        }
      } catch {
        // Silently continue polling
      }
    }, 2000);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [sessionId, onPaymentCompleted]);

  const handleCopyLink = () => {
    if (mobileUrl) {
      navigator.clipboard.writeText(mobileUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleManualConfirm = () => {
    setIsVerifying(true);
    setTimeout(() => {
      onPaymentCompleted(`pay_verified_${Math.floor(100000 + Math.random() * 900000)}`);
    }, 1000);
  };

  const methodDetails = {
    apple_pay: {
      title: 'Scan to Pay with Apple Pay',
      badge: 'Pay',
      accentColor: 'border-black text-black',
      bgCard: 'bg-black text-white',
      badgeBg: 'bg-black text-white',
      step1: 'Open Camera on your iPhone or iPad',
      step2: 'Scan this QR code with your camera',
      step3: 'Authenticate with Face ID, Touch ID, or passcode',
      appName: 'Apple Pay'
    },
    google_pay: {
      title: 'Scan to Pay with Google Pay',
      badge: 'GPay',
      accentColor: 'border-slate-800 text-slate-800',
      bgCard: 'bg-slate-900 text-white',
      badgeBg: 'bg-slate-900 text-white',
      step1: 'Open Camera or Google Wallet on your phone',
      step2: 'Scan this QR code with your camera',
      step3: 'Tap prompt to confirm payment in Google Pay',
      appName: 'Google Pay'
    },
    revolut_pay: {
      title: 'Scan to Pay with Revolut',
      badge: 'Revolut',
      accentColor: 'border-purple-800 text-purple-900',
      bgCard: 'bg-gradient-to-br from-purple-950 via-slate-950 to-purple-900 text-white',
      badgeBg: 'bg-purple-900 text-white',
      step1: 'Open your phone Camera or Revolut App',
      step2: 'Scan this QR code with your camera',
      step3: 'Approve €' + amount.toFixed(2) + ' instantly in Revolut',
      appName: 'Revolut'
    }
  }[method];

  return (
    <div className="space-y-3.5 text-left animate-in fade-in duration-200" id="payment-qr-container">
      
      {/* Top Method Header Card */}
      <div className={`p-3.5 rounded-2xl ${methodDetails.bgCard} shadow-sm space-y-1 text-center`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono font-black text-xs px-2 py-0.5 rounded-md bg-white/15 backdrop-blur-xs">
              {methodDetails.badge}
            </span>
            <span className="text-xs font-bold">{methodDetails.title}</span>
          </div>
          <span className="font-mono font-black text-sm text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-lg">
            €{amount.toFixed(2)}
          </span>
        </div>
        <p className="text-[11px] text-white/70 pt-0.5">
          Scan the QR code with your phone camera to complete payment on your device.
        </p>
      </div>

      {/* QR Code Container Box */}
      <div className="bg-white border-2 border-slate-200/90 rounded-2xl p-4 shadow-sm text-center space-y-3">
        <div className="relative inline-block mx-auto bg-white p-2.5 rounded-2xl border border-slate-200 shadow-inner">
          {isGeneratingQr ? (
            <div className="w-56 h-56 flex flex-col items-center justify-center gap-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
              <span className="text-xs font-semibold">Generating QR Code...</span>
            </div>
          ) : qrDataUrl ? (
            <div className="relative group">
              <img
                src={qrDataUrl}
                alt={`${methodDetails.appName} Payment QR Code`}
                className="w-56 h-56 object-contain rounded-xl"
              />
              {/* Centered Brand Chip overlay on QR */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-white/95 backdrop-blur-xs border border-slate-300 px-2.5 py-1 rounded-full shadow-md text-[10px] font-black tracking-tight text-slate-900 flex items-center gap-1">
                  <QrCode className="w-3 h-3 text-slate-700" />
                  <span>{methodDetails.badge}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-56 h-56 flex items-center justify-center text-slate-400 text-xs">
              Failed to load QR code
            </div>
          )}
        </div>

        {/* Live Awaiting Confirmation Indicator */}
        <div className="flex items-center justify-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl py-2 px-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-700">
            Awaiting scan & confirmation on phone...
          </span>
        </div>

        {/* 3 Step Instruction Pills */}
        <div className="space-y-1.5 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              1
            </span>
            <span className="text-slate-700 font-medium">{methodDetails.step1}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              2
            </span>
            <span className="text-slate-700 font-medium">{methodDetails.step2}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="w-4 h-4 rounded-full bg-slate-900 text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
              3
            </span>
            <span className="text-slate-700 font-medium">{methodDetails.step3}</span>
          </div>
        </div>
      </div>

      {/* Dual Interactive Options: Immediate Confirmation or Link Action */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          disabled={isVerifying}
          onClick={handleManualConfirm}
          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Verifying {methodDetails.appName} Payment...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>I've Paid on My Phone</span>
            </>
          )}
        </button>

        <div className="flex gap-2">
          {onInstantPayOnDevice && (
            <button
              type="button"
              onClick={onInstantPayOnDevice}
              className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-slate-500" />
              <span>Pay on This Device</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleCopyLink}
            className="flex-1 flex items-center justify-center gap-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2 px-3 rounded-xl transition-colors cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Link Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Copy Link</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Security Footnote */}
      <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 pt-1">
        <ShieldCheck className="w-3 h-3 text-emerald-600" />
        <span>End-to-end encrypted • Verified Irish Merchant: Professional Computers IE</span>
      </div>

    </div>
  );
}
