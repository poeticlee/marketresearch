import { describe, it, expect } from 'vitest';
import { buildTextSearchUrl, textResultToCandidate, mapConnector } from '../src/mapApi';

describe('map connector', () => {
  it('builds a text-search URL', () => {
    const u = buildTextSearchUrl('jewellers Manchester GB', 'KEY');
    expect(u).toContain('query=jewellers%20Manchester%20GB');
    expect(u).toContain('key=KEY');
  });
  it('maps results, skips nameless', () => {
    expect(textResultToCandidate({})).toBeNull();
    const c = textResultToCandidate({ name: 'A', formatted_address: 'X', place_id: 'P', types: ['car_repair'] })!;
    expect(c.category).toBe('car repair');
    expect(c.sourceUrl).toContain('place_id:P');
  });
  it('yields nothing without a key (never scrapes instead)', async () => {
    delete process.env.MAP_API_KEY;
    let n = 0;
    for await (const _ of mapConnector.search({ text: 'x', country: 'NG' })) n++;
    expect(n).toBe(0);
  });
});
