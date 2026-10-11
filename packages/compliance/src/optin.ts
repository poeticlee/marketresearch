import { randomUUID } from 'crypto';
// Opt-in collection: hosted form / QR / WhatsApp click-to-chat consent flow (Phase 5).
export interface OptIn { id: string; projectId: string; contact: string; channel: 'form'|'qr'|'whatsapp'; consentedAt: string; proof: string }
const store: OptIn[] = [];
export function recordOptIn(projectId: string, contact: string, channel: OptIn['channel'], proof: string): OptIn {
  const o = { id: randomUUID(), projectId, contact: contact.toLowerCase().trim(), channel, consentedAt: new Date().toISOString(), proof };
  store.push(o); return o;
}
export function listOptIns(projectId: string) { return store.filter(o=>o.projectId===projectId); }
export function qrPayload(projectId: string, base='https://app.example/form') { return base + '?project=' + projectId; }
export function whatsappLink(phone: string, text: string) { return 'https://wa.me/' + phone.replace(/\D/g,'') + '?text=' + encodeURIComponent(text); }
