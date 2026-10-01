# Popup UI workflow

Status: in progress; 01 complete; 02–04 open

## Goal and deliverable

This specification defines the popup's approved basic features and workflow. Implementation proceeds through the ordered issue slices below; completed page shells do not imply that bookmark or Settings operations exist. Prioritize usable features over visual polish.

[Storage and quick add](../storage-and-quick-add/spec.md) are complete. Reuse their persisted video/bookmark model; this specification does not claim that popup operations, settings, markers, or backup/restore already exist.

## Implementation and review slices

Keep this document as the complete approved workflow. Implement and review the following issue specs in order; their `Status` lines track implementation, not approval of the product contract.

| Slice | Deliverable | Dependencies |
| --- | --- | --- |
| [01 — Popup setup](issues/01-popup-setup.md) | Minimal page shells, real active-tab context, header navigation, basic layout | None |
| [02 — This video](issues/02-this-video-page.md) | Bookmark list, seek/copy, edit/adjustment, single and bulk deletion | 01 |
| [03 — All videos](issues/03-all-videos-page.md) | Expandable launcher, title filter, per-video bulk deletion | 01, 02 |
| [04 — Settings](issues/04-settings-page.md) | Persisted preferences, real JSON export/import, effect previews | 01, 02, 03 |

Each slice includes its required runtime/storage operations and smoke acceptance, not just visual controls. Setup deliberately stops at page headings and working navigation. This video owns shared bookmark mutations, player integration, and color resolution; later pages reuse those contracts. Settings is last so restored data and preference effects can be checked through both completed bookmark pages. Marker rendering remains separate from these popup slices.

## Pages and navigation

The popup has exactly three pages: **All videos**, **This video**, and **Settings**.

- On a supported standard YouTube watch page, open **This video**, including when that video has no bookmarks.
- On other YouTube pages or outside YouTube, open **All videos**.
- Keep **All videos** and **Settings** reachable from a persistent header. Show a **This video** shortcut only when the active tab is a supported watch page.
- Outside YouTube, show a brief notice while keeping browsing and Settings available.
- **This video** always refers to the active tab's video, not a saved video selected from All videos. Editing requires that context; All videos is a launcher, not an entry into another editable detail page.
- If the active video changes or becomes unavailable while an edit is open, prevent saving that draft against the wrong video. Explain the context change and require reopening the edit in the appropriate video context.

## All videos

### Listing and navigation

- List only videos with bookmarks. Each row shows the stored title, falling back to video ID, and the derived bookmark count.
- Default order is most recently bookmarked first, derived from the newest bookmark creation date in each video. Editing a name, color, or timestamp does not refresh that creation date. No sorting controls.
- Expand a video row to reveal its bookmarks in ascending timestamp order. Show formatted time, optional name, and color so moments can be identified.
- Clicking the video title opens its YouTube watch page in a new tab.
- Clicking a bookmark timestamp seeks in the active tab if it is the same video; otherwise it opens that video in a new tab at the timestamp.
- There is no separate read-only video-detail page.

### Title filter

- Provide a search field on All videos only. It is a case-insensitive partial-title filter, not fuzzy search.
- Match contiguous text anywhere in the stored video title: `Na` and `real` both match `Name is real`.
- Match neither video IDs nor bookmark names. A video without a stored title remains visible with its ID when the query is empty, but does not match a non-empty query.
- Preserve the default video ordering among matches; do not rank by relevance. Clearing the query restores the full list.
- Distinguish **No matching videos** from the empty-library state and offer a clear-search action.

### Only management action: per-video bulk deletion

- Each video offers **Delete all bookmarks**. This deletes all bookmarks for that selected video, not the entire library.
- Confirm using the video title (or ID fallback) and bookmark count, with explicit Cancel and destructive Delete actions.
- Remove the video from All videos only after deletion succeeds. On failure, retain its data and show an error.
- All videos offers no bookmark editing, individual deletion, or copy-link action. The expanded timestamp list remains a playback launcher.

## This video

### Bookmark list and actions

- Show the active video's title, falling back to ID, and its bookmarks in ascending timestamp order.
- Each row shows formatted time, optional name, and color. An unnamed bookmark is identified by its time.
- Clicking a timestamp seeks in the active video.
- Clearly labeled row-menu actions are **Edit**, **Copy timestamped link**, and **Delete**.
- Copy produces a YouTube URL for that video and whole-second timestamp; report clipboard success or failure.
- Confirm individual deletion with the timestamp and optional name. There is no undo. Remove a row only after persistence succeeds; failure keeps it visible.
- Also offer **Delete all bookmarks** for this video, confirmed with video identity and bookmark count. Deleting the last bookmark removes the video from All videos but leaves This video available with its empty state.

### Edit dialog

