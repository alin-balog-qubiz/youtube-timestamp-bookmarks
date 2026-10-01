# Settings: preferences and JSON backup/restore

Status: open
Blocked by: 01, 02, 03

## Goal

Deliver functional preferences and backup/restore, following [Settings in the parent workflow](../spec.md#settings). Requires the shell and completed bookmark pages so imported data and preference changes can be verified through their actual consumers.

## Scope

### Player markers preferences

- Show **Player markers** controls for marker visibility and global default marker color, using a labeled native color picker and the shared hex-color/default-color contract from [This video](02-this-video-page.md).
- Load and persist real preferences immediately, without a page-wide Save button. Provide loading/failure feedback; do not present an unpersisted value as saved.
- Visibility affects markers, not quick add or popup browsing. Default-color changes affect inheriting bookmarks only; explicit overrides survive, and Use default in the editor restores inheritance.

### Backup and restore

- Export readable JSON containing the entire library and settings, independent of active page or title filter. No export confirmation; use a real downloaded file, not a mock payload.
- Implement staged import within Settings: choose file → Merge/Replace → effect preview → confirmation. Nothing is persisted during file selection, mode selection, or preview.
- Establish and validate the backup format against the shared video/bookmark/settings contract before showing an actionable confirmation. Malformed or incompatible files show an error and change nothing.
- Merge adds non-duplicates by video ID plus whole second; existing duplicate bookmarks and current settings win. Preview additions and skipped duplicates.
- Replace replaces all bookmarks and settings. Preview current data being replaced, incoming totals, and settings changes; require destructive confirmation.
- Cancel leaves data unchanged. Show success only after persistence succeeds; report export/import failures explicitly.
- Completed import and preference changes must be reflected when revisiting This video and All videos, using the authoritative records rather than a parallel UI store.

## Boundaries and ownership

This slice owns the Settings page, persisted preferences, backup format/validation, effect preview, and real export/import operations. Reuse the shared color validation and default-color behavior; route bookmark mutations through the existing background boundary and serialization so imports do not bypass the mutation contract.

Player-marker rendering remains a separate implementation concern, as stated in the parent workflow. Store real visibility preferences for that consumer, but do not claim this slice renders timeline markers or that nonexistent markers were visually toggled. Verify color inheritance through the completed bookmark pages; verify visibility consumption through markers when that feature exists. Welcome, Guide, manual theme selection, and visual polish remain deferred.

## Acceptance and smoke verification

1. Change each preference in the real popup and reopen it: values persist. Simulate a storage failure and verify error feedback rather than a false saved state. Quick add and browsing remain available regardless of visibility preference.
2. Change the default color and revisit both bookmark pages: inheriting rows change, overrides do not. Edit an override back to Use default and verify it follows the current default after reopening.
3. Export a library with multiple videos, second zero, names, overrides, and preferences. Inspect the actual JSON download and restore it to prove it is a usable backup, not just valid-looking text.
4. Merge a file containing duplicate identities and new moments. Preview agrees with the resulting additions/skips; existing duplicate name/color/creation date and current settings remain unchanged.
5. Replace with a different library and settings, including a valid empty library. Preview identifies replaced/incoming data; confirmed completion is visible in both pages and persists after reopening.
6. Cancel each import mode and try malformed/invalid files: bookmarks and settings remain unchanged. Exercise an import persistence failure: no success feedback is shown.
7. Record actual popup/download/import smoke evidence and run existing source checks after implementation. Keep regression coverage focused on validation, duplicate precedence, cancellation, and persisted results. Do not claim marker-rendering verification before its separate implementation exists.
