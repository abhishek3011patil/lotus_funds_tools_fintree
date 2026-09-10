# Project Gap Analysis

## 1. Executive Summary

This is a substantial React/Vite and Express/PostgreSQL application for research analysts, brokers, clients, and administrators. It contains registration, subscription and Razorpay payment workflows, research calls, Telegram and WhatsApp participant delivery, client recommendations, administration, notifications, and deployment assets.

The project is not production-ready. The most urgent risks are unauthenticated legacy payment mutations, public access to uploaded identity documents, insufficient object-level authorization for participant data, inconsistent role models, and a client-subscription table mismatch between the inspected schema artifact and application code. Several important product workflows are only partial: audience targeting, delivery receipts, centralized notifications, performance methodology, suspension cascades, public/guest content, and governed non-research content.

This document is a source-based audit. It distinguishes:

- **Confirmed**: directly verified in source, configuration, or the inspected database artifact.
- **Potential**: credible risk or inconsistency requiring runtime/database confirmation.
- **Recommendation**: an improvement or completeness item, not necessarily a defect.

No project source files were modified during the audit. The only created file is this report.

## 2. Project Overview

### Architecture and technologies

- **Frontend:** React 19, TypeScript, Vite, React Router, Material UI, Axios, Razorpay Checkout, Playwright visual tests.
- **Backend:** Node.js, Express 5, TypeScript, PostgreSQL through `pg` with raw parameterized SQL, JWT, bcrypt, Multer, Helmet, CORS, rate limiting, Razorpay, Telegram, WhatsApp, Nodemailer.
- **Database:** PostgreSQL. The repository contains a schema-readable artifact and a database dump, but no conventional migration directory was found in the inspected tree.
- **Deployment:** Docker Compose with PostgreSQL, application, Caddy, persistent database/uploads volumes, and optional DuckDNS service.
- **Testing:** Vitest backend tests, Playwright E2E/visual tests, OpenAPI validation script, and CI build/test workflow.

### Major modules

Authentication and password setup; RA, broker, and client registration; plan selection and payments; admin approval/suspension; research calls and errata; performance; client analyst subscriptions; Telegram and WhatsApp participants and delivery; notifications; audit logs; subscription lifecycle; morning-report and automation tools; profile/settings workflows.

### Detected roles

- `RESEARCH_ANALYST`
- `BROKER`
- `CLIENT`
- `ADMIN`, `SUPERADMIN`, `SUPER_ADMIN`, and `EMPLOYEE` appear in application routing or admin logic, but are not represented consistently in the `users` role constraint.
- Guest/public users are implied by the home and registration pages, but a complete guest content experience is not evidenced.

## 3. Overall Findings

Counts are based on the detailed findings below. Categories overlap; one issue may be counted in more than one type.

| Measure | Count |
|---|---:|
| Critical issues | 2 |
| High issues | 19 |
| Medium issues | 14 |
| Low issues | 3 |
| Missing or materially partial features | 12 |
| Security issues | 12 |
| Bugs or functional mismatches | 10 |
| Validation issues | 5 |
| UI/UX issues | 6 |
| Database issues | 7 |

## 4. Gap Summary Table

