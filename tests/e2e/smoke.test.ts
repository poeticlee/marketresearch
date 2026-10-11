import { describe,it,expect } from 'vitest';
import { Store } from '../../packages/db/src/store';
import { validateBrief } from '../../packages/compliance/src/briefValidator';
import { ACCEPTABLE_USE_VERSION } from '../../packages/core/src/index';
describe('e2e smoke: signup->brief->review->export',()=>{
 it('happy path',()=>{
  const s=new Store(); const u=s.signup('R','r@uni.edu','pw123456','GB','Uni',ACCEPTABLE_USE_VERSION);
  const {token}=s.signin('r@uni.edu','pw123456');
  const p=s.createProject(token,'Liverpool mapping','Diaspora organisation mapping for academic study',['GB']);
  const b=validateBrief({projectId:p.id,rawText:'Organisations, businesses, and associations in Liverpool that publicly list contact details',country:'GB',purpose:p.purpose,actor:u.id});
  expect(['accepted','rewritten']).toContain(b.status);
 });
});
