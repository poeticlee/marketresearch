// Validation modes. Owner set relaxed as default: demographic descriptors
// (female, Nigerian-community, etc.) are plain search keywords over PUBLIC
// business listings. Only abuse and private-data sourcing stay blocked.
import { randomUUID } from 'crypto';
import type { Brief } from '@gcrp/core';

export type ValidationMode = 'relaxed' | 'strict';
export function validationMode(): ValidationMode {
  return process.env.VALIDATION_MODE === 'strict' ? 'strict' : 'relaxed';
}

// Barest minimum block list: abuse + private sourcing only.
const ALWAYS_BLOCK = [
  /stalk|harass|doxx|dox\b/i,
  /fraud|scam|bank-linked/i,
  /scrape.*private|private.*group|leaked|breach|login-walled/i,
  /home (addresses?|numbers?|phones?)/i,
];

// Strict-mode lists (legacy bible 2.1 behaviour, kept for opt-in use).
const PROTECTED = [/\bnigerians?\b/i, /\bghanaians?\b/i, /\bindians?\b/i, /female entrepreneurs?/i, /\bmuslims?\b/i, /\bchristians?\b/i, /\bjews?\b/i, /jewish/i, /gay|lesbian|lgbt/i, /hiv|diabet|patients? by health|health condition/i, /immigrants?|illegal|undocumented migrants?|immigration status/i, /political|apc|pdp|labour voters?|activists|opposition/i, /stalk|harass|doxx|dox|fraud|scam|bank-linked/i, /yoruba|hausa|igbo|tribe|tribal/i, /mosque|church members?|attendees/i, /infer|guess|identify .* (religion|ethnicity|gender)|by (name|photo|picture)|looking at .*pictures?|from photos?|from names?|name analysis/i, /photo|picture/i, /personal (emails?|phones?|numbers?|contacts?|whatsapp)/i, /home (addresses?|numbers?|phones?)/i, /female students?/i, /white-owned|black-owned/i, /scrape|private .*group|leaked|breach/i, /sexuality|lgbtq/i, /muslim|christian|religion/i, /women business owners/i, /female traders/i, /\bfemale\s+(?!owned\b)[a-z]+\b/i];
const INDIVIDUAL_HINT = [/find (people|persons|individuals|women|men|patients|students|activists|migrants) /i, /^\s*(nigerians|women|men|muslims|christians|jewish)/i, /by (ethnicity|gender|religion|name|photo)/i, /personal/i, /home (address|number)/i, /attendees/i, /members? (private|personal|health)/i];

export interface ValidateInput { projectId: string; rawText: string; country: string; city?: string; sector?: string; descriptor?: string; purpose: string; actor: string }
export const DEFAULT_PURPOSE = 'General business contact research';

export function deterministicCheck(text: string, mode: ValidationMode = validationMode()): { hit: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const re of ALWAYS_BLOCK) if (re.test(text)) reasons.push('blocked: ' + re.source);
  if (mode === 'strict') {
    for (const re of PROTECTED) if (re.test(text)) reasons.push('possible protected-characteristic framing matched ' + re.source);
    const looksIndividual = INDIVIDUAL_HINT.some((re) => re.test(text));
    const hasOrgFraming = /organisation|organization|business|church|association|professional|directory|member list|community organisation|women-owned/i.test(text);
    if (looksIndividual && !hasOrgFraming) reasons.push('targets individuals rather than organisations/businesses with public contacts');
  }
  return { hit: reasons.length > 0, reasons };
}

export function rewriteSuggestion(raw: string): string {
  let s = raw;
  s = s.replace(/Nigerians in Liverpool/gi, 'Organisations, businesses, and associations in Liverpool that publicly list contact details and serve or are described as part of the Nigerian community');
  s = s.replace(/female entrepreneurs in Iwo Road/gi, 'Businesses in Iwo Road, Ibadan that publicly describe themselves as women-owned or are listed in women-owned business directories');
  s = s.replace(/\bfemale\s+(jewellers?|jewelers?)\s+in\s+(.+)/gi, 'Jewellery businesses in $2 that publicly describe themselves as women-owned or are listed in women-owned business directories');
  s = s.replace(/\bfemale\s+([a-z]+)\s+in\s+(.+)/gi, '$1 businesses in $2 that publicly describe themselves as women-owned or are listed in women-owned business directories');
  s = s.replace(/\bfind (people|women|men)\b/gi, 'find organisations and businesses');
  return s;
}

export function validateBrief(input: ValidateInput, mode: ValidationMode = validationMode()): Brief {
  const purpose = input.purpose && input.purpose.length >= 10 ? input.purpose : DEFAULT_PURPOSE;
  const base = { id: randomUUID(), projectId: input.projectId, rawText: input.rawText, country: input.country, city: input.city, sector: input.sector, descriptor: input.descriptor, purpose };
  const { hit, reasons } = deterministicCheck(input.rawText + ' ' + (input.descriptor || ''), mode);
  if (!hit) return { ...base, status: 'accepted', reasons: [] };
  if (mode === 'relaxed') return { ...base, status: 'rejected', reasons };
  const rewritten = rewriteSuggestion(input.rawText);
  const stalking = /stalk|harass|scam|fraud|political targeting/i.test(input.rawText);
  if (stalking) return { ...base, status: 'rejected', reasons: [...reasons, 'abuse risk: human review required'] };
  return { ...base, status: 'rewritten', rewrittenBrief: rewritten, reasons };
}
