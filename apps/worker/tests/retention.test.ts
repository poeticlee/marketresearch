import { describe,it,expect } from 'vitest';
import { Store } from '../../db/src/store.js';
import { retentionWorker } from '../src/retention.js';
import { ACCEPTABLE_USE_VERSION } from '../../core/src/index.js';
describe('retention',()=>{
 it('flags expired, purges after grace',()=>{
  const { store } = (()=>{ const m=require('../../db/src/store.js') as typeof import('../../db/src/store.js'); return {store:m.store}; })();
  store.records.clear();
  const u=store.signup('R'+Date.now(),'r'+Date.now()+'@x.co','password1','NG','O',ACCEPTABLE_USE_VERSION);
  const old:any={ id:'old1', projectId:'p', entityType:'business', name:'Old', phones:[], emails:['o@x.co'], country:'NG', sourceId:'s', sourceUrl:'http://x', collectedAt:new Date(2000,0,1).toISOString(), confidence:.5, status:'approved', retentionUntil:new Date(Date.now()-20*864e5).toISOString() };
  const fresh:any={ ...old, id:'fresh1', retentionUntil:new Date(Date.now()+30*864e5).toISOString() };
  store.saveRecord(old,u.id); store.saveRecord(fresh,u.id);
  const r=retentionWorker();
  expect(r.expired).toContain('old1'); expect(r.deleted).toContain('old1'); expect(r.expired).not.toContain('fresh1');
 });
});
