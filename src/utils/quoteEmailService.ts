export interface QuoteEmailPayload {
  type: 'promethean' | 'assistive_software' | '3cx' | 'gaming_pc' | 'general';
  referenceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  organization?: string;
  details: Record<string, string | number | boolean | string[] | undefined>;
  notes?: string;
}

export async function sendQuoteRequestEmail(payload: QuoteEmailPayload): Promise<{ success: boolean; message?: string }> {
  try {
    const res = await fetch('/api/quotes/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.warn('Quote email notification response status:', res.status, errData);
      return { success: false, message: errData.error || 'Failed to dispatch email' };
    }

    const data = await res.json();
    return { success: true, message: data.message };
  } catch (err: any) {
    console.warn('Quote email notification network error:', err?.message);
    return { success: false, message: err?.message };
  }
}
