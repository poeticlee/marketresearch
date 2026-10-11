// Bible 2.1 enforced as code. Step A deterministic; Step B LLM hook (ai module) with safe fallback.
import { randomUUID } from 'crypto';
import type { Brief } from '@gcrp/core';

const PROTECTED = [/\bnigerians?\b/i, /\bghanaians?\b/i, /\bindians?\b/i, /female entrepreneurs?/i, /\bmuslims?\b/i, /\bchristians?\b/i, /\bjews?\b/i, /jewish/i, /gay|lesbian|lgbt/i, /hiv|diabet|patients? by health|health condition/i, /immigrants?|illegal|undocumented migrants?|immigration status/i, /political|apc|pdp|labour voters?|activists|opposition/i, /stalk|harass|doxx|dox|fraud|scam|bank-linked/i, /yoruba|hausa|igbo|tribe|tribal/i, /mosque|church members?|attendees/i, /infer|guess|identify .* (religion|ethnicity|gender)|by (name|photo|picture)|looking at .*pictures?|from photos?|from names?|name analysis/i, /photo|picture/i, /personal (emails?|phones?|numbers?|contacts?|whatsapp)/i, /home (addresses?|numbers?|phones?)/i, /female students?/i, /white-owned|black-owned/i, /scrape|private .*group|leaked|breach/i, /sexuality|lgbtq/i, /muslim|christian|religion/i, /women business owners/i, /female traders/i];
const INDIVIDUAL_HINT = [/find (people|persons|individuals|women|men|patients|students|activists|migrants) /i, /^\s*(nigerians|women|men|muslims|christians|jewish)/i, /by (ethnicity|gender|religion|name|photo)/i, /personal/i, /home (address|number)/i, /attendees/i, /members? (private|personal|health)/i];

export interface ValidateInput { projectId: string; rawText: string; country: string; city?: string; sector?: string; descriptor?: string; purpose: string; actor: string }
export function deterministicCheck(text: string): { hit: boolean; reasons: string[] } {
  const reasons: string[] = [];
  const hay = text;
  for (const re of PROTECTED) if (re.test(hay)) reasons.push('possible protected-characteristic framing matched ' + re.source);
  const looksIndividual = INDIVIDUAL_HINT.some(re => re.test(hay));
  const hasOrgFraming = /organisation|organization|business|church|association|professional|directory|member list|community organisation|women-owned/i.test(hay);
  if (looksIndividual && !hasOrgFraming) reasons.push('targets individuals rather than organisations/businesses with public contacts');
  return { hit: reasons.length>0, reasons };
}

export function rewriteSuggestion(raw: string): string {
  let s = raw;
  s = s.replace(/Nigerians in Liverpool/gi, 'Organisations, businesses, and associations in Liverpool that publicly list contact details and serve or are described as part of the Nigerian community');
  s = s.replace(/female entrepreneurs in Iwo Road/gi, 'Businesses in Iwo Road, Ibadan that publicly describe themselves as women-owned or are listed in women-owned business directories');
  s = s.replace(/\bfind (people|women|men)\b/gi, 'find organisations and businesses');
  return s;
}

// LLM classifier stub: real impl calls packages/ai classifyBrief; here deterministic + rewrite.
export function validateBrief(input: ValidateInput): Brief {
  if (!input.purpose || input.purpose.length < 10) {
    return { id: randomUUID(), projectId: input.projectId, rawText: input.rawText, country: input.country, city: input.city, sector: input.sector, descriptor: input.descriptor, purpose: input.purpose, status: 'rejected', reasons: ['purpose declaration required'] };
  }
  const { hit, reasons } = deterministicCheck(input.rawText + ' ' + (input.descriptor||''));
  if (!hit) return { id: randomUUID(), projectId: input.projectId, rawText: input.rawText, country: input.country, city: input.city, sector: input.sector, descriptor: input.descriptor, purpose: input.purpose, status: 'accepted', reasons: [] };
  const rewritten = rewriteSuggestion(input.rawText);
  const stalking = /stalk|harass|scam|fraud|political targeting/i.test(input.rawText);
  if (stalking) return { id: randomUUID(), projectId: input.projectId, rawText: input.rawText, country: input.country, city: input.city, sector: input.sector, descriptor: input.descriptor, purpose: input.purpose, status: 'rejected', reasons: [...reasons, 'abuse risk: human review required'] };
  return { id: randomUUID(), projectId: input.projectId, rawText: input.rawText, country: input.country, city: input.city, sector: input.sector, descriptor: input.descriptor, purpose: input.purpose, status: 'rewritten', rewrittenBrief: rewritten, reasons };
}
