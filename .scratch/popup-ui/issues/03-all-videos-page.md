# All videos: selector, title filter, and bulk deletion

Status: implemented; awaiting user verification
Blocked by: 01, 02

## Goal

Make All videos a saved-video launcher with per-video bulk deletion, following [All videos in the parent workflow](../spec.md#all-videos). Reuse [popup setup](01-popup-setup.md) and the playback/bulk-deletion operations from [This video](02-this-video-page.md).

## Scope

- Read the real persisted library. List only videos with bookmarks, showing stored title or ID fallback plus derived bookmark count.
- Order videos by newest bookmark creation date, most recent first; edits do not refresh creation date. No sorting controls or separately persisted list/count index.
- Expand a video to show chronological timestamps, optional names, and colors. Expansion is not navigation to another editable detail page.
- Clicking a title opens its watch page in a new tab. Clicking a timestamp seeks if that video is active; otherwise it opens a new tab at that timestamp.
- Provide a case-insensitive, contiguous partial-title filter. `Na` and `real` match `Name is real`. Match neither IDs nor bookmark names; videos without a title match only an empty query. Preserve default ordering rather than rank results.
- Clearing the query restores the full list. Distinguish loading, failed reads, no saved videos, and no matching videos; offer clear-search for no matches. Empty-library instructions point to the player **+** on a watch page or YouTube elsewhere.
- The only management action is **Delete all bookmarks** for one selected video. Confirm its title/ID and bookmark count, with Cancel and destructive Delete. Cancellation changes nothing; successful deletion removes the row; failure keeps data visible.
- No editing, individual deletion, or copy-link action here, even for the active video's expanded row. No entire-library delete or separate video-detail page.

## Boundaries and ownership

This slice owns the library list, expansion, title filter, launcher interactions, and per-video deletion presentation. Reuse existing storage, playback, and bulk-deletion operations rather than duplicate them or introduce another store. This video and All videos must derive their results from the same records, so edits/deletion are reflected when the page is opened or revisited.

Settings, fuzzy/typo-tolerant search, ID/name search, advanced sorting, Guide, Welcome, and visual polish remain outside this slice.

## Acceptance and smoke verification

1. Use multiple real saved videos, including missing titles, names/colors, and different creation dates. Verify fallback labels, counts, video order, chronological expansion, and absence of zero-bookmark videos.
2. Search by title fragments with different case. Verify an ID-only match and bookmark-name-only match do not appear, no-match differs from empty-library state, clearing restores all rows, and result order is unchanged.
3. Open a video title, seek an active-video timestamp, and launch another video's timestamp in a new tab. Observe the actual tab/player destinations; no editable detail page is introduced.
4. Cancel and confirm per-video deletion, including from a filtered result. Other videos remain unchanged; the deleted video stays absent after reopening. A failed deletion retains the row/data and reports failure.
5. Edit or delete through This video and revisit All videos: counts, ordering, and expanded moments reflect the authoritative records. Confirm the only management control here is per-video bulk deletion.
6. Record actual popup/tab smoke evidence and run existing source checks after implementation. Keep search-behavior regressions focused on consumer-visible matching and ordering.

## Implementation and verification

- Implemented the persisted library list, creation-date ordering, chronological expansion, title-only filter, new-tab title links, shared timestamp playback launcher, and confirmed per-video bulk deletion.
- Reads and storage-change refreshes use the authoritative video records and marker preferences. Deletion uses the existing background-routed operation; failed reads/deletions report errors without discarding the previous library.
- `npm run compile`, `npm run build`, and final `npm run lint` passed.
- Isolated Edge extension smoke used real local storage: confirmed title/ID fallback, derived counts, ordering, zero-bookmark exclusion, mixed-case title fragments, ID/bookmark-name exclusion, chronological timestamps, inherited/custom colors, confirmation identity/count, cancellation, successful filtered deletion, other-video retention, and absence after popup reload. Captured the rendered 400 px popup.
- Remaining acceptance testing belongs to the user, including active-player seeking, timestamp tab destinations, failure scenarios, and This video → All videos transitions. No permanent automated tests added.
