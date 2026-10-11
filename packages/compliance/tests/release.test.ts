import { describe,it,expect } from 'vitest';
import { SuppressionList } from '../src/suppression.js';
import { canExport, PLANS } from '../src/billing.js';
import { verifyEmail } from '../src/verify.js';
import { recordOptIn, listOptIns } from '../src/optin.js';
describe('release extras',()=>{
 it('suppression roundtrip',()=>{ const s=new SuppressionList('t'); s.add('A@B.co','email'); expect(s.isSuppressed('a@b.co')).toBe(true); expect(s.isSuppressed('c@d.co')).toBe(false); });
 it('billing limits',()=>{ expect(canExport('free',50)).toBe(true); expect(canExport('free',51)).toBe(false); expect(PLANS.business).toBeDefined(); });
 it('verify syntax gate',async ()=>{ expect((await verifyEmail('bad')).syntax).toBe(false); expect((await verifyEmail('a@b.co')).syntax).toBe(true); });
 it('opt-in flow',()=>{ recordOptIn('p','A@b.co','qr','proof1'); expect(listOptIns('p').length).toBe(1); });
});
