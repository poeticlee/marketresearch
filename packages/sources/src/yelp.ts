import type { SourceConnector, RawCandidate } from './types';

// Yelp Fusion API: free tier key (no credit card), 5000 calls/day.
// GET /v3/businesses/search returns display_phone + address per business.
// Requires YELP_API_KEY. No key -> no calls.
const BASE = 'https://api.yelp.com/v3';

export function buildSearchUrl(term: string, location: string): string {
  return `${BASE}/businesses/search?term=${encodeURIComponent(term)}&location=${encodeURIComponent(location)}&limit=20`;
}

export interface YelpBusiness {
  name?: string;
  display_phone?: string;
  location?: { display_address?: string[] };
  categories?: Array<{ title?: string }>;
  url?: string;
}

export function businessToCandidate(b: YelpBusiness): RawCandidate | null {
  if (!b.name) return null;
  return {
    name: b.name,
    phones: b.display_phone ? [b.display_phone] : [],
    emails: [],
    address: b.location?.display_address?.join(', '),
    category: b.categories?.[0]?.title,
    sourceUrl: b.url || 'https://www.yelp.com/',
    entityType: 'business',
  };
}

async function* runLive(brief: { text: string; country: string; city?: string; sector?: string }): AsyncIterable<RawCandidate> {
  const key = process.env.YELP_API_KEY;
  if (!key) return;
  const term = brief.sector || brief.text;
  const location = [brief.city, brief.country].filter(Boolean).join(', ');
  const res = await fetch(buildSearchUrl(term, location), {
    headers: { Authorization: `Bearer ${key}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return;
  const j = await res.json();
  for (const b of ((j.businesses || []) as YelpBusiness[]).slice(0, 20)) {
    const c = businessToCandidate(b);
    if (c) yield c;
  }
}

export const yelpConnector: SourceConnector = {
  id: 'yelp-fusion',
  countries: ['GB', 'US', 'CA', 'NG', 'GH', 'KE', 'ZA'],
  accessMethod: 'official API, free-tier key',
  termsNotes: 'Yelp Fusion ToS: attribution + display requirements apply; review before production',
  search: runLive,
};