| ID | Category | Gap | Severity | File / location | Status | Priority |
|---|---|---|---|---|---|---|
| G-001 | Security / Bug | Legacy payment endpoints are unauthenticated and trust client state | Critical | [payment.routes.ts](backend/src/routes/payment.routes.ts), [payment.controller.ts](backend/src/controllers/payment.controller.ts) | Confirmed | Immediate |
| G-002 | Security | Identity uploads are publicly readable | Critical | [app.ts](backend/src/app.ts), [upload.ts](backend/src/middlewares/upload.ts) | Confirmed | Immediate |
| G-003 | Security | Authorization headers and JWT claims are logged | High | [auth.middleware.ts](backend/src/middlewares/auth.middleware.ts) | Confirmed | Immediate |
| G-004 | Security / Authorization | Audit logs are available to any authenticated user | High | [audit.routes.ts](backend/src/routes/audit.routes.ts) | Confirmed | Immediate |
| G-005 | Security / Authorization | Telegram participant access is public or caller-selected | High | [telegram.routes.ts](backend/src/routes/telegram.routes.ts), [telegram.controller.ts](backend/src/controllers/telegram.controller.ts) | Confirmed | Immediate |
| G-006 | Security / Authorization | WhatsApp RA lookup lacks ownership enforcement | High | [whatsapp.controller.ts](backend/src/controllers/whatsapp.controller.ts) | Confirmed | Immediate |
| G-007 | Security | Long-lived JWTs lack issuer, audience, and revocation controls | High | [auth.controller.ts](backend/src/controllers/auth.controller.ts), [auth.middleware.ts](backend/src/middlewares/auth.middleware.ts) | Confirmed | High |
| G-008 | Security / Privacy | Tokens and regulated registration data use browser storage | High | [axio.ts](frontend/src/utils/axio.ts), registration pages | Confirmed | High |
| G-009 | Security / Validation | Upload validation relies on extension and client MIME | High | [upload.ts](backend/src/middlewares/upload.ts) | Confirmed | High |
| G-010 | Security / Validation | Login and OTP abuse controls are incomplete | High | [auth.routes.ts](backend/src/routes/auth.routes.ts), [auth.controller.ts](backend/src/controllers/auth.controller.ts) | Confirmed | High |
| G-011 | Bug / Configuration | Client recommendations use hard-coded localhost API origin | High | [ClientRecommendations.tsx](frontend/src/client_section/pages/ClientRecommendations.tsx) | Confirmed | Immediate |
| G-012 | Bug / API | Admin WhatsApp Excel upload calls a missing backend route | High | [AdminDashboard.tsx](frontend/src/pages_admin/AdminDashboard.tsx), [whatsapp.routes.ts](backend/src/routes/whatsapp.routes.ts) | Confirmed | High |
| G-013 | Authorization | Role names differ across middleware, controller, routing, and database | High | [admin.middleware.ts](backend/src/middlewares/admin.middleware.ts), [whatsapp.controller.ts](backend/src/controllers/whatsapp.controller.ts), [authRedirect.ts](frontend/src/utils/authRedirect.ts) | Confirmed | Immediate |
| G-014 | Authorization / Architecture | Two identity stores and unconstrained company-user roles split the actor model | High | [auth.controller.ts](backend/src/controllers/auth.controller.ts), schema artifact | Confirmed | High |
| G-015 | Database / Security | Published-call immutability is not enforced at database level | High | `research_calls` schema, research-call controllers | Confirmed from audit artifact | High |
| G-016 | Missing Feature / Authorization | Audience targeting and immutable recipient snapshots are absent | High | `research_calls`, Telegram/WhatsApp delivery | Confirmed from audit artifact | High |
| G-017 | Missing Feature / Reliability | No common delivery handshake or recipient receipt ledger | High | Telegram/WhatsApp job and message tables | Confirmed from audit artifact | High |
| G-018 | Functional / Compliance | Research and non-research content domains are not segregated | High | Client pages and research-call domain | Confirmed from audit artifact | High |
| G-019 | Database / Authorization | RA classification and broker assignment are absent | High | `ra_details`, `broker_details` schema | Confirmed from audit artifact | High |
| G-020 | Functional / Security | Suspension does not evidence an atomic cascade and performance freeze | High | User/subscription/performance workflows | Potential | High |
| G-021 | Database / API | Client subscription code uses a table absent from the inspected schema artifact | High | [clientSubscription.middleware.ts](backend/src/middlewares/clientSubscription.middleware.ts), client subscription controller, [schema_readable.txt](tmp/pdfs/schema_readable.txt) | Confirmed artifact mismatch | Immediate |
| G-022 | Build / Configuration | Frontend uses deprecated TypeScript module resolution | Medium | [tsconfig.app.json](frontend/tsconfig.app.json) | Confirmed diagnostic | High |
| G-023 | API / Documentation | OpenAPI does not document the complete mounted API | Medium | [openapi.yaml](backend/docs/openapi.yaml), route files | Confirmed | Medium |
| G-024 | Operations | Backup/restore automation lacks visible restore verification | Medium | [compose.yml](deploy/compose.yml), deploy scripts | Potential | Medium |
| G-025 | Security / Operations | Sensitive dump, environment, and upload artifacts require boundary review | Medium | `database-backups/`, `backend/.env`, `backend/uploads/` | Confirmed presence; exposure unknown | Immediate |
| G-026 | Security / Operations | Proxy-derived IP trust is broader than the code proves safe | Medium | [app.ts](backend/src/app.ts), controllers using `x-forwarded-for` | Potential | Medium |
| G-027 | Security / Quality | Production logs contain request, token, session, participant, and operational data | Medium | multiple backend controllers | Confirmed | High |
| G-028 | Functional / Data Quality | Performance metrics have incomplete or potentially inconsistent calculation semantics | Medium | [performance.controller.ts](backend/src/controllers/performance.controller.ts), [performance.service.ts](backend/src/services/performance.service.ts) | Confirmed partial implementation; semantics partly potential | High |
| G-029 | UI/UX / Bug | Performance cards expose View controls without actions | Medium | [Performance.tsx](frontend/src/pages/Performance.tsx), [Performance.tsx](frontend/src/pages_client/Performance.tsx) | Confirmed | Medium |
| G-030 | UI/UX / Quality | Client recommendation page retains dummy/dead data and inconsistent implementation variants | Medium | [ClientRecommendations.tsx](frontend/src/client_section/pages/ClientRecommendations.tsx), [Recomendation.tsx](frontend/src/pages_client/Recomendation.tsx) | Confirmed | Medium |
| G-031 | Missing Feature | Central notifications are only partially modeled | Medium | notification tables/controllers, subscription notification service | Confirmed from audit artifact | High |
| G-032 | Database / Compliance | Disclaimer version identity is not linked to each published call | Medium | `disclaimer_history`, `research_calls` schema | Confirmed from audit artifact | Medium |
| G-033 | Validation | Registration form validation is mostly required-field checking | Medium | [BrokerRegistration.tsx](frontend/src/pages_registration/BrokerRegistration.tsx), [RegistrationPage.tsx](frontend/src/pages_registration/RegistrationPage.tsx) | Confirmed | High |
| G-034 | Quality / UI | Debug routes, console logging, browser alerts, and placeholder paths remain | Low | auth/research routes and frontend modules | Confirmed | Medium |
| G-035 | Operations / Quality | Historical project notes report build and release hygiene gaps | Low | [issues-codex.txt](issues-codex.txt), CI workflow | Potential / historical | Medium |
| G-036 | Recommendation | Add formal migration, constraint, index, and contract governance | Low | database/deployment/documentation | Recommendation | Future |

