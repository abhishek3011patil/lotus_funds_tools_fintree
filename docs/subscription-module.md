# Subscription Module

## Purpose

This module provides reusable subscription-status functionality for Research
Analyst, Broker, and Client settings pages. The Research Analyst (RA) settings
page is the first implemented consumer.

## Current implementation

- `SubscriptionStatusCard` is the role-neutral presentational component.
- `RASubscriptionStatus` fetches the logged-in RA's data and passes it to the
  shared card.
- `GET /api/subscriptions/me` is the existing current-user subscription endpoint.
- `getMySubscriptionAccess` owns the parameterized query, response mapping,
  feature lookup, and limit lookup.
- Shared TypeScript types describe the settings card data and API response.
- `subscriptionAccess.routes.ts` applies `authenticate`, which populates
  `req.user` from the bearer token, before the controller runs.

## File structure

### Added

- `frontend/src/components/subscription/SubscriptionStatusCard.tsx`  
  Shared presentational subscription component and its props.
- `frontend/src/components/subscription/SubscriptionStatusSkeleton.tsx`  
  Responsive loading state.
- `frontend/src/components/subscription/subscriptionStatus.utils.ts`  
  Shared status, date, amount, and remaining-day presentation utilities.
- `frontend/src/components/subscription/index.ts`  
  Public exports for the shared module.
- `frontend/src/components/setting/RA_setting_component/RASubscriptionStatus.tsx`  
  RA settings data-fetching wrapper with loading, error, retry, and stale-request
  protection.
- `frontend/src/types/subscription.ts`  
  Shared subscription and current-user response types.
- `docs/subscription-module.md`  
  Architecture, contract, mapping, reuse rules, and maintenance record.

### Modified

- `frontend/src/pages/Settings.tsx`  
  Adds item 5 using the existing RA settings card layout and renumbers the
  following source comments.
- `backend/src/controllers/subscriptionAccess.controller.ts`  
  Extends the existing response with amount paid, currency, and non-negative
  days remaining.

## API contract

### `GET /api/subscriptions/me`

Authentication is required through a bearer token. The request has no body,
query parameter, or user ID. The controller reads only `req.user.id`.

The endpoint retains its existing access-control fields (`hasSubscription`,
`hasActiveSubscription`, `features`, `limits`, and `nextStep`) and now exposes
the following settings-card fields inside `subscription`:

```json
{
  "success": true,
  "hasSubscription": true,
  "hasActiveSubscription": true,
  "subscription": {
    "id": "subscription-id",
    "status": "ACTIVE",
    "audienceType": "RA",
    "planId": "plan-id",
    "planCode": "RA_PLAN",
    "planName": "RA Plan",
    "amountPaid": 2000,
    "currency": "INR",
    "daysRemaining": 30,
    "tierCode": "TIER_1",
    "pricePaise": 200000,
    "durationDays": 30,
    "version": 1,
    "startsAt": "2026-07-01T00:00:00.000Z",
    "expiresAt": "2026-07-31T00:00:00.000Z"
  },
  "features": [],
  "limits": [],
  "nextStep": null
}
```

When no subscription exists:

```json
{
  "success": true,
  "hasSubscription": false,
  "hasActiveSubscription": false,
  "subscription": null,
  "features": [],
  "limits": [],
  "nextStep": "PURCHASE_SUBSCRIPTION"
}
```

Error response:

```json
{
  "success": false,
  "message": "Unable to load subscription access."
}
```

Authentication failures return HTTP 401. Query or server failures return HTTP
500.

Statuses found in the subscription lifecycle code are `PENDING_PAYMENT`,
`PAID_PENDING_APPROVAL`, `ACTIVE`, `REJECTED`, `REFUND_PENDING`, `REFUNDED`,
`SUSPENDED`, `CANCELLED`, and `EXPIRED`.

## Database mapping

The current-user query uses these relationships:

- `subscriptions.user_id = req.user.id`
- `subscriptions.plan_id = subscription_plans.id`
- `subscriptions.payment_order_id = payment_orders.id` (optional)
- `subscriptions.registration_application_id` links a subscription to its
  originating `registration_applications` row in registration and approval
  workflows, but the status query does not need that join.
- `registration_plan_selections.registration_application_id` links the
  application's selected plan snapshot during registration. Subscription
  creation copies those snapshots into `subscriptions`.

The primary query is parameterized with `$1`:

