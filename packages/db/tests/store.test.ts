import { describe,it,expect } from 'vitest';
import { Store } from '../src/store.js';
import { ACCEPTABLE_USE_VERSION } from '../../core/src/index.js';
describe('phase1 acceptance',()=>{
 it('signup->project->audit',()=>{
  const s=new Store();
  const u=s.signup('A','a@x.co','pw123456','NG','Org',ACCEPTABLE_USE_VERSION);
  const {token}=s.signin('a@x.co','pw123456');
  const p=s.createProject(token,'T','Mapping public business contacts in Ibadan',['NG']);
  expect(s.listProjects(token).length).toBe(1);
  expect(s.audit.length).toBeGreaterThanOrEqual(3);
 });
});
