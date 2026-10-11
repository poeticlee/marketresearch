import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
import { validateBrief } from '@gcrp/compliance';
import { overpassConnector, registryConnector, mapConnector, yelpConnector, userUrlConnector } from '@gcrp/sources';
import { enrichFromWebsite } from '@gcrp/extraction';
import { randomUUID } from 'crypto';

// POST { rawText, country, city?, sector?, purpose?, projectId?, enrich? }
// Validates the brief, fans out to live connectors, stores candidates.
// enrich=true fetches business homepages (max 10) to fill missing contacts.
export async function POST(req: Request) {
  const b = await req.json();
  const brief = validateBrief({
    projectId: b.projectId || 'demo',
    rawText: b.rawText || '',
    country: b.country || 'NG',
    city: b.city,
    sector: b.sector,
    descriptor: b.descriptor,
    purpose: b.purpose || '',
    actor: 'web-search',
  });
  if (brief.status === 'rejected') return NextResponse.json({ brief }, { status: 422 });
  const q = { text: brief.rewrittenBrief || b.rawText, country: b.country || 'NG', city: b.city, sector: b.sector, urls: Array.isArray(b.urls) ? b.urls.filter((u: unknown) => typeof u === 'string').slice(0, 20) : [] };
  const found: unknown[] = [];
  const sourceCounts: Record<string, number> = {};
  const connectors = [userUrlConnector, overpassConnector, yelpConnector, mapConnector, registryConnector];
  for (const conn of connectors) {
    let n = 0;
    try {
      for await (const c of conn.search(q)) {
        const rec = {
          id: randomUUID(),
          projectId: brief.projectId,
          entityType: c.entityType || 'business',
          name: c.name,
          phones: c.phones,
          emails: c.emails,
          address: c.address,
          country: q.country,
          category: c.category,
          selfDeclaredTags: [],
          sourceId: conn.id,
          sourceUrl: c.sourceUrl,
          collectedAt: new Date().toISOString(),
          confidence: 0.6,
          status: 'candidate',
          retentionUntil: new Date(Date.now() + 180 * 864e5).toISOString(),
        };
        store.saveRecord(rec as never, 'web-search');
        found.push({ id: rec.id, name: rec.name, phones: rec.phones, emails: rec.emails, address: rec.address, sourceUrl: rec.sourceUrl });
        n++;
        if (found.length >= 100) break;
      }
    } catch (e) {
      // One source failing must not kill the search.
      sourceCounts[conn.id + ':error'] = 1;
    }
    sourceCounts[conn.id] = n;
    if (found.length >= 100) break;
  }
  if (b.enrich === true) {
    let done = 0;
    for (const r of found as Array<{ id: string; phones: string[]; emails: string[]; sourceUrl: string }>) {
      if (done >= 10) break;
      if (r.phones.length || r.emails.length) continue;
      if (!/^https?:\/\//.test(r.sourceUrl)) continue;
      try {
        const extra = await enrichFromWebsite(r.sourceUrl);
        if (extra.phones.length || extra.emails.length) {
          r.phones = [...new Set([...r.phones, ...extra.phones])];
          r.emails = [...new Set([...r.emails, ...extra.emails])];
          const stored = store.records.get(r.id) as unknown as { phones: string[]; emails: string[] } | undefined;
          if (stored) {
            stored.phones = r.phones;
            stored.emails = r.emails;
          }
        }
      } catch {
        // Enrichment is best-effort.
      }
      done++;
    }
  }
  return NextResponse.json({ brief, count: found.length, records: found, sources: sourceCounts });
}
