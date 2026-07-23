# RA registration subscription: manual integration

The feature files in this directory are intentionally isolated. Apply the
following three small frontend edits manually after reviewing and testing the
new pages. None of these patches has been applied by Codex.

## Section A — `RegistrationPage.tsx`

Add this import to
`frontend/src/pages_registration/RegistrationPage.tsx`:

```diff
 import { useNavigate } from "react-router-dom";
+import { saveRARegistrationSession } from "../features/raRegistrationSubscription";
```

Replace only the current successful registration block:

```diff
     if (response.data.success) {
-  localStorage.removeItem("raRegistrationForm");
-  localStorage.removeItem("raRegistrationStep");
-
-  alert("✅ Registration submitted successfully!");
-  navigate("/login");
-}
+      const applicationId =
+        typeof response.data.application_id === "string"
+          ? response.data.application_id.trim()
+          : "";
+      const registrationToken =
+        typeof response.data.registration_token === "string"
+          ? response.data.registration_token.trim()
+          : "";
+      const tokenExpiresAt =
+        typeof response.data.registration_token_expires_at === "string"
+          ? response.data.registration_token_expires_at.trim()
+          : "";
+
+      if (
+        !applicationId ||
+        !registrationToken ||
+        !tokenExpiresAt ||
+        Number.isNaN(Date.parse(tokenExpiresAt))
+      ) {
+        throw new Error(
+          "Registration succeeded, but the secure registration session was incomplete."
+        );
+      }
+
+      saveRARegistrationSession({
+        applicationId,
+        registrationToken,
+        tokenExpiresAt,
+        audienceType: "RA",
+      });
+
+      localStorage.removeItem("raRegistrationForm");
+      localStorage.removeItem("raRegistrationStep");
+
+      navigate("/registration/subscription", {
+        replace: true,
+      });
+    }
```

This keeps the two existing draft cleanup calls, removes the blocking success
alert, stores the plain registration token only in `sessionStorage`, and does
not send the applicant to login before payment and approval.

## Section B — `AppRoutes.tsx`

Replace the old password page lazy import and add the two registration flow
page imports:

```diff
 const LoginForm = lazy(() => import("../common/LoginForm"));
 const LoginFormAdmin = lazy(() => import("../common/LoginFormAdmin"));
 const Signup = lazy(() => import("../pages/common/Signup"));
-const NewPassword = lazy(() => import("../common/NewPassword"));
+const RAPasswordSetupPage = lazy(
+  () =>
+    import(
+      "../features/raRegistrationSubscription/pages/RAPasswordSetupPage"
+    )
+);
 
 // --- Lazy: Registration ---
 const RegistrationPage = lazy(() => import("../pages_registration/RegistrationPage"));
 const BrokerRegistration = lazy(() => import("../pages_registration/BrokerRegistration"));
+const RAPlanSelectionPage = lazy(
+  () =>
+    import(
+      "../features/raRegistrationSubscription/pages/RAPlanSelectionPage"
+    )
+);
+const RAUnderReviewPage = lazy(
+  () =>
+    import(
+      "../features/raRegistrationSubscription/pages/RAUnderReviewPage"
+    )
+);
```

Replace the existing `/set-password` element only after testing the new page:

```diff
-<Route path="/set-password" element={<NewPassword />} />
+<Route path="/set-password" element={<RAPasswordSetupPage />} />
```

Add the two public child routes under the existing `/registration` route:

```diff
 <Route path="/registration">
   <Route index element={<RegistrationPage />} />
   <Route path="broker" element={<BrokerRegistration />} />
+  <Route
+    path="subscription"
+    element={<RAPlanSelectionPage />}
+  />
+  <Route
+    path="under-review"
+    element={<RAUnderReviewPage />}
+  />
 </Route>
```

The resulting public route mapping is:

- `/registration/subscription` → `RAPlanSelectionPage`
- `/registration/under-review` → `RAUnderReviewPage`
- `/set-password` → `RAPasswordSetupPage`

Do not delete `frontend/src/common/NewPassword.tsx` yet. Keep the existing
`/subscription` route unchanged as the legacy/public pricing page. Remove
nothing else. `AppRoutes.tsx` currently contains a duplicate
`/recommendations` route; leave that duplication unchanged in this task.

## Section C — `LoginForm.tsx`

This edit is required for the “register and start calls” outcome. Replace only
the Research Analyst branch:

```diff
 if (role === "RESEARCH_ANALYST") {
-  navigate("/ra-dashboard");
+  navigate("/recommendations", {
+    replace: true,
+  });
 } else if (role === "BROKER") {
```

Do not rewrite the login component or alter the Admin, Employee, Broker, or
Client branches.

## Section D — Admin approval

No new Admin frontend page is required. The existing Admin **Approve** button
remains in use. Backend approval changes the registration to `APPROVED`,
activates the subscription, creates the inactive user with `password_hash`
equal to `NULL`, and emails this one-time link:

```text
${FRONTEND_URL}/set-password?token=...
```

Once `/set-password` points to `RAPasswordSetupPage`, the Research Analyst uses
that link to create a password. Successful password setup activates the
account. Login then routes the Research Analyst to `/recommendations`.

## Section E — Existing `SubscriptionPage`

Do not use `frontend/src/subscription/SubscriptionPage.tsx` for this flow. Keep
`/subscription` as legacy/public pricing temporarily. The RA registration flow
uses `/registration/subscription`. Remove the temporary manual Razorpay code
from the old page later, in a separate cleanup task.

## Section F — Manual end-to-end test

1. Open `/registration`.
2. Submit a fresh RA.
3. Confirm sessionStorage contains:
   - registration_application_id
   - registration_token
   - registration_token_expires_at
   - registration_audience_type = RA
4. Confirm navigation to `/registration/subscription`.
5. Confirm only current RA plans are fetched.
6. Choose a plan.
7. Complete Razorpay Test Mode payment.
8. Confirm backend verification.
9. Confirm navigation to `/registration/under-review`.
10. Refresh under-review and confirm no second order is created.
11. Open existing Admin section.
12. Approve the paid RA.
13. Copy/open the development password setup link or email link.
14. Confirm `/set-password?token=...` validates without OTP.
15. Create the password.
16. Confirm account becomes active.
17. Log in.
18. Confirm RESEARCH_ANALYST is routed to `/recommendations`.
19. Create a research call.
20. Confirm the protected backend accepts it with the active subscription.
21. Confirm an expired subscription is denied by backend middleware.
22. Confirm invalid, expired, and reused setup links show safe errors.
