// Website enrichment: for candidates that have a business website but no
// phone/email, fetch the public homepage (polite: timeout, 500KB cap,
// 1s delay between fetches) and extract contact details from its text.
import { extractFromPageText } from './extract';

export interface EnrichResult { phones: string[]; emails: string[] }

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .slice(0, 20000);
}

export async function enrichFromWebsite(
  website: string,
  fetchFn: typeof fetch = fetch
): Promise<EnrichResult> {
  let u: URL;
  try {
    u = new URL(website);
  } catch {
    return { phones: [], emails: [] };
  }
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return { phones: [], emails: [] };
  await new Promise((r) => setTimeout(r, 1000));
  const res = await fetchFn(u.toString(), {
    headers: { 'User-Agent': 'ContactResearchPlatform/0.1 (contact enrichment)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return { phones: [], emails: [] };
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 500 * 1024) return { phones: [], emails: [] };
  const text = stripHtml(new TextDecoder().decode(buf.slice(0, 500 * 1024)));
  const recs = extractFromPageText({
    projectId: 'enrich',
    country: 'XX',
    sourceId: 'enrich',
    sourceUrl: u.toString(),
    pageText: text,
  });
  if (!recs.length) return { phones: [], emails: [] };
  return { phones: recs[0].phones.slice(0, 3), emails: recs[0].emails.slice(0, 3) };
}