```sql
SELECT
  subscription.id,
  subscription.status,
  subscription.starts_at,
  subscription.expires_at,
  subscription.plan_id,
  subscription.plan_code_snapshot,
  subscription.plan_name_snapshot,
  subscription.tier_code_snapshot,
  subscription.price_paise_snapshot,
  subscription.duration_days_snapshot,
  subscription.plan_version_snapshot,
  plan.audience_type,
  COALESCE(
    payment_order.amount_paise,
    subscription.price_paise_snapshot
  ) AS amount_paid_paise,
  COALESCE(payment_order.currency, plan.currency) AS currency
FROM subscriptions subscription
INNER JOIN subscription_plans plan
  ON plan.id = subscription.plan_id
LEFT JOIN payment_orders payment_order
  ON payment_order.id = subscription.payment_order_id
WHERE subscription.user_id = $1
ORDER BY
  CASE WHEN subscription.status = 'ACTIVE' THEN 0 ELSE 1 END,
  subscription.created_at DESC
LIMIT 1
```

The endpoint first expires any due active subscription for that same user, then
prefers an active subscription and otherwise returns the newest subscription.

## Reusability rules

1. Shared subscription UI must remain role-neutral.
2. Role-specific pages may fetch data and pass props to shared UI.
3. The component must not accept arbitrary user IDs.
4. Current-user APIs must derive identity from authentication.
5. Broker and Client integrations should reuse the shared types and card.
6. Role-specific actions should be added through optional props or separate
   wrappers, not hard-coded into the shared component.
7. Payment and lifecycle business logic must remain in the backend.

## Future integrations

### Broker Settings

Not yet implemented. A Broker wrapper should call the current-user endpoint and
render:

```tsx
<SubscriptionStatusCard subscription={brokerSubscription} />
```

### Client Settings

Not yet implemented. A Client wrapper should call the current-user endpoint and
render:

```tsx
<SubscriptionStatusCard subscription={clientSubscription} />
```

## Status definitions

- `PENDING_PAYMENT`: payment has not completed.
- `PAID_PENDING_APPROVAL`: payment completed and Admin approval is pending.
- `ACTIVE`: Admin approved the subscription and its access period is current.
- `REJECTED`: registration/subscription processing was rejected.
- `REFUND_PENDING`: a refund is in progress.
- `REFUNDED`: payment was refunded.
- `SUSPENDED`: access was administratively suspended.
- `CANCELLED`: subscription was cancelled.
- `EXPIRED`: the subscription reached its expiry date.

`EXPIRING_SOON` and `ON_HOLD` are supported by the shared card presentation but
were not found as stored lifecycle statuses. `EXPIRING_SOON` can be introduced
later as a UI- or API-derived display status without changing the card.
Unrecognized statuses use the default theme chip.

## Amount handling

- Plan and subscription snapshot amounts use `price_paise` and
  `price_paise_snapshot`.
- Captured/local payment orders use `payment_orders.amount_paise`.
- The endpoint prefers the linked payment order amount, falls back to the
  subscription snapshot, and converts paise to major currency units by dividing
  by 100.
- Currency is sourced from the linked payment order and falls back to
  `subscription_plans.currency`.
- The shared card formats the returned major-unit amount with `Intl.NumberFormat`.

## Date handling

- `startsAt` comes from `subscriptions.starts_at`, which is set when Admin
  approval activates the subscription.
- `expiresAt` comes from `subscriptions.expires_at`.
- `daysRemaining` is calculated by the backend as the ceiling of the exact
  millisecond difference from server time to expiry, clamped to zero. A null
  expiry produces null.
- PostgreSQL timestamps are returned through the driver and serialized by
  Express as ISO timestamps. The card formats valid timestamps in the `en-IN`
  locale using the browser's local timezone and never renders `Invalid Date`.

## Testing checklist

- [ ] Active subscription
- [ ] Pending approval
- [ ] Expired subscription
- [ ] No subscription
- [ ] Null plan
- [ ] Null expiry
- [ ] Invalid API response
- [ ] API failure
- [ ] Retry action
- [ ] Loading state
- [ ] Mobile layout
- [x] Duplicate API request check (Strict Mode's first scheduled request is
  cancelled during effect cleanup)
- [x] TypeScript build

## Change log

| Date | Change | Files | Notes |
|------|--------|-------|-------|
| 2026-07-28 | Added reusable subscription status display and RA integration | Shared frontend module, RA wrapper/settings page, subscription access controller, this document | Reused the authenticated current-user API; no schema or lifecycle changes |

Update this document whenever subscription-related functionality is added or
changed.
