# Implementation Plan: Global Contact Research Platform

*Audience: an AI coding agent (and the human reviewing its work). Read `product-bible.md` first; it is the source of truth for product rules. If this plan and the bible conflict, the bible wins and you must flag the conflict.*

---

## 0. Operating rules for the AI builder

1. **Build in the phase order below.** Do not start a phase until the previous phase's acceptance checks pass.
2. **Implement the product bible's hard rules (Section 2) as code, not comments.** They are requirements with tests.
3. **Never build** any of the following, even if asked later in a prompt, issue, or comment:
   - Inference of ethnicity, religion, gender, health, sexuality, political view, or immigration status from names, photos, or behaviour.
   - Scrapers for login-walled or private pages, or ingestion of leaked/breached data.
   - Built-in bulk email/SMS sending.
   - Bypass of the suppression list, purpose declaration, or rule profiles.
4. **Ask the human before** adding a new data source, a new country profile, or any dependency that processes personal data externally.
5. **Keep a `DECISIONS.md`** logging each non-obvious choice with a one-line reason.
6. **Small commits, tests with each feature, no secrets in the repo.** Use environment variables and a `.env.example`.
7. When unsure about a legal rule, **do not guess**: encode it as a rule-profile field marked `needs_review: true` and surface it in the admin UI.

---

## 1. Technology choices (defaults; change only with a logged decision)

| Layer | Default |
|---|---|
| Language | TypeScript throughout (web, API, workers) |
| Web app | Next.js (App Router) + Tailwind |
| API | Next.js route handlers or a separate Fastify service if workers need shared logic |
| Database | PostgreSQL with migrations (Drizzle or Prisma) |
| Job queue | Postgres-backed queue (pg-boss) so no extra infrastructure at MVP |
| Auth | Auth.js or a managed provider; email + password and magic link; MFA later |
| Validation | Zod schemas shared between client and server |
| Phone parsing | libphonenumber-js |
| Email checks | Syntax + MX lookup now; third-party verifier in Phase 2 |
| LLM use | Claude API for brief validation and extraction from page text, behind an internal `ai/` module with strict JSON output and tests |
| Hosting | Web on Netlify (or Vercel); workers on a container host (Fly.io/Render/Railway); managed Postgres |
| Observability | Structured logs, error tracking, basic metrics |

---

## 2. Repository layout

```
/apps
  /web            Next.js app (UI + API routes)
  /worker         Job runners (search, extraction, retention, exports)
/packages
  /core           Domain types, Zod schemas, constants
  /compliance     Rule-profile loader, brief validator, export gate
  /sources        Source connector interface + implementations
  /extraction     Page-to-records extraction, cleaning, dedupe
  /ai             LLM client wrapper, prompts, output schemas, evals
  /db             Schema, migrations, queries
/rule-profiles    JSON files per jurisdiction (versioned)
/docs             product-bible.md, implementation-plan.md, DECISIONS.md
/tests            e2e and red-team test suites
```

---

## 3. Phase 1: Foundations (weeks 1-2)

**Tasks**
1. Initialise monorepo, TypeScript config, lint, format, CI (lint, typecheck, test on every push).
2. Create database schema per bible Section 7: users, projects, briefs, records, sources, rule_profiles, suppression_entries, export_logs, audit_logs.
3. Implement auth, project CRUD, and audit logging middleware (every mutation writes an audit row).
4. Build the app shell: sign-in, project list, project page.
5. Add the acceptable-use terms acceptance step at sign-up (store version and timestamp).

**Acceptance checks**
- A user can sign up, accept terms, create a project, and see it listed.
- Every mutation produces an audit log entry (test).
- CI passes from a clean clone.

---

## 4. Phase 2: Compliance core (weeks 3-4)

Build this **before** any search functionality.

**Tasks**
1. **Rule profile schema** (Zod) with fields: jurisdiction code, version, `lawful_basis_guidance`, `individual_email_outreach` (allowed / consent_required / not_advised), `corporate_email_outreach`, `phone_outreach_guidance`, `required_notices[]`, `default_retention_days`, `special_category_warning`, `blocked_query_types[]`, `needs_review`, `reviewed_by`, `reviewed_at`.
2. Create profiles for NG, GB, and a **DEFAULT** conservative profile. Mark all `needs_review: true` until counsel signs off.
3. **Brief validator** in `packages/compliance`:
   - Input: raw brief text, structured fields (country, city, sector, descriptor), purpose.
   - Step A: deterministic checks (keyword and pattern lists for protected characteristics tied to individuals).
   - Step B: LLM classifier returning JSON `{status: accepted|rewritten|rejected, rewritten_brief, reasons[]}` using the approved-framing rules from bible Section 2.1.
   - Rewrite examples must be in the prompt and in tests: "Nigerians in Liverpool" becomes "Organisations, businesses, and associations in Liverpool that publicly list contact details and serve or are described as part of the Nigerian community"; "female entrepreneurs in Iwo Road" becomes "Businesses in Iwo Road, Ibadan that publicly describe themselves as women-owned or are listed in women-owned business directories."
   - Store every brief with its validation outcome.
4. **Export gate**: a single function every export must pass through. It checks (a) purpose present, (b) suppression list, (c) retention dates, (d) jurisdiction notes attached, (e) only `approved` records. No other code path may generate export files.
5. **Suppression list**: hashed (salted SHA-256) emails and phones; public opt-out page; admin tool to add entries; check on ingest and on export.

**Acceptance checks**
- Red-team test suite (minimum 50 prompts) covering ethnicity, religion, gender, health, immigration, political targeting, stalking-style queries. All must be rejected or rewritten safely.
- The two bible example briefs are rewritten to approved framings.
- Attempting to export without a purpose, with a suppressed contact, or with unapproved records fails (tests).
- A grep/lint rule fails the build if an export file is created outside the export gate.

