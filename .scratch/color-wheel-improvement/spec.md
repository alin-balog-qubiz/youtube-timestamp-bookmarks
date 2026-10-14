# Color wheel improvement

Status: implemented locally — user verification pending

The locally implemented [import/export rewrite](../import-export-rewrite/spec.md), with verification pending, supersedes this effort's settings-inclusive backup coupling. Historical implementation notes below describe the previous transfer code; current transfers neither include nor apply preferences.

## Request and boundary

The user reports that selecting colors in the native color wheel triggers autosaves and causes the UI to glitch. Keep the native picker, but debounce Settings' Custom default-marker-color persistence so dragging remains responsive.

Implementation is authorized. The user explicitly owns local verification and requested no tests, builds, or commits for this implementation.

## Pre-change implementation evidence

- `ui/components/ColorPicker.tsx` updates its local Custom value and calls its parent's `onChange` on every native color-input change.
- `entrypoints/popup/pages/SettingsPage.tsx` routes those changes directly to `savePreferences`, which starts a saving operation, calls `updateSettings`, adopts the saved preferences, and shows success feedback.
- The saving operation contributes to `preferencesDisabled`, which disables the color picker's fieldset. The picker also synchronizes its local value from incoming preferences.
- [INFERENCE] Repeated save/disable/prop-refresh cycles can interrupt native color selection and explain the reported glitch. The user's report is accepted; the exact native-picker behavior has not been inspected in this task.
- The shared picker is also used in `ui/components/BookmarkEditor.tsx`, where changes update an unsaved draft. That editor must retain explicit Save changes / Cancel behavior.

## Decision

Use a **trailing debounce** for continuous Custom color changes in Settings. Every new color restarts the timer; save only the latest value after the quiet period. This is a pause-based debounce, not a throttle. The initial specification requested 1,000 ms; the current local implementation uses 100 ms. The feedback refinement preserves the existing local delay.

The delay is an internal constant, not a new user setting. Do not debounce local picker feedback or all Settings operations.

## Required behavior

1. **Immediate local feedback:** update the native input, swatch, and Custom selected state as the user picks a color. Do not wait for persistence to show the current selection.
2. **Coalesced persistence:** a continuous sequence of changes produces one save of its final value after the quiet period. Do not write unchanged colors or show success feedback for every intermediate selection.
3. **Stable interaction:** keep the active color input mounted and usable. A color save must not close, disable, reset, or steal focus from the native picker. Saved-prop updates and older responses must not replace a newer local selection.
4. **Latest choice wins:** if the user selects another color while a save is in flight, retain that newer choice and persist it after its own quiet period. Do not drop it because the existing operation guard is busy. Do not launch unordered writes that can leave an older color persisted last.
5. **Discrete choices remain immediate:** selecting Accent, Gray, Ink, or the remembered Custom choice is not subject to the continuous-input delay. A preset selection supersedes a pending Custom save; the old timer must never switch the setting back to Custom.
6. **Preserve other settings:** saving a delayed color must not overwrite newer theme or marker-visibility choices using a stale full-preferences snapshot. Theme and marker visibility remain immediate operations.
7. **Honest, quiet feedback:** do not render inline pending/saving/saved color-status text. Persist Custom changes silently while the wheel is open. On wheel commit/close, show one success toast only once the latest selection is confirmed saved, including when it saved during an earlier pause. Preset selections save immediately and show their toast after success. Show a meaningful failure and retain its unsaved preview without falsely claiming it is saved. Do not add automatic retries.
8. **Editor isolation:** bookmark-editor colors update the draft immediately and persist only with Save changes. Cancel discards them. A Settings debounce must not delay draft updates or lose the newest color when Save changes is clicked immediately.

## Lifecycle requirements

- Preserve the final selection when the native picker normally commits/closes or the user navigates within the popup: flush a pending color at a reliable commit/navigation boundary rather than silently discarding it. A flush replaces the scheduled save, not duplicates it.
- Native picker input/commit event behavior must be checked in the target Chromium browser during authorized verification; do not assume React `onChange` means the native picker has closed.
- Under the approved rewrite, videos-only export/import must not depend on flushing the global default color or adopt imported preferences. Preserve normal picker commit/navigation persistence and ordered preference writes independently; show settings failures honestly without treating settings as transfer data.
- Clean up timers and ignore stale responses after disposal. Abrupt popup destruction before a commit/debounce deadline is a lifecycle risk: do not promise a durable save based solely on async React-unmount or unload cleanup. Record the actual supported behavior when implementing and verifying.

## Implementation direction

Keep persistence scheduling in the Settings flow, with local preview state separate from committed preferences. The reusable ColorPicker should remain usable by a draft-only editor. A small input-versus-commit distinction may be appropriate if needed for native picker completion; do not introduce a generic autosave framework, another settings store, or a custom color wheel.

