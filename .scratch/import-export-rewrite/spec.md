# Import/export rewrite and launch versioning

Status: implemented locally — source/runtime and launch verification pending
Approved: 2026-10-13
Revised: 2026-10-14 — launch schema starts at 1; all prelaunch data is disposable

## Goal and authority

Prepare the videos/bookmarks import/export workflow for launch, with selectable transfers, explicit review, useful conflict/skip diagnostics, and independent app/file-schema versioning.

[Product scope](../../docs/scope.md) remains the product-intent authority. This spec supersedes the backup/import/export requirements in [popup workflow](../popup-ui/spec.md), [design system](../design-system/spec.md), and the backup-specific settings coupling in [color wheel improvement](../color-wheel-improvement/spec.md). Their completed issues and implementation notes remain historical evidence, not requirements to transfer settings.

The approval phase created documentation only. Local implementation followed on 2026-10-14; the user requested no tests, builds, or commits. No runtime or release verification is claimed, and app metadata remains `0.0.0` until the launch gate below is satisfied.

## Current implementation baseline

- `package.json` currently declares app version `0.0.0`; `wxt.config.ts` has no explicit manifest-version override.
- `models/backup.ts` and `services/storage/backup.ts` use backup version 2, accept version 1, and transfer settings together with videos.
- The current popup exports the entire library/settings and previews imports with destructive acknowledgement and stale-snapshot checks.
- Current development storage uses authoritative per-video records, a whole-library mutation barrier, and timestamp-keyed bookmark objects. Those architectural patterns remain useful, but prelaunch records/keys are not a compatibility or preservation obligation.

These are pre-rewrite facts, not descriptions of the approved workflow below.

## Transfer boundary

Only videos and bookmarks are transferred: video ID, optional stored title, whole-second timestamp, creation date, optional name, and optional bookmark-specific color override.

Never export or apply settings: theme/Light/Dark/System, marker visibility, global default marker color, or other preferences. This applies to both Merge and Replace. Prelaunch backups are unsupported; there is no legacy-settings import path or notice.

Preserve explicit bookmark overrides, including preset and Custom choices. Omitted color remains inheritance from the destination's current default; do not resolve or freeze inherited colors during export. Imported appearance may differ because destination preferences are not transferred. Names, titles, creation dates, and exact Custom hex spelling are preserved; display fallbacks such as Unnamed bookmark are not stored.

## Shared selection UI

- Entry actions remain in Settings' Backup section. Use the existing design system and bounded, accessible dialogs within the 560 × 600 px popup.
- Import JSON is the only visible file-picker action; keep its native file input hidden rather than showing a duplicate Choose File row.
- Export selects from the library; import selects from valid incoming videos. Start with all available videos selected. Each selected video transfers all its accepted bookmarks; no individual-bookmark selector.
- Offer Select all and individual checkboxes. A case-insensitive partial-title search hides rows without changing selection or list order. Do not match video IDs or bookmark names. Select all applies to the entire dataset, including hidden rows.
- Display title with ID fallback, per-video bookmark counts, and continuously updated selected video/bookmark totals. Counts include only validated bookmarks, but UI labels omit the word “accepted.” Selection starts independently of the All videos page's filter or active video.
- Duplicate, conflict, and validation-omission details identify videos by title whenever available. Prefer the incoming record's title, matching its selection row; fall back to the current stored title, then the ID. A malformed record without either identity uses its file location. Preserve usable titles in omission diagnostics even when the enclosing video is skipped. Display timestamp alongside the title where available; title differences still show both existing and incoming values.
- Distinguish loading, empty dataset, no search results, diagnostics, and failures. Disable final actions when no valid bookmarks are selected. Do not offer empty exports or use empty imports to clear the library.
- Dismissal/cancellation has no transfer side effects. Keep focus handling, keyboard controls, bounded scrolling, and explicit pending/error states; prevent duplicate final submissions.

## Export workflow

1. Export opens a modal showing the video selector and optional filename field.
2. Review selected videos/bookmarks and the filename. The modal's final Export button is the confirmation; no second naming or confirmation dialog.
3. Obtain a fresh consistent snapshot of the selected video IDs at the final action. If selected membership, metadata, or bookmark contents/counts differ from the reviewed snapshot, refresh the review and require Export again. Newly added library videos are not automatically selected. Removed or newly empty selected videos cannot produce stale output.
4. Export only the confirmed subset as readable, indented schema-1 JSON. Use the current build's actual app version.
5. Use the existing downloads boundary and report completion or interruption truthfully; release temporary download resources after completion/failure.

