import { describe,it,expect } from 'vitest';
import { extractFromPageText, assertTagsGrounded } from '../src/extract.js';
import { dedupe } from '../src/dedupe.js';
import { toE164 } from '../src/clean.js';
describe('extraction',()=>{
 it('empty page -> no hallucination',()=>{ expect(extractFromPageText({projectId:'p',country:'NG',sourceId:'s',sourceUrl:'http://x',pageText:'Welcome to our site. No contacts here.'})).toEqual([]); });
 it('extracts + grounds tags',()=>{
  const rs=extractFromPageText({projectId:'p',country:'NG',sourceId:'s',sourceUrl:'http://x',pageText:'Ada Shop\nPhone: +2348012345678\nEmail: ada@shop.ng\nWe are women-owned.'});
  expect(rs[0].emails).toContain('ada@shop.ng'); expect(rs[0].selfDeclaredTags).toContain('women-owned');
  expect(()=>assertTagsGrounded('no tags here',['women-owned'])).toThrow();
 });
 it('dedupe merges',()=>{
  const a:any={id:'1',name:'Ada Shop',address:'Iwo Rd',phones:['+2348012345678'],emails:['ada@shop.ng'],confidence:.6};
  const b:any={id:'2',name:'ada shop',address:'Iwo Rd',phones:['+2348012345678'],emails:['ADA@shop.ng'],confidence:.7};
  expect(dedupe([a,b]).length).toBe(1);
 });
 it('E164 NG',()=>{ expect(toE164('08012345678','NG')).toBe('+2348012345678'); });
});
