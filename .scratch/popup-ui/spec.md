# Popup UI workflow

Status: design-system cutover implemented; user source checks and behavioral/visual verification pending

## Goal and deliverable

This specification defines popup operation rules. The approved [design-system implementation](../design-system/spec.md) replaces the POC's visual presentation and explicitly changes its UI behaviors through two new issues. This document incorporates those agreed changes; the old issues and their completion evidence remain historical POC records. The design-system spec owns tokens, components, and the theme/color migration. Its temporary development gallery has been retired after popup adoption.

[Storage and quick add](../storage-and-quick-add/spec.md) are complete. The shared popup model and operations now drive the design-system pages and dialogs, including persisted appearance/colors and versioned JSON backup/restore. Historical POC verification does not verify this cutover. Player-marker rendering remains unimplemented.

The locally implemented [import/export rewrite](../import-export-rewrite/spec.md), with verification pending, supersedes the earlier settings-inclusive backup contract. This document's current transfer requirements below point to that spec; completed POC/cutover issue evidence remains historical.

## Implementation and review slices

The following slices record the POC's implementation sequence, not the new design-system work. Their historical `Status` lines do not imply adoption of the approved replacement UI; implement that cutover through the two issues in the linked design-system spec.

| Slice | Deliverable | Dependencies |
| --- | --- | --- |
| [01 — Popup setup](issues/01-popup-setup.md) | Minimal page shells, real active-tab context, header navigation, basic layout | None |
| [02 — This video](issues/02-this-video-page.md) | Bookmark list, seek/copy, edit/adjustment, single and bulk deletion | 01 |
| [03 — All videos](issues/03-all-videos-page.md) | Expandable launcher, title filter, per-video bulk deletion | 01, 02 |
| [04 — Settings](issues/04-settings-page.md) | Persisted preferences, real JSON export/import, effect previews | 01, 02, 03 |

Each slice includes its required runtime/storage operations and smoke acceptance, not just visual controls. Setup deliberately stops at page headings and working navigation. This video owns shared bookmark mutations, player integration, and color resolution; later pages reuse those contracts. Settings is last so restored data and preference effects can be checked through both completed bookmark pages. Marker rendering remains separate from these popup slices.

## First-use privacy consent

Before loading active-tab context, settings, bookmarks, or transfer data, show a one-time popup disclosure covering the current YouTube video's ID/title, save-time playback position, locally stored bookmarks/preferences, and user-initiated JSON import/export. Require an unchecked checkbox and explicit **Agree and continue** action. The popup remains on this disclosure and the content script reads only the consent setting until consent is stored. Closing the popup without agreeing leaves app-data reads and YouTube integration inactive. Link the full privacy policy from the disclosure; consent-storage failures remain visible and block use. This required consent gate is not a general Welcome or Guide page.

## Pages and navigation

The popup has exactly three pages: **All videos**, **This video**, and **Settings**.

- On a supported standard YouTube watch page, open **This video**, including when that video has no bookmarks.
- On other YouTube pages or outside YouTube, open **All videos**.
- Keep **All videos** and **Settings** reachable from a persistent header. Show a **This video** shortcut only when the active tab is a supported watch page.
- Outside YouTube, keep browsing and Settings available without an informational banner. Loading retains its feedback. Active-tab lookup failures show **Having trouble reading this tab’s context. Try opening YouTube.**, with YouTube opening in a new tab; All videos and Settings remain available while This video stays unavailable.
- **This video** always refers to the active tab's video, not a saved video selected from All videos. Editing requires that context; All videos is a launcher, not an entry into another editable detail page.
- If the active video changes or becomes unavailable while an edit is open, prevent saving that draft against the wrong video. Explain the context change and require reopening the edit in the appropriate video context.

## All videos

### Listing and navigation

