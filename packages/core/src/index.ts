import { z } from 'zod';

export const EntityType = z.enum(['business','organisation','professional']);
export type EntityType = z.infer<typeof EntityType>;

export const RecordStatus = z.enum(['candidate','approved','rejected','opted_out']);
export type RecordStatus = z.infer<typeof RecordStatus>;

export const BriefStatus = z.enum(['accepted','rewritten','rejected']);
export type BriefStatus = z.infer<typeof BriefStatus>;

export const UserSchema = z.object({
  id: z.string(), name: z.string(), email: z.string().email(),
  organisation: z.string().optional(), country: z.string(),
  verified: z.boolean().default(false), plan: z.string().default('free'),
  termsAcceptedVersion: z.string().optional(), termsAcceptedAt: z.string().optional(),
});
export type User = z.infer<typeof UserSchema>;

export const ProjectSchema = z.object({
  id: z.string(), ownerId: z.string(), title: z.string(),
  purpose: z.string().min(10, 'purpose must be declared (min 10 chars)'),
  targetCountries: z.array(z.string()).min(1), createdAt: z.string(),
});
export type Project = z.infer<typeof ProjectSchema>;

export const BriefSchema = z.object({
  id: z.string(), projectId: z.string(), rawText: z.string(),
  country: z.string(), city: z.string().optional(), sector: z.string().optional(),
  descriptor: z.string().optional(), purpose: z.string(),
  status: BriefStatus, rewrittenBrief: z.string().optional(), reasons: z.array(z.string()).default([]),
});
export type Brief = z.infer<typeof BriefSchema>;

export const ContactRecordSchema = z.object({
  id: z.string(), projectId: z.string(), entityType: EntityType,
  name: z.string(), role: z.string().optional(),
  phones: z.array(z.string()).default([]), emails: z.array(z.string()).default([]),
  address: z.string().optional(), country: z.string(), category: z.string().optional(),
  selfDeclaredTags: z.array(z.string()).default([]),
  sourceId: z.string(), sourceUrl: z.string(), collectedAt: z.string(),
  confidence: z.number().min(0).max(1).default(0.5),
  status: RecordStatus.default('candidate'), retentionUntil: z.string(),
  notes: z.string().optional(),
});
export type ContactRecord = z.infer<typeof ContactRecordSchema>;

export const SourceSchema = z.object({
  id: z.string(), country: z.string(), name: z.string(),
  type: z.string(), accessMethod: z.string(), termsNotes: z.string(),
  allowedUse: z.string(), qualityRating: z.number().min(0).max(5), enabled: z.boolean().default(true),
});
export type Source = z.infer<typeof SourceSchema>;

export const SuppressionEntrySchema = z.object({
  hash: z.string(), type: z.enum(['email','phone']), date: z.string(), reason: z.string().optional(),
});
export type SuppressionEntry = z.infer<typeof SuppressionEntrySchema>;

export const ACCEPTABLE_USE_VERSION = 'v1.0.0';
export const ACCEPTABLE_USE_TEXT = `Acceptable use: B2B/organisation contacts only from public sources. No targeting individuals by ethnicity, religion, gender, health, sexuality, political view, immigration status. No spam, scams, harassment, stalking. Respect opt-outs and applicable data protection law.`;
