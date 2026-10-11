import { NextResponse } from 'next/server';
import { store } from '@gcrp/db';
import { parseCsv } from '@gcrp/sources';
import { randomUUID } from 'crypto';

// POST { csv, projectId?, country? } — header row: name,email,phone,address,category
export async function POST(req: Request) {
  const b = await req.json();
  if (typeof b.csv !== 'string' || !b.csv.trim()) return NextResponse.json({ error: 'csv text required' }, { status: 400 });
  const rows = parseCsv(b.csv);
  const projectId = b.projectId || 'demo';
  const country = b.country || 'NG';
  for (const r of rows) {
    store.saveRecord(
      {
        id: randomUUID(),
        projectId,
        entityType: 'business',
        name: r.name,
        phones: r.phones,
        emails: r.emails,
        address: r.address,
        country,
        category: r.category,
        selfDeclaredTags: [],
        sourceId: 'csv-import',
        sourceUrl: 'csv://upload',
        collectedAt: new Date().toISOString(),
        confidence: 0.7,
        status: 'candidate',
        retentionUntil: new Date(Date.now() + 180 * 864e5).toISOString(),
      } as never,
      'csv-import'
    );
  }
  return NextResponse.json({ count: rows.length });
}
