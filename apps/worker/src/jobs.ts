import { store } from '@gcrp/db';
import { dedupe } from '@gcrp/extraction';
import { registryConnector, overpassConnector } from '@gcrp/sources';
import { randomUUID } from 'crypto';
// Search job fans out to connectors, streams candidates as status=candidate.
export async function runSearchJob(projectId: string, briefText: string, country: string, actor: string, opts: { city?: string; sector?: string; live?: boolean } = {}) {
  const found: any[] = [];
  const connectors = opts.live === false ? [registryConnector] : [overpassConnector, registryConnector];
  for (const conn of connectors) {
    try {
      for await (const c of conn.search({ text: briefText, country, city: opts.city, sector: opts.sector })) {
    const rec = { id: randomUUID(), projectId, entityType: c.entityType||'business', name: c.name, phones: c.phones, emails: c.emails, address: c.address, country, category: c.category, selfDeclaredTags: [], sourceId: conn.id, sourceUrl: c.sourceUrl, collectedAt: new Date().toISOString(), confidence: 0.6, status: 'candidate', retentionUntil: new Date(Date.now()+180*864e5).toISOString() };
    store.saveRecord(rec as any, actor); found.push(rec);
    }
  } catch { /* one source failing must not kill the job */ }
  }
  return dedupe(found as any);
}
export function retentionSweep() {
  const now = new Date(); const flagged: string[] = [];
  for (const r of store.records.values()) if (new Date((r as any).retentionUntil) < now) flagged.push((r as any).id);
  return flagged;
}
