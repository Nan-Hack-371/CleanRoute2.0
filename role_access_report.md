# CleanRoute Role Access Report

## Access model implemented

CleanRoute separates **public discovery**, **authenticated community contribution**, and **administrator verification/management**. Official field checks are now an administrator-only function and are not treated as user ratings or issue reports.

| Capability | Public | Authenticated user | Administrator | Enforcement |
|---|:---:|:---:|:---:|---|
| View locator, map, search, filters, details, source-backed ratings/reviews | Allowed | Allowed | Allowed | Public read procedures and public UI |
| Use browser location and distance sorting | Allowed | Allowed | Allowed | Client-side browser-permission flow; coordinates remain database-backed |
| Submit issue report with permitted evidence image | Denied until sign-in | Allowed | Allowed | `protectedProcedure` |
| Submit community rating/review | Denied until sign-in | Allowed; moderation pending | Allowed; moderation pending | `protectedProcedure` |
| Edit/delete own review | Denied | Allowed for own record only | Allowed for own record; moderation separately available | Owner-scoped database query plus `protectedProcedure` |
| View own permitted submissions | Denied until sign-in | Allowed | Allowed | User ID constrained in server procedure |
| Official field check / change official verification | Denied | **Denied** | Allowed | `adminProcedure` |
| Create, edit, publish, or unpublish facility listing | Denied | **Denied** | Allowed | `adminProcedure` |
| Moderate reviews | Denied | **Denied** | Allowed | `adminProcedure` |
| Resolve/reject reports | Denied | **Denied** | Allowed | `adminProcedure` |
| Admin statistics and administration dashboard | Denied | **Denied** | Allowed | Route guard and `adminProcedure` |

## Required security results

| Test | Status | Evidence |
|---|---|---|
| Field Check: user denied / admin allowed | **PASS (automated)** | Separate `user` and `admin` server contexts are tested. User receives `FORBIDDEN`; admin submission invokes the official verified-check write. |
| Add/Edit/Publish Toilet: user denied / admin allowed | **PASS (automated)** | `admin.createFacility` is rejected for a normal user and allowed for an administrator. Facility publication status is server controlled. |
| Moderate Reviews: user denied / admin allowed | **PASS (automated)** | `admin.updateReview` rejects a normal user; administrator moderation is protected. |
| Resolve Reports: user denied / admin allowed | **PASS (automated)** | `admin.updateReport` rejects a normal user; administrator reporting queue is protected. |
| Unauthenticated report submission denied | **PASS (automated)** | Protected issue-report procedure rejects `UNAUTHORIZED`. |
| Direct admin-route protection | **PASS (implementation); manual second-account check pending** | `/admin`, `/admin/toilets`, `/admin/field-checks`, `/admin/reviews`, and `/admin/reports` use an access-denied/safe-state guard for non-admins. The visible navigation only renders admin items for `user.role === "admin"`. |
| Selected-detail official actions | **PASS (automated component interaction)** | The actual reusable `FacilityAdminActions` group used by the public evidence card renders no official controls for a normal user, invokes the administrator’s supplied Field Check handler, and builds the encoded Edit Toilet management route. |
| Database/RLS-equivalent protection | **PASS (architecture)** | This managed MySQL/TiDB project has no direct browser database credentials and no Supabase RLS layer. Database mutation occurs only in server procedures, where `adminProcedure` is required for administrator-controlled writes. |

## Automated validation

`pnpm check` passed. `pnpm test` passed with **5 test files and 12 tests**. The suite distinguishes a normal-user context from an administrator context, covers public/authenticated/admin operations, and now includes a selected-facility component interaction regression test for administrator-only Field Check and Edit Toilet actions. `pnpm build` passed.

> **Data note:** The security tests use mocked persistence and storage contracts. They do not insert fabricated field observations, ratings, reviews, or reports into the managed database.

## Exact two-account browser verification

### Test 1 — normal authenticated user (Account A)

1. Use a separate normal-user account and sign in to CleanRoute.
2. Open `/` and confirm the locator, search, filters, location button, toilet detail card, review button, and report button are available.
3. Confirm that the header has **My contributions** but does **not** show **Field checks**, **Manage toilets**, **Moderate reviews**, **Report moderation**, or **Admin overview**.
4. Navigate manually to `/admin`, `/admin/toilets`, `/admin/field-checks`, `/admin/reviews`, and `/admin/reports`.
5. Confirm every route shows the administrator-access denial/safe page rather than an administrative operation.
6. Submit a genuine review or report only if you have real information. Confirm it appears under `/my-contributions` as your own content and remains pending; it must not update official facility facts.
7. Attempt no administrator action. Server-side procedure tests confirm those actions return `FORBIDDEN` for the normal-user role.

**Expected result:** Discovery and permitted personal contributions work; every admin action is denied.

### Test 2 — administrator (Account B)

