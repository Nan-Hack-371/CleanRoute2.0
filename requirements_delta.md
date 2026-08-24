# CleanRoute Requirements Delta — Persistence & Workflow Update

## Review basis

This comparison uses the Maharashtra-first product brief, the current React implementation, the static project manifest, and the newly attached persistence-and-bug-fix requirements.

| Area | Current implementation | New or changed requirement | Classification | Implementation consequence |
|---|---|---|---|---|
| Field check | The form records an observation only in browser local storage and deliberately labels it a private draft. | Save a validated observation to a persistent data store, refresh the selected facility, and show database-derived evidence values. | **Changed** | Replace local-only save with an authenticated write flow and a persisted field-check model. |
| Evidence image | File selection is local only; no upload occurs. | Validate image files, upload them safely, persist a reference, and show loading/error state. | **New** | Requires managed file storage plus a database relation to the field check. |
| Issue report | The modal stores a local browser draft only. | Insert a persistent report with a pending status and support later review, resolution, and rejection. | **Changed** | Requires reports storage, status transitions, and an admin-authorisation policy. |
| Admin reports | No admin route, role system, or report list exists. | Provide a persistent, admin-only reports workflow. | **New** | Requires authentication, role checks, report queries, and a protected administration route. |
| Distance sorting | The client already uses a Haversine calculation and sorts when browser geolocation succeeds. | Make the no-location state explicit, retain live recalculation, and verify ascending order with the live facility dataset. | **Refinement** | Preserve the existing calculation; improve permission/error state and add test coverage. |
| Data source | A central TypeScript demo dataset drives markers, lists, cards, and metrics. | Facilities, checks, reports, and photo references must be database-backed; no frontend-only demonstrations. | **Changed** | Migrate facility data into a persistent model and fetch it rather than treating local constants as the primary source of truth. |
| Data infrastructure | The project is a `web-static` React/Vite template with no app API, authentication, database client, Supabase package, Supabase URL/key, or storage configuration. | Reuse an “existing Supabase/database/API architecture” and apply Supabase RLS. | **Conflict** | There is **no existing Supabase architecture to reuse**. The existing static scope cannot safely implement database writes, RLS, uploads, or an admin workflow. |

## Decision needed for the conflict

The product goals are compatible with the existing CleanRoute interface, but **not with its current static-only runtime**. To implement real persistence, uploads, user ownership, and protected admin actions, the project must be upgraded to a full-stack project with authentication, a database, and managed storage.

The available project upgrade provides the required database, authentication, protected server APIs, and storage inside the existing CleanRoute project. It preserves the existing React pages and visual system, but it is **not an existing Supabase deployment**. If exact Supabase is mandatory, a Supabase project URL, publishable key, and service-side integration plan are still required; no such configuration is present in this repository.

## Requirements preserved

The Maharashtra-first scope, the 26-record evidence-labelled locator dataset, map/list synchronization, source hierarchy, design system, dynamic Haversine calculation, directions links, and fieldwork language remain in scope. The prior rule against fabricating fieldwork remains unchanged: an unmoderated user submission must never be presented as a verified facility fact.

## Proposed resolution

Upgrade the existing CleanRoute project to the managed full-stack capability, then implement facilities, field checks, reports, photo storage, role-gated moderation, and tests against that persistence layer. Field checks should be stored as observations first; only an authorised moderation action should update the facility’s verified display values.

---

# Role Access-Control Delta — Third Attachment

## Current access model compared with the requested model