- List only videos with bookmarks. Each row shows the stored title, falling back to video ID, and the derived bookmark count.
- Default order is most recently bookmarked first, derived from the newest bookmark creation date in each video. Editing a name, color, or timestamp does not refresh that creation date. No sorting controls.
- Expand a video row to reveal its bookmarks in ascending timestamp order. Show formatted time, optional name, and color so moments can be identified.
- Clicking the video header/title toggles expansion. A separate **Go to video** action in the expanded group opens its YouTube watch page in a new tab.
- Clicking a bookmark timestamp seeks in the active tab if it is the same video; otherwise it opens that video in a new tab at the timestamp.
- There is no separate read-only video-detail page.

### Title filter

- Provide a search field on All videos only. It is a case-insensitive partial-title filter, not fuzzy search.
- Match contiguous text anywhere in the stored video title: `Na` and `real` both match `Name is real`.
- Match neither video IDs nor bookmark names. A video without a stored title remains visible with its ID when the query is empty, but does not match a non-empty query.
- Preserve the default video ordering among matches; do not rank by relevance. Clearing the query restores the full list.
- Distinguish **No matching videos** from the empty-library state and offer a clear-search action.

### Only management action: per-video bulk deletion

- Each expanded video offers **Delete video**. This deletes all saved bookmarks for that selected video, not the entire library or the YouTube source; explain that distinction in the confirmation.
- Confirm using the video title (or ID fallback) and bookmark count, with explicit Cancel and destructive Delete actions.
- Remove the video from All videos only after deletion succeeds. On failure, retain its data and show an error.
- All videos offers no bookmark editing, individual deletion, or copy-link action. The expanded timestamp list remains a playback launcher.

## This video

### Bookmark list and actions

- Show the active video's title, falling back to ID, and its bookmarks in ascending timestamp order.
- Each row shows formatted time, optional name, and color. An unnamed bookmark shows its time plus **Unnamed bookmark**; the fallback is display text, not a saved name. Use the same fallback in compact All videos rows.
- Clicking a timestamp seeks in the active video.
- Clearly labeled row-menu actions are **Edit bookmark**, **Copy timestamped link**, and **Delete bookmark**.
- Copy produces a YouTube URL for that video and whole-second timestamp; report clipboard success or failure.
- Confirm individual deletion with the timestamp and optional name. There is no undo. Remove a row only after persistence succeeds; failure keeps it visible.
- Video-level bulk deletion belongs only to All videos; remove the POC's This video bulk-delete control during cutover. Deleting the last bookmark removes the video from All videos but leaves This video available with its empty state.

### Edit dialog

- Use the design-system editor dialog with formatted timestamp, optional name, preset/custom/default color choices, and explicit **Save changes / Cancel**.
- Provide **−5s**, **−1s**, **+1s**, and **+5s** buttons beside the timestamp. No direct timestamp entry in this slice.
- Buttons change the draft only. Save commits timestamp, name, and color together; Cancel leaves stored data unchanged.
- A blank name means unnamed. Marker choices are theme-aware **Accent / Gray / Ink** presets or a fixed opaque six-digit **Custom** hex color chosen through the native picker. A separate **Use default** control removes the bookmark's override; show selected choice/color and inherited state without relying on color alone. Settings uses the same choice contract; its canonical model and resolver are defined in the design-system spec. Prelaunch hex-string records need not be migrated or preserved.
- Adjustment stays within whole seconds from `0` through `floor(active player duration)`, inclusive. Disable any adjustment button whose result would be outside that range; do not clamp an oversized step to a boundary.
- If duration is unavailable or non-finite, disable timestamp adjustment with an explanation while permitting name/color edits. Recheck the active video and duration bounds when saving a timestamp change.
- Bookmark identity remains `(video ID, whole second)`. Moving to another second changes that identity while preserving the creation date and retaining the name/color unless edited in the same draft.
- If the target second already has another bookmark, reject Save with **A bookmark already exists at <formatted time>.** Keep both persisted bookmarks unchanged and the dialog open. Saving an unchanged timestamp is not a collision with itself.
- A save failure leaves stored data unchanged and retains the draft for correction or retry. A successful move appears at its chronological position in the list.

## Settings

### Appearance

- Use **Light / Dark / System**, defaulting to System. Persist the preference immediately through the background settings boundary and restore it on reopen/restart.
- System follows OS theme changes; explicit Light/Dark does not. Failed reads/writes show accurate errors rather than a falsely saved choice.
- Theme is not transfer data. Neither Merge nor Replace changes it. Prelaunch backups are unsupported under the import/export rewrite.

