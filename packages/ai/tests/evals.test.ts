import { describe,it,expect } from 'vitest';
import { validateBrief } from '../../compliance/src/briefValidator.js';
import { EVALS } from '../evals/briefs.eval.js';
describe('llm evals (deterministic fallback)',()=>{
 for(const e of EVALS) it(e.in.slice(0,30),()=>{
  const b=validateBrief({projectId:'p',rawText:e.in,country:'NG',purpose:'Academic research purpose declared',actor:'t'});
  expect(b.status).toBe(e.expect);
 });
});
