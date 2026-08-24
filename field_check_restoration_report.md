# CleanRoute Field Check Restoration Report

## Existing implementation found

The persistent field-check workflow already existed. The administrator-only `facilities.submitFieldCheck` procedure validates the full observation payload, uses managed storage for an optional evidence image, writes a `field_checks` row, and updates the corresponding facility’s official evidence values and verification metadata. The selected-facility form in `Home.tsx` already contained the complete hygiene, water, safety, lighting, accessibility, women-friendly, operating-status, notes, and evidence-photo controls.

## Root cause of missing UI

The public toilet-details evidence card had no administrator action that invoked the existing `setSurveyOpen(true)` field-check modal. The detailed modal and server mutation were still present, but the control that linked the selected facility to the modal had been removed during the role-access UI refactor. Global links to `/admin/field-checks` remained, which masked the missing contextual action.

## Restored entry points

| Requirement | Result | Evidence |
|---|---|---|
| Selected-detail field check | **PASS** | The evidence card now renders the dedicated `FacilityAdminActions` group only when `user.role === "admin"`. Its **Perform field check** handler is wired by `Home.tsx` to the existing `openOfficialFieldCheck()` modal action for the selected toilet. |
| Selected-detail edit | **PASS** | The same selected-detail action group renders **Edit toilet** only for administrators and creates the encoded `/admin/toilets?edit=<facility-id>` route, which pre-populates the existing management form. |
| Administrator navigation | **PASS** | The administrator workspace exposes Manage toilets, Field checks, Moderate reviews, and Report moderation. The validated `/admin/toilets?edit=khopoli-rail` view opened with the matching facility form pre-filled. |
| Administrator field-check workspace | **PASS** | The protected `/admin/field-checks` view rendered for an administrator and presented the current verified-save form. |
| Normal-user role protection | **PASS (server); browser check pending** | The field-check API uses `adminProcedure`; the role test rejects a normal-user `submitFieldCheck` call. A live normal-user browser check remains deferred by the external account restriction. |
| User report workflow | **PASS** | Public users retain **Report an issue** and authenticated persistent reporting. |
| Persistence and refresh path | **PASS (existing implementation + automated tests)** | The mutation persists field checks, updates facility evidence/verification data when authorised, and invalidates/refetches the facility list. The database currently contains 3 verified persisted field checks; no new observation was created for this restoration. |

## Database and safety boundary

A read-only database check confirmed that existing records include **3 field checks, all verified**. No field check, photo, review, report, role, or facility record was inserted or changed to validate this restoration. A future administrator should submit an update only after a genuine on-site observation; the UI confirmation then reports that the facility data was refreshed.

## Build and test result

TypeScript validation passed. The test suite passed **5 files and 12 tests**, including server-side rejection of normal-user field-check submission, persistence/storage contract coverage, and a selected-facility component interaction regression test. That test verifies that normal users receive no official controls, while an administrator’s **Perform field check** action invokes the supplied modal-opening handler and **Edit toilet** produces the encoded management route. The production build passed, with only the existing non-blocking client-chunk-size warning.
