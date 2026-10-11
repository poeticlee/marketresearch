import type { SourceConnector, RawCandidate, SearchBrief } from './types';
import { extractFromPageText } from '@gcrp/extraction';
import { stripHtml } from '@gcrp/extraction';

const lastFetch = new Map<string, number>();
export function rateLimitOk(domain: string, ms = 2000) {
  const t = lastFetch.get(domain) || 0;
  if (Date.now() - t < ms) return false;
  lastFetch.set(domain, Date.now());
  return true;
}

export function isPublicHttpUrl(u: string): boolean {
  try {
    const p = new URL(u);
    return p.protocol === 'http:' || p.protocol === 'https:';
  } catch {
    return false;
  }
}

// Fetch robots.txt and honour a Disallow for '/' ( site-wide block).
// Page-specific rules are out of scope for MVP; site-wide blocks are respected.
export async function robotsAllowsSiteRoot(url: string, fetchFn: typeof fetch = fetch): Promise<boolean> {
  const p = new URL(url);
  try {
    const res = await fetchFn(`${p.protocol}//${p.host}/robots.txt`, {
      headers: { 'User-Agent': 'ContactResearchPlatform/0.1' },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return true; // no robots file -> allowed
    const txt = await res.text();
    return !/^\s*Disallow\s*:\s*\/\s*$/im.test(txt);
  } catch {
    return true; // unreachable robots file -> allowed, page fetch still guarded
  }
}

export async function fetchPageCandidates(pageUrl: string, fetchFn: typeof fetch = fetch): Promise<RawCandidate[]> {
  if (!isPublicHttpUrl(pageUrl)) return [];
  const host = new URL(pageUrl).host;
  if (!rateLimitOk(host)) return [];
  if (!(await robotsAllowsSiteRoot(pageUrl, fetchFn))) return [];
  const res = await fetchFn(pageUrl, {
    headers: { 'User-Agent': 'ContactResearchPlatform/0.1 (user-supplied page fetch)' },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return [];
  const buf = await res.arrayBuffer();
  if (buf.byteLength > 500 * 1024) return [];
  const text = stripHtml(new TextDecoder().decode(buf.slice(0, 500 * 1024)));
  const recs = extractFromPageText({ projectId: 'user-url', country: 'XX', sourceId: 'user-url', sourceUrl: pageUrl, pageText: text }) as Array<{ name: string; phones: string[]; emails: string[]; address?: string; category?: string; entityType: RawCandidate['entityType'] }>;
  return recs.map((r) => ({
    name: r.name,
    phones: r.phones.slice(0, 5),
    emails: r.emails.slice(0, 5),
    address: r.address,
    category: r.category,
    sourceUrl: pageUrl,
    entityType: r.entityType,
  }));
}

async function* runLive(brief: SearchBrief): AsyncIterable<RawCandidate> {
  for (const u of (brief.urls || []).slice(0, 20)) {
    try {
      for (const c of await fetchPageCandidates(u)) yield c;
    } catch {
      // One bad URL must not kill the batch.
    }
  }
}

export const userUrlConnector: SourceConnector = {
  id: 'user-url',
  countries: ['*'],
  accessMethod: 'fetch user-supplied URLs only',
  termsNotes: 'User declares the right to fetch; robots.txt site-wide Disallow respected; 2s per-domain rate limit',
  search: runLive,
};
