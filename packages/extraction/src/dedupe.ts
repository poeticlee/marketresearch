import type { ContactRecord } from '@gcrp/core';
import { normKey } from './clean.js';
export function dedupe(records: ContactRecord[]): ContactRecord[] {
  const byPhone = new Map<string, ContactRecord>(), byEmail = new Map<string, ContactRecord>(), byKey = new Map<string, ContactRecord>();
  const out: ContactRecord[] = [];
  for (const r of records) {
    const p = r.phones[0], e = r.emails[0]?.toLowerCase(), k = normKey(r.name, r.address);
    const dup = (p && byPhone.get(p)) || (e && byEmail.get(e)) || byKey.get(k);
    if (dup) {
      dup.phones = [...new Set([...dup.phones, ...r.phones])];
      dup.emails = [...new Set([...dup.emails, ...r.emails])];
      dup.confidence = Math.min(1, Math.max(dup.confidence, r.confidence) + 0.05);
      continue;
    }
    out.push(r);
    if (p) byPhone.set(p, r); if (e) byEmail.set(e, r); byKey.set(k, r);
  }
  return out;
}
