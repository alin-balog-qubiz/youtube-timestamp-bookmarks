# Use design-system components throughout the app

Status: blocked
Type: task
Blocked by: 01

## Goal

Replace the popup POC completely with the components from [issue 1](01-create-components.md), implement the agreed production behavior and persistence in the [design-system spec](../spec.md), and delete the temporary Components link. This is a complete cutover, not a parallel theme or an optional redesigned screen.

## Read first

- [Design-system spec](../spec.md): visual tokens, inventory, approved behavior, theme/color migration, gallery lifecycle.
- [Popup workflow](../../popup-ui/spec.md): unchanged context, playback, edit, filtering, persistence, and import safeguards.
- [Product scope](../../../docs/scope.md) and [coding conventions](../../../docs/agents/coding-style.md).

## Implementation

### Adopt all popup surfaces

1. Use the shared components for popup header/navigation, outside-YouTube/context notices, This video summary/list/actions, All videos filter/groups/launchers, Settings groups, editor, import/confirmation dialogs, and all loading/empty/no-results/error/success states. Remove obsolete POC component owners and global styling when their callers migrate; no aliases or duplicate old/new rendering paths.
2. Apply the shared theme/tokens to the actual popup and all portaled overlays. Target 560 px width and up to 700 px height, constrained by native browser space. Maintain persistent navigation and reliable scrolling; do not copy fixed 570 px view heights or mobile minimum sizes from the reference.
3. Use **YouTube Bookmarks** in the popup, popup document title, and extension display metadata. Retain storage keys and the existing backup format identifier. Do not expand this issue into replacing the separate starter-icon task.
4. Render timestamp plus **Unnamed bookmark** for missing names, without writing a synthetic name to storage. Keep real title/ID fallback and derived counts; do not invent channel metadata to fill reference examples.
5. All videos header/title toggles expansion, independently for each group. Add distinct **Go to video** and **Delete video** controls in the expanded panel. Go to video opens the watch page; compact bookmark links retain seek-if-active/new-tab-at-time behavior. Delete video confirms title/ID and count, explains that the source is unaffected, and removes saved data only after success.
6. This video keeps per-bookmark Edit / Copy timestamped link / Delete menus. Remove its bulk-delete control; video-level deletion lives in All videos. Preserve title-only filtering, ordering, supported-context initial navigation and gating.
7. Use the composed editor/import dialogs with real controller state. Retain atomic save, draft-only adjustment, legal-duration disabled buttons, unknown-duration explanation, collision rejection, active-video checks, save-error draft retention, import validation, stale-preview checks and destructive Replace acknowledgement.

### Theme, color, migration, and backups

8. Add one persisted `light | dark | system` preference through the existing background settings boundary and production theme owner. Missing means System. Restore after reopen/restart, react to OS changes only in System, and apply to dialogs/menus/native controls. Report read/write failures; never claim an unpersisted choice is saved. Reuse the gallery's provider, not a second CSS-only theme implementation.
9. Add semantic Accent/Gray/Ink and fixed-hex Custom choices to global default and bookmark override data using the spec's canonical discriminated choice. Use default removes a bookmark override. Convert existing stored hex colors to Custom, preserving exact colors, identities, timestamps, names, titles and creation dates. Fresh installations use Accent; existing users keep their saved default. Reuse one resolver and migrate every affected model, validation, mutation, read, preview and message consumer.
10. Export version-2 backups under the unchanged format identifier; include semantic color choices and theme alongside existing metadata/settings. Strictly accept existing version 1, normalize hex values to Custom and missing theme to System, and validate new version-2 discriminants. Merge preserves current settings and duplicate metadata; Replace adopts incoming theme/colors/visibility with an accurate preview and explicit destructive acknowledgement. Invalid input, cancellation and failed/stale imports change nothing. Update the detailed popup backup schema and regression contracts with the implementation.
11. Keep background serialization/library coordination and atomic Replace semantics intact. Color/theme preference writes, imports and consistent snapshots must not bypass the shared settings/mutation boundary. Do not add a second persisted UI store.

