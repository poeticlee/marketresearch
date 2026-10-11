import type { SourceConnector } from './types.js';
// Official map/business listing API. Respects quotas/caching. Requires MAP_API_KEY.
export const mapConnector: SourceConnector = {
  id:'map-api', countries:['NG','GB','US','CA','GH','KE','ZA'], accessMethod:'official API', termsNotes:'Respect ToS, quotas, cache rules',
  async *search(brief) {
    const key = process.env.MAP_API_KEY; if (!key) return; // no key -> no calls, never scrape instead
    // Placeholder: real fetch goes here with rate limiting. Intentionally minimal for MVP.
  }
};
