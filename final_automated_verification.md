# CleanRoute Final Automated Verification

**Verification date:** 23 August 2026  
**Scope:** Automated application verification and read-only browser observations only. No role, facility, field check, review, report, evidence image, or administrator-session change was made.

## Verification status

| Area | Status | Evidence and boundary |
|---|---|---|
| OAuth configuration | **PASS (code inspection)** | The client uses `window.location.origin` to build the app callback URL and creates a host-only, secure nonce cookie only when login begins. |
| Callback endpoint | **Implemented; external callback not reached** | `/api/oauth/callback` validates the nonce, exchanges the code, upserts the user, creates the session, and redirects to `/`. During the normal-user attempt, the logs showed **zero** callback requests. |
| Session creation | **Implemented; not exercised in a valid normal-user browser session** | The callback’s session-creation branch cannot execute until the identity provider returns through the CleanRoute callback. Protected-route logs showed a missing session cookie for the attempted normal-user browser context. |
| Normal-user browser session | **NOT COMPLETED / NOT PASSED** | The public locator loads without authentication. The attempted `/admin` visit redirected to Manus login because a valid app session cookie was absent; this is not evidence of authenticated-normal-user route denial. |
| Five normal-user `/admin…` checks | **PENDING / NOT COMPLETED / NOT PASSED** | `/admin`, `/admin/toilets`, `/admin/field-checks`, `/admin/reviews`, and `/admin/reports` remain deferred until a normal-user OAuth flow actually returns through `/api/oauth/callback`. |
| Administrator/API authorization | **PASS (automated)** | Server tests distinguish normal-user and administrator contexts. Official field checks, facility creation/update/publication, review moderation, report moderation, and administration statistics require `adminProcedure`. |
| Public/community authorization | **PASS (automated)** | Public reads remain public; issue reports and reviews require authentication; own-review operations are owner scoped. |
| Selected-detail administrator controls | **PASS (component regression)** | `FacilityAdminActions` hides official controls for non-admins and preserves administrator Field Check handler and Edit Toilet route wiring. |
| Type safety | **PASS** | `pnpm check` completed without errors. |
| Tests | **PASS** | `pnpm test`: **5 files / 12 tests** passed. |
| Production build | **PASS** | `pnpm build` completed successfully. The output retains only a non-blocking client bundle-size warning. |
| Public usability | **PASS (visual)** | The public locator, search, area filters, discovery cards, directions, Review/Report controls, and clear map-unavailable fallback render without administrator controls in the unauthenticated public view. |
| Administrator usability | **PASS (previous visual validation)** | Administrator overview, facility edit, and field-check routes were visually validated in the existing administrator context without submitting data. |

## OAuth finding

The configured preview callback is:

```text
https://3000-i3qwwf8vcthoo3ycz0jp3-f28cbf94.us3.manus.computer/api/oauth/callback
```

The implementation preserves this callback through OAuth state and redirects the completed session to the CleanRoute root. The observed external limitation is that the normal-user sign-in did not return through this endpoint; the user instead returned to the Manus editor, leaving no CleanRoute session cookie. This prevents a valid manual normal-user route test, but it does not alter the server-side authorization result established by the automated suite.

The user also confirmed that the expected Manus OAuth sign-in page opens from **Write a review**. The failure occurs after that sign-in handoff, when the identity-provider journey returns to the Manus editor rather than calling CleanRoute’s configured callback.

> The five browser checks are deliberately recorded as **pending, not completed, and not passed**. No further OAuth or CAPTCHA attempts are authorised for this validation cycle.

## Safe future completion

When a normal-user OAuth flow successfully returns to the callback above, first confirm that **My contributions** appears in the CleanRoute header and that administrator navigation is absent. Then visit the five routes below without clicking any action control, and record the access-denied or redirect result for each.

| Route | Required future observation |
|---|---|
| `/admin` | Denied or safely redirected; no administration dashboard. |
| `/admin/toilets` | Denied or safely redirected; no facility-management form. |
| `/admin/field-checks` | Denied or safely redirected; no official field-check form. |
| `/admin/reviews` | Denied or safely redirected; no moderation queue. |
| `/admin/reports` | Denied or safely redirected; no report-moderation queue. |
