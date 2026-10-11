import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
import { validateBrief } from '@gcrp/compliance';
import { harvestContacts } from '@gcrp/sources';
import { randomUUID } from 'crypto';

// POST { rawText, country, city?, sector?, urls? }
// One-call pipeline: validate -> discover websites -> extract contacts -> store.
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
    actor: 'web-harvest',
  });
  if (brief.status === 'rejected') return NextResponse.json({ brief }, { status: 422 });
  const report = await harvestContacts({
    text: b.rawText,
    country: b.country || 'NG',
    city: b.city,
    sector: b.sector,
    urls: Array.isArray(b.urls) ? b.urls.filter((u: unknown) => typeof u === 'string').slice(0, 20) : [],
  });
  for (const r of report.records) {
    store.saveRecord(
      {
        id: randomUUID(),
        projectId: brief.projectId,
        entityType: r.entityType || 'business',
        name: r.name,
        phones: r.phones,
        emails: r.emails,
        address: r.address,
        country: b.country || 'NG',
        category: r.category,
        selfDeclaredTags: [],
        sourceId: r.sourceId,
        sourceUrl: r.sourceUrl,
        collectedAt: new Date().toISOString(),
        confidence: r.phones.length || r.emails.length ? 0.75 : 0.5,
        status: 'candidate',
        retentionUntil: new Date(Date.now() + 180 * 864e5).toISOString(),
      } as never,
      'web-harvest'
    );
  }
  return NextResponse.json({
    brief,
    stages: { discovered: report.discovered, enriched: report.enriched, withPhone: report.withPhone, withEmail: report.withEmail },
    records: report.records.map(({ sourceId, ...r }) => r),
  });
}