The optional name affects only the downloaded filename, not JSON content. A blank name uses `youtube-bookmarks-YYYY-MM-DD-HHmmss.json` (local date/time). A supplied name is normalized to a safe filename with exactly one `.json` extension; preserve the user's meaningful name rather than interpreting it as a path.

Unselected library changes do not invalidate export review. Snapshot/read/download failure shows an actionable error and retains the selection/name; do not claim an export completed.

## Import workflow

1. Select a JSON file. Parse and classify its envelope before presenting selectable videos.
2. Validate the incoming records without writing storage. Present valid videos and partial-import diagnostics.
3. Select videos, choose Merge or Replace, and inspect the computed effect. Changing selection or mode recomputes the preview.
4. Final Merge or Replace library explicitly commits the reviewed operation. Choosing Replace alone never mutates data. No second destructive confirmation dialog or acknowledgement checkbox is required.
5. Report success only after persistence succeeds, with actual additions/replacement and skipped counts. Skips remain inspectable rather than disappearing behind a generic success message.

The preview separates accepted selected totals, validation omissions, identical duplicates, existing-data conflicts, and (for Replace) current library totals being removed. Diagnostics identify the video/file location and timestamp where available, plus the concrete reason. Malformed entries without identities use their file location. Avoid double-counting a skipped video's bookmarks as additional independent skipped videos.

### Merge precedence and conflicts

- Identity is video ID plus nonnegative safe whole second.
- Add new videos and missing bookmarks to existing videos. Keep the existing video title and all metadata of existing bookmarks at matching seconds, even if incoming values differ or existing optional fields are absent.
- Example: existing A has 10s/20s; incoming A has 20s/30s. Keep existing 10s/20s and add incoming 30s.
- Identical incoming bookmarks at an existing identity are skipped duplicates, not conflicts. Differing name, color, or creation date is an informational conflict. Show video + timestamp, differing fields, existing/incoming values, and Existing kept. Title differences are shown separately.
- Equality follows canonical domain values rather than JSON property order; Custom hex letter case alone is not a color conflict. Retain existing spelling/metadata when skipping.
- No per-conflict override or resolution controls. Existing always wins. Existing settings are neither imported nor part of the conflict comparison.
- Disable Merge with Nothing new to import when it would make no changes; duplicates/conflicts remain inspectable. Do not report a successful import for a no-op.

### Replace semantics

Replace installs the accepted bookmarks of the selected incoming videos as the entire library. It deletes every current video/bookmark not present in that selected subset, including videos absent from the file or deselected in the modal. It does not replace only matching videos and never alters settings.

Allow Replace after validation skips, provided valid selected bookmarks remain. Its final preview states accepted incoming totals, inspectable skipped totals/reasons, all current video/bookmark totals being removed, and that skipped records will not be restored. Use a clearly destructive Replace library final action. An empty file, an all-invalid file, or an empty selection cannot clear storage.

### Stale preview and persistence

- Preview is read-only. Recheck relevant current library data under the existing whole-library barrier at commit. If it changed, refresh the effect/conflicts and require the final action again; do not apply silently against a stale review.
- Replace depends on the whole current library; Merge depends on records that can affect its reviewed additions/conflicts. Preference-only changes do not invalidate import review.
- Retain background-owned mutations, per-video serialization, and coordinated library snapshots. Revalidate at the background boundary; the popup's analysis is not trusted authorization to write arbitrary records.
- Commit the accepted subset and removals atomically as one operation. Partial acceptance is a validation policy, not permission for partially persisted imports. Failure leaves the previous library intact, retains review state, releases queues, and reports failure.
- Do not import/adopt preferences, cancel color intent as though settings were replaced, or require global-color persistence to create a videos-only snapshot. Normal native-picker commit/navigation persistence and settings errors remain independent and visible.

## Schema 1

```json
{
  "format": "youtube-timestamp-bookmarks",
  "schemaVersion": 1,
  "appVersion": "1.0.0",
  "videos": [
    {
      "id": "example-video",
      "title": "Saved video",
      "bookmarks": [
        {
          "timestamp": 42,
          "createdAt": "2026-10-13T12:00:00Z",
          "name": "Useful moment",
          "color": { "type": "custom", "value": "#ff8800" }
        }
      ]
    }
  ]
}
```

