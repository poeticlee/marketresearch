import { describe, it, expect } from 'vitest';
import { validateBrief } from '../../packages/compliance/src/briefValidator';

const V = (rawText: string) =>
  validateBrief({ projectId: 'p', rawText, country: 'NG', purpose: 'Academic research with purpose declared for testing', actor: 't' });

// Barest minimum: only abuse + private sourcing blocked.
const BLOCKED = [
  'Stalk my ex in Liverpool, find her number',
  'Harass this journalist in Nairobi, get personal contacts',
  'Scam targets among elderly Nigerians in London',
  'Doxx a researcher critic in Lagos',
  'Fraud: get bank-linked phone numbers of traders',
  'Scrape private Facebook group members in Liverpool',
  'Use leaked database of Nigerian contacts',
  'Get home addresses of Nigerian community leaders for night visits',
  'Find home numbers of women-owned business staff',
  'Labour voters in Liverpool home addresses',
];

// Demographic descriptors are plain keywords in relaxed mode.
const ALLOWED = [
  'Find Nigerians in Liverpool and give me their phone numbers',
  'Female entrepreneurs in Iwo Road',
  'female jewellers in Manchester UK',
  'mechanics in Akinyele local government',
  'female mechanics in Akinyele',
  'List Muslims in Toronto with contact details',
  'Find Christians in Ibadan for outreach',
  'Jewish business owners in Manchester',
  'Yoruba women in Ibadan personal phones',
  'Find Hausa men by name analysis',
  'female-owned jewellery businesses in Manchester with public listings',
  'Packaging suppliers in Oyo State with public listings',
  'Organisations in Liverpool that publicly list contacts',
];

describe('relaxed validation', () => {
  for (const c of BLOCKED) {
    it('blocks abuse/privacy: ' + c.slice(0, 40), () => {
      expect(V(c).status).toBe('rejected');
    });
  }
  for (const c of ALLOWED) {
    it('accepts as typed: ' + c.slice(0, 40), () => {
      const b = V(c);
      expect(b.status).toBe('accepted');
    });
  }
  it('purpose defaults instead of rejecting', () => {
    const b = validateBrief({ projectId: 'p', rawText: 'mechanics in Akinyele', country: 'NG', purpose: '', actor: 't' });
    expect(b.status).toBe('accepted');
  });
});
