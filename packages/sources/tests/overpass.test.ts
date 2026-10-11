import { describe, it, expect } from 'vitest';
import { tagsForSector, buildOverpassQuery, buildBboxQuery, parseOverpassResponse } from '../src/overpass';

describe('overpass connector (offline fixtures)', () => {
  it('maps sectors to OSM tags', () => {
    expect(tagsForSector('mechanics')[0]).toMatch(/car_repair/);
    expect(tagsForSector('female jewellers')[0]).toMatch(/jewelry/);
    expect(tagsForSector('unknown xyz')[0]).toMatch(/shop/);
  });
  it('builds radius + bounded queries with cap', () => {
    const geo = { bbox: { south: 1, west: 2, north: 3, east: 4 }, lat: 53.48, lon: -2.24 };
    const q = buildOverpassQuery(geo, ['["shop"="jewelry"]'], 50);
    expect(q).toContain('around:10000,53.48,-2.24');
    expect(q).toContain('out center tags 50');
    const bq = buildBboxQuery(geo.bbox, ['["shop"="jewelry"]'], 50);
    expect(bq).toContain('1,2,3,4');
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
