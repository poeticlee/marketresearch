# Product Bible: Global Contact Research Platform

*Working name: TBD. Version 0.3 (relaxed mode, owner-directed). This document defines WHAT the product is and why. The companion file `implementation-plan.md` defines HOW to build it.*

---

## 1. Vision

A platform where a researcher describes a target group in any country (for example "women-owned businesses on Iwo Road, Ibadan" or "Nigerian-community organisations and businesses in Liverpool") and receives a clean, sourced, deduplicated list of **publicly listed business and organisation contacts**, with the right compliance rules for that country applied automatically.

**Principle:** the platform finds *organisations and professionals who publish contact details for business purposes*. It never finds *people by protected characteristic*.

---

## 2. Query rules (relaxed mode — owner-directed, barest minimum)

Target groups are expressed freely, e.g. "mechanics in Akinyele local government", "female jewellers in Manchester", "Nigerians in Liverpool". Descriptors (trade, gender, community) are plain search keywords over **publicly listed business and organisation contacts**.

### Hard rules (minimal)
1. **Public sources only.** Business directories, company websites, official registries, trade association member lists, map/business listing APIs, user-supplied pages, opt-in submissions. No login-walled pages, private profiles/groups, or leaked/breached data.
2. **No abuse queries:** stalking, harassment, doxxing, scams, fraud. Rejected automatically.
3. **No home addresses.** Business/organisation contact addresses only.
4. **Provenance on every record:** source URL, source type, collected date.
5. **Suppression list** checked before every export, honoured permanently.
6. **No built-in bulk sending.** Users export and use their own tools.
7. Purpose defaults to "General business contact research" when not declared.
8. Strict validation remains available via `VALIDATION_MODE=strict` if a deployment needs the old framing rules.

---

## 3. Users and use cases

**Primary users:** academic and market researchers; NGOs and development programmes; small businesses doing B2B outreach; community organisers and event planners.

| Use case | Example brief | Output |
|---|---|---|
| Local business mapping | Women-owned businesses, Iwo Road, Ibadan | Business name, category, public phone/email, address, source |
| Diaspora organisations | Nigerian-community organisations and businesses in Liverpool | Organisation contacts from public listings |
| Supplier discovery | Packaging suppliers in Oyo State | Business contacts, products, source |
| Survey recruitment | Market traders willing to be surveyed | Opt-in list collected via form/QR/WhatsApp consent |
| Any city worldwide | Same patterns in Toronto, Nairobi, Accra, Houston, Dubai | Same output, local rules applied |

---

## 4. Global design requirements

### 4.1 Jurisdiction-aware compliance engine
The platform detects the **country of the target data** and the **country of the user**, then applies a rule profile. Rule profiles are data, not code, so legal counsel can update them.

Each profile defines: lawful basis guidance, whether email outreach to individuals is permitted, corporate vs individual subscriber treatment, required notices, retention defaults, opt-out requirements, special-category warnings, and whether the region is blocked for certain query types.

Starting profiles (each must be **verified by local counsel before launch**):
- Nigeria (NDPA 2023, NCC messaging rules)
- United Kingdom (UK GDPR, PECR)
- European Union (GDPR, ePrivacy; per-country variations)
- United States (CAN-SPAM, TCPA for phone/SMS, state laws such as CCPA/CPRA)
- Canada (PIPEDA, CASL)
- South Africa (POPIA)
- Kenya (Data Protection Act)
- Ghana (Data Protection Act)
- A conservative **default profile** for any country without a dedicated profile: business contacts only, role-based emails preferred, no phone/SMS outreach guidance, short retention.

### 4.2 Internationalisation
- Phone numbers parsed and normalised to E.164 using a maintained library (libphonenumber).
- Address parsing per country; support for countries without postcodes.
- UI languages: English first; architecture ready for French, Arabic, Portuguese, Spanish, Yoruba, Hausa, Igbo.
- Multi-currency pricing (NGN, GBP, USD, EUR) via regional payment providers.
- Time zones and locale-aware date formats.

### 4.3 Source coverage model
Each country has a **source registry**: list of approved sources, their access method (API, bulk download, permitted crawl, manual import), terms-of-use notes, and quality rating. Coverage is expanded country by country. Users see which sources were used and which countries have thin coverage.

---

## 5. Features

### MVP
1. **Brief builder:** location (country, region, city, neighbourhood), sector, descriptor (validated against Section 2.1), research purpose (required).
2. **Brief validator:** rejects or rewrites prohibited framings, explaining why and suggesting the approved version.
3. **Source connectors:** map/business listing API, public registries where available, CSV import, user-supplied URLs.
4. **Extraction and cleaning:** names, phones, emails, addresses, categories; E.164 phones; email syntax and domain checks; deduplication.
5. **Provenance and confidence** on every record.
6. **Review screen:** approve, reject, tag, add notes.
7. **Export:** CSV and Excel, with compliance cover sheet (purpose, sources, jurisdiction notes, retention date).
8. **Suppression list** and opt-out page.
9. **Accounts, projects, audit log.**

