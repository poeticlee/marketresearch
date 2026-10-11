import { describe,it,expect } from 'vitest';
import { exportGate } from '../src/exportGate';
import { SuppressionList } from '../src/suppression';
import { hashContact } from '../../db/src/store';
const prof:any=[{jurisdiction:'NG',required_notices:['N']},{jurisdiction:'GB',required_notices:['G']}];
function rec(o:any){ return { id:'r1', projectId:'p', entityType:'business', name:'A', phones:[], emails:['a@b.co'], country:'NG', sourceId:'s', sourceUrl:'http://x', collectedAt:new Date().toISOString(), confidence:.8, status:'approved', retentionUntil:new Date(Date.now()+864e5).toISOString(), ...o }; }
describe('export gate',()=>{
 it('blocks missing purpose',()=>{ expect(()=>exportGate({purpose:'',records:[rec({})] as any,jurisdictions:['NG'],profiles:prof,suppression:new SuppressionList(),actor:'u'})).toThrow(/purpose/); });
 it('blocks unapproved',()=>{ expect(()=>exportGate({purpose:'research purpose ok',records:[rec({status:'candidate'})] as any,jurisdictions:['NG'],profiles:prof,suppression:new SuppressionList(),actor:'u'})).toThrow(/approved/); });
 it('blocks suppressed',()=>{ const s=new SuppressionList('dev-salt'); s.add('a@b.co','email'); expect(()=>exportGate({purpose:'research purpose ok',records:[rec({})] as any,jurisdictions:['NG'],profiles:prof,suppression:s,actor:'u'})).toThrow(/suppressed/); });
 it('blocks expired',()=>{ expect(()=>exportGate({purpose:'research purpose ok',records:[rec({retentionUntil:new Date(Date.now()-1000).toISOString()})] as any,jurisdictions:['NG'],profiles:prof,suppression:new SuppressionList(),actor:'u'})).toThrow(/expired/); });
 it('passes valid',()=>{ const r=exportGate({purpose:'research purpose ok',records:[rec({})] as any,jurisdictions:['NG'],profiles:prof,suppression:new SuppressionList(),actor:'u'}); expect(r.cover.count).toBe(1); });
});
