# Import preview: title-first diagnostic groups

Status: implemented — real-popup smoke verification complete
Created: 2026-10-16
Approved: 2026-10-16 — user requested implementation of this spec

## Request and authority

The user supplied an Import bookmarks screenshot showing repeated video IDs and raw-second timestamps under Identical duplicates. They requested recognizable YouTube video titles and a title tree, discussed the tradeoffs, then approved implementation. This is a non-breaking presentation change, not an import rewrite.

[Product scope](../../docs/scope.md) and the [import/export contract](../import-export-rewrite/spec.md) remain authoritative. The approved change is category-first video grouping within the existing outcome sections; only diagnostic presentation changes.

## Baseline before implementation

- Product scope and the transfer spec already require incoming title, then current stored title, then video ID; malformed records may fall back to file location.
- `ui/components/ImportPreview.tsx` already renders title-or-ID for individual diagnostic and duplicate rows. Duplicate rows remain flat, repeat video identity and “Identical bookmark. Existing kept.” for each timestamp, and show raw seconds.
- `services/storage/backup.ts` already selected incoming/current titles for merge details. The supplied screenshot did not establish whether its visible IDs came from missing titles or a different running build; the new implementation retains the established title fallbacks.

## Approved presentation

Keep the existing outcome sections: Validation omissions, Identical duplicates, Bookmark metadata conflicts, and Video title differences. Within each section, group records by video and label each group with its available title and relevant item count. Expand a video group to inspect timestamps and reasons/values.

- Group by video ID, never the title string. Different videos can have identical titles, and incoming/current titles can differ for one video.
- Prefer incoming title, then current stored title. Do not fetch YouTube titles over the network or require new permissions. Use ID only when neither usable title exists, and file location for unidentifiable malformed records.
- Do not combine ambiguous repeated incoming video records into a seemingly valid single record. Keep each omission's file location and any conflicting title inspectable.
- Show human-readable timestamps using the existing popup time convention, rather than raw seconds. Within a video, order usable timestamps chronologically; retain a stable order and locations for entries without a timestamp.
- Put the identical-duplicate outcome once at the section/group level instead of repeating it for every bookmark. Keep every duplicate timestamp inspectable.
- Preserve per-entry validation reasons and differing fields with both existing/incoming values. Title differences remain explicit, not hidden by the chosen group label.
- Keep IDs secondary rather than routinely displaying them in every row. Distinguish same-title video groups with a secondary ID when needed.
- Use ordinary disclosure controls, not an ARIA tree widget or a deeply nested navigation system. Preserve keyboard operation, readable long titles, and bounded dialog scrolling.

## Grouping decision

Category-first grouping preserves the existing distinction between harmless duplicates, differing metadata, and invalid data; it adds video grouping without restructuring the entire preview. A video may appear in multiple sections.

An alternative is one video-first hierarchy containing all outcomes for each video. That makes reviewing one video's complete import result easier, but hides the cross-library conflict/omission overview behind per-video expansion and changes more of the preview. This is not the recommended default for a non-breaking polish pass.

The implementation request approves the recommended category-first structure. Both outcome sections and their video groups start collapsed, using native disclosures to keep the small popup bounded.

## Non-breaking boundary

No schema/version changes, storage migration, title persistence changes, network title lookup, matching/deduplication changes, merge-precedence changes, new conflict controls, selection changes, or Replace semantics changes. Keep all existing reasons, counts, stale-review protections, no-op Merge disabling, and cancellation guarantees.

## Required verification

Exercise the actual popup with multiple timestamps for one video, two distinct videos sharing a title, differing incoming/current titles, titleless records, malformed omissions without identity, mixed duplicate/conflict outcomes, and a no-op Merge. Verify grouping/counts, timestamp order, inspectable reasons/values, keyboard disclosures, long-title layout, and bounded scrolling. Confirm preview interaction does not mutate storage.

## Implementation and verification — 2026-10-16

- `ui/components/ImportVideoGroups.tsx` owns native video disclosures shared by omissions, duplicates, and conflict details. It groups by ID, additionally separating omission source records by their file location, preserves source order between groups, and sorts timestamps within each group without mutating preview data. Untimed entries remain in stable order after timed entries.
- `ImportPreview` and `ImportConflictDetails` retain the existing outcome categories and all diagnostic data. Identical-duplicate and existing-wins explanations appear once per category. Same-title videos receive secondary IDs; omission groups retain their source location and every row's concrete location/reason.
- Dialog focus trapping includes native summary controls. Styling uses the existing theme tokens and bounded dialog body.
- Exercised the actual extension popup in isolated Chrome with the WXT development runtime, real local extension storage, native File/JSON input, background preview messaging, and no replacement handlers or mocked preview responses. Refreshed the extension after dev artifact regeneration before the successful run.
- Verified five distinct video groups for seven duplicates: same-title videos stayed separate with secondary IDs; one video's times rendered as `0:00`, `0:47`, `8:59`; hour formatting rendered as `1:00:00`. Incoming title, stored-title fallback, and ID fallback were all observed. Outcome sections and video groups initially stayed collapsed.
- Verified repeated incoming IDs with differing titles remained separate omission groups at `Backup.videos[5]` and `[6]`; malformed records retained title/location fallbacks. Repeated seconds, invalid names, invalid timestamps, every omission location, existing/incoming bookmark names, and differing video titles remained inspectable.
- Used keyboard Tab/Space to open a video group and reveal its timestamps; verified Shift+Tab/Tab wrapped between Close and Cancel. Expanded omission/conflict disclosures through actual browser controls.
- At a measured 560 × 600 viewport, document dimensions stayed 560 × 600, dialog height was 568 px, and only its body scrolled (2236 px content in 443 px). Visible group summaries fit horizontally, including the long title. [Actual popup screenshot](smoke-popup.png) was inspected.
- No-op Merge stayed disabled with zero additions. Switching to Replace enabled its final action and showed the existing removal warning; Cancel closed the dialog. A deep comparison of all extension local-storage values before review and after cancellation was identical. No import was committed.
- `npm run compile` passed. `npm run lint` failed on the unrelated `services/popup/backup-download.ts:9:34` control-character regex (`no-control-regex`); that file was not changed.
- Removed the temporary WXT smoke configuration and stopped the dev runtime/browser tabs. No permanent test harness or production build was added. This verifies the presentation slice, not the broader import/export launch matrix.
