import { describe,it,expect } from 'vitest';
import { Store } from '../src/store';
import { ACCEPTABLE_USE_VERSION } from '../../core/src/index';
describe('security: tenant isolation + authz',()=>{
 it('user cannot read another user project',()=>{
  const s=new Store();
  s.signup('A','a@t.co','password1','NG','O',ACCEPTABLE_USE_VERSION);
  s.signup('B','b@t.co','password2','GB','O',ACCEPTABLE_USE_VERSION);
  const ta=s.signin('a@t.co','password1').token, tb=s.signin('b@t.co','password2').token;
  const pa=s.createProject(ta,'A proj','Mapping public business contacts here',['NG']);
  const lb=s.listProjects(tb);
  expect(lb.find(p=>p.id===pa.id)).toBeUndefined();
 });
 it('mutations without session fail',()=>{
  const s=new Store();
  expect(()=>s.createProject('bad-token','T','A valid purpose string here',['NG'])).toThrow(/auth/);
  expect(()=>s.listProjects('bad-token')).toThrow(/auth/);
 });
 it('wrong password fails',()=>{
  const s=new Store(); s.signup('A','a2@t.co','password1','NG','O',ACCEPTABLE_USE_VERSION);
  expect(()=>s.signin('a2@t.co','wrong')).toThrow(/invalid/);
 });
});
