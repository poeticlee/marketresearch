// Single choke point for exports. No other code path may generate export files (enforced by lint rule).
import type { ContactRecord } from '@gcrp/core';
import { SuppressionList } from './suppression.js';
import type { RuleProfile } from './ruleProfiles.js';

export interface ExportRequest { purpose: string; records: ContactRecord[]; jurisdictions: string[]; profiles: RuleProfile[]; suppression: SuppressionList; actor: string }
export function exportGate(req: ExportRequest) {
  if (!req.purpose || req.purpose.length < 10) throw new Error('EXPORT_BLOCKED: purpose required');
  const approved = req.records.filter(r => r.status === 'approved');
  if (approved.length !== req.records.length) throw new Error('EXPORT_BLOCKED: only approved records may be exported');
  for (const r of approved) {
    if (req.suppression.filterRecord(r.emails, r.phones)) throw new Error('EXPORT_BLOCKED: suppressed contact ' + r.id);
    if (new Date(r.retentionUntil) < new Date()) throw new Error('EXPORT_BLOCKED: record expired ' + r.id);
  }
  const notes = req.profiles.filter(p => req.jurisdictions.includes(p.jurisdiction)).flatMap(p => p.required_notices);
  const cover = { purpose: req.purpose, jurisdictions: req.jurisdictions, notices: notes, generatedAt: new Date().toISOString(), count: approved.length, actor: req.actor };
  return { cover, records: approved };
}
