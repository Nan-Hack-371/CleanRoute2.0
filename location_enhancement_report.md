# Locator Distance, Loading, and Map-Pin Enhancements

## Implemented Behavior

| Enhancement | Delivered behavior |
|---|---|
| Distance unit | A user-facing accessible switch changes dynamic distance labels between kilometers and miles. Short distances use metres in kilometer mode and feet in mile mode. |
| Geolocation feedback | While the browser location request is pending, the primary action is disabled, includes an inline spinner, and exposes a live status panel: **“Finding toilets near you…”** and **“Using your device location to calculate live distances.”** |
| Nearest map pins | Once a location is available, the managed Google Maps view receives a blue current-location marker and up to twelve nearest markers from the already filtered/searched published results. Marker clicks retain the established selected-facility behavior. |
| Map bounds and labels | The map bounds include the current location and displayed nearest pins. Pin titles use the selected distance unit, while the map overlay reports the nearest filtered marker count and current-location legend. |

## Regression Validation

| Check | Result |
|---|---|
| Type check | `pnpm check` passed. |
| Automated suite | `pnpm test` passed: **8 files, 30 tests**. The focused location suite verifies kilometer/mile conversion and nearest-pin limiting over an already-filtered subset. |
| Production build | `pnpm build` passed. The existing non-blocking bundle-size advisory remains. |
| Browser loading state | A browser-only delayed geolocation callback confirmed the disabled action, spinning indicator, and live loading guidance. |
| Browser unit and nearest-result state | A temporary browser-only successful location callback verified the miles selector, mile/foot labels, and the nearest-filtered map overlay state. The test state was removed by reloading the page. |
| Responsive layout | Desktop (1280 × 720) and mobile (375 × 812) locator screenshots kept the existing primary controls visible and unclipped. |

## Managed Map Runtime Note

The feature uses the existing managed Google Maps integration and does not introduce a new provider or API key. The automation browser still fails to initialise the managed Maps script, so it displays the established honest fallback rather than a live base map in that browser. The interactive marker logic is integrated and tested at the data/handler level; it will render when the managed script initialises in a supported browser.

No facilities, reviews, reports, photos, field checks, roles, or other civic data were created, edited, published, or deleted.