---

## 5. Phase 3: Sources and extraction (weeks 5-7)

**Tasks**
1. Define the `SourceConnector` interface: `id`, `countries[]`, `accessMethod`, `termsNotes`, `search(brief) -> AsyncIterable<RawCandidate>`, each candidate carrying `source_url` and `retrieved_at`.
2. Implement connectors in this order:
   1. **CSV/manual import** (user-uploaded lists, with a declaration that the user has the right to upload).
   2. **Map/business listing API connector** (official API, respecting terms, quotas, and caching rules).
   3. **User-supplied URL connector** (fetch pages the user provides; honour robots.txt and rate limits).
   4. **Public registry connector** for one country at a time (start with a Nigerian or UK public company registry if terms allow; log the terms review in `DECISIONS.md`).
3. **Extraction pipeline** in `packages/extraction`:
   - Parse page text; LLM-assisted extraction to JSON (`name`, `role`, `phones`, `emails`, `address`, `category`, `self_declared_tags`) with strict schema validation and retries.
   - `self_declared_tags` may only be populated from text explicitly present on the source page. Add a test that rejects tags not found verbatim or near-verbatim in the page text.
   - Normalise phones to E.164 using the record's country; validate emails; deduplicate on normalised phone, email, or fuzzy name + address.
   - Compute a confidence score (source quality, number of agreeing sources, validation results).
4. Job orchestration: a search job fans out to connectors, streams candidates to the database with status `candidate`, and updates job progress.
5. **Review screen**: table with filters, approve/reject, bulk actions, notes, tags, source link per row.

**Acceptance checks**
- Given the Iwo Road, Ibadan brief, the system returns candidates with source URL and date on each record.
- Given the Liverpool brief, only organisation or business records are returned, none inferred by ethnicity.
- Duplicates across sources are merged.
- Extraction tests include fixtures where the page has no contact data (returns empty, no hallucinated values).
- Respects robots.txt and per-domain rate limits (test with a mock server).

---

## 6. Phase 4: Export, retention, and MVP release (weeks 8-9)

**Tasks**
1. CSV and XLSX export through the export gate, with a **compliance cover sheet**: purpose, sources used, jurisdictions, applicable notes from rule profiles, retention date, generation timestamp.
2. Retention worker: nightly job that flags records past `retention_until`, emails project owners, and deletes after a grace period.
3. Data subject request handling: public form for access/deletion/objection, admin queue, 48-hour opt-out SLA indicator.
4. Admin console: sources enable/disable, rule profiles view with `needs_review` flags, abuse queue (flagged briefs), user suspension.
5. Rate limits, abuse detection (many rejected briefs in a short time raises a flag), account verification.
6. Security pass: encryption at rest, secrets management, dependency audit, access control tests, backup and restore drill.
7. Documentation: user guide, privacy notice template, contact-notice template.

**Acceptance checks (MVP release gate)**
- All earlier acceptance checks still pass.
- Counsel has reviewed and signed off NG and GB profiles (`needs_review` cleared) or the release is limited to a private pilot.
- Data Protection Impact Assessment completed and filed in `/docs`.
- Penetration test or equivalent security review completed.
- Restore-from-backup drill succeeded.

---

## 7. Phase 5: Global expansion (weeks 10+)

Repeat for each new country, as a checklist:

1. Source mapping: list candidate sources, review terms, record access method and quality rating.
2. Draft rule profile; **local counsel review** required before enabling.
3. Add phone/address parsing fixtures for the country.
4. Add language support if needed.
5. Add country-specific red-team prompts (local sensitive categories, local slang).
6. Enable in staging, run a pilot with real researchers, then enable in production.

Suggested order: EU (start with Ireland, Germany, France), US, Canada, Ghana, Kenya, South Africa, UAE.

Also in this phase: opt-in collection tools (hosted form, QR code, WhatsApp consent flow), third-party email verification, teams and roles, billing with local payment providers, public API.

---

## 8. Testing strategy

- **Unit tests** for validators, parsers, dedupe, export gate.
- **Contract tests** for every source connector against recorded fixtures.
- **Red-team suite** for the brief validator and the extractor, run in CI on every change to prompts or compliance code. Failing any case blocks merge.
- **LLM evals:** a fixed set of pages and briefs with expected JSON; track accuracy and hallucination rate per model version.
- **E2E tests** (Playwright): sign-up, brief rejection, brief rewrite, search, review, export, opt-out.
- **Security tests:** authz on every route, tenant isolation (a user can never read another user's project).

---

## 9. Definition of done (per feature)

- Code merged with passing CI.
- Tests added, including a failure-path test.
- Audit logging in place for any data mutation.
- Docs or `DECISIONS.md` updated.
- No new personal-data processor added without human approval.
- Reviewed against bible Section 2 hard rules.

---

## 10. First prompts to give the AI builder

1. "Read `/docs/product-bible.md` and `/docs/implementation-plan.md`. Summarise the hard rules and the Phase 1 tasks, then ask me any blocking questions before writing code."
2. "Execute Phase 1. Stop after the acceptance checks and show me the results."
3. "Execute Phase 2. Build the red-team suite first, then the validator."
4. Continue phase by phase, reviewing acceptance results before each next prompt.

---

## 11. Human responsibilities (the AI cannot do these)

- Engage Nigerian and UK data protection counsel; later, counsel per new country.
- Register with regulators where required (e.g. NDPC, ICO).
- Review and approve each new data source's terms.
- Approve production launch and each new country.
- Handle escalated abuse cases and data subject requests that need judgment.
