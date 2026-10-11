import type { SourceConnector, RawCandidate } from './types';

// Official Google Places API (Text Search + Place Details for phone/website).
// Requires MAP_API_KEY. Quota-safe: capped results, details fetched only for
// candidates missing contact data, sequential with delay. No key -> no calls.
const BASE = process.env.MAP_API_BASE || 'https://maps.googleapis.com';

export function buildTextSearchUrl(query: string, key: string): string {
  return `${BASE}/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${key}`;
}

export interface PlacesTextResult {
  name?: string;
  formatted_address?: string;
  place_id?: string;
  types?: string[];
}

export function textResultToCandidate(r: PlacesTextResult): RawCandidate | null {
  if (!r.name) return null;
  return {
    name: r.name,
    phones: [],
    emails: [],
    address: r.formatted_address,
    category: r.types?.[0]?.replace(/_/g, ' '),
    sourceUrl: r.place_id ? `https://www.google.com/maps/place/?q=place_id:${r.place_id}` : 'https://maps.google.com/',
    entityType: 'business',
  };
}

async function placeDetailsPhone(placeId: string, key: string): Promise<{ phone?: string; website?: string }> {
  await new Promise((r) => setTimeout(r, 300));
  const url = `${BASE}/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&fields=formatted_phone_number,website&key=${key}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return {};
  const j = await res.json();
  return { phone: j.result?.formatted_phone_number, website: j.result?.website };
}

async function* runLive(brief: { text: string; country: string; city?: string; sector?: string }): AsyncIterable<RawCandidate> {
  const key = process.env.MAP_API_KEY;
  if (!key) return;
  const query = [brief.sector || brief.text, brief.city, brief.country].filter(Boolean).join(' ');
  const res = await fetch(buildTextSearchUrl(query, key), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) return;
  const j = await res.json();
  const results = ((j.results || []) as PlacesTextResult[]).slice(0, 20);
  for (const r of results) {
    const c = textResultToCandidate(r);
    if (!c) continue;
    if (!c.phones.length && r.place_id) {
      try {
        const d = await placeDetailsPhone(r.place_id, key);
        if (d.phone) c.phones = [d.phone];
        if (d.website) c.sourceUrl = d.website;
      } catch {
        // Details failing must not drop the candidate.
      }
    }
    yield c;
  }
}

export const mapConnector: SourceConnector = {
  id: 'map-api',
  countries: ['NG', 'GB', 'US', 'CA', 'GH', 'KE', 'ZA'],
  accessMethod: 'official API',
  termsNotes: 'Google Maps Platform ToS: quota, caching and display rules apply; review before production',
  search: runLive,
};
