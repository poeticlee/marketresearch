import { store } from '@gcrp/db';
import { exportGate, SuppressionList } from '@gcrp/compliance';
export function toCsv(records: any[]) {
  const head = 'name,phones,emails,address,country,source_url,confidence\n';
  return head + records.map(r => [JSON.stringify(r.name), JSON.stringify(r.phones.join(';')), JSON.stringify(r.emails.join(';')), JSON.stringify(r.address||''), r.country, r.sourceUrl, r.confidence].join(',')).join('\n');
}
export function buildExport(projectId: string, actor: string, purpose: string, jurisdictions: string[], profiles: any[], suppression: SuppressionList) {
  const records = [...store.records.values()].filter((r:any)=>r.projectId===projectId);
  const { cover, records: approved } = exportGate({ purpose, records: records as any, jurisdictions, profiles, suppression, actor });
  store.exports.push({ id: 'exp-'+Date.now(), actor, projectId, count: approved.length, at: new Date().toISOString() });
  store.log(actor, 'export.create', projectId);
  return { cover, csv: toCsv(approved), xlsxNote: 'XLSX: sheet1=records, sheet2=cover (generated client-side via exceljs)' };
}