### Phase 2
- Opt-in collection tools (hosted form, QR code, WhatsApp click-to-chat consent flow).
- Third-party email verification.
- Enrichment from public sources (website, category, social page link).
- Team workspaces, roles, shared projects.
- Retention manager: auto-expiry and review prompts.

### Phase 3
- Survey module.
- Map view.
- Public API and webhooks.
- Outreach templates with unsubscribe language (sending stays outside the platform).
- Data subject request portal.

---

## 6. User flow

1. Sign up, verify identity, accept acceptable-use terms.
2. Create a project and declare the research purpose.
3. Describe the target group and location. Validator enforces the approved framing.
4. Platform detects jurisdictions, loads rule profiles, shows a short plain-language notice of what applies.
5. Search jobs run against approved sources; candidates stream in.
6. User reviews and approves records.
7. Export with compliance cover sheet.
8. Records expire or prompt for review at the retention date.

---

## 7. Core data model

- **User:** id, name, email, organisation, country, verified, plan.
- **Project:** id, owner, title, purpose, target countries, created date.
- **Brief:** id, project, raw text, validated text, status (accepted, rewritten, rejected), rejection reason.
- **Record:** id, project, entity type (business, organisation, professional), name, role, phones[], emails[], address, country, category, self_declared_tags[], source_id, source_url, collected_at, confidence, status (candidate, approved, rejected, opted_out), retention_until.
- **Source:** id, country, name, type, access method, terms notes, allowed use, quality rating, enabled.
- **RuleProfile:** id, jurisdiction, version, rules (JSON), reviewed_by, reviewed_at.
- **SuppressionEntry:** hashed identifier, type, date, reason.
- **ExportLog:** user, project, record count, jurisdictions, purpose, timestamp.
- **AuditLog:** actor, action, object, timestamp.

---

## 8. Compliance and trust

- Privacy notice for the platform; template notice users can send to contacts.
- Purpose limitation, data minimisation, retention limits.
- Data subject rights (access, correction, deletion, objection) handled within 30 days; opt-outs actioned within 48 hours.
- Registration or appointment duties (e.g. NDPC registration, UK ICO fee, EU representative) reviewed per market.
- Records of processing; Data Protection Impact Assessment before launch.
- International data transfer mechanism documented.
- Abuse prevention: flagged queries reviewed, accounts suspended for misuse, no use for harassment, scams, stalking, political targeting, or fraud.
- Region and query-type blocks configurable by the operator.

---

## 9. Business model

- **Free:** limited searches, small exports.
- **Researcher/Student:** discounted monthly plan.
- **Business:** higher limits, seats, verification credits.
- **NGO/Institution:** annual plans, custom projects.
- Local payment rails (Paystack, Flutterwave, Stripe) and local-currency pricing.

---

## 10. Success metrics

- Share of records with a valid phone or email.
- Email bounce rate on exports (target under 5%).
- Time saved per research project.
- Opt-outs processed within 48 hours (target 100%).
- Share of records from opt-in or official sources.
- Brief rejection rate trending down as users learn the framing.
- Countries with "good coverage" status.
- Paid conversion and retention.

---

## 11. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Legal exposure across many countries | Rule profiles reviewed by local counsel; conservative default profile; launch country by country |
| Misuse for spam, scams, or targeting people | Purpose declaration, brief validator, audit logs, suspensions, no bulk sending |
| Sensitive-trait inference by the AI | Hard rule in code and prompts; red-team tests; reject at brief and at extraction stages |
| Platform terms violations | Official APIs, no login-walled scraping |
| Uneven data quality worldwide | Per-country source ratings, confidence scores, manual review step |
| Data breach | Encryption, minimal retention, access controls, incident plan |

---

## 12. Roadmap

- **Month 0-1:** legal review of Nigeria and UK profiles, source mapping, brief validator design.
- **Month 1-3:** MVP for Nigeria and UK (Ibadan and Liverpool pilots).
- **Month 3-5:** opt-in tools, verification, teams; pilot with 10 researchers/NGOs.
- **Month 5-8:** add EU, US, Canada, Ghana, Kenya, South Africa profiles; paid plans.
- **Month 8+:** API, survey module, more countries.

---

## 13. Open questions for the owner

1. First customer segment: researchers, NGOs, or businesses?
2. Own tool or product sold to others?
3. Which countries come after Nigeria and the UK?
4. Will the company register as a data controller and appoint a data protection officer from day one?
5. Budget for legal review per jurisdiction?
