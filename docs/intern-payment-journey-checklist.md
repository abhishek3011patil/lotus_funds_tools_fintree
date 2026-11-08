# Payment and user journey: intern test checklist

Use this checklist on the `codex/payment-journey-readiness` branch. The goal is to record what works, what fails, and what is blocked; a green automated run alone is not proof that the full journey works.

## Before starting

- Get a dedicated staging URL, separate staging database, synthetic RA/broker/client accounts, and an admin test account from the project owner. The local schema-only database created during the review has no journey fixtures and is not a ready-to-use staging site.
- A senior must configure Razorpay test mode and a test webhook, an identity-provider sandbox or approved mock, and disable or redirect email, Telegram, and WhatsApp to approved test destinations. Never use real Aadhaar numbers, card details, passwords, or customers.
- Confirm the app and database both point to staging. Do not run these checks on the Oracle production site. Do not change database rows directly to make a scenario pass.
- Do not post tokens, credentials, identity numbers, card data, or unredacted provider responses in GitHub. Use synthetic data and redacted screenshots.
- If staging, a provider sandbox, or a test account is unavailable, mark the affected case **BLOCKED** and say what is missing. Do not mark mocked checks as a provider end-to-end pass.

## Automated checks

On the pull request, open **Checks → Build and test** and review the result and logs. The workflow runs on pull requests and pushes to `master`; a push to a feature branch alone does not start it. If a check fails, record the first relevant error and rerun only after a change or transient infrastructure failure.

For local checks, install Node.js 22 and run from the project root:

```powershell
npm ci
npm ci --prefix backend
npm ci --prefix frontend
npm run build --prefix backend
npm run build --prefix frontend
npm run docs:validate --prefix backend
npm run test:backend
npm run test --prefix frontend
npm run test:e2e
```

The two new backend suites are `legacyPaymentSecurity.test.ts` and `registrationPaymentSecurity.test.ts`. They mock the database and payment provider. The browser suite starts a frontend preview and some scenarios mock APIs. Run the manual staging cases below separately.

## Manual scenarios

Record PASS, FAIL, BLOCKED, or NOT RUN for each case, with environment, date and commit SHA. Where a role is specified, repeat for applicable RA, broker, and client registration paths.

### Registration and identity

- **REG-01 Valid registration:** Submit complete synthetic registration details. Expect a confirmation and a registration record for the correct role; no active account before required approval.
- **REG-02 Required fields:** Omit each required field and submit invalid formats. Expect clear validation and no completed registration.
- **REG-03 Duplicate account:** Reuse a test email or username. Expect a clear rejection or documented recovery flow, without a second account.
- **KYC-01 Sandbox success:** With approved synthetic identity fixtures, complete verification. Expect verification tied to that registration and the next step available.
- **KYC-02 Wrong or expired OTP:** Submit a wrong or expired code. Expect rejection, no verified status, and an actionable retry message.
- **KYC-03 Changed identity or expired proof:** Verify one test identity, change identity details or use an expired proof, then submit. Expect the server to reject it and require verification again. Report any bypass as a release blocker; do not assume all registration roles currently enforce this.
- **KYC-04 Provider unavailable:** Simulate a timeout or provider rejection in the approved sandbox/mock. Expect no verified status and a safe retry or support message.

### Payments and approval

- **PAY-01 Test payment success:** Select a paid test plan and complete a sandbox payment. Expect the server-selected amount and currency, a paid order, and registration pending approval. Confirm the provider test dashboard and app agree.
- **PAY-02 Payment cancelled or failed:** Cancel checkout and simulate a failure. Expect no paid status, no active subscription, and a usable retry.
- **PAY-03 Double click and retry:** Click Pay twice and retry after a refresh. Expect no duplicate successful charge, subscription, or payment record. Record any extra provider orders for senior review.
- **PAY-04 Invalid signature or wrong order:** With an approved test fixture, submit an invalid signature or another application's order. Expect rejection and no paid status or activation.
- **PAY-05 Wrong amount, currency, or uncaptured payment:** Use provider test fixtures/mocks to return each mismatch. Expect rejection and no activation. Never modify the production provider or database to create this case.
- **PAY-06 Replay and webhook:** Repeat a successful callback and send a duplicate test webhook. Expect no duplicate subscription or transaction; an invalid webhook signature must be rejected. Record exact app and provider statuses.
- **PAY-07 Session expired:** Retry with an expired registration or reset session. Expect rejection and a safe recovery path.
- **PAY-08 Admin approval:** After a successful test payment, approve the correct application. Expect the correct account/subscription to become usable; a different application must remain unchanged. Check rejection separately.

### Login, linking and calls

- **LOGIN-01 Login and role:** Log in with each test role; verify its own dashboard and logout. Wrong passwords and suspended accounts must not gain access.
- **LINK-01 Request and accept:** Broker requests an RA connection; RA accepts. Expect pending before acceptance and active afterward, with no duplicate link after retry.
- **LINK-02 Decline and remove:** Decline a request and remove an existing link. Expect the broker to lose access to that RA's calls; other connections remain intact.
- **CALL-01 Publish and visibility:** An approved RA publishes a synthetic call to the intended broker/client audience. Expect it in the appropriate feed and absent for unrelated accounts. Drafts should not appear as published calls.
- **CALL-02 Attachments:** Authorized recipients can open a synthetic attachment. A logged-out user, another RA, and an unauthorized client must not retrieve it by URL.
- **CALL-03 Delivery failure:** Use a disabled or approved test messaging destination. Confirm failures and retries are visible and do not create duplicate deliveries. Do not send to real recipients.

### Subscription lifecycle

- **SUB-01 Subscribe:** Complete a sandbox subscription payment. Expect access only for the purchased account and plan, and correct status and dates.
- **SUB-02 Cancellation:** Cancel a test subscription. Confirm the displayed cancellation and effective access match the product's stated policy, then repeat cancellation and confirm it is safe.
- **SUB-03 Expiry or suspension:** Using a senior-prepared test fixture, inspect access after expiry and suspension. Expect restricted content to be inaccessible and an appropriate status or message.
- **SUB-04 Cross-account access:** Attempt to use another client's subscription, broker's connection, or RA's document. Expect access denied or no data.

## Record and report results

For each case, record: ID, result, staging URL, commit SHA, date, role and synthetic account, steps, expected result, actual result, and a redacted screenshot or log. For payments include only safe test order/payment identifiers if the project owner approves. Note whether provider responses were real sandbox calls or mocks.

Open a GitHub issue for each distinct failure with the case ID and reproduction steps; link it in the pull request. Mark missing credentials, fixtures, or external test access as BLOCKED. A senior reviews payment, identity, authorization, and provider failures before release.
