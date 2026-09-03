import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import axios from 'axios';
import path from 'path';
import nodemailer from 'nodemailer';
import Stripe from 'stripe';
import { createServer as createViteServer } from 'vite';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    const key = (process.env.STRIPE_SECRET_KEY || '').trim();
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    stripeClient = new Stripe(key);
  }
  return stripeClient;
}

let mailTransporter: nodemailer.Transporter | null = null;

function getMailTransporter() {
  const host = (process.env.SMTP_HOST || 'smtp.office365.com').trim();
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = (process.env.SMTP_USER || '').trim();
  const pass = (process.env.SMTP_PASS || '').trim();

  if (!user || !pass) {
    return null;
  }

  if (!mailTransporter) {
    mailTransporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: {
        user,
        pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return mailTransporter;
}

let cachedAccessToken = '';
let tokenExpiresAt = 0;

let cachedItems: any[] | null = null;
let itemsCachedAt = 0;
const CACHE_DURATION_MS = 2 * 60 * 1000; // 2 minutes (keeps live prices fresh)

// In-memory caches for image binaries and single item detail specs
const imageCache = new Map<string, { buffer: Buffer; contentType: string; expiresAt: number }>();
const rateLimitedUntil = new Map<string, number>();
const itemDetailsCache = new Map<string, { item: any; expiresAt: number }>();

function resolveZohoCredentials() {
  const clientId = (process.env.ZOHO_CLIENT_ID || '').trim().replace(/^['"]|['"]$/g, '');
  const clientSecret = (process.env.ZOHO_CLIENT_SECRET || '').trim().replace(/^['"]|['"]$/g, '');
  let refreshToken = (process.env.ZOHO_REFRESH_TOKEN || '').trim().replace(/^['"]|['"]$/g, '');
  const apiDomain = (process.env.ZOHO_API_DOMAIN || '').trim().replace(/^['"]|['"]$/g, '');
  const orgId = (process.env.ZOHO_ORGANIZATION_ID || process.env.ZOHO_ORG_ID || '').trim().replace(/^['"]|['"]$/g, '');

  // Auto-detect if refresh token and api domain are swapped in env config
  if (apiDomain && apiDomain.startsWith('1000.') && !refreshToken.startsWith('1000.')) {
    refreshToken = apiDomain;
  }

  return { clientId, clientSecret, refreshToken, orgId };
}

async function getZohoAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedAccessToken && now < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const { clientId, clientSecret, refreshToken } = resolveZohoCredentials();

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Zoho Auth]: Missing clientId, clientSecret, or refreshToken in environment.');
    return '';
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token'
  });

  try {
    const response = await axios.post('https://accounts.zoho.eu/oauth/v2/token', params.toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    });

    cachedAccessToken = response.data?.access_token || '';
    tokenExpiresAt = now + ((response.data?.expires_in || 3600) * 1000);
    return cachedAccessToken;
  } catch (err: any) {
    console.warn('[Zoho Token Gen Error]:', err.response?.data || err.message);
    return '';
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Stripe Payment Public Config Endpoint
  app.get('/api/stripe/config', (req, res) => {
    const publishableKey = (process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
    const hasSecretKey = !!(process.env.STRIPE_SECRET_KEY || '').trim();
    res.json({
      publishableKey,
      isConfigured: !!(publishableKey && hasSecretKey)
    });
  });

  // Stripe Create Payment Intent Endpoint
  app.post('/api/create-payment-intent', async (req, res) => {
    try {
      const { amount, currency = 'eur', metadata = {} } = req.body || {};

      if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Valid positive payment amount is required.' });
      }

      const secretKey = (process.env.STRIPE_SECRET_KEY || '').trim();
      if (!secretKey) {
        return res.status(500).json({
          error: 'Stripe Secret Key is not configured on the server. Please define STRIPE_SECRET_KEY in your environment secrets.'
        });
      }

      const stripe = getStripe();
      
      // Stripe enforces a strict minimum charge of €0.50 EUR (50 cents) on EUR transactions.
      // Convert to cents and enforce the €0.50 minimum threshold so micro-transactions
      // or sub-50-cent totals do not cause Stripe API to reject with an error.
      const rawCents = Math.round(amount * 100);
      const chargeAmountInCents = Math.max(rawCents, 50);

      // We restrict payment_method_types to ['card'] so Stripe does NOT load unrequested
      // methods like bancontact, eps, giropay, or link.
      // Apple Pay and Google Pay operate natively through the card rail on Stripe.
      const paymentIntent = await stripe.paymentIntents.create({
        amount: chargeAmountInCents,
        currency: (currency || 'eur').toLowerCase(),
        payment_method_types: ['card'],
        metadata: {
          ...metadata,
          source: 'procomputer_storefront',
          supported_methods: 'card,apple_pay,google_pay,revolut_pay',
          requested_amount: String(amount),
          charged_cents: String(chargeAmountInCents)
        }
      });

      console.log(`[Stripe API] Created PaymentIntent ${paymentIntent.id} for €${(chargeAmountInCents / 100).toFixed(2)} (${chargeAmountInCents} cents)`);

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to create payment intent';
      console.warn('[Stripe API Notice]:', errorMsg);
      return res.status(400).json({ error: errorMsg });
    }
  });

  // Mobile Device QR Payment Session Store (Supports phone camera QR handoff for Apple Pay, Google Pay, Revolut)
  interface MobilePaymentSession {
    id: string;
    method: string;
    amount: number;
    shippingInfo?: any;
    status: 'pending' | 'completed' | 'cancelled';
    orderId?: string;
    paymentId?: string;
    createdAt: number;
  }

  const mobilePaymentSessions = new Map<string, MobilePaymentSession>();

  // Cleanup sessions older than 30 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [id, session] of mobilePaymentSessions.entries()) {
      if (now - session.createdAt > 30 * 60 * 1000) {
        mobilePaymentSessions.delete(id);
      }
    }
  }, 5 * 60 * 1000);

  // 1. Create or register a mobile payment session for QR handoff
  app.post('/api/payment-session/create', (req, res) => {
    try {
      const { id, method, amount, shippingInfo } = req.body;
      const sessionId = id || `sess_${Math.random().toString(36).substring(2, 11)}`;
      
      const newSession: MobilePaymentSession = {
        id: sessionId,
        method: method || 'apple_pay',
        amount: Number(amount || 0),
        shippingInfo: shippingInfo || {},
        status: 'pending',
        createdAt: Date.now()
      };

      mobilePaymentSessions.set(sessionId, newSession);
      console.log(`📱 [Mobile Payment Session] Created session ${sessionId} for ${method} (€${amount})`);

      return res.status(200).json({
        success: true,
        sessionId,
        status: 'pending'
      });
    } catch (e: any) {
      console.error('[Session Create Error]:', e);
      return res.status(500).json({ error: 'Failed to create payment session' });
    }
  });

  // 2. Poll payment session status (called by desktop waiting for phone QR completion)
  app.get('/api/payment-session/:id', (req, res) => {
    const sessionId = req.params.id;
    const session = mobilePaymentSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Payment session not found or expired' });
    }
    return res.status(200).json({
      success: true,
      session
    });
  });

  // 3. Mark session complete from mobile device (called by customer's phone after scanning QR)
  app.post('/api/payment-session/:id/complete', (req, res) => {
    const sessionId = req.params.id;
    const { paymentId, paymentMethod } = req.body;
    const session = mobilePaymentSessions.get(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Payment session not found' });
    }

    const orderNumber = `PCI-${Math.floor(100000 + Math.random() * 900000)}`;
    session.status = 'completed';
    session.orderId = orderNumber;
    session.paymentId = paymentId || `pay_mob_${Math.random().toString(36).substring(2, 9)}`;
    if (paymentMethod) session.method = paymentMethod;

    console.log(`✅ [Mobile Payment Completed] Session ${sessionId} confirmed from phone! Order ${orderNumber} created.`);

    return res.status(200).json({
      success: true,
      orderId: orderNumber,
      paymentId: session.paymentId,
      session
    });
  });

  // Simple Order Confirmation Endpoint
  app.post('/api/confirm-order', async (req, res) => {
    try {
      const { paymentId, paymentMethod, amount, shippingInfo, items } = req.body;
      const orderNumber = `PCI-${Math.floor(100000 + Math.random() * 900000)}`;
      
      console.log(`[Order Confirmed] Order ${orderNumber} for €${amount} via ${paymentMethod} (ID: ${paymentId})`);
      
      return res.status(200).json({
        success: true,
        orderId: orderNumber,
        paymentId: paymentId || orderNumber,
        paymentMethod: paymentMethod || 'Card',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[Order Confirmation Error]:', err.message);
      return res.status(500).json({ error: 'Failed to record order' });
    }
  });

  // Quote Request Email Dispatcher (routes to sales@procomputer.ie via SMTP)
  app.post('/api/quotes/send', async (req, res) => {
    const {
      type = 'general',
      referenceId = `QUO-${Math.floor(100000 + Math.random() * 900000)}`,
      customerName = '',
      customerEmail = '',
      customerPhone = '',
      organization = '',
      details = {},
      notes = ''
    } = req.body || {};

    if (!customerEmail && !customerPhone && !customerName) {
      return res.status(400).json({ error: 'Missing required customer contact details.' });
    }

    const typeTitles: Record<string, string> = {
      promethean: 'Promethean Interactive ActivPanel Quote',
      assistive_software: 'Assistive Technology & Software Quote',
      '3cx': '3CX Next-Gen VoIP Phone System Quote',
      gaming_pc: 'Custom Gaming PC Build Quote',
      general: 'Product Quotation Request'
    };

    const quoteTitle = typeTitles[type] || 'Product Quotation Request';
    const destinationSalesEmail = (process.env.SALES_EMAIL || 'sales@procomputer.ie').trim();
    const fromAddress = (process.env.SMTP_FROM || `Pro Computer Sales <${process.env.SMTP_USER || 'sales@procomputer.ie'}>`).trim();

    const formattedDetailsRows = Object.entries(details)
      .filter(([_, val]) => val !== undefined && val !== null && val !== '')
      .map(([key, val]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          .replace(/_/g, ' ');
        const displayVal = Array.isArray(val) ? val.join(', ') : String(val);
        return `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; background-color: #f8fafc;">${label}</td>
            <td style="padding: 10px 14px; color: #0f172a; font-weight: 500;">${displayVal}</td>
          </tr>
        `;
      })
      .join('');

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #0f172a; }
          .card { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 28px 24px; text-align: center; }
          .badge { display: inline-block; padding: 4px 12px; background: rgba(59, 130, 246, 0.2); border: 1px solid rgba(59, 130, 246, 0.4); color: #93c5fd; border-radius: 9999px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px; }
          .title { font-size: 20px; font-weight: 900; margin: 0 0 6px 0; letter-spacing: -0.02em; }
          .ref { font-family: monospace; font-size: 13px; color: #38bdf8; font-weight: 700; }
          .body { padding: 24px; }
          .section-title { font-size: 12px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin: 20px 0 8px 0; }
          .table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; font-size: 13px; margin-bottom: 16px; }
          .notes-box { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #334155; line-height: 1.5; margin-top: 8px; }
          .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 11px; color: #94a3b8; }
          .cta-btn { display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 700; font-size: 13px; margin-top: 16px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <span class="badge">New Quote Request</span>
            <h1 class="title">${quoteTitle}</h1>
            <div class="ref">Ref ID: ${referenceId}</div>
          </div>

          <div class="body">
            <div class="section-title">Customer & Organization Information</div>
            <table class="table">
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600; color: #475569; width: 35%; background-color: #f8fafc;">Full Name</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: 700;">${customerName || 'N/A'}</td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Email Address</td>
                <td style="padding: 10px 14px; color: #2563eb; font-weight: 600;"><a href="mailto:${customerEmail}" style="color: #2563eb; text-decoration: none;">${customerEmail || 'N/A'}</a></td>
              </tr>
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Phone Number</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${customerPhone || 'N/A'}</td>
              </tr>
              ${organization ? `
              <tr>
                <td style="padding: 10px 14px; font-weight: 600; color: #475569; background-color: #f8fafc;">Organization / School</td>
                <td style="padding: 10px 14px; color: #0f172a; font-weight: 600;">${organization}</td>
              </tr>
              ` : ''}
            </table>

            <div class="section-title">Quotation Details & Specifications</div>
            <table class="table">
              ${formattedDetailsRows}
            </table>

            ${notes ? `
              <div class="section-title">Customer Notes / Additional Requirements</div>
              <div class="notes-box">${notes.replace(/\n/g, '<br/>')}</div>
            ` : ''}

            <div style="text-align: center;">
              <a href="mailto:${customerEmail}?subject=Re:%20Quote%20Request%20${referenceId}%20-%20Pro%20Computer" class="cta-btn">
                Reply Directly to Customer (${customerEmail})
              </a>
            </div>
          </div>

          <div class="footer">
            Pro Computer Services • Athlone, Co. Roscommon, Ireland • +353 90 645 2550 • sales@procomputer.ie
            <br/>Automated notification from Storefront Portal.
          </div>
        </div>
      </body>
      </html>
    `;

    const plainText = `
[NEW QUOTE REQUEST - PRO COMPUTER SERVICES]
Type: ${quoteTitle}
Reference ID: ${referenceId}

Customer Information:
- Name: ${customerName}
- Email: ${customerEmail}
- Phone: ${customerPhone}
${organization ? `- Organization: ${organization}\n` : ''}

Quotation Specifications:
${Object.entries(details)
  .filter(([_, v]) => v !== undefined && v !== null && v !== '')
  .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
  .join('\n')}

${notes ? `\nAdditional Notes:\n${notes}\n` : ''}

---
Dispatched to: ${destinationSalesEmail}
    `.trim();

    const transporter = getMailTransporter();

    if (!transporter) {
      console.log(`[Quote Notification] ⚠️ SMTP credentials (SMTP_USER/SMTP_PASS) not yet set in environment. Quotation logged locally:\n`, {
        destinationSalesEmail,
        referenceId,
        customerName,
        customerEmail,
        customerPhone,
        type,
        details
      });

      return res.status(200).json({
        success: true,
        dispatched: false,
        referenceId,
        message: `Quote request ${referenceId} logged successfully. SMTP will send email to ${destinationSalesEmail} once SMTP_PASS is configured in Settings.`
      });
    }

    try {
      const mailInfo = await transporter.sendMail({
        from: fromAddress,
        to: destinationSalesEmail,
        replyTo: customerEmail || undefined,
        subject: `[Quote Request ${referenceId}] ${quoteTitle} - ${customerName || organization || 'Customer'}`,
        text: plainText,
        html: htmlBody
      });

      console.log(`[Quote Notification] ✉️ Quote email successfully sent to ${destinationSalesEmail}! MessageId: ${mailInfo.messageId}`);
      return res.status(200).json({
        success: true,
        dispatched: true,
        referenceId,
        messageId: mailInfo.messageId,
        message: `Quote request ${referenceId} submitted and emailed to ${destinationSalesEmail}!`
      });
    } catch (mailErr: any) {
      console.error('[Quote Notification] ❌ Failed to send SMTP email:', mailErr.message);
      // Return 200 with fallback so customer UI doesn't break
      return res.status(200).json({
        success: true,
        dispatched: false,
        referenceId,
        warning: mailErr.message,
        message: `Quote request ${referenceId} recorded.`
      });
    }
  });

  // Zoho API connection test and credential verification endpoint
  app.get('/api/zoho/verify', async (req, res) => {
    const creds = resolveZohoCredentials();
    const statusReport = {
      credentialsConfigured: {
        clientId: !!creds.clientId,
        clientSecret: !!creds.clientSecret,
        refreshToken: !!creds.refreshToken,
        orgId: !!creds.orgId
      },
      tokenAcquired: false,
      apiConnection: false,
      organizationId: creds.orgId,
      sampleItems: [] as any[],
      error: null as string | null
    };

    try {
      const token = await getZohoAccessToken();
      if (!token) {
        statusReport.error = 'Failed to generate OAuth access token with provided credentials.';
        return res.status(200).json(statusReport);
      }
      statusReport.tokenAcquired = true;

      const response = await axios.get(
        `https://www.zohoapis.eu/inventory/v1/items?organization_id=${encodeURIComponent(creds.orgId)}&page=1&per_page=3`,
        {
          headers: { Authorization: `Zoho-oauthtoken ${token}` },
          timeout: 10000
        }
      );

      statusReport.apiConnection = response.status === 200;
      statusReport.sampleItems = (response.data?.items || []).slice(0, 3);
      return res.status(200).json(statusReport);
    } catch (err: any) {
      statusReport.error = err.response?.data?.message || err.message;
      return res.status(200).json(statusReport);
    }
  });

  const itemDetailCache: Record<string, any> = {};

  function isWebsiteProduct(it: any): boolean {
    if (!it) return false;
    if (it.cf_website_category && typeof it.cf_website_category === 'string' && it.cf_website_category.trim().length > 0) {
      return true;
    }
    if (it.cf_website_category_unformatted && typeof it.cf_website_category_unformatted === 'string' && it.cf_website_category_unformatted.trim().length > 0) {
      return true;
    }
    if (it.custom_field_hash && typeof it.custom_field_hash === 'object') {
      for (const [k, v] of Object.entries(it.custom_field_hash)) {
        if (k.toLowerCase().includes('website_category') || k.toLowerCase().includes('website category') || k.toLowerCase().includes('cf_website_category')) {
          if (v && String(v).trim().length > 0) return true;
        }
      }
    }
    if (Array.isArray(it.custom_fields)) {
      const found = it.custom_fields.some((f: any) => {
        const label = (f.label || f.name || f.field_name || '').toLowerCase();
        const api = (f.api_name || f.placeholder_name || '').toLowerCase();
        return (label.includes('website category') || api.includes('website_category') || api.includes('cf_website_category')) && f.value;
      });
      if (found) return true;
    }
    return false;
  }

  async function enrichWebsiteItems(items: any[], token: string, orgId: string): Promise<void> {
    if (!items || !items.length || !token || !orgId) return;

    // Filter to website products that need complete descriptions/details
    const websiteItems = items.filter(isWebsiteProduct);

    console.log(`[Zoho Enrichment] Enriching full descriptions for ${websiteItems.length} website products (out of ${items.length} total)...`);

    const CONCURRENCY = 6;
    for (let i = 0; i < websiteItems.length; i += CONCURRENCY) {
      const batch = websiteItems.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map(async (item) => {
          const itemId = String(item.item_id || item.id || '');
          if (!itemId) return;

          // Snapshot live transactional/pricing values from the live list endpoint
          // so stale cached details can never overwrite newly updated prices or stock
          const freshPriceAndStock: Record<string, any> = {};
          if (item.rate !== undefined && item.rate !== null) freshPriceAndStock.rate = item.rate;
          if (item.sales_rate !== undefined && item.sales_rate !== null) freshPriceAndStock.sales_rate = item.sales_rate;
          if (item.price !== undefined && item.price !== null) freshPriceAndStock.price = item.price;
          if (item.unit_price !== undefined && item.unit_price !== null) freshPriceAndStock.unit_price = item.unit_price;
          if (item.purchase_rate !== undefined && item.purchase_rate !== null) freshPriceAndStock.purchase_rate = item.purchase_rate;
          if (item.tax_id !== undefined) freshPriceAndStock.tax_id = item.tax_id;
          if (item.tax_percentage !== undefined) freshPriceAndStock.tax_percentage = item.tax_percentage;
          if (item.tax_name !== undefined) freshPriceAndStock.tax_name = item.tax_name;
          if (item.stock_on_hand !== undefined) freshPriceAndStock.stock_on_hand = item.stock_on_hand;
          if (item.actual_available_stock !== undefined) freshPriceAndStock.actual_available_stock = item.actual_available_stock;
          if (item.available_stock !== undefined) freshPriceAndStock.available_stock = item.available_stock;
          if (item.status !== undefined) freshPriceAndStock.status = item.status;
          if (item.last_modified_time !== undefined) freshPriceAndStock.last_modified_time = item.last_modified_time;

          if (itemDetailCache[itemId]) {
            // Merge cached rich text/specs/images
            Object.assign(item, itemDetailCache[itemId]);
            // Restore fresh price and stock values from live Zoho Inventory query
            Object.assign(item, freshPriceAndStock);
            return;
          }

          try {
            const res = await axios.get(
              `https://www.zohoapis.eu/inventory/v1/items/${encodeURIComponent(itemId)}?organization_id=${encodeURIComponent(orgId)}`,
              {
                headers: { Authorization: `Zoho-oauthtoken ${token}` },
                timeout: 8000,
                validateStatus: (status) => status < 500
              }
            );

            const detail = res.data?.item;
            if (detail) {
              itemDetailCache[itemId] = detail;
              Object.assign(item, detail);
              // Ensure live pricing takes precedence if detail has different/missing price
              Object.assign(item, freshPriceAndStock);
              if (detail.rate !== undefined && detail.rate !== null && Number(detail.rate) > 0) {
                item.rate = detail.rate;
              }
            }
          } catch (err: any) {
            // keep item as is on network blip
          }
        })
      );
    }
    console.log(`[Zoho Enrichment] Completed enriching website product descriptions.`);
  }

  app.get('/api/zoho/items', async (req, res) => {
    const force = req.query.force === 'true' || req.query.refresh === 'true';
    const now = Date.now();

    if (!force && cachedItems && (now - itemsCachedAt < CACHE_DURATION_MS)) {
      return res.status(200).json({ items: cachedItems, cached: true });
    }

    if (force) {
      console.log('🔄 [Zoho Items API] Live price sync forced: clearing cache...');
      Object.keys(itemDetailCache).forEach(k => delete itemDetailCache[k]);
      cachedItems = null;
      itemsCachedAt = 0;
    }

    try {
      const token = await getZohoAccessToken();
      const { orgId } = resolveZohoCredentials();
      if (!token || !orgId) return res.status(200).json({ items: cachedItems || [] });

      let allItems: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) {
        const response = await axios.get(
          `https://www.zohoapis.eu/inventory/v1/items?organization_id=${encodeURIComponent(orgId)}&filter_by=Status.Active&page=${page}&per_page=200`,
          {
            headers: { Authorization: `Zoho-oauthtoken ${token}` },
            timeout: 12000
          }
        );

        const items = response.data?.items || response.data?.products || [];
        allItems = allItems.concat(items);
        hasMore = response.data?.page_context?.has_more_page === true;
        page++;
      }

      // Enrich all website items with full details & descriptions from Zoho
      await enrichWebsiteItems(allItems, token, orgId);

      cachedItems = allItems;
      itemsCachedAt = now;
      console.log(`[Zoho Items API] Fetched and enriched total of ${allItems.length} items.`);
      return res.status(200).json({ items: allItems });
    } catch (err: any) {
      console.warn('[Zoho Items Error]:', err.response?.data || err.message);
      if (cachedItems) {
        return res.status(200).json({ items: cachedItems, cached: true, fallback: true });
      }
      return res.status(200).json({ items: [], error: err.message });
    }
  });

  // Single Item details endpoint
  app.get('/api/zoho/item/:id', async (req, res) => {
    const itemId = req.params.id;
    if (!itemId) {
      return res.status(400).json({ error: 'Missing item id', item: null });
    }

    if (itemDetailCache[itemId]) {
      return res.status(200).json({ item: itemDetailCache[itemId] });
    }

    // Check if item is present in cachedItems list as fallback
    const fallbackFromList = cachedItems?.find(
      (it: any) => String(it.item_id) === String(itemId) || String(it.id) === String(itemId)
    );

    try {
      const token = await getZohoAccessToken();
      const { orgId } = resolveZohoCredentials();

      if (!token || !orgId) {
        return res.status(200).json({ item: fallbackFromList || null });
      }

      const response = await axios.get(
        `https://www.zohoapis.eu/inventory/v1/items/${encodeURIComponent(itemId)}?organization_id=${encodeURIComponent(orgId)}`,
        {
          headers: { Authorization: `Zoho-oauthtoken ${token}` },
          timeout: 9000,
          validateStatus: (status) => status < 500
        }
      );

      const itemData = response.data?.item || null;
      if (itemData) {
        itemDetailCache[itemId] = itemData;
      }
      return res.status(200).json({ item: itemData || fallbackFromList || null });
    } catch (err: any) {
      console.warn(`[Zoho Item ${itemId} API Error]:`, err.message);
      return res.status(200).json({ item: fallbackFromList || null, error: err.message });
    }
  });

  // Force refresh endpoint
  app.get('/api/zoho/refresh', async (req, res) => {
    try {
      // Clear cache to ensure newest descriptions in Zoho are immediately pulled
      Object.keys(itemDetailCache).forEach(k => delete itemDetailCache[k]);
      cachedItems = null;
      itemsCachedAt = 0;

      const token = await getZohoAccessToken();
      const { orgId } = resolveZohoCredentials();
      if (!token || !orgId) {
        return res.status(200).json({ success: false, items: [], count: 0 });
      }

      let allItems: any[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore && page <= 10) {
        const response = await axios.get(
          `https://www.zohoapis.eu/inventory/v1/items?organization_id=${encodeURIComponent(orgId)}&filter_by=Status.Active&page=${page}&per_page=200`,
          {
            headers: { Authorization: `Zoho-oauthtoken ${token}` },
            timeout: 12000
          }
        );

        const items = response.data?.items || response.data?.products || [];
        allItems = allItems.concat(items);
        hasMore = response.data?.page_context?.has_more_page === true;
        page++;
      }

      // Enrich all website items with full details & descriptions from Zoho
      await enrichWebsiteItems(allItems, token, orgId);

      cachedItems = allItems;
      itemsCachedAt = Date.now();
      console.log(`[Zoho Refresh API] Successfully refreshed and enriched ${allItems.length} items.`);
      return res.status(200).json({ success: true, items: allItems, count: allItems.length });
    } catch (err: any) {
      console.warn('[Zoho Refresh Error]:', err.response?.data || err.message);
      return res.status(200).json({
        success: false,
        items: cachedItems || [],
        count: (cachedItems || []).length,
        error: err.message
      });
    }
  });

  app.get('/api/zoho/item/:id/image', async (req, res) => {
    const placeholder = 'https://placehold.co/600x600/f8fafc/64748b?text=Product+Image';
    const itemId = req.params.id;

    if (!itemId) {
      return res.redirect(placeholder);
    }

    // 1. Check in-memory cache first
    const now = Date.now();
    const cached = imageCache.get(itemId);
    if (cached && now < cached.expiresAt) {
      res.setHeader('Content-Type', cached.contentType);
      res.setHeader('Cache-Control', 'public, max-age=86400');
      return res.send(cached.buffer);
    }

    // 2. Check if we are currently rate-limited on this item or generally
    const rateLimitExpiry = rateLimitedUntil.get(itemId) || 0;
    if (now < rateLimitExpiry) {
      return res.redirect(placeholder);
    }

    try {
      const token = await getZohoAccessToken();
      const { orgId } = resolveZohoCredentials();

      if (!token || !orgId) {
        return res.redirect(placeholder);
      }

      const response = await axios.get(
        `https://www.zohoapis.eu/inventory/v1/items/${encodeURIComponent(itemId)}/image?organization_id=${encodeURIComponent(orgId)}`,
        {
          headers: { Authorization: `Zoho-oauthtoken ${token}` },
          responseType: 'arraybuffer',
          timeout: 8000,
          validateStatus: (status) => status < 500
        }
      );

      // Handle 429 Too Many Requests explicitly
      if (response.status === 429) {
        console.warn(`[Zoho Image API] 429 Too Many Requests for item ${itemId}. Serving fallback placeholder.`);
        // Set a 30-second backoff window for this item
        rateLimitedUntil.set(itemId, now + 30000);
        return res.redirect(placeholder);
      }

      const contentType = String(response.headers['content-type'] || '');
      if (response.status === 200 && response.data && contentType.includes('image')) {
        const buffer = Buffer.from(response.data);
        // Cache successful image buffer for 2 hours
        imageCache.set(itemId, {
          buffer,
          contentType,
          expiresAt: now + (2 * 60 * 60 * 1000)
        });

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }

      return res.redirect(placeholder);
    } catch (err: any) {
      if (err.response?.status === 429 || (err.message && err.message.includes('429'))) {
        console.warn(`[Zoho Image API] 429 Rate Limit caught for item ${itemId}. Serving placeholder.`);
        rateLimitedUntil.set(itemId, now + 30000);
      } else {
        console.warn(`[Zoho Image API] Image fetch exception for ${itemId}:`, err.message);
      }
      return res.redirect(placeholder);
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ready on port ${PORT}`);
  });
}

startServer();

