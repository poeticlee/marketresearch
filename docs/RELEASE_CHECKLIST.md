# MVP release gate (plan Phase 4)
- [x] All phase acceptance checks pass (71+ tests, typecheck, lint, export-gate)
- [ ] Counsel sign-off NG + GB profiles (clear needs_review) — HUMAN
- [ ] DPIA finalized and filed in /docs — draft at docs/DPIA.md, needs HUMAN sign-off
- [ ] Pen test / security review completed — HUMAN
- [ ] Restore-from-backup drill succeeded — HUMAN (needs managed Postgres)
- [ ] Rate limits + abuse detection enabled in prod config — code ready (abuse.ts), wire to gateway
- [ ] If counsel sign-off missing: release limited to private pilot only
