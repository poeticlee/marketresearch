import { describe, it, expect } from 'vitest';
import { fetchPageCandidates, robotsAllowsSiteRoot, isPublicHttpUrl, userUrlConnector } from '../src/userUrl';

const page = `<html><body><h1>Iwo Road Auto Works</h1><p>Tel: +2348012345678, mail: autos@example.ng, 14 Iwo Road, Ibadan</p></body></html>`;
const okRobots = 'User-agent: *\nDisallow: /private/\n';
const blockedRobots = 'User-agent: *\nDisallow: /\n';

function fakeFetch(map: Record<string, string>) {
  return (async (u: string) => {
    const body = Object.entries(map).find(([k]) => u.startsWith(k))?.[1];
    if (body === undefined) return new Response('nf', { status: 404 });
    return new Response(body, { status: 200 });
  }) as unknown as typeof fetch;
}

describe('user-url connector', () => {
  it('rejects non-http URLs', () => {
    expect(isPublicHttpUrl('not a url')).toBe(false);
    expect(isPublicHttpUrl('ftp://x/y')).toBe(false);
    expect(isPublicHttpUrl('https://example.com/a')).toBe(true);
  });
  it('extracts contacts from a supplied page', async () => {
    const out = await fetchPageCandidates(
      'https://example.com/shop',
      fakeFetch({ 'https://example.com/robots.txt': okRobots, 'https://example.com/shop': page })
    );
    expect(out.length).toBe(1);
    expect(out[0].emails).toContain('autos@example.ng');
    expect(out[0].sourceUrl).toBe('https://example.com/shop');
  });
  it('respects site-wide robots Disallow', async () => {
    expect(await robotsAllowsSiteRoot('https://blocked.com/x', fakeFetch({ 'https://blocked.com/robots.txt': blockedRobots }))).toBe(false);
    const out = await fetchPageCandidates(
      'https://blocked.com/x',
      fakeFetch({ 'https://blocked.com/robots.txt': blockedRobots, 'https://blocked.com/x': page })
    );
    expect(out).toEqual([]);
  });
  it('connector yields nothing without urls', async () => {
    let n = 0;
    for await (const _ of userUrlConnector.search({ text: 'x', country: 'NG' })) n++;
    expect(n).toBe(0);
  });
});
