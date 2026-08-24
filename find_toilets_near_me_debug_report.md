# Find Toilets Near Me Debug Report

## Root Cause

The reported “no visible action” symptom was **not reproducible** on the actual deployed CleanRoute site. A manual deployed click immediately changed the button to **Finding toilets near you…**, disabled it, and showed the in-page loading panel. The browser console had no JavaScript exceptions.

The deployed browser was a secure context with `navigator.geolocation` available and a `prompt` geolocation permission state. It did not deliver a usable location fix, so the location flow completed through its existing fallback and clear recovery panel. No backend “nearby query” follows a successful location acquisition by design: the published facility list is already loaded and the client calculates distances, sorts the active filtered subset, updates labels, and updates the established map/list state.

To ensure a user never mistakes a real request for no response, the button now additionally emits an immediate **Locating…** toast, replaces it with a visible success count when coordinates arrive, and replaces it with a visible error toast when the request cannot complete.

## Acceptance Results

| Check | Status | Evidence |
|---|---|---|
| Button click detected | **PASS** | Live deployed click immediately rendered the disabled **Finding toilets near you…** state. |
| Geolocation request | **PASS** | Deployed browser reported secure context, available `navigator.geolocation`, and permission state `prompt`; the real request entered loading then fallback/recovery. |
| Visible loading feedback | **PASS** | In-page spinner/status plus immediate **Locating…** toast were confirmed in the browser. |
| Permission handling | **PASS** | Controlled browser denial made exactly one request, rendered denial guidance and recovery action, and showed an error toast. |
| Fallback location | **PASS** | Controlled high-accuracy timeout made a second broader-signal request and showed **Getting an approximate location…**. |
| Nearby toilet query | **PASS — local published dataset** | Browser resource inspection recorded the initial batched `auth.me`, `facilities.list`, and published-review tRPC request. No follow-up nearby request is expected or made because the existing published facilities are filtered, distance-calculated, and sorted in client runtime state after coordinates arrive. |
| Results update | **PASS** | Controlled success showed **Found 25 toilets near you**, nearest-first order, and **0 m away** for the matching published record. |
| Distance calculation | **PASS** | Live-coordinate test rendered dynamic labels; automated Haversine/order assertions passed. |
| Refresh location | **PASS** | The existing refresh action was preserved; controlled refresh returned results and removed recovery guidance. |
| Sort by distance | **PASS** | Success enables the current distance sort over the active subset. |
| Search and filters | **PASS** | A Vashi search reduced the locator to two records; location success preserved that subset, rendered **0 m away**, and retained the sorted update. |
| Map/list linkage | **PASS — established integration** | The same filtered/sorted facility collection continues to feed list and map marker logic. The managed Google base-map script remains unavailable in this automation browser and truthfully falls back. |
| Regression tests | **PASS** | `pnpm test`: 8 files, 32 tests. |
| Type checking | **PASS** | `pnpm check` passed. |
| Production build | **PASS** | `pnpm build` passed; the existing non-blocking chunk-size advisory remains. |

## Browser Limitation

The automation browser did not expose a usable real location fix or an actual user permission prompt, so a live approved-coordinate test remains for a user-controlled browser. Temporary in-memory browser stubs were used only to exercise success, fallback, denial, refresh, and result-rendering paths, then removed by reload. No civic data was written, created, edited, published, or deleted.
