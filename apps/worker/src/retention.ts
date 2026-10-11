import { store } from '@gcrp/db';
// Nightly: flag expired, notify owner (log), delete after 14-day grace.
export function retentionWorker() {
  const now = Date.now(); const expired: string[] = []; const deleted: string[] = [];
  for (const [id, r] of store.records) {
    const until = new Date((r as any).retentionUntil).getTime();
    if (until < now) expired.push(id);
    if (until + 14*864e5 < now) { store.records.delete(id); store.log('system','record.purged',id); deleted.push(id); }
  }
  return { expired, deleted };
}
