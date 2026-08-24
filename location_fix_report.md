# Targeted Location-Control Repair Report

## Scope

This report records the repair limited to **Find Toilets Near Me** and **Sort by Distance**. No facility, review, report, field-check, authentication, administrative, search, filter, map, API, schema, or civic-data workflow was changed for this repair.

## Root Cause and Resolution

| Finding | Resolution |
|---|---|
| The hero and sidebar controls previously shared the location-request action, causing a click on **Sort by Distance** to request browser geolocation rather than only sort an existing location result. | The control paths are now separate. `findNearMe()` owns browser permission and coordinate acquisition, while `enableDistanceSort()` only enables sorting when current coordinates already exist. |
| Distance display and ordering needed a single dynamic calculation based on the same published dataset that powers locator cards and markers. | `client/src/lib/location.ts` provides a Haversine `distanceKm()` function and `sortNearestFirst()`. The card display calculates km/m dynamically from browser coordinates; the visible list uses the same filtered facilities before nearest-first sorting. |
| The location action needed a clear in-progress state and to reject repeated attempts. | `isLocating` disables the Find Toilets Near Me control while the browser request is outstanding and shows **“Finding toilets near you…”**. |
| Pre-location sorting did not clearly explain its prerequisite. | Sort before a location is available now says **“Enable location to sort toilets by distance.”** and does not request permission or assert a sort occurred. |

## Confirmed User-Facing Behavior

| Scenario | Verified result |
|---|---|
| Location request begins | The real browser `navigator.geolocation` path is invoked. The control becomes disabled and shows **“Finding toilets near you…”**. |
| Browser cannot provide a location | After the configured 10-second request timeout, the UI shows **“We couldn't determine your location. Please try again or search for an area manually.”** |
| Sort is requested before location is available | The rendered DOM shows **“Enable location to sort toilets by distance.”** after the sidebar control is activated. |
| Successful location update | A temporary browser-only geolocation stub was used solely to exercise the UI. With an existing published Vashi coordinate, the filtered cards rendered **0 m away** then **906 m away** and the matching records were ordered nearest to farthest. A reload removed the stub and restored normal real-permission behavior. |
| Dynamic distance and nearest-first order | The focused automated regression suite verifies Haversine distance calculation and orders the supplied facility records nearest to farthest from an input coordinate. |
| Existing locator search | A browser search for **Vashi** reduced the live locator to the two matching published facility records. The code applies filters/search before optional distance sorting, preserving this composition. |

## Validation Results

| Check | Result |
|---|---|
| TypeScript | `pnpm check` passed. |
| Automated tests | `pnpm test` passed: **8 files, 28 tests**. `server/location-flow.test.ts` covers real geographic distance, nearest-first ordering, required denied and unavailable responses, the pre-location sort message, and sorting an already searched subset without reintroducing excluded facilities. |
| Production build | `pnpm build` passed. The existing bundle-size advisory remains non-blocking and is outside this targeted scope. |
| Desktop locator rendering | Verified at 1280 × 720; the existing Find Toilets Near Me control is visible and unclipped. |
| Mobile locator rendering | Verified at 375 × 812; the existing Find Toilets Near Me control and search entry point are visible and unclipped. |

## Browser Limitation

The automated browser did not provide a usable geolocation fix, so it exercised the genuine unavailable path rather than a successful real permission grant. It did not produce a permission-denied response either. A temporary browser-only stub was therefore used to verify the successful UI path against existing published facility coordinates; it did not change application code or civic data and was removed by reloading the page. A real user browser should still perform one acceptance check with location permission explicitly allowed.

No civic data was written, published, edited, or deleted during validation.
