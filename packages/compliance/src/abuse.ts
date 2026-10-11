// Abuse detection: many rejected briefs in short time flags account.
const attempts = new Map<string, number[]>();
export function recordBriefAttempt(userId: string, rejected: boolean) {
  const arr = attempts.get(userId) || []; arr.push(Date.now()); attempts.set(userId, arr.slice(-20));
  if (!rejected) return { flagged: false };
  const recent = arr.filter(t => Date.now()-t < 10*60e3);
  return { flagged: recent.length >= 5, recent: recent.length };
}