## 5. Detailed Gap Analysis

### G-001: Legacy payment mutation endpoints

- **Category/type:** Security, bug, API.
- **Severity/priority:** Critical / Immediate.
- **Files/functions:** [payment.routes.ts](backend/src/routes/payment.routes.ts): `POST /create-order`, `/verify`, `/activate-free-plan`; [payment.controller.ts](backend/src/controllers/payment.controller.ts): `createOrder`, `verifyPayment`, `activateFreePlan`.
- **Current state:** The routes have no `authenticate` middleware. `verifyPayment` updates `users` by a client-supplied `resetToken` and stores client-supplied `amountPaid`. `activateFreePlan` updates a matching user from client-supplied `resetToken` and `planName`. Order creation uses client-supplied amount and plan name.
- **Gap/problem:** A caller can attempt to mutate payment and plan state without an authenticated identity, and verification is not bound to the locally stored order amount/order record/provider state. This conflicts with the stronger registration-payment verification flow elsewhere in the project.
- **Recommended solution:** Retire or isolate legacy endpoints. Derive user, plan, amount, and order from server-side records; verify provider order/payment linkage, amount, currency, status, and idempotency; use timing-safe signatures and transactional updates.
- **Status:** Confirmed.

### G-002: Public identity-document uploads

- **Category/type:** Security, privacy, API.
- **Severity/priority:** Critical / Immediate.
- **Files/functions:** [app.ts](backend/src/app.ts) mounts `/uploads` with `express.static`; [upload.ts](backend/src/middlewares/upload.ts); registration and broker upload routes.
- **Current state:** PAN cards, address proof, SEBI/NISM certificates, cancelled cheques, financial statements, and similar files are written to `uploads` and the entire directory is statically served without authentication or authorization.
- **Gap/problem:** Anyone who obtains a filename can request sensitive identity material. Returned profile URLs also use `/uploads/...`.
- **Recommended solution:** Keep private documents outside public static hosting. Add authenticated download handlers with owner/admin authorization, audit access, non-guessable storage keys, short-lived URLs where appropriate, malware scanning, retention/deletion rules, and content-disposition controls.
- **Status:** Confirmed.