1. Log out, then sign in using a distinct account whose database role is `admin`.
2. Open `/admin` and confirm the operations dashboard is available.
3. Open `/admin/toilets`; create an **unpublished test facility** using an actual or clearly labelled test coordinate, then edit and publish/unpublish it. Delete the test record when validation is complete if it is not a genuine listing.
4. Open `/admin/field-checks` and submit an official field check **only with a real observation**. Confirm the associated facility evidence card updates.
5. Open `/admin/reviews`; publish or reject an authentic submitted review.
6. Open `/admin/reports`; update a genuine report to `reviewing`, `resolved`, or `rejected` with a factual internal note.
7. Confirm the public locator only lists facilities whose publication status is `published`.

**Expected result:** All authorised administration actions work, and server procedures persist the change.

## Remaining limitation

The current browser session was an administrator session. A real two-account browser test cannot be completed until a separate normal OAuth account is used. The implemented route guard and server tests cover the intended denial model, but the normal-account manual verification above remains the final operator check.

## Preview authentication finding

The exact CleanRoute preview URL is:

```text
https://3000-i3qwwf8vcthoo3ycz0jp3-f28cbf94.us3.manus.computer/
```

CleanRoute does **not** have a separate email/password registration page at `/login`. Its application authentication is Manus OAuth. The public preview opens without authentication; choosing **Report an issue** or **Write a review** begins the app-specific OAuth flow. The live request was checked and carries this callback:

```text
https://3000-i3qwwf8vcthoo3ycz0jp3-f28cbf94.us3.manus.computer/api/oauth/callback
```

That callback provisions or updates the CleanRoute user record and redirects to the locator root after successful OAuth completion. The temporary normal-user browser session has not yet reached that callback; it returned to the Manus workspace instead. No account role, permissions, or application data were changed while diagnosing this.

To establish a normal-user app session, begin at the preview URL above, click **Report an issue** or **Write a review**, complete the OAuth flow in the same tab, and wait for the callback to return to the CleanRoute root. When the header exposes **My contributions**, the app session is active and the five direct `/admin…` checks can proceed.

## Normal-user browser verification status

The separate-account test was started from the public CleanRoute preview using the application-specific **Report an issue** entrypoint. The resulting OAuth request carried the correct CleanRoute callback URL. The account-selection page then displayed Cloudflare’s **“Verify you are human”** challenge before the normal-user sign-in could finish.

No role, permission, facility, field check, review, report, or other application data was changed. Because the OAuth callback was not reached, the five direct administrator URLs were **not** tested in a real normal-user browser session. This is an external identity-provider verification blocker, not an in-app authorization failure.

The application logs were also checked after the attempt and contained **zero** `/api/oauth/callback` requests, confirming that the CAPTCHA-blocked identity-provider session never reached the CleanRoute callback endpoint.

### Safe retry procedure

1. Open the exact CleanRoute preview URL in a browser that permits cookies.
2. Click **Report an issue** or **Write a review** from the public locator, which initiates the app-bound OAuth flow.
3. Complete the identity-provider CAPTCHA and sign-in in the same browser tab.
4. Confirm the callback returns to the CleanRoute root and that **My contributions** is present for the normal user.
5. Visit `/admin`, `/admin/toilets`, `/admin/field-checks`, `/admin/reviews`, and `/admin/reports` without clicking any action controls. Record the access-denied or redirect result for each URL.

## Final verification boundary

At the project owner’s direction, no further CAPTCHA or normal-user OAuth attempts will be made during this validation cycle. The five normal-user browser checks for `/admin`, `/admin/toilets`, `/admin/field-checks`, `/admin/reviews`, and `/admin/reports` are explicitly **pending**, not passed.

The current reason for deferral is an external Manus account restriction that prevents a valid normal-user CleanRoute session. This is an external identity-provider constraint; CleanRoute code, roles, permissions, data, and the administrator session will remain unchanged. No further OAuth or CAPTCHA retries are authorised in this cycle.

The final verification conclusion is limited to the completed evidence: server-side role-enforcement tests, API contract tests, database schema inspection, production build, and visual rendering checks. A future valid normal-user application session should execute the safe retry procedure above and append the five observed route outcomes to this report.

## Final automated update — 23 August 2026

The final automated validation completed with `pnpm check`, **5 test files / 12 tests**, and `pnpm build` all passing. The only build observation is the non-blocking client bundle-size warning. Public locator rendering and the existing administrator routes remained usable; no role, facility, field check, review, report, or session was changed.

The OAuth implementation remains correctly configured to derive its callback from the active preview origin and use the callback below:

```text
https://3000-i3qwwf8vcthoo3ycz0jp3-f28cbf94.us3.manus.computer/api/oauth/callback
```

The callback handler is implemented to validate state, create the session after a successful token exchange, and return to the locator. However, the final normal-user attempt produced **zero** requests to this endpoint and protected-route logs showed a missing CleanRoute session cookie. The observed redirect to Manus login is therefore an unauthenticated-session result, not a completed authenticated-normal-user denial result.

Accordingly, all five normal-user browser route checks—`/admin`, `/admin/toilets`, `/admin/field-checks`, `/admin/reviews`, and `/admin/reports`—are **pending, not completed, and not passed**. No further OAuth or CAPTCHA attempt is authorised during this cycle. The complete status table and future safe completion procedure are in `final_automated_verification.md`.