Retain existing color choices, theme resolution, inheritance, storage validation, and background mutation ownership. Transfer formats and settings exclusion follow the separate [import/export rewrite](../import-export-rewrite/spec.md); do not preserve obsolete settings-inclusive backup coupling. Player markers continue to reflect persisted settings; live broadcast of every unsaved picker movement is not requested.

## Acceptance scenarios

1. Drag through several colors with less than the configured debounce delay between changes: selection stays responsive and no intermediate autosaves occur. After the quiet period, only the final color is saved. No inline status or success toast appears while the wheel is still open.
2. Pause long enough to save, then resume dragging while that save is pending: the picker remains usable, no stale color snaps back, and the final newer selection eventually persists.
3. Pick a Custom color and select Accent, Gray, or Ink before the timer expires: the preset saves immediately, shows success feedback only after confirmation, and remains selected after the former deadline.
4. Change theme or marker visibility while a Custom save is pending: the final stored preferences retain both changes.
5. Commit/close the native picker before the deadline: the latest selection is committed once, with one confirmed success toast and no stale timer or duplicate toast on subsequent blur. If it already saved during a pause, closing still shows one toast without another write. Navigation within the popup also flushes pending color work. Separately record behavior on abrupt popup closure.
6. A failed save shows an error rather than success and does not misrepresent an unsaved preview as persisted.
7. In the bookmark editor, select a color and immediately Save changes: the latest color is included. Repeat with Cancel: stored bookmark color is unchanged.
8. Under the approved rewrite, pending color work remains independent of import/export: transfers do not adopt preferences, and exported JSON contains no global default color/theme/visibility. Both import modes leave current preferences intact; normal queued color intent may still persist as a separate settings operation.

## Related contracts and verification

This spec elaborates [product scope](../../docs/scope.md) and the [design-system color contract](../design-system/spec.md#marker-color-model-and-migration). Both record the implemented timing refinement, with user verification pending.

No tests, builds, or commits were run for this implementation. Runtime acceptance remains user-owned. Verification must exercise the real native color picker, not only synthetic change events, because the reported defect concerns interaction stability. Native Chromium input/change/blur timing, in-flight persistence, editor Save/Cancel, and backup scenarios above remain unverified.

## Implementation — 2026-10-13

The backup flush/settings-adoption behavior recorded below is historical implementation state, removed by the import/export rewrite on 2026-10-14; it does not override the videos-only transfer boundary. Normal picker commit/navigation persistence remains independent.

- `entrypoints/popup/hooks/useSettingsPersistence.ts` owns Settings' local color preview, trailing timer (currently 100 ms), and ordered preference writes. Each write merges only its changed fields into the latest confirmed preferences. Superseded color intents are skipped before dispatch; already-dispatched writes complete before newer writes. Unchanged choices, including hex values differing only by letter case, do not cause writes.
- `ColorPicker` reports native `input` events immediately. Settings schedules these; BookmarkEditor continues receiving immediate draft changes. An actual DOM `change` event is a separate commit signal, not React's synthesized `onChange`. Blur outside the picker also flushes; moving focus to another color choice leaves that choice free to supersede the timer.
- Settings no longer keys/remounts the picker on errors or disables it for color saves, other preference saves, or background settings refreshes. Refreshes with existing preferences no longer insert a loading skeleton above the active picker. Newer local colors remain visible while older writes resolve.
- Color saves run quietly without inline pending/saving/saved status text. Continuous Custom input does not request a success toast until picker commit. Commit flushes and reports the latest confirmed revision once, even when it saved during a pause; duplicate commit/blur signals do not duplicate feedback. Discrete choices request immediate persistence and a toast after success. A failed color retains its unsaved preview and actionable error; no automatic retry runs. Selecting a color again creates a new explicit intent. Theme and marker-visibility feedback names the setting saved rather than claiming all previews are persisted.
- Popup navigation awaits the pending color and ordered writes before unmounting Settings. A color failure leaves Settings open with its error and preview. Navigation during a backup operation is held on Settings. Older settings reads cannot replace a just-confirmed mutation response.
- Export and import-preview preparation flush before requesting a snapshot. Confirmed imports wait for color work, then adopt imported preferences while invalidating old color intent and timers. Failed color persistence blocks export/import rather than silently omitting the intended selection.
- Disposal clears timers and prevents late responses from updating the UI. There is deliberately no async unload/unmount save guarantee: abruptly destroying the popup before the debounce or commit boundary can lose the unsaved selection. Native close/commit behavior and abrupt-close behavior still require the user's Chromium verification.
