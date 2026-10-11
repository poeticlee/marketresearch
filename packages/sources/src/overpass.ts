// Live keyless source: OpenStreetMap via Nominatim (geocode) + Overpass (POIs).
// Policy: attribution to OSM contributors, <=1 req/s, identifying User-Agent,
// small result caps. Never scrape; both endpoints are public APIs.
import type { SourceConnector, RawCandidate } from './types';

const NOMINATIM = process.env.NOMINATIM_URL || 'https://nominatim.openstreetmap.org';
const OVERPASS_URLS = (process.env.OVERPASS_URLS || process.env.OVERPASS_URL || 'https://overpass-api.de/api/interpreter').split(',').map((s) => s.trim()).filter(Boolean);
const CONTACT = process.env.CONTACT_EMAIL || 'contact@example.com';
const UA = `ContactResearchPlatform/0.1 (${CONTACT})`;

let lastCall = 0;
async function throttle(ms = 1200) {
  const wait = ms - (Date.now() - lastCall);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

// Sector keyword -> OSM tag filters.
export function tagsForSector(sectorText: string): string[] {
  const s = sectorText.toLowerCase();
  if (/mechanic|auto|car repair|motor/.test(s)) return ['["shop"="car_repair"]', '["craft"="motor_vehicle"]'];
  if (/jewell?ers?|jewelry/.test(s)) return ['["shop"="jewelry"]'];
  if (/tailor|fashion/.test(s)) return ['["shop"="clothes"]', '["craft"="tailor"]'];
  if (/pharm/.test(s)) return ['["amenity"="pharmacy"]'];
  if (/restaurant|food|eatery/.test(s)) return ['["amenity"="restaurant"]', '["amenity"="fast_food"]'];
  return ['["shop"]', '["craft"]'];
}

export interface Geo { bbox: Bbox; lat: number; lon: number }
export interface Bbox { south: number; west: number; north: number; east: number }

export async function geocodeCity(city: string, country: string): Promise<Geo | null> {
  await throttle();
  const url = `${NOMINATIM}/search?format=json&limit=1&city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}`;
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) return null;
  const j = (await res.json()) as Array<{ boundingbox: [string, string, string, string]; lat: string; lon: string }>;
  if (!j.length) return null;
  const [south, north, west, east] = j[0].boundingbox.map(Number);
  return { bbox: { south, west, north, east }, lat: Number(j[0].lat), lon: Number(j[0].lon) };
}

// Radius query around the city centre: far cheaper than whole-metro bbox.
export function buildOverpassQuery(geo: Geo, tagFilters: string[], cap = 50, radiusM = 10000): string {
  const around = `around:${radiusM},${geo.lat},${geo.lon}`;
  const bodies = tagFilters.map((t) => `node${t}(${around});way${t}(${around});`).join('');
  return `[out:json][timeout:25];(${bodies});out center tags ${cap};`;
}

// Back-compat for bbox callers.
export function buildBboxQuery(bbox: Bbox, tagFilters: string[], cap = 50): string {
  const b = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const bodies = tagFilters.map((t) => `node${t}(${b});way${t}(${b});`).join('');
  return `[out:json][timeout:25];(${bodies});out center tags ${cap};`;
}

export interface OsmElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export function elementToCandidate(el: OsmElement): RawCandidate | null {
  const tags = el.tags || {};
  const name = tags.name;
  if (!name) return null;
  const addr = [tags['addr:housenumber'], tags['addr:street'], tags['addr:suburb'], tags['addr:city']].filter(Boolean).join(', ');
  const phones = tags.phone ? [tags.phone] : [];
  const emails = tags.email ? [tags.email] : [];
  const url = `https://www.openstreetmap.org/${el.type}/${el.id}`;
  return {
    name,
    phones,
    emails,
    address: addr || undefined,
    category: tags.shop || tags.craft || tags.amenity,
    sourceUrl: tags.website || url,
    entityType: 'business',
  };
}

export function parseOverpassResponse(json: { elements?: OsmElement[] }): RawCandidate[] {
  return ((json.elements || []) as OsmElement[])
    .map(elementToCandidate)
    .filter((c): c is RawCandidate => c !== null);
}

async function* runLive(brief: { text: string; country: string; city?: string; sector?: string }): AsyncIterable<RawCandidate> {
  const city = brief.city || brief.text.match(/in\s+([A-Za-z ]+)/)?.[1]?.trim();
  if (!city) return;
  const geo = await geocodeCity(city, brief.country);
  if (!geo) return;
  const tags = tagsForSector(`${brief.sector || ''} ${brief.text}`);
  const query = buildOverpassQuery(geo, tags);
  await throttle();
  for (let attempt = 0; attempt < 2; attempt++) {
    for (const endpoint of OVERPASS_URLS) {
      try {
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
          body: 'data=' + encodeURIComponent(query),
          signal: AbortSignal.timeout(35000),
        });
        if (!res.ok) continue; // busy/failing instance -> try next mirror
        const json = await res.json();
        for (const c of parseOverpassResponse(json)) yield c;
        return;
      } catch {
        // Timeout or network error -> try next mirror.
      }
    }
    await new Promise((r) => setTimeout(r, 3000)); // overloaded dispatchers sometimes clear
  }
}

export const overpassConnector: SourceConnector = {
  id: 'osm-overpass',
  countries: ['*'],
  accessMethod: 'public API (Nominatim + Overpass), attribution required, rate-limited',
  termsNotes: 'ODbL: credit OpenStreetMap contributors on every export using this source',
  search: runLive,
};
