import { describe, it, expect } from 'vitest';
import { enrichFromWebsite, stripHtml } from '../src/enrich';

const html = `<html><body><h1>Ada Jewels</h1><p>Call +441511234567 or mail ada@shop.co.uk</p><script>var x=1;</script></body></html>`;
const fakeFetch = (async () => new Response(html, { status: 200 })) as unknown as typeof fetch;

describe('website enrichment', () => {
  it('strips scripts and tags', () => {
    const t = stripHtml(html);
    expect(t).not.toContain('var x=1');
    expect(t).toContain('Ada Jewels');
  });
  it('extracts contacts from homepage text', async () => {
    const r = await enrichFromWebsite('https://example.com', fakeFetch);
    expect(r.emails).toContain('ada@shop.co.uk');
    expect(r.phones.length).toBeGreaterThan(0);
  });
  it('rejects non-http URLs safely', async () => {
    expect(await enrichFromWebsite('not a url', fakeFetch)).toEqual({ phones: [], emails: [] });
  });
});
