import { describe,it,expect } from 'vitest';
import { parseCsv } from '../src/csvImport';
import { registryConnector } from '../src/registry';
describe('source contracts',()=>{
 it('csv parses',()=>{ const rows=parseCsv('name,email,phone\nAda,ada@x.ng,0801'); expect(rows[0].emails).toContain('ada@x.ng'); });
 it('registry yields sourced candidates',async ()=>{ for await (const c of registryConnector.search({text:'x',country:'GB'})) { expect(c.sourceUrl).toMatch(/^https?:/); } });
 it('map connector requires key (no key -> no calls)',async ()=>{ const { mapConnector }=await import('../src/mapApi.js'); let n=0; for await (const _ of mapConnector.search({text:'x',country:'NG'})) n++; expect(n).toBe(0); });
});