### Remove temporary access, retain development tooling

12. Delete the temporary popup Components link and its opening handler, including development builds. Retain the interactive gallery only in development, reachable directly by extension `components.html` URL. Keep its fixtures isolated and absent from release output. Update developer instructions to replace temporary-link guidance with direct-page instructions.
13. Leave the YouTube quick-add control and feedback unchanged. Do not implement timeline markers, Welcome or Guide. If a shared data contract change requires adapting an existing consumer, keep its current visible behavior; no host UI redesign is part of this issue.

## Acceptance and smoke evidence

- [ ] Capture actual extension-popup light/dark surfaces for all three pages, menus, editor, import and delete confirmations. All use shared components; requested font stack, off-white, elevation and separate danger treatment are visible. Measure actual popup width/height; document any native cap and exercise scrolling at the available height.
- [ ] Open on a supported watch page and elsewhere. Initial selection/context gating and outside-YouTube notice remain correct. Navigation stays reachable with long lists, and overlay actions remain usable near scroll boundaries.
- [ ] Verify All videos header expands instead of launching; Go to video launches; compact timestamps seek/open correctly; title-only filter preserves order and clearing restores it. Unnamed fallback is visible without altering stored names.
- [ ] Confirm/cancel/fail individual deletion and Delete video. Confirmation identifies data; failures retain rows; last-bookmark deletion removes the library group. This video no longer exposes bulk deletion or a replacement hidden shortcut.
- [ ] Exercise name/color/time Save and Cancel, zero/end boundaries, oversized steps, unavailable duration, target collision, save failure and active-video change. Persisted data remains correct, drafts survive recoverable failure, and successful moves preserve creation date and chronology.
- [ ] Change Light/Dark/System in real Settings, reopen the popup, and restart/reload the development browser. Verify stored preference survives, OS changes update only System, and injected preference failures do not display false saved feedback. Record manual OS/native limits separately from browser media emulation.
- [ ] Migrate a real isolated legacy library/default color: saved hex values become Custom without visual changes or lost metadata. Change each preset between themes, edit Custom, change global default, and Use default; inherited rows follow default, explicit overrides remain overrides, Custom stays fixed.
- [ ] Export and inspect a real version-2 download; Replace it into isolated data and reopen to prove a complete round trip including theme/choices/visibility. Import a real version-1 fixture with second zero, names, overrides and saved defaults; Replace sets theme to System and preserves hex colors as Custom.
- [ ] Exercise Merge duplicates/current settings precedence; different and empty Replace; both mode cancellations; malformed version-1/version-2 discriminants and unsupported versions; persistence failure; concurrent-change stale preview. Preview totals/settings changes match committed results, and rejected operations do not alter data.
- [ ] Keyboard-check actual popup navigation, menus, native input access, choices, dialog focus trapping/restoration and Escape/Cancel; inspect readable text, focus/contrast, reduced motion and height-constrained layouts.
- [ ] Open the gallery directly in development after deleting the link. Inspect the real production build/package: no Components link/handler, gallery entrypoint or fixture bundle.
- [ ] Smoke quick add on a real supported YouTube watch page: unchanged player appearance/feedback and working save. Do not claim marker rendering or native color-picker dialog coverage unless actually exercised.
- [ ] Run existing source checks once after implementation and focused regressions for migration/backup/operation boundaries. Update README, affected specs/schema, and developer gallery instructions; record exercised evidence here and remove temporary smoke data/scripts.

## Comments

### Approval — 2026-10-02

The user treats the prototype as UI authority, not the existing POC. Approved exceptions and unchanged data-safety invariants are recorded in the parent spec. This issue intentionally includes runtime/data-contract work required by persisted themes and semantic colors; styling alone does not complete it.