### G-003 to G-010: Authentication and session security

The following related issues should be fixed as one security workstream:

- **G-003:** [auth.middleware.ts](backend/src/middlewares/auth.middleware.ts) logs the complete bearer header and decoded JWT. Remove token/claim logging and review existing logs for exposure.
- **G-004:** [audit.routes.ts](backend/src/routes/audit.routes.ts) uses `authenticate` but not `requireAdmin`; `getAuditLogs` and `exportAuditLogs` return IP addresses, devices, old values, and new values to any authenticated caller. Restrict to administrators and minimize/redact exports.
- **G-005:** [telegram.routes.ts](backend/src/routes/telegram.routes.ts) exposes `/participants` publicly and `/ra/:raId` to any authenticated caller. `saveTelegramUser` accepts an arbitrary `user_id`; [telegram.controller.ts](backend/src/controllers/telegram.controller.ts) does not consistently constrain it to the caller or an authorized administrator.
- **G-006:** [whatsapp.controller.ts](backend/src/controllers/whatsapp.controller.ts) recognizes admin roles for selected RA access, but `/ra/:raId` and related selected-RA paths require explicit authorization checks, not only a caller-supplied RA ID. Test ADMIN, SUPERADMIN, SUPER_ADMIN, RA, and other roles separately.
- **G-007:** JWT issuance in [auth.controller.ts](backend/src/controllers/auth.controller.ts) uses a long lifetime, while [auth.middleware.ts](backend/src/middlewares/auth.middleware.ts) verifies only the signature. Add short-lived access tokens, refresh rotation, issuer/audience checks, token version/revocation, and key rotation.
- **G-008:** [axio.ts](frontend/src/utils/axio.ts) and multiple login components store bearer tokens in `localStorage`; registration pages persist identity data and drafts in browser storage. Prefer secure HttpOnly SameSite cookies or a carefully designed in-memory session, and never persist regulated identity data unnecessarily.
- **G-009:** [upload.ts](backend/src/middlewares/upload.ts) accepts files using client MIME and extension checks. Add signature/content sniffing, field-specific format rules, antivirus scanning, random storage names, and private storage.
- **G-010:** `/login` and `/send-otp` in [auth.routes.ts](backend/src/routes/auth.routes.ts) lack dedicated login/OTP throttles. Password-reset OTP in [auth.controller.ts](backend/src/controllers/auth.controller.ts) uses `Math.random()` and has no visible attempt counter or lockout. Use cryptographically secure OTPs, attempt limits, per-account/IP/device throttling, replay prevention, and alerts.

### G-011 and G-012: Frontend/backend API contract mismatches

- **G-011 current state:** [ClientRecommendations.tsx](frontend/src/client_section/pages/ClientRecommendations.tsx) calls `http://localhost:3000/api/client/recommendations` instead of the configured `VITE_API_URL`. Production or non-local environments will fail or target the wrong service.
- **G-012 current state:** [AdminDashboard.tsx](frontend/src/pages_admin/AdminDashboard.tsx) posts Excel data to `/api/whatsapp/upload-excel/:raId`, but [whatsapp.routes.ts](backend/src/routes/whatsapp.routes.ts) exposes no such route. Telegram has `/api/telegram/upload-excel`.
- **Recommended solution:** Centralize API clients and endpoint constants, generate or contract-test frontend calls against mounted backend routes, and either implement the intended WhatsApp upload contract or change the frontend to the supported Telegram route.
- **Status:** Both confirmed.