### Player markers

- Group marker visibility and global default marker color under **Playback**, matching the prototype. Timeline-marker rendering remains separate.
- Show/hide affects markers only; quick add and popup browsing remain available.
- Offer Accent/Gray/Ink presets and a native Custom picker for the global default, using the editor's shared color-choice contract. Preferences save immediately without a page-wide Save button; show failures rather than reporting unpersisted values as saved.
- The global default affects bookmarks with no explicit override. Existing overrides remain unchanged; choosing **Use default** in the bookmark editor restores inheritance.

### Backup and restore

The [import/export rewrite](../import-export-rewrite/spec.md) owns transfer workflow, file schemas, validation, conflict reporting, and release versioning. It is implemented locally with verification pending; the previous version-2 settings-inclusive workflow is historical implementation state, not the current contract.

- Keep import/export under Settings' **Backup** group. Both dialogs select videos, initially all selected, with title-only filtering that does not alter selection. Select all includes hidden rows; display selected video/bookmark totals.
- Export includes only selected videos/bookmarks, with an optional filename and one final Export action. Export a fresh consistent reviewed subset; selected-data changes refresh review and require another action.
- Import previews accepted selected data, inspectable validation omissions, identical duplicates, and existing-wins conflicts. Merge adds missing identities and retains existing titles/bookmark metadata; disable it with **Nothing new to import** when nothing changes.
- **Replace library** installs the accepted selected subset as the entire library, deleting absent/deselected current records. Show deletion totals and that skipped records will not be restored; use one final destructive action, not a second dialog or acknowledgement checkbox.
- Never export/import preferences. Explicit bookmark overrides are transferred; omitted color inherits the destination default. There is no legacy import path.
- Broken/unsupported envelopes block import. Known-schema invalid videos/bookmarks are skipped with reasons; ambiguous repeated incoming IDs/seconds have no arbitrary winner. No valid selected bookmarks means no import, not a library-clearing action.
- Cancel and persistence failure leave stored data unchanged. Partial acceptance commits atomically, and success follows confirmed persistence.

### Backup format and persistence

