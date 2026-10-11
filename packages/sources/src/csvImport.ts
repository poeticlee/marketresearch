import type { SourceConnector, RawCandidate } from './types.js';
export function parseCsv(text: string): RawCandidate[] {
  const lines = text.trim().split(/\r?\n/); const head = lines.shift()!.split(',').map(s=>s.trim().toLowerCase());
  return lines.map(l => {
    const cols = l.split(','); const o: any = {}; head.forEach((h,i)=>o[h]=(cols[i]||'').trim());
    return { name: o.name||'Unknown', phones: o.phone?[o.phone]:[], emails: o.email?[o.email]:[], address: o.address, category: o.category, sourceUrl: 'csv://upload', entityType: 'business' as const };
  });
}
export const csvConnector: SourceConnector = { id:'csv-import', countries:['*'], accessMethod:'manual import with uploader declaration', termsNotes:'Uploader declares right to share', async *search(){ } };
