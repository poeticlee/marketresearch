// Harvest layer: location/sector in -> discover business websites ->
// fetch homepages -> phones/emails out, with stage counts.
// Skips known directory pages (no contacts in raw HTML) to save time.
import type { RawCandidate, SearchBrief, SourceConnector } from './types';
import { overpassConnector } from './overpass';
import { yelpConnector } from './yelp';
import { mapConnector } from './mapApi';
import { registryConnector } from './registry';
import { userUrlConnector } from './userUrl';
import { enrichFromWebsite } from '@gcrp/extraction';

export const ALL_CONNECTORS: SourceConnector[] = [userUrlConnector, overpassConnector, yelpConnector, mapConnector, registryConnector];

const SKIP_ENRICH_HOSTS = ['openstreetmap.org', 'google.com', 'yelp.com', 'find-and-update.company-information.service.gov.uk'];

export function enrichable(url: string): boolean {
  let host = '';
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    host = u.host;
  } catch {
    return false;
  }
  return !SKIP_ENRICH_HOSTS.some((h) => host.endsWith(h));
}

export interface HarvestResult {
  discovered: number;
  enriched: number;
  withPhone: number;
  withEmail: number;
  records: Array<RawCandidate & { sourceId: string }>;
}

export async function harvestContacts(
  brief: SearchBrief,
  deps: {
    connectors?: SourceConnector[];
    enrichLimit?: number;
    enrich?: (url: string) => Promise<{ phones: string[]; emails: string[] }>;
  } = {}
): Promise<HarvestResult> {
  const connectors = deps.connectors || ALL_CONNECTORS;
  const enrichLimit = deps.enrichLimit ?? 10;
  const enrich = deps.enrich || enrichFromWebsite;
  const seen = new Set<string>();
  const records: Array<RawCandidate & { sourceId: string }> = [];
  for (const conn of connectors) {
    try {
      for await (const c of conn.search(brief)) {
        const key = (c.name + '|' + c.sourceUrl).toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        records.push({ ...c, sourceId: conn.id });
        if (records.length >= 100) break;
      }
    } catch {
      // One source failing must not kill the harvest.
    }
    if (records.length >= 100) break;
  }
  let enriched = 0;
  for (const r of records) {
    if (enriched >= enrichLimit) break;
    if (r.phones.length || r.emails.length) continue;
    if (!enrichable(r.sourceUrl)) continue;
    try {
      const extra = await enrich(r.sourceUrl);
      if (extra.phones.length || extra.emails.length) {
        r.phones = [...new Set([...r.phones, ...extra.phones])];
        r.emails = [...new Set([...r.emails, ...extra.emails])];
        enriched++;
      }
    } catch {
      // Best-effort per site.
    }
  }
  return {
    discovered: records.length,
    enriched,
    withPhone: records.filter((r) => r.phones.length).length,
    withEmail: records.filter((r) => r.emails.length).length,
    records,
  };
}
