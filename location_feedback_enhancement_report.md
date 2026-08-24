# Location Feedback and Recovery Enhancements

| Enhancement | Delivered behavior |
|---|---|
| Fallback notice | When high-accuracy geolocation fails, the locator presents a toast explaining that it is trying the device’s broader available signal. |
| Manual refresh | A **Refresh location** control now appears next to the locator results and again in the recovery panel. Both use the existing real browser geolocation flow. |
| Recovery guidance | If both attempts fail, an accessible alert provides device-location, browser-permission, and retry steps. Permission denial receives site-settings-specific instructions. |
| Reusable skill | `/home/ubuntu/skills/browser-geolocation-fallback-repair/SKILL.md` packages the validated retry, messaging, and regression workflow. Its prescribed validator passed. |

## Validation

The fallback toast was confirmed in the browser with the expected title and description. Controlled browser checks verified the loading status, dual-failure recovery panel, and Refresh location path returning dynamic nearest results. `pnpm check`, `pnpm test` (**8 files / 32 tests**), and `pnpm build` passed. Mobile visual validation confirmed the existing locator controls remain visible at 375 × 812.

Temporary browser-only geolocation stubs were removed after validation. No civic data, authentication behavior, roles, reviews, reports, field checks, or schema changed.