- Required envelope: exact format identifier, integer schemaVersion 1, a valid producer appVersion SemVer string, and videos array. No settings or old version field. Reject unknown top-level fields or an unusable envelope; do not guess the schema from contents.
- Video: nonblank string id, optional string title, and bookmarks array; no unknown fields. ID validity retains the existing stored-video contract, not a newly invented YouTube-ID restriction.
- Bookmark: nonnegative safe-integer timestamp, valid calendar/time ISO createdAt with a time zone, optional string name, optional color; no unknown fields. Zero is valid. No redundant timestamp-key field in the array representation.
- Color: exactly `{ "type": "preset", "preset": "accent" | "gray" | "ink" }` or `{ "type": "custom", "value": "#rrggbb" }`. Custom hex is six-digit and case-insensitive; omitted color means destination-default inheritance, not null or an exported default value.
- Empty video records do not become selectable library groups. Final actions require valid selected bookmarks.
- Convert wire bookmark arrays to the authoritative timestamp-keyed storage model only after validation. No development-data migration is required.

## Validation and partial acceptance

| Condition | Result |
| --- | --- |
| Broken JSON, wrong format, unsupported schema, unusable envelope/top-level structure | Block import; explain the error; no writes |
| Invalid video identity/metadata or unusable video bookmark container | Skip that video and its bookmarks; preserve other valid videos |
| Invalid bookmark timestamp/date/name/color or unknown bookmark fields | Skip that bookmark; preserve valid siblings |
| Repeated incoming video ID | Skip every record with that repeated ID, not an arbitrary first/last winner |
| Repeated timestamp within one incoming video | Skip every incoming entry at that ambiguous second; preserve other seconds |
| Valid entry already stored during Merge | Existing wins; distinguish identical duplicate from metadata conflict |
| No valid selected bookmarks remain | Disable Merge/Replace; no clearing operation |

Detect repeated identities across all recognizable incoming entries before selecting a winner; invalid metadata does not turn an ambiguous identity into a trustworthy entry. Skips are disclosed before the final action. Do not repair invalid fields, silently trim metadata, or import an unknown future schema. An error in one known-schema entry does not reject unrelated valid entries.

## Clean launch baseline

Schema 1 is the first supported release file format. App 1.0.0 does not inherit compatibility promises from development backup versions 1 or 2.

- Import accepts only the declared launch schema with the complete envelope above. Reject development envelopes using `version`, settings-inclusive files, timestamp-keyed wire bookmark objects, and missing/unsupported schemaVersion. Do not reinterpret old `version: 1` as `schemaVersion: 1`.
- No legacy validators, import adapters, hex-string color normalization, fallback schemas, or notices for ignored development settings are required. Remove obsolete compatibility paths and their preservation tests during implementation.
- All prelaunch bookmarks and preferences are development data and may be deleted/reset during cutover. No backup conversion, storage migration, or preservation guarantee is required. This permission does not make normal postlaunch import/export a settings-reset operation.
- Documentation work does not delete files or extension storage. Any actual development-data reset belongs to implementation/cutover, not this spec edit.


## App and schema versioning

- package.json version is the app-version source of truth. Generated extension manifest metadata, package artifacts, and export appVersion must agree with it; do not introduce separately maintained version constants. Keep package-lock root metadata synchronized when bumping.
- Set the launch release to 1.0.0 after the rewrite is implemented, verified, and launch-ready. This approved spec does not bump 0.0.0 or claim launch readiness.
- Patch: compatible fixes. Minor: compatible features. Major: breaking changes to supported contracts. File-schema compatibility is versioned independently: compatible app releases need not increment schemaVersion; incompatible wire changes require a new schema and explicit import support policy.
- schemaVersion, not appVersion ordering, decides import compatibility. A newer producer app version with a supported schema is acceptable. Unsupported schemas are blocked without mutation.
- Keep the format identifier and a single authoritative persisted model; no storage-key rename is required merely to reset file-schema numbering. Prelaunch storage compatibility is not required. Release verification must inspect the actual built manifest and packaged artifact, not only source declarations.

## Scope exclusions

No settings transfer, prelaunch backup compatibility, development-data migration/preservation, sync, individual-bookmark selection, interactive conflict resolution, undo, new persistence store, generic import framework, release publishing, or unrelated player/popup redesign. This scratch specifies the rewrite and launch-version policy; it does not certify all other launch work complete.

