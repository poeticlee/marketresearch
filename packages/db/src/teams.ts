// Team workspaces, roles, shared projects (Phase 5).
export type Role = 'owner'|'admin'|'member'|'viewer';
const members = new Map<string, Map<string, Role>>(); // projectId -> userId -> role
export function addMember(projectId: string, userId: string, role: Role) {
  let m = members.get(projectId); if (!m) { m = new Map(); members.set(projectId, m); }
  m.set(userId, role);
}
export function canEdit(projectId: string, userId: string) { return ['owner','admin','member'].includes(members.get(projectId)?.get(userId) || 'owner'); }