### G-013 to G-021: Role, ownership, and domain model gaps

- **G-013:** `requireAdmin` accepts `ADMIN` and `SUPERADMIN`; WhatsApp accepts `ADMIN` and `SUPER_ADMIN`; frontend routing accepts all three plus `EMPLOYEE`. The database `users` check only permits RA, BROKER, and CLIENT. Define one canonical role/permission model and normalize legacy values at a controlled boundary.
- **G-014:** Admin login reads `company_users`, while normal users use `users`; `company_users.role` has no equivalent visible constraint. This makes authorization, audit identity, lifecycle, password policy, and role enumeration inconsistent. Unify identities or formally isolate them with shared policy and test coverage.
- **G-015:** The inspected schema artifact shows timestamp-maintenance triggers but no database rule preventing updates/deletes of published research calls. Application-only protection is insufficient for append-only/immutability requirements.
- **G-016:** No audience, subscriber, selected-broker, or immutable recipient snapshot relation is evidenced. Current delivery follows participant lists, making publication scope and historical recipient proof incomplete.
- **G-017:** Telegram and WhatsApp have separate jobs/messages, but no channel-neutral recipient delivery ledger with accepted/delivered/read/failed states, provider IDs, timestamps, and retry evidence.
- **G-018:** No separate governed article/blog/newsletter/content domain is evidenced. Client-facing pages should not implicitly treat research calls as general content.
- **G-019:** `ra_details` and `broker_details` exist, but no Independent/Broker-Hired/Organizational RA classification or effective-dated RA-to-broker assignment is modeled.
- **G-020:** User/subscription suspension fields and workers exist, but the inspected code does not prove one atomic workflow that places subscriptions on hold, blocks all publishing, notifies clients, and freezes performance calculations. Runtime workflow tests are required.
- **G-021:** [clientSubscription.middleware.ts](backend/src/middlewares/clientSubscription.middleware.ts) and the client subscription controller query `client_ra_subscriptions`. The inspected [schema_readable.txt](tmp/pdfs/schema_readable.txt) lists many subscription tables but not this table. This may be a stale artifact, but it must be reconciled before deployment.

### G-022 to G-036: Completeness, quality, and operational gaps

- **G-022:** `moduleResolution: "Node"` in [tsconfig.app.json](frontend/tsconfig.app.json) produces a current TypeScript deprecation diagnostic. Migrate to the current mode rather than suppressing it indefinitely.
- **G-023:** [openapi.yaml](backend/docs/openapi.yaml) does not evidence parity with all mounted client, dashboard, subscription, Telegram, WhatsApp, and admin paths. Add route-to-spec parity validation.
- **G-024:** Persistent database/uploads volumes and backup scripts exist, but automated backup verification, restore drills, encryption, retention, and off-host recovery evidence are not visible.
- **G-025:** The workspace contains a database dump, `backend/.env`, uploads, and deployment artifacts. Contents are not reproduced here. Verify repository history, filesystem permissions, encryption, retention, and distribution boundaries immediately.
- **G-026:** `app.set("trust proxy", 1)` and direct `x-forwarded-for` consumption are safe only behind the expected single trusted proxy. Restrict exposure and configure trusted proxy addresses deliberately.
- **G-027:** Console output includes authorization headers, decoded claims, request bodies, Telegram sessions, participant details, payment diagnostics, and operational payloads. Replace with structured, redacted, level-controlled logging.
- **G-028:** [performance.service.ts](backend/src/services/performance.service.ts) calculates P/L from raw entry and exit prices, while target/stop/early-exit classifications, denominator choices, suspension freeze, multi-target/lot-size logic, and public visibility rules are not fully governed. Establish a versioned methodology and golden datasets.
- **G-029:** Both Performance pages render `View`/arrow controls with no action handlers. They appear interactive but do nothing.
- **G-030:** [ClientRecommendations.tsx](frontend/src/client_section/pages/ClientRecommendations.tsx) retains `dummyData`, and separate recommendation implementations exist under client/page-client paths. Consolidate the product path and remove dead/demo data.
- **G-031:** Notification tables/controllers exist, but recipient identity, preferences, channel delivery state, retries, expiry reminders, and announcement/content workflows are not consistently modeled.
- **G-032:** Disclaimer history exists, but each published call does not visibly store the immutable disclaimer version ID/number alongside its text snapshot.
- **G-033:** Registration pages visibly check many required fields but do not consistently enforce email syntax, phone format, PAN/Aadhaar format, date ordering, numeric bounds, field lengths, and duplicate checks at both UI and API boundaries. Required-field checks must not be treated as complete validation.
- **G-034:** Test/debug endpoints such as auth and research route checks, broad console logging, browser `alert()` workflows, and placeholder navigation remain in production paths. Remove or gate them and replace alerts with accessible in-app feedback.
- **G-035:** [issues-codex.txt](issues-codex.txt) records historical build-failure and release-hygiene concerns. Current diagnostics confirm the frontend TypeScript issue but do not independently prove every historical build claim; rerun CI commands before release.
- **G-036:** Establish formal migrations, foreign keys, uniqueness rules, indexes, seed/version management, and schema drift checks. The raw SQL approach is workable, but the repository does not show a single authoritative schema lifecycle.

