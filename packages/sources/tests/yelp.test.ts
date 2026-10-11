import { describe, it, expect } from 'vitest';
import { buildSearchUrl, businessToCandidate, yelpConnector } from '../src/yelp';

describe('yelp connector', () => {
  it('builds a search URL', () => {
    expect(buildSearchUrl('jewellers', 'Manchester, GB')).toContain('term=jewellers');
  });
  it('maps businesses with phones, skips nameless', () => {
    expect(businessToCandidate({})).toBeNull();
    const c = businessToCandidate({ name: 'A', display_phone: '+44 161 000 000', location: { display_address: ['1 Main St'] }, categories: [{ title: 'Jewelry' }], url: 'https://yelp.com/biz/a' })!;
    expect(c.phones).toEqual(['+44 161 000 000']);
    expect(c.category).toBe('Jewelry');
  });
  it('yields nothing without a key', async () => {
    delete process.env.YELP_API_KEY;
    let n = 0;
    for await (const _ of yelpConnector.search({ text: 'x', country: 'GB' })) n++;
    expect(n).toBe(0);
  });
});