| Area | Current implementation | New or changed requirement | Classification | Required change |
|---|---|---|---|---|
| Public discovery | Public users can view the locator, map, source-backed records, filters, search, directions, and browser-location distance sorting. | Preserve public read-only discovery. | **Preserved** | No change to public read procedures. |
| Field check | Any authenticated user can open and submit a field check; only an administrator’s submission currently updates official facility facts. | Field Check must be an administrator/authorised verifier function, unavailable to normal authenticated users. | **Conflict / changed** | Move the field-check route and mutation to `adminProcedure`; remove public field-check calls-to-action for normal users. |
| User feedback | Authenticated users can submit issue reports with optional evidence. There is no separate rating/review model. | Normal authenticated users should submit ratings and reviews, manage their own permitted content, and report issues. | **New** | Add a separately modelled review workflow; do not conflate reviews with official field checks. |
| Administration | The existing admin page manages reports only. There is no admin dashboard or facility create/edit/publication workflow. | Administrators can manage listings, add/edit/publish facilities, field checks, verification, review moderation, evidence, and relevant statistics. | **New** | Add server-enforced administrative facility/review operations and protected admin routes. |
| UI protection | The public header hides report moderation for non-admins, but the shared dashboard sidebar currently exposes a moderation item to any authenticated dashboard viewer. | Admin navigation must be hidden from normal users. | **Changed** | Render administrator navigation only when `user.role === "admin"`; redirect/deny direct admin routes. |
| Route protection | `/admin/reports` renders an access-denied view to a non-admin after client auth state resolves. | Direct admin URLs must deny normal users safely. | **Refinement** | Add a common admin-route guard that redirects non-admins to the public locator with a clear notice; retain server enforcement regardless of the UI. |
| Server enforcement | `adminProcedure` rejects non-admin report changes. However, current field-check mutation is only `protectedProcedure`. | Every administrator action must be rejected server-side for normal users. | **Changed** | Apply `adminProcedure` to field checks and all facility/review/publication mutations; add role-separated tests. |
| Database/RLS | This project uses a managed MySQL/TiDB database, not Supabase. Browser clients have no database credentials; all database writes pass through authenticated server procedures. | Enforce RLS or equivalent server-side policy. | **Architecture clarification** | MySQL does not supply the Supabase RLS model here. The equivalent control is server-only database access plus `protectedProcedure`/`adminProcedure` checks. Direct browser database mutation is not exposed. |
| Two-account verification | Tests already create distinct `user` and `admin` contexts, but do not yet cover every new operation. | Test normal and administrator accounts separately. | **Refinement** | Expand automated tests for the separate roles and provide browser steps for two genuine accounts. |

## Resolution

The requested model is compatible with the CleanRoute architecture once **official verification** and **community feedback** are separated. Public users remain read-only. Authenticated normal users may submit reports and their own ratings/reviews, but cannot create field checks, edit facilities, publish records, change verification, or moderate anyone else’s content. Administrators receive separately protected management tools.

No pre-existing actual observations, ratings, reviews, or reports will be fabricated while implementing this access model. Seeded discovery records remain development data and will be labelled separately from user content and verified field evidence.

---

# Field Check Entry-Point Delta — Fourth Attachment

## Existing implementation found

The field-check backend already exists and is protected correctly. `facilities.submitFieldCheck` is an administrator-only server procedure. It validates observation input, uploads an optional PNG/JPEG/WebP evidence image through the managed storage helper, persists a field-check record, and, for an authorised verifier, updates the facility’s database-backed hygiene, water, safety, lighting, accessibility, women-friendly, operating-status, evidence reference, verification status, and `lastChecked` values. The public locator invalidates and refetches the facility query after mutation.

The detailed field-check form already exists in `client/src/pages/Home.tsx`. It accepts the full observation set, notes, and evidence photo, then invokes that persisted mutation. The administrator workspace also has routes for facility management (`/admin/toilets`) and field checks (`/admin/field-checks`).

## Root cause of the missing administrator control

The full detail-page modal remains mounted behind `surveyOpen`, but **no visible action calls `setSurveyOpen(true)`**. Recent role-access changes retained global header and methodology links to `/admin/field-checks` while removing the selected-facility field-check trigger from the evidence card. Consequently, the detailed persisted form became unreachable from the toilet currently being reviewed. This is a **frontend linking regression**, not a missing database/API/storage implementation or a role-detection failure.

## Resolution

Restore the existing field-check form from the selected facility’s evidence card, visible only when `user.role === "admin"`. Add a companion administrator-only **Edit toilet** route into the existing facility-management workspace. Keep the user-facing review and issue-report controls intact. The current server `adminProcedure` remains the authoritative protection, so a normal user cannot save an official field check even if they manipulate the client.

## Requirement classification

| Fourth-attachment requirement | Current state | Change |
|---|---|---|
| Administrator opens a full field check for the selected toilet | Form exists but is unreachable from the details card | Restore one role-gated action; reuse the current modal and mutation. |
| Edit official toilet data | Existing administrator workspace route | Add a selected-detail entry point to the existing route. |
| Field-check values persist, verification updates, and detail card refreshes | Existing server/database/storage and client query invalidation | Preserve; add regression coverage and explicit confirmation UI. |
| Normal user sees View + Report only | Existing server protection and public controls | Preserve; do not show the two new official actions to non-admin users. |
| User report workflow | Existing persisted report flow | Preserve unchanged. |

---

# Product Positioning and Responsive Actions Delta — Fifth Attachment

## Current implementation compared with the requested refinement