- New exports use `schemaVersion: 1`, the current build's `appVersion`, and video records containing bookmark arrays under the `youtube-timestamp-bookmarks` identifier; no settings or old `version` field. See [schema 1](../import-export-rewrite/spec.md#schema-1).
- Reject prelaunch version-1/version-2 backups instead of adapting them. An old version: 1 field is not launch schemaVersion: 1. See the [clean launch baseline](../import-export-rewrite/spec.md#clean-launch-baseline).
- Retain one authoritative timestamp-keyed storage model. All existing development bookmarks/preferences may be reset at cutover; no legacy normalization, storage migration, or existing-key preservation is required. No key rename is required merely because file-schema numbering starts at 1.
- Background imports and consistent snapshots coordinate with per-video mutations through the library barrier. Recheck relevant library data before commit; stale data requires refreshed review, but settings-only changes do not invalidate it.
- Replace commits accepted video records and removals together, never settings. Existing null tombstones remain absent to readers. Failure must not partially apply a replacement.
- Export retains the browser downloads API boundary and reports completion/interruption before releasing temporary download resources.
- Remove settings adoption and settings-inclusive snapshot coupling from transfer callers as part of the rewrite, without changing normal preference persistence.

### Backup regression contracts

These are future behavioral requirements, not exercised-test claims. The new transfer acceptance scenarios live in the [rewrite spec](../import-export-rewrite/spec.md#acceptance-criteria-and-implementation-verification).

- Prelaunch data is disposable; remove obsolete compatibility paths and preservation requirements during implementation. Fresh settings remain Accent/System, independently of transfers.
- Schema-1 import round trips preserve accepted timestamps, names, titles, dates, explicit colors, and omitted-color inheritance without writing settings.
- Merge preserves existing metadata; whole-library Replace uses only accepted selected records. Empty/all-invalid inputs cannot wipe the library.
- Relevant concurrent library mutations refresh preview; preference-only changes do not. Failed persistence retains the library/review, releases queues, and never produces success feedback.


## Shared states and presentation

- Provide loading, empty, and failure states. Failed reads are errors, not empty data; failed writes do not produce success feedback.
- Empty This video points to the player **+** button. An empty All videos view points to the player **+** on a watch page or offers a link to YouTube elsewhere.
- Use the shared native React design-system components without Radix UI: 560 px width and up to 600 px height, respecting Chromium's toolbar-popup height limit, with persistent header and scrollable content. Use reference-specific styling, off-white, installed-font typography, and accessible focus/motion treatment. Light/Dark/System selection defaults to System.
- Preserve usable keyboard navigation, accessible control labels, and color-value/default-state indicators that do not rely on color alone. Functional clarity takes precedence over decoration.
- Welcome and the separate Guide page are deferred. Show useful inline instructions, but no Guide link until its destination exists. Guide remains a later product commitment.

## Implementation boundaries

Follow the product's existing architecture: one authoritative record per video, derived lists/counts, background-routed mutations, per-video serialization, and typed success/failure results. Moving a timestamp must be one persisted record update, not independent delete/create writes that can lose a bookmark or partially apply the edit.

Follow the shared YouTube player ownership in [product architecture](../../docs/scope.md#project-architecture): the popup detects active-tab context, while content-side player messages and quick add consume one player lifecycle. Keep player navigation/media identity checks in that shared owner so popup operations and quick add cannot disagree about stale playback.

The implemented popup pages use real background/storage operations rather than an independent UI store. Player-marker rendering remains a separate implementation concern that must consume the persisted visibility and default-color preferences.

Deferred: advanced sorting, typo-tolerant/fuzzy search, ID/bookmark-name search, direct timestamp entry, Welcome, Guide, and timeline-marker rendering. Existing exclusions such as popup quick add, undo, and unsupported playback integrations remain unchanged. Visual polish and manual theme selection are now approved work in the separate design-system effort; do not treat the POC's historical exclusions as current requirements.

## Acceptance scenarios for later implementation

1. Opening on a supported watch page selects This video; opening elsewhere selects All videos. Settings is always reachable, and the header's This video shortcut follows supported active-video context.
2. All videos shows title/ID fallback and correct counts, lists videos by newest bookmark creation date, and expands into chronological bookmarks through its header/title. Go to video and compact bookmark links launch/seek the agreed destinations without offering an editable saved-video detail page.
3. `Na` and `real` match `Name is real` regardless of case. Queries do not match IDs or bookmark names. Clearing restores the full list; no matches and no saved data have distinct states.
4. All videos exposes only per-video bulk deletion as a management action. Confirmation names the video and count; cancel preserves data, successful deletion removes that video, and failure retains it.
5. This video supports seek, copy, name/color editing, and confirmed individual deletion, but no bulk-delete control. Outside its active-video context, editing is unavailable; video-level deletion belongs to All videos.
6. Adjustment buttons change only the draft, allow zero, respect finite duration bounds, and reject steps crossing either boundary. Unknown duration blocks adjustment but not name/color edits. Cancel changes nothing.
7. A saved move changes the identity and list position without changing creation date. A target-second collision, persistence failure, or changed active-video context does not overwrite or lose bookmarks.
8. Marker preferences persist immediately; inherited rows follow default choices, overrides remain independent, presets resolve per theme, and Custom colors remain fixed. Use default restores inheritance. Light/Dark/System persists, defaults to System, and follows OS changes only in System.
9. Exercise the [approved rewrite's transfer acceptance scenarios](../import-export-rewrite/spec.md#acceptance-criteria-and-implementation-verification): selectable videos-only exports/imports, launch schema 1 and independent app versioning, rejection of prelaunch backups, disclosed partial imports, existing-wins Merge, whole-library Replace, stale reviews, and atomic failure behavior. These planned changes are not verified by historical settings-inclusive backup evidence.
10. Loading/error/empty states are distinguishable; success follows persistence. Inline help works without Welcome or Guide, and no dead Guide links or nonfunctional placeholder controls ship.
