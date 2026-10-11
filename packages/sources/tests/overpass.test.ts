import { describe, it, expect } from 'vitest';
import { tagsForSector, buildOverpassQuery, parseOverpassResponse } from '../src/overpass';

describe('overpass connector (offline fixtures)', () => {
  it('maps sectors to OSM tags', () => {
    expect(tagsForSector('mechanics')[0]).toMatch(/car_repair/);
    expect(tagsForSector('female jewellers')[0]).toMatch(/jewelry/);
    expect(tagsForSector('unknown xyz')[0]).toMatch(/shop/);
  });
  it('builds a bounded query with cap', () => {
    const q = buildOverpassQuery({ south: 1, west: 2, north: 3, east: 4 }, ['["shop"="jewelry"]'], 50);
    expect(q).toContain('1,2,3,4');
    expect(q).toContain('out center tags 50');
  });
  it('parses elements, skips unnamed, never hallucinates contacts', () => {
    const out = parseOverpassResponse({
      elements: [
        { type: 'node', id: 1, tags: { name: 'Ada Jewels', shop: 'jewelry', phone: '+441511234567', 'addr:street': 'Bold St' } },
        { type: 'node', id: 2, tags: { shop: 'jewelry' } },
        { type: 'node', id: 3, tags: { name: 'No Contact Autos', shop: 'car_repair' } },
      ],
    });
    expect(out.length).toBe(2);
    expect(out[0].phones).toEqual(['+441511234567']);
    expect(out[1].phones).toEqual([]);
    expect(out[1].emails).toEqual([]);
  });
});
