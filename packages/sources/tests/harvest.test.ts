import { describe, it, expect } from 'vitest';
import { harvestContacts, enrichable, type SearchBrief } from '../src/harvest';
import type { SourceConnector, RawCandidate } from '../src/types';

function fakeConn(id: string, rows: RawCandidate[]): SourceConnector {
  return {
    id, countries: ['*'], accessMethod: 'test', termsNotes: 'test',
    async *search(_brief: SearchBrief) { for (const r of rows) yield r; },
  };
}

describe('harvest layer', () => {
  it('skips directory hosts for enrichment', () => {
    expect(enrichable('https://www.openstreetmap.org/node/1')).toBe(false);
    expect(enrichable('https://shop.example.ng')).toBe(true);
    expect(enrichable('not a url')).toBe(false);
  });
  it('discovers, dedupes, enriches contact-less sites', async () => {
    const a = fakeConn('a', [
      { name: 'Shop A', phones: ['+2341'], emails: [], sourceUrl: 'https://a.example' },
      { name: 'Shop B', phones: [], emails: [], sourceUrl: 'https://b.example' },
      { name: 'Shop B', phones: [], emails: [], sourceUrl: 'https://b.example' },
    ]);
    const report = await harvestContacts(
      { text: 'x', country: 'NG' },
      { connectors: [a], enrich: async () => ({ phones: [], emails: ['b@example.ng'] }) }
    );
    expect(report.discovered).toBe(2);
    expect(report.enriched).toBe(1);
    expect(report.withPhone).toBe(1);
    expect(report.withEmail).toBe(1);
  });
  it('one failing connector does not kill the harvest', async () => {
    const bad: SourceConnector = {
      id: 'bad', countries: ['*'], accessMethod: 't', termsNotes: 't',
      async *search(_brief: SearchBrief): AsyncIterable<RawCandidate> { throw new Error('down'); yield; },
    };
    const good = fakeConn('good', [{ name: 'G', phones: [], emails: [], sourceUrl: 'https://g.example' }]);
    const report = await harvestContacts({ text: 'x', country: 'NG' }, { connectors: [bad, good], enrich: async () => ({ phones: [], emails: [] }) });
    expect(report.discovered).toBe(1);
  });
});
