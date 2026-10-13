# Show bookmark markers on the YouTube player

Status: implemented locally; user-owned YouTube smoke test pending

## Work constraint

**NO COMMIT, LOCAL ONLY**

Keep this feature's work local. Do not create commits, push changes, or publish a pull request.

## Goal and boundary

Show saved bookmarks as small colored markers centered on the current video's YouTube progress bar. Users can identify saved moments and seek to them without opening the extension popup.

This feature implements the marker behavior already defined in [product scope](../../docs/scope.md). It uses the existing bookmarks, marker visibility preference, and color choices; it does not introduce another storage model or redesign the popup.

## User flow

1. Open a standard `youtube.com/watch` page with saved bookmarks. When the player has a usable duration, show a marker for each in-range bookmark centered on its proportional position on the progress bar.
2. Hover or keyboard-focus a marker to see its formatted timestamp and optional saved name in a tooltip, separated by a space without an em dash. An unnamed bookmark still shows its timestamp; no permanent name label is shown.
3. Click a marker to seek the current player to that bookmark's timestamp. Do not open another tab or take over normal progress-bar controls.
4. Saving a moment with the existing player `+` button makes its marker appear after the save succeeds. Editing, deleting, or importing bookmarks updates the displayed markers without requiring a page reload.
5. Turning off player markers in Settings hides them without disabling quick add or popup browsing. Turning the preference back on restores the current video's markers.
6. Markers use each bookmark's color override, or inherit the global default when no override exists. Changes to applicable colors update the displayed markers.
7. Navigating between videos within YouTube shows only the newly active video's bookmarks, without stale or duplicate markers.

## Behavior and integration constraints

- Support standard YouTube watch pages only. Shorts, live streams, embeds, and `youtu.be` entry points remain outside the playback integration boundary.
- Reuse the shared YouTube player lifecycle and existing player operations. Keep marker UI separate from shared navigation and media checks; do not create a competing player lifecycle or content entrypoint.
- Read the same persisted bookmark records and preferences used by quick add and the popup. No marker-specific persisted copies, indexes, or schema changes are required.
- Position markers using the active media duration and bookmark timestamp. Second zero is valid. If duration is unavailable, non-finite, or not positive, defer rendering until usable; do not guess positions. Do not render out-of-range bookmarks or alter their stored timestamps.
- Use compact 8 × 12 px markers centered vertically on the progress bar. Keep hover/focus tooltips above the markers, styled like the supplied YouTube controls tooltip: translucent dark background, rounded 8 px corners, 14 px medium-weight white text, and 8 × 12 px padding.
- Preserve the existing color meanings: theme-aware Accent / Gray / Ink, fixed Custom colors, and Use default inheritance. Reuse the established color-resolution behavior rather than introducing another palette.
- Nearby markers may overlap. Clustering, stacked lanes, and overlap-selection menus are not required; the popup remains the reliable way to select nearby bookmarks.
- Keep ordinary YouTube seeking and dragging available outside the marker interaction. Do not add a full-bar overlay that intercepts unrelated input.
- Marker controls need accessible names identifying the timestamp and optional name, keyboard activation, and visible focus. Do not rely on color alone to identify a saved moment.
- Keep placement aligned when the player resizes, including theater and fullscreen modes. Handle replaced player/progress-bar elements without duplicate UI, listeners, or stale video state.
- Remove feature-owned UI and subscriptions when leaving a supported player or disposing the integration. Ignore late updates for a video that is no longer active.
- Rendering and seeking must not mutate bookmarks. A failed load must not present the previous video's bookmarks as current data.

## Acceptance scenarios

1. A watch video with bookmarks at zero and several later seconds shows correctly positioned markers after load and reload. A video with no bookmarks shows none.
2. Hovering named and unnamed markers reveals the correct timestamp and, when present, name. Clicking or keyboard-activating a marker seeks the active video to that timestamp without opening a tab.
3. Ordinary progress-bar clicks and drags remain usable. Clicking a marker does not also trigger a conflicting seek through the underlying progress bar.
4. Quick add creates one marker after a successful save. Saving the same second again does not duplicate it; a failed save creates no marker.
5. Popup name, timestamp, and color edits update the corresponding marker. Bookmark deletion, video-level deletion, and confirmed imports reconcile the current video's markers with persisted state.
6. The marker visibility setting hides and restores markers immediately while quick add and popup browsing continue to work.
7. Inherited markers follow changes to the global default; explicit overrides remain independent. Preset and Custom choices preserve their existing theme behavior.
8. Navigating video A → video B → video A without reloading never leaves another video's markers visible or duplicates marker UI. Leaving a supported watch page removes the markers.
9. Resizing the player and entering/exiting theater or fullscreen mode keeps markers aligned with the progress bar and preserves YouTube controls.
10. Unknown duration defers markers until metadata is ready. Out-of-range timestamps remain stored but are not shown at misleading positions. Unsupported playback contexts receive no marker UI.
11. Nearby markers may overlap without breaking normal playback controls; each bookmark remains selectable through the popup.

## Verification expectations

The user owns the actual-extension smoke test on a standard YouTube watch page, including seeking, hover/focus, live bookmark/settings changes, single-page navigation, and player resizing. Implementation checks may exercise an isolated DOM fixture, but do not replace actual YouTube verification. Record observed evidence and unverified scenarios in the [implementation issue](issues/01-implement-player-markers.md).

## Non-goals

- Popup redesign, new settings, new quick-add behavior, or a new bookmark store.
- Marker dragging, timestamp editing from the progress bar, clustering, or new keyboard shortcuts.
- Support for Shorts, live streams, embeds, accounts, or cross-device sync.
- Welcome or Guide pages.

## Documentation boundary

This scratch elaborates existing approved product scope; it does not change that scope. If subsequent decisions change agreed behavior, update this spec and `docs/scope.md` together.
