import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
import { validateBrief } from '@gcrp/compliance';
import { overpassConnector, registryConnector } from '@gcrp/sources';
import { randomUUID } from 'crypto';

// POST { rawText, country, city?, sector?, purpose?, projectId? }
// Validates the brief, fans out to live connectors, stores candidates.
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
  const q = { text: brief.rewrittenBrief || b.rawText, country: b.country || 'NG', city: b.city, sector: b.sector };
  const found: unknown[] = [];
  const connectors = [overpassConnector, registryConnector];
  for (const conn of connectors) {
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
        found.push({ name: rec.name, phones: rec.phones, emails: rec.emails, address: rec.address, sourceUrl: rec.sourceUrl });
        if (found.length >= 100) break;
      }
    } catch {
      // One source failing must not kill the search.
    }
    if (found.length >= 100) break;
  }
  return NextResponse.json({ brief, count: found.length, records: found });
}