## 6. Role-wise Gap Analysis

### Research Analyst

**Currently evidenced:** Login, profile/settings, research-call creation and publishing, performance, client/participant management, Telegram, WhatsApp, notifications, templates, and subscription access.

**Gaps:** Participant access must be owner-scoped; publishing needs immutable audience snapshots; performance needs governed calculations and suspension behavior; RA classification/broker assignment is absent; disclaimer version linkage is incomplete; private uploaded documents must be protected. The frontend has role-specific routes, but backend policy must remain authoritative.

### Broker

**Currently evidenced:** Broker registration/profile/settings/dashboard and broker-specific subscription/registration data.

**Gaps:** Broker capability boundaries and assignments are not modeled; broker branding/version snapshots are absent; route redirections make broker recommendations/performance point to dashboard rather than provide broker-specific workflows. Confirm whether this is intentional or incomplete.

### Client

**Currently evidenced:** Client login/dashboard, analyst discovery, analyst subscriptions, recommendation feed, notifications, profile, and account functionality.

**Gaps:** The client subscription table must be reconciled with the database artifact; client recommendations include an older hard-coded localhost implementation; locked/discover content and subscription entitlements need end-to-end tests; client-facing documents/profile assets currently use public upload URLs.

### Admin / Superadmin

**Currently evidenced:** Registration approval/rejection/suspension, clients/brokers/RA management, audit UI, notifications, subscription approval, profile requests, and participant management.

**Gaps:** Admin role spelling is inconsistent; admin identity is split from normal users; audit exports are not protected by admin middleware; the Admin Dashboard contains a missing WhatsApp upload endpoint; sensitive uploaded documents and audit values need least-privilege access.

### Employee

**Currently evidenced:** Frontend access to morning reports and automation pages.

**Gaps:** `EMPLOYEE` is accepted by frontend route guards but is not represented in the `users` role constraint and is not consistently handled by backend authorization. Define employee permissions explicitly or remove the role from routes.

### Guest / public user

**Currently evidenced:** Home, login, registration, and public route scaffolding.

**Gaps:** A complete educational/public content experience and governed public performance visibility are not evidenced. Do not expose research or identity information by default.

## 7. Functional Gap Analysis

1. Payment and registration flows exist in both legacy and newer forms, creating inconsistent trust and state-management models.
2. Audience targeting, broker assignment, content segregation, and delivery receipts are missing or partial.
3. Notifications exist but are not a complete recipient-aware multi-channel workflow.
4. Performance is implemented but its business methodology is not fully complete or versioned.
5. Broker recommendations/performance route to dashboard placeholders.
6. Admin WhatsApp Excel upload is wired to a nonexistent endpoint.
7. Client subscription code and the inspected schema artifact disagree on `client_ra_subscriptions`.
8. Published-call immutability and suspension cascade behavior are not database-enforced or fully demonstrated.
9. Public/guest content and future broker/API capability boundaries are not evidenced.
10. Subscription integrations are documented as future work for Broker and Client settings in [subscription-module.md](docs/subscription-module.md).

