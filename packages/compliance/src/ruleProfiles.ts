import { z } from 'zod';
import * as fs from 'fs'; import * as path from 'path';
export const RuleProfileSchema = z.object({
  id: z.string(), jurisdiction: z.string(), version: z.string(),
  lawful_basis_guidance: z.string(),
  individual_email_outreach: z.enum(['allowed','consent_required','not_advised']),
  corporate_email_outreach: z.string(),
  phone_outreach_guidance: z.string(),
  required_notices: z.array(z.string()),
  default_retention_days: z.number(),
  special_category_warning: z.string(),
  blocked_query_types: z.array(z.string()),
  needs_review: z.boolean(), reviewed_by: z.string().optional(), reviewed_at: z.string().optional(),
});
export type RuleProfile = z.infer<typeof RuleProfileSchema>;
export function loadProfiles(dir: string): RuleProfile[] {
  return fs.readdirSync(dir).filter(f=>f.endsWith('.json')).map(f=>{
    const j = JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
    return RuleProfileSchema.parse(j);
  });
}
export function profileFor(profiles: RuleProfile[], countryCode: string): RuleProfile {
  return profiles.find(p=>p.jurisdiction===countryCode) || profiles.find(p=>p.jurisdiction==='DEFAULT')!;
}
