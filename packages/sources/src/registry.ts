import type { SourceConnector } from './types.js';
// Public registry connector (one country at a time, terms reviewed in DECISIONS.md)
export const registryConnector: SourceConnector = { id:'public-registry', countries:['GB'], accessMethod:'bulk download / permitted API', termsNotes:'UK Companies House terms reviewed; non-commercial use check', async *search(){ yield { name:'Example Ltd (registry fixture)', phones:[], emails:['info@example.co.uk'], address:'Liverpool, UK', sourceUrl:'https://find-and-update.company-information.service.gov.uk/', entityType:'business' }; } };