## 8. Bug and Logic Analysis

- Unauthenticated legacy payment routes can mutate user payment state.
- Client recommendations can fail outside a developer machine due to hard-coded localhost.
- The Admin Dashboard WhatsApp upload request has no matching backend route.
- Role checks can disagree depending on which middleware/controller handles a request.
- Audit filter spelling differs between list (`SUPERADMIN`) and export (`SUPER_ADMIN`).
- Performance page controls have no handlers.
- Weekly performance selects the current week rather than accepting a user-selected week; confirm intended behavior.
- Performance denominators mix calls created in a period with calls exited in a period; confirm the intended reporting rule.
- Dead/dummy recommendation data and duplicate page implementations increase the chance of editing the wrong product path.
- The schema artifact mismatch can cause runtime SQL failures if the artifact reflects the deployed database.

## 9. Security Gap Analysis

Priority security actions are G-001 through G-010, G-013 through G-021, G-025 through G-027. Positive controls also exist: Helmet, CORS allowlisting, global rate limiting, parameterized SQL in inspected paths, hashed registration tokens, timing-safe comparisons in newer payment flows, and database-derived publishing authorization. These controls do not compensate for public private files, broken object-level authorization, or unauthenticated legacy payment mutations.

No secrets, credentials, tokens, or personal data are reproduced in this report. The presence of potentially sensitive artifacts is reported only by location.

## 10. Validation Gap Analysis

- Backend validation is uneven: newer subscription/payment controllers contain stronger parsing and checks, while legacy payment and several registration paths accept loosely typed request bodies.
- Broker registration visibly checks required fields but not robust email, phone, PAN, Aadhaar, date, length, and numeric formats.
- RA registration checks required fields and some pincode/file conditions, but duplicate and format enforcement must be verified at every API boundary.
- Upload validation must inspect actual content, not only extension/MIME.
- OTP/password reset needs attempt, expiry, replay, and lockout validation.
- Database constraints cover some enumerations and positive values, but the application needs documented uniqueness, foreign-key, and cross-field business rules.

## 11. Database Gap Analysis

- The schema artifact contains many tables and useful check constraints, but foreign-key/unique/index governance is not evident from the readable artifact.
- `client_ra_subscriptions` is queried by application code but absent from the inspected schema artifact; reconcile against the live database.
- `users` permits only RA/BROKER/CLIENT while application code uses admin/employee roles elsewhere.
- Two user tables (`users`, `company_users`) create duplicated identity and authorization state.
- `research_calls` lacks a visible immutable disclaimer-history reference and published-update/delete guard.
- Audience, RA classification, broker assignment, and recipient snapshot relations are absent.
- Notification persistence lacks recipient and delivery-state semantics.
- Add migrations, foreign keys, unique constraints for natural identities/idempotency, indexes for frequent owner/status/date queries, and schema drift checks.

## 12. API Gap Analysis

Important mounted API areas include auth, registration, admin, research, performance, Telegram, WhatsApp, payments, Razorpay webhook, subscriptions, client dashboard/account/notifications/recommendations, RA dashboard, broker, and audit logs.

The principal API findings are:

- Legacy payment authorization and contract safety are inadequate.
- `/uploads` is an unauthenticated file API in practice.
- Telegram `/participants` is public and RA selection is not consistently authorized.
- Audit endpoints lack admin authorization.
- WhatsApp upload is called by frontend but not mounted by backend.
- Client recommendation origin is not environment-configured in one implementation.
- OpenAPI documentation lacks complete route parity.
- API errors are often surfaced as browser alerts or generic server messages rather than a consistent typed error contract.

## 13. UI/UX Gap Analysis

- Loading states exist in several areas, but error, retry, empty-state, and success patterns are inconsistent.
- Browser `alert()` is used for important form, payment, participant, approval, and upload outcomes; replace with accessible snackbar/inline feedback and focus management.
- Performance cards expose inactive controls and inconsistent implementations for RA/client paths.
- Some route placeholders redirect to dashboard rather than explaining unavailable functionality.
- Registration drafts store sensitive data in local storage and show generic draft-save confirmation.
- Tables and admin actions need consistent confirmation dialogs for destructive operations, accessible status announcements, and clear disabled/loading states.
- Visual tests cover approved screenshots, but authenticated role workflows and API failure states are not visibly covered by the inspected E2E surface.