## Acceptance criteria and implementation verification

These required scenarios remain unexercised for the local implementation. When verification is authorized, use real popup/import/export/storage boundaries and inspect downloaded JSON. Source inspection supplements, not replaces, behavioral verification.

1. Export/import selectors start fully selected; individual changes and Select all update actual transfer totals. Title filtering preserves selection/order and Select all includes hidden rows. Empty selection/no valid bookmarks disables final actions.
2. Export one of several videos with a supplied name and with a blank name. Readable downloaded files have one .json extension, correct selected data, schemaVersion 1, and actual appVersion; no settings/default color/theme/visibility fields appear. Explicit overrides and inheritance survive round trips.
3. Change a selected video while export review is open: the review refreshes and requires another final action; no stale data is downloaded. Unselected/new videos are not unexpectedly exported. Download/read failures retain review state and do not claim completion.
4. Merge the 10s/20s versus 20s/30s example: only 30s is added. Existing title/name/color/createdAt remain unchanged. Identical duplicates are distinct from differing-field conflicts, with inspectable values. An all-duplicate/conflict-only merge says Nothing new to import and cannot submit.
5. Import a file with good and bad videos/bookmarks: preview identifies accepted records and every omission/reason. Confirm imports only accepted selected data. Repeated IDs/seconds skip all ambiguous entries, including second zero, without arbitrary winners. Broken/unsupported envelopes never reach mutation.
6. Replace a three-video library with one selected valid video from a partially invalid file: preview explains whole-library deletion and omissions; one final Replace library action installs only the accepted subset. Mode changes/cancel do not write. Empty/all-invalid files cannot wipe the library.
7. Reject development version-1/version-2 backups and any unsupported/missing launch schema before mutation; an old version: 1 field is not schemaVersion: 1. Schema-1 round trips preserve accepted metadata/explicit colors/inheritance while destination settings remain unchanged in both import modes. No development-data preservation or migration is needed at cutover.
8. Change relevant library data after import preview: commit refreshes rather than using stale counts/conflicts. Preference-only changes do not invalidate review. Concurrent quick add and failed writes do not lose data or poison subsequent queue operations.
9. Force persistence failure during Merge/Replace: the previous library remains intact, no partial accepted subset is persisted, and success feedback is absent. Settings writes/color drafts remain independent of transfer operations.
10. At launch, inspect package.json/package-lock, built extension manifest, packaged filename, and an actual export: version sources agree on 1.0.0. Supported-schema files from newer producer versions remain importable; unsupported schemas remain blocked.

## Decisions and approval

The user approved all recommendations after grilling, including partial imports rather than whole-file rejection for record-level errors, whole-library Replace after disclosed omissions, no-op Merge disabling, and refreshed export review. No unresolved product questions remain. Implementation details must follow existing coding/style/storage conventions without broadening this contract.

The user subsequently replaced the legacy-support decision with a clean launch baseline: schemaVersion 1, no compatibility with any prelaunch backup/storage format, and permission to discard all existing development data. This revision supersedes the earlier recommendation to number the launch schema 3 or preserve legacy data.

## Local implementation — 2026-10-14

- `models/backup.ts` separates schema-1 wire arrays, validated timestamp-keyed records, diagnostics, conflicts, and explicit stale/committed results. `services/storage/backup.ts` owns strict envelope validation, partial acceptance, selected snapshots, effect previews, revalidation, and video-only batch commits under the existing library barrier.
- Settings opens popup-local Export/Import dialogs. The shared video selector preserves selection through title filtering; import keeps omission/duplicate/conflict details available after completion. Replace uses one destructive final action; empty transfers and no-op Merge cannot submit.
- `services/popup/backup-download.ts` owns safe filenames, indented JSON, browser-confirmed completion/interruption, and temporary download resources. Producer app version comes from generated manifest metadata, with no separately maintained version constant.
- Removed development backup adapters, legacy hex conversion, stored appearance migrations, imported preference adoption, and transfer-triggered color flushing. No extension storage reset was performed; settings persistence remains independent.
- Static integration review only. No tests, builds, lint/format commands, runtime scenarios, commits, or artifact regeneration were performed. The single-batch persistence failure guarantee, popup focus/scrolling, downloads, concurrent mutations, and release artifacts still require the acceptance checks above.
- Package and lockfile remain synchronized at `0.0.0`; launch `1.0.0` is deliberately gated on verified readiness rather than inferred from local edits.
