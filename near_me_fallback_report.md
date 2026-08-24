# Find Toilets Near Me Fallback Repair

## Root Cause

The live deployed locator reproduced the reported behavior: its initial `navigator.geolocation` request used `enableHighAccuracy: true` with a 10-second timeout, then immediately stopped with the unavailable guidance if that precision request timed out. This can fail on devices or browsers that cannot rapidly acquire a high-accuracy signal even though a broader device location is available.

## Focused Repair

The location request now preserves the original high-accuracy attempt first. If it is unavailable or times out, CleanRoute keeps the existing single in-progress state and makes one genuine second browser geolocation request with `enableHighAccuracy: false`, a 20-second timeout, and a five-minute acceptable cached location. It never retries an explicit permission denial. Successful coordinates still drive the same published, filtered facility data, dynamic distances, and nearest-first ordering.

## Validation

| Check | Result |
|---|---|
| Live reproduction | The deployed browser completed the high-accuracy request with the unavailable guidance after the 10-second timeout. |
| Fallback recovery | A temporary browser-only test made the first request time out and the second return existing Vashi coordinates. The handler called geolocation twice, rendered dynamic distance labels, and reported sorted nearby published toilets. |
| Denied permission | A browser-only explicit denial made exactly one request and rendered the required denial guidance; no retry occurred. |
| Automated validation | `pnpm check`, `pnpm test` (**8 files / 31 tests**), and `pnpm build` passed. |

The temporary browser stubs were removed by reloading the page. No facility, review, report, field check, photo, role, or other civic data changed.