## 14. Code Quality Analysis

- Raw SQL is used consistently with parameter placeholders in many inspected paths, which is a positive control, but schema lifecycle is not centralized.
- Duplicate implementations and dead commented blocks are substantial in performance and recommendation code.
- Debug logging and test routes remain in runtime modules.
- Role and API constants are repeated as string literals.
- Error contracts vary between `{ message }`, `{ success, message }`, plain text, and browser alerts.
- Legacy and current payment/subscription paths coexist without a clearly enforced deprecation boundary.
- CI covers builds, subscription tests, and visual UI tests, but focused security and contract tests for the findings above are missing.

## 15. Recommended Fixes

1. Disable or redesign legacy payment mutation endpoints; bind every payment mutation to server-side order records and authenticated/registration ownership.
2. Remove public static access to uploads and implement authorized document retrieval.
3. Fix object-level authorization for Telegram/WhatsApp participants and restrict audit logs/exports to administrators.
4. Standardize roles and permissions across JWTs, database records, middleware, frontend routes, and audit logs.
5. Reconcile the live database with application SQL, especially `client_ra_subscriptions`; introduce migrations and schema drift checks.
6. Remove token/session/request-body logging and establish redacted structured logging.
7. Add dedicated login/OTP/payment/file abuse controls and stronger input/file validation.
8. Fix frontend/backend endpoint parity and centralize API configuration.
9. Define research publication governance: audience snapshots, immutable published calls, disclaimer versions, suspension cascade, and delivery receipts.
10. Define and test a versioned performance methodology with edge-case and golden-data fixtures.
11. Complete notification recipients, preferences, delivery state, retry, expiry reminders, and announcements.
12. Replace alerts/placeholders/dummy data and add accessible, consistent UI states.

## 16. Priority-Based Action Plan

### Immediate

- Disable/replace G-001 legacy payment routes.
- Protect uploads (G-002).
- Remove token logging (G-003).
- Lock audit and participant endpoints (G-004 to G-006).
- Reconcile `client_ra_subscriptions` and the deployed schema (G-021).
- Review sensitive artifacts and repository history (G-025).
- Fix hard-coded localhost and missing upload endpoint (G-011, G-012).

### High Priority

- Standardize roles and identity stores (G-007, G-013, G-014).
- Strengthen upload, login, OTP, and session security (G-008 to G-010).
- Add publication immutability, audience snapshots, delivery receipts, and suspension policy (G-015 to G-020).
- Fix validation and performance correctness (G-028, G-033).
- Establish API documentation parity and route contract tests (G-023).

### Medium Priority

- Migrate TypeScript module resolution (G-022).
- Complete notifications, disclaimer linkage, backup verification, proxy configuration, and operational logging (G-024, G-026, G-027, G-031, G-032).
- Consolidate recommendation/performance pages and replace inactive controls (G-029, G-030).
- Improve accessible UI feedback and destructive-action confirmations.

### Future Improvements

- Formalize migration/index/constraint governance (G-036).
- Add governed non-research CMS/content workflows, broker branding snapshots, RA classification, mobile version management, and future broker API boundaries after core authorization is stable.

## 17. Final Assessment

The project has meaningful breadth and several solid foundations: parameterized SQL, modular controllers/routes, subscription lifecycle concepts, payment webhooks, publishing-policy middleware, rate limiting, Helmet, CORS controls, deployment configuration, and automated build/test scaffolding.

Its completeness is best assessed as **feature-rich but not production-ready**. The blocking risks are not cosmetic: payment state can be mutated through unauthenticated legacy APIs, private identity files are public, participant and audit data authorization is incomplete, roles are inconsistent, and the application/schema contract may be out of sync. After those are fixed, the next production gate should require verified publication immutability, audience and delivery auditability, suspension behavior, performance calculations, validation coverage, database migrations/constraints, and authenticated end-to-end tests for every role.
