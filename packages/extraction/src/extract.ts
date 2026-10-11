// Page-text -> records. selfDeclaredTags ONLY from verbatim page text.
import { randomUUID } from 'crypto';
const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /\+?[\d][\d\s().-]{6,}\d/g;
export interface ExtractInput { projectId: string; country: string; sourceId: string; sourceUrl: string; pageText: string; entityType?: 'business'|'organisation'|'professional'; defaultRetentionDays?: number }
export function extractFromPageText(inp: ExtractInput) {
  const emails = [...new Set((inp.pageText.match(EMAIL)||[]).map(e=>e.toLowerCase()))].slice(0,5);
  const phones = [...new Set(inp.pageText.match(PHONE)||[])].slice(0,5);
  if (!emails.length && !phones.length) return [];
  const nameM = guessName(inp.pageText);
  // self-declared tags: only literal phrases present in text
  const tags: string[] = [];
  if (/women-owned/i.test(inp.pageText) && inp.pageText.toLowerCase().includes('women-owned')) tags.push('women-owned');
  // name guess: first non-empty line
  const rec = { id: randomUUID(), projectId: inp.projectId, entityType: inp.entityType||'business' as const, name: nameM, phones, emails, country: inp.country, selfDeclaredTags: tags, sourceId: inp.sourceId, sourceUrl: inp.sourceUrl, collectedAt: new Date().toISOString(), confidence: 0.5 + (emails.length?0.2:0) + (tags.length?0.05:0), status: 'candidate' as const, retentionUntil: new Date(Date.now() + (inp.defaultRetentionDays||180)*864e5).toISOString() };
  return [rec];
}
// Best-effort business name: first short chunk of visible text that is not
// itself a phone/email line (stripped pages often arrive as one long line).
export function guessName(pageText: string): string {
  const lines = pageText.split(/\n+/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean);
  for (const line of lines) {
    const chunks = line.split(/(?<=[.!?])\s+|\s\|\s/).map((s) => s.trim()).filter(Boolean);
    for (const c of chunks) {
      if (c.length > 3 && c.length <= 120 && !c.includes('@') && !/^\+?[\d\s().-]{7,}$/.test(c)) return c;
    }
    if (line.length > 3 && line.length <= 120 && !line.includes('@')) return line;
  }
  const flat = lines.join(' ');
  return flat.slice(0, 120) || 'Unknown organisation';
}
export function assertTagsGrounded(pageText: string, tags: string[]) {  for (const t of tags) if (!pageText.toLowerCase().includes(t.toLowerCase())) throw new Error('UNGROUNDED_TAG: ' + t);
}
