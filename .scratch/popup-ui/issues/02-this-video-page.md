# This video: bookmark management

Status: open
Blocked by: 01

## Goal

Make the active video's page functional end to end, following [This video in the parent workflow](../spec.md#this-video). Requires [popup setup](01-popup-setup.md).

## Scope

- Read the active video's persisted bookmarks; show title/ID fallback and chronological rows with formatted time, optional name, and color. Distinguish loading, failed reads, and an empty video; empty instructions point to the player **+**.
- Clicking a timestamp seeks in that active video. Read real player duration for adjustment; do not substitute guessed metadata or a fake player response.
- Row menu: **Edit**, **Copy timestamped link**, **Delete**. Copy the real timestamped URL and report clipboard success/failure.
- Confirm single deletion with time/name. Confirm **Delete all bookmarks** with video identity and count. Remove data from the UI only after persistence succeeds; deleting the last bookmark leaves This video in its empty state and removes the video from saved-video listings.
- Edit in a small dialog: optional name, preset color or **Use default**, and **−5s / −1s / +1s / +5s** buttons. Explicit Save/Cancel; all controls change a draft until Save. Blank name means unnamed; no direct timestamp entry.
- Disable steps outside `0…floor(duration)`, without clamping. Unknown/non-finite duration disables adjustment with an explanation, not name/color editing. Recheck active video and duration bounds when saving a timestamp change.
- Save timestamp/name/color as one persisted update. Preserve creation date; a moved bookmark returns to its chronological position. Reject an occupied target second without changing either bookmark; an unchanged timestamp is not a self-collision.
- Keep the dialog/draft available on collision or persistence failure. Prevent saves after active-video context changes; explain the change and require reopening in the correct context.

## Boundaries and ownership

This slice owns the actual bookmark read/edit/delete operations and player seek/duration integration needed by this page, including typed responses and background-routed, per-video-serialized mutations. A timestamp move is one video-record write, not independent delete/create writes.

Provide reusable per-video bulk deletion and timestamp playback navigation for [All videos](03-all-videos-page.md). Own the shared color palette/default-color resolution required by the editor and rows; [Settings](04-settings-page.md) must extend that same contract rather than introduce another preference store. Preferences UI and marker rendering are not part of this slice. All videos and Settings remain the minimal shells until their own slices.

## Acceptance and smoke verification

1. Use real saved moments in a loaded extension: rows are chronological, timestamp clicks seek, and copied URLs identify the correct video/second. Verify empty and read/clipboard failure states.
2. Save a name/color edit, return to Use default, and cancel a draft. Reopen the popup to prove persistence and cancellation behavior.
3. Adjust by each step size, including zero and near the duration boundary. Verify disabled out-of-range steps and unavailable-duration behavior; name/color edits remain usable.
4. Move a bookmark to a free second and verify preserved creation date/metadata and chronological position. Attempt an occupied second and an unchanged-second name edit; only the former is a collision.
5. Exercise a failed write and an active-video change during editing: neither loses data nor writes against the wrong video. Preserve the draft on write failure.
6. Cancel and confirm both deletion types. Verify counts/data after reopening and the empty state after the last deletion. Failure retains persisted bookmarks and shows an error.
7. Record actual popup/player smoke evidence and run existing source checks after implementation. Cover collision/boundary/data-loss invariants with focused regression tests where appropriate; mocks alone are not UI proof.
