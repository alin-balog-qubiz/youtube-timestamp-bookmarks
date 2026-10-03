# Use design-system components throughout the app

Status: implemented; user-approved; detailed verification evidence below
Type: task
Dependency: 01 — shared components implemented; temporary gallery retired after popup adoption

## Goal

Replace the popup POC completely with the components from [issue 1](01-create-components.md), implement the agreed production behavior and persistence in the [design-system spec](../spec.md), and delete the temporary Components link. This is a complete cutover, not a parallel theme or an optional redesigned screen.

## Read first

- [Design-system spec](../spec.md): visual tokens, inventory, approved behavior, theme/color migration, gallery lifecycle.
- [Popup workflow](../../popup-ui/spec.md): unchanged context, playback, edit, filtering, persistence, and import safeguards.
- [Product scope](../../../docs/scope.md) and [coding conventions](../../../docs/agents/coding-style.md).

## Implementation

### Adopt all popup surfaces

1. Use the shared components for popup header/navigation, outside-YouTube/context notices, This video summary/list/actions, All videos filter/groups/launchers, Settings groups, editor, import/confirmation dialogs, and all loading/empty/no-results/error/success states. Remove obsolete POC component owners and global styling when their callers migrate; no aliases or duplicate old/new rendering paths.
2. Apply the shared theme/tokens to the actual popup and all portaled overlays. Request 560 × 600 px, respecting Chromium's native toolbar-popup limit rather than the earlier 700 px design target. Maintain persistent navigation and reliable inner scrolling; do not copy fixed 570 px view heights or mobile minimum sizes from the reference.
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

### Remove temporary access and gallery

12. Delete the temporary popup Components link and its opening handler, including development builds. After popup adoption, remove the gallery entrypoint, gallery-only examples/fixtures/styles, and obsolete production-exclusion hook. Keep shared popup components. Update developer instructions to inspect the popup rather than a direct components page.
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
- [x] Verify development and production builds retain the popup without a Components link/handler, gallery entrypoint or fixture bundle.
- [ ] Smoke quick add on a real supported YouTube watch page: unchanged player appearance/feedback and working save. Do not claim marker rendering or native color-picker dialog coverage unless actually exercised.
- [ ] Run existing source checks once after implementation and focused regressions for migration/backup/operation boundaries. Update README, affected specs/schema, and developer popup inspection instructions; record exercised evidence here and remove temporary smoke data/scripts.

## Comments

### Approval — 2026-10-02

The user treats the prototype as UI authority, not the existing POC. Approved exceptions and unchanged data-safety invariants are recorded in the parent spec. This issue intentionally includes runtime/data-contract work required by persisted themes and semantic colors; styling alone does not complete it.

### Implementation handoff — 2026-10-02

