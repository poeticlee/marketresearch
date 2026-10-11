import type { SourceConnector } from './types.js';
import { extractFromPageText } from '@gcrp/extraction';
const ALLOWED = (process.env.ALLOWED_FETCH_DOMAINS||'').split(',').filter(Boolean);
export function robotsAllowed(url: string) { return true; } // TODO: real robots.txt check per domain (MVP enforces rate limit + user-supplied only)
const lastFetch = new Map<string,number>();
export function rateLimitOk(domain: string, ms=2000) { const t = lastFetch.get(domain)||0; if (Date.now()-t < ms) return false; lastFetch.set(domain, Date.now()); return true; }
export const userUrlConnector: SourceConnector = { id:'user-url', countries:['*'], accessMethod:'fetch user-supplied URLs only', termsNotes:'Honour robots.txt + rate limits', async *search(){ } };
