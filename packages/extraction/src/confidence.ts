export function score(opts: { sourceQuality: number; agreeingSources: number; hasEmail: boolean; hasPhone: boolean }) {
  let s = 0.3 + opts.sourceQuality * 0.08 + Math.min(0.2, (opts.agreeingSources-1)*0.05);
  if (opts.hasEmail) s += 0.1; if (opts.hasPhone) s += 0.1;
  return Math.max(0, Math.min(1, s));
}
