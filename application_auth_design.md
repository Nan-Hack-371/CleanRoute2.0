# CleanRoute Application Authentication Design

## Decision

CleanRoute will replace **end-user Manus OAuth** with a first-party email/password flow while retaining the existing database-backed `users` table, signed secure-cookie session format, `protectedProcedure`, `adminProcedure`, and user-owned contribution records. Public locator browsing remains anonymous.

## Account and session model

| Concern | Design decision |
|---|---|
| User table | Extend the existing `users` table; do not create a second account table. Existing foreign keys continue to use `users.id`. |
| Local identity | A new local user receives an internal `openId` in the `local:<random-id>` format, preserving the current session/user lookup contract. |
| Email | Normalize to trimmed lowercase at registration/login and enforce uniqueness for non-null email addresses. A read-only preflight found one existing email-bearing user and no duplicate-email groups. |
| Password storage | Store only a versioned Node `scrypt` hash with a per-password random salt. Plaintext passwords are never persisted, logged, returned by procedures, or stored in browser storage. |
| Session | Reuse the existing signed, HTTP-only session cookie. The server resolves the token’s internal identity to the database user on every protected request. |
| Logout | Clear the signed session cookie and invalidate the client-side `auth.me` query. |
| Rate limiting | Apply an in-memory, per-IP/per-normalized-email attempt window to registration and password login. This is a best-effort server-instance safeguard; it does not fabricate user records or bypass authorization. |
| Existing OAuth records | Preserve them in the existing table and do not alter roles. The public app will no longer initiate OAuth for end-user actions. |

## Role and admin bootstrap model

Registration always creates `role = user`; neither URL parameters nor client input can select an administrator role. `adminProcedure` remains mandatory for official verification, facility management, moderation, and administrator statistics.

The existing administrator record has no local password hash. A local administrator password therefore requires an **owner-controlled, administrator-authorized bootstrap/reset action** after implementation. The migration will not invent a password, promote a user, modify an administrator role, or seed an account. `/admin/login` verifies both credentials and `role === admin`; a normal user who supplies valid local credentials remains denied.

## Navigation and return-to-action model

Only internal return targets that begin with one `/` and do not begin with `//` are accepted. Review/report actions pass an internal return URL containing the selected facility ID and a short action intent. After successful local login or registration, Home restores that selected facility and opens the intended review or report form. Arbitrary external redirect URLs are rejected.

| Entry | Unauthenticated behavior | Successful local-auth result |
|---|---|---|
| Write a review | Navigate to `/login` with an internal review return target | Return to the selected facility and open the review form. |
| Report an issue | Navigate to `/login` with an internal report return target | Return to the selected facility and open the report form. |
| `/my-contributions` | Navigate to `/login` with the route as return target | Open the contributor’s own records. |
| `/admin/login` | Show first-party admin form | Route to `/admin` only after credential and role checks pass. |
| Public locator | No login required | Remains available to anonymous visitors. |

## Required security tests

The migration will test registration, duplicate-email rejection, generic invalid-credential behavior, password verification, session issuance and logout, normal-user/admin role separation, owner-scoped contributions, local-auth return-target validation, and existing protected mutation enforcement. Tests use mocked contexts and never insert civic observations, reviews, reports, photos, or facility records into the managed database.