| Area | Current implementation | New or changed requirement | Classification | Implementation consequence |
|---|---|---|---|---|
| Administrator detail actions | The restored controls are role-gated and functional, but their compact grid can crowd the label, icons, and buttons at narrow widths. | Present equal-height, readable Field Check and Edit Toilet controls that remain inside their container and stack cleanly on small screens. | **UI refinement** | Redesign only the reusable `FacilityAdminActions` component; retain its role gate, handler, route, and server-side enforcement. |
| Hero identity | The hero foregrounds “Maharashtra Fieldwork Study” and an evidence-first framing. | Lead with a public toilet locator and rating-platform identity. | **Content / positioning change** | Replace the eyebrow, headline, and supporting copy with user-task language: discovery, filters, comparison, navigation, and ratings. |
| Regional scope | Maharashtra, Khopoli, Rasayani, Panvel, and Navi Mumbai currently appear as the central brand identity. | Keep Maharashtra as launch-data context, not the entire product identity. | **Content hierarchy change** | Retain the region in supporting copy and discovery context without changing the location-independent data model or current data scope. |
| Field verification | Fieldwork is prominent in the hero and methodology narrative. | Preserve verification as a trust signal rather than primary branding. | **Content hierarchy change** | Keep existing field-check, evidence-card, and trust content; reframe the homepage support card and trust wording to explain verified data without presenting the product as a research dashboard. |
| Protected workflows | Administrator functions, authentication, storage, database, reports, reviews, map logic, and location search are in place. | Do not modify them. | **Preserved / constraint** | This attachment is a UI and copy refinement only; no schema, API, authorization, or field-data changes are permitted. |

## Resolution

The requested change is compatible with the current architecture. CleanRoute will retain its Maharashtra launch dataset and evidence-labelling safeguards while presenting the user-facing value proposition first: **find, filter, compare, navigate, and rate**. The role-gated administrator actions will be refined for responsive clarity without changing their protected behavior. No field observation, review, report, photo, facility, role, or database value will be created or altered as part of this work.

---

# Application-Level Authentication Delta — Sixth Attachment

## Current implementation compared with the requested model

| Area | Current implementation | Requested requirement | Classification | Implementation decision |
|---|---|---|---|---|
| End-user sign-in | Manus OAuth starts from review/report actions and is currently failing to return through the CleanRoute callback in the normal-user browser context. | Use CleanRoute-native email/password login and registration, with no Manus workspace redirect. | **Changed** | Replace end-user OAuth entry points with local registration and login routes while preserving public browsing. |
| User record | A single `users` table owns all reviews, reports, checks, and moderation references. It has a required unique `openId`, optional non-unique email, and `user`/`admin` role. | Reuse the existing user model; do not create duplicate account tables. | **Changed, compatible** | Extend `users` with a nullable password hash and a local-account identity strategy, preserving existing user IDs and foreign-key ownership. |
| Session enforcement | Signed session cookies already resolve a database user by `openId`; `protectedProcedure` and `adminProcedure` already enforce user/admin roles server-side. | Persist and validate a real application session, destroy it on logout, and retain role enforcement. | **Preserved, extended** | Reuse the existing signed-cookie contract for local accounts and remove only the browser’s end-user dependence on Manus OAuth. |
| Login routes | No app-native `/login`, `/register`, or `/admin/login` route exists. | Provide normal-user login/registration and an administrator sign-in route. | **New** | Add dedicated CleanRoute pages using the current visual system and safe return paths. |
| Return-to-action | Clicking Review/Report starts OAuth, with no reliable return path. | Return to the initiating toilet and reopen the review/report form after app login. | **New** | Store a validated internal return path and action intent in client navigation state; never accept arbitrary external redirect URLs. |
| Global unauthenticated handling | The client automatically calls `startLogin()` when a protected tRPC request fails. | Contribution actions should send visitors to CleanRoute login, not Manus. | **Changed** | Replace OAuth redirects with `/login` navigation that preserves the validated return target. |
| Admin access | Existing `adminProcedure` and role-based UI are sound, but the existing admin record has no local password credential. | `/admin/login` authenticates then confirms `role === admin`. | **New dependency** | Implement the route and deny non-admins. A local password must be provisioned for the existing admin through a secure owner-controlled setup/reset mechanism; no role or password will be invented. |
| Security | Server-side `protectedProcedure`, `adminProcedure`, owner-scoped review queries, and S3 evidence controls already exist. | Hash passwords, use secure sessions, validate input, rate limit auth, and preserve ownership/role checks. | **Preserved, strengthened** | Add memory-hard password hashing, generic credential errors, rate limiting, and local-auth tests without weakening existing procedures. |

## Requirements preserved

The Maharashtra locator, source labels, database records, reviews, reports, field checks, storage, owner-scoped contribution handling, administrator moderation, and `adminProcedure` protections remain in scope. No civic observation, photo, review, report, facility value, role, or password will be fabricated as part of the migration.

## Implementation boundary

This migration removes **end-user dependency** on Manus OAuth. It does not remove framework tooling that the development environment may still require. Existing Manus-authenticated records remain in the same `users` table, but local email/password accounts will use a password hash and a signed first-party session. The first real administrator local credential is an explicit setup dependency; the implementation must not silently promote or seed an administrator account.
