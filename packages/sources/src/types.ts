import type { ContactRecord } from '@gcrp/core';
export interface RawCandidate { name: string; phones: string[]; emails: string[]; address?: string; category?: string; sourceUrl: string; entityType?: ContactRecord['entityType'] }
export interface SourceConnector { id: string; countries: string[]; accessMethod: string; termsNotes: string; search(brief: { text: string; country: string; city?: string; sector?: string }): AsyncIterable<RawCandidate> }