- Use a small dialog with formatted timestamp, optional name, preset color choices, and explicit **Save / Cancel**.
- Provide **−5s**, **−1s**, **+1s**, and **+5s** buttons beside the timestamp. No direct timestamp entry in this slice.
- Buttons change the draft only. Save commits timestamp, name, and color together; Cancel leaves stored data unchanged.
- A blank name means unnamed. **Use default** removes the bookmark's color override; otherwise select from the same accessible preset palette used in Settings.
- Adjustment stays within whole seconds from `0` through `floor(active player duration)`, inclusive. Disable any adjustment button whose result would be outside that range; do not clamp an oversized step to a boundary.
- If duration is unavailable or non-finite, disable timestamp adjustment with an explanation while permitting name/color edits. Recheck the active video and duration bounds when saving a timestamp change.
- Bookmark identity remains `(video ID, whole second)`. Moving to another second changes that identity while preserving the creation date and retaining the name/color unless edited in the same draft.
- If the target second already has another bookmark, reject Save with **A bookmark already exists at <formatted time>.** Keep both persisted bookmarks unchanged and the dialog open. Saving an unchanged timestamp is not a collision with itself.
- A save failure leaves stored data unchanged and retains the draft for correction or retry. A successful move appears at its chronological position in the list.

## Settings

### Player markers

- Group marker visibility and global default marker color under **Player markers**.
- Show/hide affects markers only; quick add and popup browsing remain available.
- Use a small, accessible preset palette, not a free-form color picker. Marker preferences save immediately without a page-wide Save button; show failures rather than reporting unpersisted values as saved.
- The global default affects bookmarks with no explicit override. Existing overrides remain unchanged; choosing **Use default** in the bookmark editor restores inheritance.

### Backup and restore

- Group JSON export and import under **Backup & restore**.
- Export a readable JSON file containing all bookmarks and settings, independent of the current page or title filter. No confirmation is required for export.
- Import is staged within Settings: choose JSON file → choose **Merge / Replace** → inspect the effect → explicitly confirm.
- **Merge** adds non-duplicate bookmarks and keeps existing bookmarks and current settings. Identity uses video ID plus whole second. Preview additions and skipped duplicates.
- **Replace** replaces all bookmarks and settings. Preview the current data being replaced, incoming totals, and settings changes; require clearly destructive confirmation.
- Validate the file before applying it. Invalid files show an error and change nothing. Canceling the preview also changes nothing.
- Present operation success only after persistence succeeds. Import failures must not be presented as successful imports.

## Shared states and presentation

- Provide loading, empty, and failure states. Failed reads are errors, not empty data; failed writes do not produce success feedback.
- Empty This video points to the player **+** button. An empty All videos view points to the player **+** on a watch page or offers a link to YouTube elsewhere.
- Keep a compact, scrollable popup, roughly 380–420 px wide, with restrained layout and system light/dark theme. Use actual shadcn/ui components where helpful.
- Preserve usable keyboard navigation, accessible control labels, and color names/selected-state indicators that do not rely on color alone. Functional clarity takes precedence over decoration.
- Welcome and the separate Guide page are deferred. Show useful inline instructions, but no Guide link until its destination exists. Guide remains a later product commitment.

## Implementation boundaries

Follow the product's existing architecture: one authoritative record per video, derived lists/counts, background-routed mutations, per-video serialization, and typed success/failure results. Moving a timestamp must be one persisted record update, not independent delete/create writes that can lose a bookmark or partially apply the edit.

Follow the shared YouTube player ownership in [product architecture](../../docs/scope.md#project-architecture): the popup detects active-tab context, while content-side player messages and quick add consume one player lifecycle. Keep player navigation/media identity checks in that shared owner so popup operations and quick add cannot disagree about stale playback.

The later implementation must deliver the real operations behind the described controls, not inert settings, placeholder import/export, or a second store. This document itself implements none of them. Player-marker rendering remains a separate implementation concern that must consume the agreed settings.

Deferred: advanced sorting, typo-tolerant/fuzzy search, ID/bookmark-name search, direct timestamp entry, Welcome, Guide, and visual polish. Existing product exclusions such as popup quick add, undo, free-form colors, and unsupported playback integrations remain unchanged.

## Acceptance scenarios for later implementation

1. Opening on a supported watch page selects This video; opening elsewhere selects All videos. Settings is always reachable, and the header's This video shortcut follows supported active-video context.
2. All videos shows title/ID fallback and correct counts, lists videos by newest bookmark creation date, and expands into chronological bookmarks. Title and timestamp clicks launch the agreed destinations without offering an editable saved-video detail page.
3. `Na` and `real` match `Name is real` regardless of case. Queries do not match IDs or bookmark names. Clearing restores the full list; no matches and no saved data have distinct states.
4. All videos exposes only per-video bulk deletion as a management action. Confirmation names the video and count; cancel preserves data, successful deletion removes that video, and failure retains it.
5. This video supports seek, copy, name/color editing, confirmed single deletion, and confirmed per-video bulk deletion. Outside its active-video context, editing is unavailable.
6. Adjustment buttons change only the draft, allow zero, respect finite duration bounds, and reject steps crossing either boundary. Unknown duration blocks adjustment but not name/color edits. Cancel changes nothing.
7. A saved move changes the identity and list position without changing creation date. A target-second collision, persistence failure, or changed active-video context does not overwrite or lose bookmarks.
8. Marker preferences persist immediately; default-color changes affect inheriting bookmarks only. A bookmark can choose an override or return to Use default without affecting other overrides.
9. Export covers the complete library and settings. Import previews Merge and Replace effects, preserves existing duplicates/settings on Merge, replaces both on Replace, and leaves data unchanged for invalid files or cancellation.
10. Loading/error/empty states are distinguishable; success follows persistence. Inline help works without Welcome or Guide, and no dead Guide links or nonfunctional placeholder controls ship.
