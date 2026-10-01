# This video: bookmark management

Status: complete
Blocked by: 01

## Goal

Make the active video's page functional end to end, following [This video in the parent workflow](../spec.md#this-video). Requires [popup setup](01-popup-setup.md).

## Scope

- Read the active video's persisted bookmarks; show title/ID fallback and chronological rows with formatted time, optional name, and color. Distinguish loading, failed reads, and an empty video; empty instructions point to the player **+**.
- Clicking a timestamp seeks in that active video. Read real player duration for adjustment; do not substitute guessed metadata or a fake player response.
- Row menu: **Edit**, **Copy timestamped link**, **Delete**. Copy the real timestamped URL and report clipboard success/failure.
- Confirm single deletion with time/name. Confirm **Delete all bookmarks** with video identity and count. Remove data from the UI only after persistence succeeds; deleting the last bookmark leaves This video in its empty state and removes the video from saved-video listings.
- Edit in a small dialog: optional name, a labeled native color picker and separate **Use default** control, and **−5s / −1s / +1s / +5s** buttons. Explicit Save/Cancel; all controls change a draft until Save. Blank name means unnamed; no direct timestamp entry.
- Disable steps outside `0…floor(duration)`, without clamping. Unknown/non-finite duration disables adjustment with an explanation, not name/color editing. Recheck active video and duration bounds when saving a timestamp change.
- Save timestamp/name/color as one persisted update. Preserve creation date; a moved bookmark returns to its chronological position. Reject an occupied target second without changing either bookmark; an unchanged timestamp is not a self-collision.
- Keep the dialog/draft available on collision or persistence failure. Prevent saves after active-video context changes; explain the change and require reopening in the correct context.

## Boundaries and ownership

This slice owns the actual bookmark read/edit/delete operations and player seek/duration integration needed by this page, including typed responses and background-routed, per-video-serialized mutations. A timestamp move is one video-record write, not independent delete/create writes.

Provide reusable per-video bulk deletion and timestamp playback navigation for [All videos](03-all-videos-page.md). Own the shared color validation/default-color resolution required by the native picker and rows; [Settings](04-settings-page.md) must extend that same contract rather than introduce another preference store. Preferences UI and marker rendering are not part of this slice. All videos and Settings remain the minimal shells until their own slices.

## Acceptance and smoke verification

1. Use real saved moments in a loaded extension: rows are chronological, timestamp clicks seek, and copied URLs identify the correct video/second. Verify empty and read/clipboard failure states.
2. Save a name/color edit, return to Use default, and cancel a draft. Reopen the popup to prove persistence and cancellation behavior.
3. Adjust by each step size, including zero and near the duration boundary. Verify disabled out-of-range steps and unavailable-duration behavior; name/color edits remain usable.
4. Move a bookmark to a free second and verify preserved creation date/metadata and chronological position. Attempt an occupied second and an unchanged-second name edit; only the former is a collision.
5. Exercise a failed write and an active-video change during editing: neither loses data nor writes against the wrong video. Preserve the draft on write failure.
6. Cancel and confirm both deletion types. Verify counts/data after reopening and the empty state after the last deletion. Failure retains persisted bookmarks and shows an error.
7. Record actual popup/player smoke evidence and run existing source checks after implementation. Cover collision/boundary/data-loss invariants with focused regression tests where appropriate; mocks alone are not UI proof.

## Comments

### Implementation and review handoff — 2026-10-01

- Implemented persisted chronological rows, seek/copy actions, draft name/color/timestamp editing, and confirmed single/per-video deletion. All videos and Settings remain shells.
- Bookmark mutations share the background's per-video queue. Timestamp moves write one record, preserve creation date, reject collisions, and check the active source tab/video and fresh duration before writing. Failed operations release the queue.
- Player duration and seek use the shared content-side lifecycle. Advertising media is excluded so an ad's duration cannot stand in for the watch video's duration.
- Added a shared named color palette and inherited default-color resolution through `local:marker-preferences:v1`; Settings must extend that owner.
- Before the user took over verification, nine regression tests, lint, compilation, and production build passed. The user subsequently removed the tests and reserved testing for a dedicated scratch; no tests were recreated.
- Partial live evidence from an isolated loaded extension: persisted rows rendered chronologically, the editor showed the real 213.061-second player's floored 3:33 bound, and an unfocused clipboard write displayed its failure. Full acceptance and visual smoke were not completed.
- The user owns further testing and verification during code review. No checks were rerun after the import-group changes. This issue remains in review, not complete.

### Code-review preferences and editor refactor — 2026-10-01

- Applied the shared component layout: intent-revealing state, separate refs, effect setup, mount-only effects before dependent effects, handlers/helpers, then render-only derived values and JSX.
- Editor values are explicitly `draftTimestamp`, `draftName`, `draftColor`, `playerDuration`, and `saveError`. Lifecycle refs identify their non-DOM purpose.
- `save` now orchestrates `validateSaveContext`, `validateTimestampChange`, and persistence; the final live-context check, invalidation latch, draft retention, and mounted-only result/error/cleanup handling remain in place.
- Added whitespace and guard-layout conventions to the coding standard and applied them across popup components, services, and utilities. Both inline and two-line braceless early returns are accepted.
- No tests, source checks, browser verification, or Sonar analysis were run for this refactor; the user owns verification during review.

### Current-change engineering review — 2026-10-01

- Reviewed the pending popup, persistence, player, messaging, model, and utility changes against the aligned coding skill and project preferences. Preserved existing exported contracts, user refactors, and the approved feature scope.
- Successful edits/deletions now refresh through This video's existing persisted-read lifecycle. A delayed mutation response no longer replaces a newer record or cancels a newer quick-add read with its older snapshot.
- Quick add checks duplicates before copying stored data; title-only writes retain the unchanged bookmark map. Atomic moves still preserve creation date and use the shared per-video queue. Mutation ownership and complete-draft clearing semantics are documented beside their contracts.
- The background edit guard rechecks the content-side active video after duration validation, including unsupported media changes without a new watch URL. Browser/player preconditions and storage still cannot form one atomic transaction across execution contexts.
- Shared message registration converts thrown/rejected handlers into failure responses instead of leaving requesters without a result. Player requests validate their fields without assuming a valid unknown payload.
- Browser/player/storage failures retain useful nonblank details. Playback navigation does not turn a failed context lookup into a changed-video error or open another tab as though the lookup succeeded.
- Named the popup refresh interval without changing its value; retained the agreed state/ref/effect layout, helper placement, import groups, and readable spacing.
- No tests, lint, compilation, build, formatter, browser smoke, or Sonar analysis were run. User verification should include concurrent quick add with edit/delete completion, player changes during duration lookup, and throwing/rejected message handlers.

### Native color picker — 2026-10-01

- The user selected the browser's native color picker instead of the preset-only palette. The editor holds the selected color in its draft; a separate Use default button clears the override. Save/Cancel semantics are unchanged.
- Shared validation now accepts opaque six-digit hex colors (`#rrggbb`, case-insensitive). Existing saved preset values remain valid; the preference storage key and default color are unchanged.
- Removed the preset palette, name lookup, radio controls, and their styles. Rows announce the resolved hex color and default inheritance.
- Updated scope, the popup spec, README, and the Settings issue to use the same native-picker color contract. Settings remains a page shell.
- No tests, source checks, or browser verification were run. User verification should cover selecting an arbitrary color, saving/reopening, discarding changes, and restoring inherited default color.

### Completion — 2026-10-01

- Marked complete at the user's request following review. Verification remains user-owned; no additional checks were run.
- The user will commit and push the changes.