- Replaced production popup presentation with `@/ui` components: header/navigation/context notices, This video rows/actions/states, All videos search/groups/launchers/states, Settings groups, editor, import preview and deletion confirmations. Removed obsolete popup header/context/dialog owners, duplicate navigation types, Components link stylesheet, and POC global styling.
- Popup document requests an intrinsic 560 × 700 px size without viewport-relative caps; the fixed inset-zero shell fills the browser-provided viewport, with persistent navigation and one content scroller. Shared top-layer menus/dialogs inherit the same provider/tokens. Actual native dimensions have not been measured.
- All videos headers expand independently; Go to video and Delete video are distinct expanded actions. This video keeps individual Edit / Copy timestamped link / Delete menus and no bulk-delete path. Missing names render Unnamed bookmark without synthetic stored data.
- `models/appearance.ts` owns strict canonical theme/color choices. The background settings read migrates existing default/override hex values as Custom in the library queue, preserving metadata and exact hex spelling; preference writes use the existing settings boundary. App restores/subscribes authoritative preferences and drives the existing shared ThemeProvider. Failed choices do not produce false saved feedback.
- Backups export version 2 and strictly normalize version 1 to Custom/System. Merge keeps current settings/duplicate metadata; Replace uses one atomic batch and tombstones. Snapshots/previews normalize read-only, confirmation rejects stale snapshots, and Replace acknowledgement remains mandatory. Import errors retain the file/mode and require refreshed preview. The detailed schema and regression contracts are in [popup workflow](../../popup-ui/spec.md#backup-format-and-persistence).
- Removed the popup Components link in all builds. The development gallery remains available directly at `chrome-extension://<development-extension-id>/components.html`, with its existing production-entrypoint exclusion. Updated popup title and manifest display name to YouTube Bookmarks; storage keys and backup identifier are unchanged. Quick-add UI/feedback and starter icons are untouched; no markers, Welcome or Guide were added.
- README, product scope, design-system and popup specs now describe the implemented cutover and user verification handoff. No configured test suite exists; no new test harness or temporary scripts/data were retained.

#### Exercised evidence and limits

- No tests, lint, compilation, build or packaging commands ran. The user owns those checks and the unchecked acceptance scenarios above.
- A direct Node runtime invocation of the actual appearance validators and color resolver returned legacy `{ "type": "custom", "value": "#A1b2C3" }`, System preference, Light Accent `#c83f4f`, Dark Accent `#ff7a86`, and unchanged Dark Custom `#A1b2C3`. This is narrow runtime evidence only, not migration persistence or popup/backup verification.
- The available automation extension page was unavailable (`ERR_BLOCKED_BY_CLIENT` / browser error page); no popup screenshots, native-size measurements, interactions, real storage changes, backup round trips, quick-add checks, OS-theme changes or production-artifact claims are made.

### Native build dependency repair — 2026-10-02

User's production build failed in `vite:css-post` because Lightning CSS could not load its Windows x64 native binding. Installed `lightningcss@1.33.0` declared the matching optional package, but the lockfile omitted its resolved package records and `node_modules` lacked the binding.

Restored `lightningcss-win32-x64-msvc@1.33.0` locally and added the missing optional dependency lock records, retaining existing package versions and the unchanged root package manifest. Dependency resolution occurred in an isolated temporary directory because a normal npm install encountered a locked Rolldown native binary; no running processes were stopped. README installation guidance explicitly includes optional dependencies and Windows lock precautions.

Directly exercised the repaired `require('lightningcss').transform({ filename, code, minify: true })` path: output `.popup{width:560px;height:min(700px,100dvh)}`. No production build, lint, compile or test suite reran; user owns the full build confirmation. Temporary repair files were removed.

### Collapsed native popup repair — 2026-10-02

The user supplied a screenshot showing the popup collapsed to a thin strip. Removed the viewport-relative intrinsic constraints (`max-width: 100vw`, `height: min(700px, 100dvh)`) from production document/shell sizing. The document now requests 560 × 700 px; the fixed inset-zero shell uses the native browser's actual viewport, keeping the header outside the flex content scroller.

Exercised the changed production CSS in an isolated Chromium layout-only surface, not the actual extension popup. At a 560 × 600 px viewport, the document remained 560 × 700 px, the shell filled 560 × 600 px and content scrolled to 1869 px without moving the header. At 360 × 300 px, the shell filled that viewport, content scrolled to 2169 px and the final row remained reachable (bottom 284.39 px). Inspected the layout screenshot and closed the temporary surface. No tests, lint, compile or build commands ran; native popup sizing/reopening remains user verification.

### Popup color-contract crash repair — 2026-10-03

The reported `Pe` stack in `popup-BEWGIHch.js:9:66740` maps to `ColorPicker` calling `resolvedColor.toUpperCase()`. Reproduced the exact stack with a successful settings response containing the legacy hex string `#A1b2C3`: the unchecked message value reached the canonical color resolver, which returned `undefined`. This reproduces a compatible cause; the user's running background response was not inspected.

`services/settings-client.ts` now passes successful read and write responses through the existing stored-preference normalizer before committing popup state. Legacy hex values retain their exact spelling as Custom and missing theme becomes System. Malformed choices reject with their field-specific error instead of entering React state. No color fallback, data reset, storage-key change, or change to the background's durable migration was added. Product scope and feature contracts are unchanged.

Verification:

- `node --test services/settings-client.test.mjs`: three passing regressions for legacy response normalization, malformed successful reads, and malformed successful writes.
- `npm run compile` and `npm run build`: passed; refreshed `.output/chrome-mv3`.
- Exercised the emitted production popup in Chromium over an isolated local HTTP surface with simulated extension APIs. Before repair, opening Settings produced the exact reported stack and blank surface. After repair, the same response selected Custom and displayed `#A1B2C3` without a page error. A malformed read displayed the field error and retry; a malformed write retained the saved Custom selection with an inline failure. Canonical Light Accent, Light Gray, and Dark Gray resolved to `#C83F4F`, `#6B7280`, and `#D9DEE7`; inspected the rendered screenshots.
- `npm run lint` remains blocked by two unrelated errors: unused `formatTimestamp` in `entrypoints/popup/components/BookmarkEditor.tsx:6`, and an unescaped apostrophe in `entrypoints/popup/pages/AllVideosPage.tsx:233`.
- Native extension-page automation returned `ERR_BLOCKED_BY_CLIENT`; actual Chrome toolbar reopening, real storage/background migration, and persistence were not verified by this smoke. No user data was changed. Temporary browser surfaces and the HTTP server were closed.

### User approval and gallery retirement — 2026-10-03

User approved the implementation and requested removal of the previous issue's gallery because only the popup is relevant now. Removed `entrypoints/components/`, all gallery-only examples/fixtures/styles in `development/components/`, and the obsolete WXT build-exclusion hook. Shared `ui/` components, popup controllers, storage, and host integration are unchanged. README, product scope, and feature specs now describe popup-only inspection. Earlier gallery handoffs remain historical.

Gallery-removal verification:

- `npm run compile` passed.
- Started WXT's actual development server with browser launching disabled and isolated temporary output. Discovered only `background`, `popup`, and `youtube`; popup source HTML returned HTTP 200, `components.html` returned 404, and the generated manifest retained `action.default_popup: "popup.html"`. Development output contained `popup.html` and no `components.html`.
- The first smoke used `/popup.html` on Vite's HTTP server and received 404; using the actual source route `/entrypoints/popup/index.html` passed. The extension output remains named `popup.html`.
- Stopped the smoke server and removed its temporary output; no permanent smoke scripts, tests, or fixture data were added. This verifies entrypoint/build availability, not native toolbar rendering or persistence.
- `npm run build` passed on the longer-timeout run after the first invocation timed out. Production output contains the popup, background worker, YouTube content script, and icons, with no gallery page/bundle. Its manifest still registers `action.default_popup: "popup.html"`. No ZIP packaging or native toolbar UI checks ran for this removal.

### Duplicate popup scrollbar: initial CSS-only attempt — 2026-10-03

User's screenshot shows an unwanted outer document scrollbar beside the intended content scrollbar. The document requests 700 px height while Chrome can grant less; `body` already hid overflow, but `html` retained its default visible overflow. Added explicit document-root `overflow: hidden` in `entrypoints/popup/style.css`, preserving intrinsic 560 × 700 px sizing, the fixed shell, and `.popup-content` scrolling.

Verification:

- `npm run build` passed and refreshed `.output/chrome-mv3`.
- Exercised the emitted production popup in Chromium over isolated local HTTP with simulated extension APIs. At 560 × 600, 360 × 300, and 560 × 700 px, `html` overflow was hidden, the shell matched the granted viewport, and the document retained its 560 × 700 px request.
- Real wheel input scrolled the inner content to 123, 555, and 23 px respectively. Window scroll and header top stayed at zero; the bottom import file input remained reachable at every size. Inspected rendered Settings screenshots, including the short layout. The final smoke had no page errors.
- An initial incomplete API simulation omitted `storage.local` and caused harness-only page errors; the complete isolated storage simulation passed. No production storage or user data was changed.
- Closed the browser surfaces and HTTP server. This verifies the rendered overflow policy and content reachability, not native Chrome toolbar reopening/scrollbar chrome. No permanent presentation tests or throwaway files were added.

### Native popup autosize correction — 2026-10-03

User reported that the outer scrollbar remained across browsers after the CSS-only attempt. The preceding HTTP smoke did not exercise native popup autosizing and was not proof of a native fix.

[Chrome's action contract](https://developer.chrome.com/docs/extensions/reference/api/action#popup) caps toolbar popups at 800 × 600 px. [Chromium's `FrameViewAutoSizeInfo::AutoSizeIfNeeded`](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/frame/frame_view_auto_size_info.cc) compares document scroll height against the maximum and calls `SetAutosizeScrollbarModes` with `kAlwaysOn` when it exceeds that maximum, overriding CSS overflow. Our 700 px body height caused that condition.

Changed the document's intrinsic height to 600 px in `entrypoints/popup/style.css`. Kept width 560 px, root/body overflow disabled, the fixed viewport-filling shell, and the existing inner content scroller. Updated current scope/spec/README sizing guidance; earlier 700 px measurements remain historical.

Verification:

- `npm run build` passed and refreshed `.output/chrome-mv3`.
- Loaded the real unpacked production extension in a separately spawned Chrome 154 profile using browser-target CDP `Extensions.loadUnpacked`, then opened the genuine toolbar action with `Extensions.triggerAction` on the tab target. No simulated extension APIs or HTTP host were used for this smoke.
- Native viewport, document client/scroll dimensions, and body measured exactly 560 × 600 px. Inspected the actual dark Settings popup screenshot: only the inner scrollbar was present, beginning below the persistent header.
- Native wheel input scrolled Settings to its 198 px maximum. Window scroll and header top remained zero; the bottom file input was visible at 549.125 px. Inspected the bottom screenshot.
- Closed and reopened the actual toolbar popup: viewport, document, and body remained 560 × 600 px, with no outer document overflow.
- The isolated active tab was `about:blank` and showed the existing context-read error; this smoke verifies native sizing/scrolling, not supported YouTube integration. Opera GX and the user's other browser were not independently automated.
- Closed the spawned isolated Chrome and discovery probe, and removed temporary screenshots. No permanent presentation tests or fixture files were added; the user's browser profiles/data were not modified.

### Actionable context-read notice — 2026-10-03

User requested a friendlier message and YouTube recovery link for the Chrome context-read error. The popup now says **Having trouble reading this tab’s context. Try opening YouTube.** and uses the shared `Link` to open `https://www.youtube.com/` in a new tab with `noopener noreferrer`. All videos/Settings remain available, and This video stays disabled without supported context. Tab discovery, error state, subscriptions, storage, and browser-specific behavior are unchanged; this is the requested presentation/recovery change, not a claim that Chrome's underlying context lookup was repaired.

Verification:

- `npm run compile` and `npm run build` passed.
- Loaded the emitted production extension in an isolated real Chrome 154 profile and triggered its genuine toolbar popup on `about:blank`. The new notice rendered at 560 × 600 px; inspected its screenshot.
- Observed the YouTube link's actual destination, `_blank` target, and `noreferrer noopener` relationship. All videos was initially selected; Settings remained enabled and could be selected, with the notice still present. This video remained disabled.
- Actual mouse input on the notice link opened a new `https://www.youtube.com/` tab. No simulated extension APIs, HTTP preview, or production-user data were used. Opera was not independently automated.
- Closed the isolated Chrome session and removed its temporary screenshot. No permanent wording/presentation tests or fixture files were added.
