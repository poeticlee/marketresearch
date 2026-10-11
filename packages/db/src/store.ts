// In-memory store for dev/tests + audit middleware. Prod uses Postgres (schema.sql) via Drizzle; interface is identical.
import { createHash, randomUUID, createHmac } from 'crypto';
import type { Project, ContactRecord, Brief } from '@gcrp/core';

export interface AuditRow { id: string; actor: string; action: string; object: string; createdAt: string }
export interface DbUser { id: string; name: string; email: string; passwordHash: string; organisation?: string; country: string; verified: boolean; plan: string; termsVersion?: string; termsAcceptedAt?: string }

function sha(pw: string, salt: string) { return createHmac('sha256', salt).update(pw).digest('hex'); }

export class Store {
  users = new Map<string, DbUser>();
  sessions = new Map<string, string>(); // token -> userId
  projects = new Map<string, Project>();
  briefs = new Map<string, Brief>();
  records = new Map<string, ContactRecord>();
  audit: AuditRow[] = [];
  exports: any[] = [];
  dsr: any[] = [];
  salt = process.env.SUPPRESSION_SALT || 'dev-salt';

  log(actor: string, action: string, object: string) {
    const row = { id: randomUUID(), actor, action, object, createdAt: new Date().toISOString() };
    this.audit.push(row); return row;
  }
  signup(name: string, email: string, password: string, country: string, organisation: string | undefined, termsVersion: string) {
    if ([...this.users.values()].some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error('email exists');
    if (!termsVersion) throw new Error('terms must be accepted');
    const id = randomUUID();
    const u: DbUser = { id, name, email, passwordHash: sha(password, this.salt), organisation, country, verified: false, plan: 'free', termsVersion, termsAcceptedAt: new Date().toISOString() };
    this.users.set(id, u); this.log(id, 'user.signup', id); return u;
  }
  signin(email: string, password: string) {
    const u = [...this.users.values()].find(x => x.email.toLowerCase() === email.toLowerCase());
    if (!u || u.passwordHash !== sha(password, this.salt)) throw new Error('invalid credentials');
    const token = randomUUID(); this.sessions.set(token, u.id); this.log(u.id, 'user.signin', u.id); return { token, user: u };
  }
  me(token: string) { const id = this.sessions.get(token); return id ? this.users.get(id)! : null; }
  createProject(token: string, title: string, purpose: string, targetCountries: string[]) {
    const u = this.me(token); if (!u) throw new Error('auth');
    if (!purpose || purpose.length < 10) throw new Error('purpose required');
    const p: Project = { id: randomUUID(), ownerId: u.id, title, purpose, targetCountries, createdAt: new Date().toISOString() };
    this.projects.set(p.id, p); this.log(u.id, 'project.create', p.id); return p;
  }
  listProjects(token: string) { const u = this.me(token); if (!u) throw new Error('auth'); return [...this.projects.values()].filter(p => p.ownerId === u.id); }
  saveBrief(b: Brief, actor: string) { this.briefs.set(b.id, b); this.log(actor, 'brief.' + b.status, b.id); return b; }
  saveRecord(r: ContactRecord, actor: string) { this.records.set(r.id, r); this.log(actor, 'record.upsert', r.id); return r; }
  setRecordStatus(id: string, status: ContactRecord['status'], actor: string, notes?: string) {
    const r = this.records.get(id); if (!r) throw new Error('not found');
    const u = { ...r, status, notes: notes ?? r.notes }; this.records.set(id, u); this.log(actor, 'record.' + status, id); return u;
  }
}
export const store = new Store();
export function hashContact(v: string, salt: string) { return createHash('sha256').update(salt + ':' + v.trim().toLowerCase()).digest('hex'); }
