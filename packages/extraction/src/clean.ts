import { parsePhoneNumberWithError } from 'libphonenumber-js';
export function toE164(raw: string, country: string): string | null {
  try { const p = parsePhoneNumberWithError(raw, country as any); return p && p.isValid() ? p.number : null; }
  catch { return null; }
}
export function validEmail(e: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim()); }
export function normEmail(e: string) { return e.trim().toLowerCase(); }
export function normKey(name: string, address?: string) { return (name.trim().toLowerCase() + '|' + (address||'').trim().toLowerCase()).replace(/\s+/g,' '); }
