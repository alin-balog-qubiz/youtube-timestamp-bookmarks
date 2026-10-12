# Service organization and scoped interfaces

Status: approved for implementation; not implemented

## Goal and authority

Organize the existing service modules by execution-context ownership and shared capability. Expose small, explicit interfaces through selected barrels without changing extension behavior. The user approved the research recommendation and requested this scratch handoff before another agent implements it.

[Product scope](../../docs/scope.md) remains authoritative for behavior. [Coding conventions](../../docs/agents/coding-style.md) govern imports, ownership, and execution-context terminology. This spec defines the structural cutover; [issue 01](issues/01-organize-services.md) owns implementation and verification.

## Local-only execution

**NO COMMIT ON MY BEHALF. Keep everything local.** Leave all changes uncommitted in the working tree. Do not create commits, push changes, open pull requests, or publish code or artifacts remotely.

## Agreed decisions

- Use context folders for background, YouTube-facing client, and popup operations; use named storage and messaging capabilities rather than a catch-all `shared/`.
- Keep one shared `models/` directory with focused files. Module-owned types stay beside their implementation; component props and page state stay local.
- Keep both root `utils/` and `ui/utils/`: the former owns context-independent rules, the latter UI support.
- Retain the existing UI component files, `ui/index.ts`, and direct internal UI imports.
- This is a relocation/import refactor, not a behavior, schema, lifecycle, or performance redesign.

## File relocation contract

Paths below are relative to `services/`. Preserve exported operation names and implementations; filename changes clarify ownership.

| Current file | Target file |
| --- | --- |
| `bookmark-background.ts` | `background/bookmark-handlers.ts` |
| `settings-background.ts` | `background/settings-handlers.ts` |
| `player-client.ts` | `client/player.ts` |
| `player-messages.ts` | `client/player-messages.ts` |
| `quick-add-client.ts` | `client/quick-add.ts` |
| `active-tab.ts` | `popup/active-tab.ts` |
| `player-navigation.ts` | `popup/player-navigation.ts` |
| `bookmarks.ts` | `storage/bookmarks.ts` |
| `marker-preferences.ts` | `storage/marker-preferences.ts` |
| `backup.ts` | `storage/backup.ts` |
| `messages.ts` | `messaging/register-handlers.ts` |
| `bookmark-client.ts` | `messaging/bookmark-requests.ts` |
| `settings-client.ts` | `messaging/settings-requests.ts` |

`client` continues to mean YouTube-facing code, not all code outside background. Background-request adapters get neutral request filenames because bookmark requests are used by both quick add and popup, and settings requests currently serve popup callers.

Keep the existing cohesive files intact. In particular, backup validation remains with backup operations; preference normalization remains with preferences. Their shared consumers do not justify splitting those implementations as part of this task.

## Public imports

Create exactly these scoped barrels, using explicit named re-exports:

| Barrel | Public operations |
| --- | --- |
| `services/background/index.ts` | `registerBookmarkHandlers`, `registerSettingsHandlers` |
| `services/client/index.ts` | `createPlayerClient`, `getPlayerMessageHandlers`, `initializeQuickAdd` |
| `services/popup/index.ts` | `getActiveTabContext`, `getPlayerDuration`, `seekBookmark`, `openBookmark`, `getBookmarkUrl` |

- Callers outside each of these folders use its barrel. Thus background/content entrypoints and popup controllers migrate together.
- Files inside a scoped folder import their sibling dependencies directly, not through their own barrel. Keep `PlayerClient` and `PlayerContext` with the player implementation; current internal consumers import types directly.
- Storage and messaging consumers use direct leaf imports, such as `@/services/storage/bookmarks` and `@/services/messaging/bookmark-requests`. These folders have no barrel in this cutover.
- Barrels contain only re-exports: no initialization, subscriptions, registration calls, broad `export *`, or forwarding wrappers.
- Do not add a root `services/index.ts`, a models barrel, old-path compatibility files, or aliases. Complete the caller migration and remove the old files.
- Follow existing import grouping and preserve side-effect import ordering.

## Invariants and ownership traps

1. **Execution stays where it is today.** Importing a module does not send work elsewhere. Background handler registration remains explicit in the background entrypoint; player creation and content registration remain in the content entrypoint. Keep one player lifecycle and its current cleanup.
2. **Mutation serialization stays background-owned.** Bookmark/preference writes and import/export coordination retain the existing queue/barrier implementation. Module-local queues are not shared between execution contexts. Do not bypass request adapters or create another mutation owner.
3. **Existing direct reads remain valid.** Popup currently reads video lists/preferences directly. `storage/` identifies capability, not background-exclusive execution. Do not convert reads to new messages or move writes into popup/content.
4. **Shared validation stays shared.** Settings imports `validateBackup` directly; background operations also use it. Settings requests also use preference normalization. Preserve those dependencies without introducing new wrappers or moving this logic to generic utilities.
5. **Contracts do not change.** Preserve message discriminators/results, persisted keys, backup versions, validation, failure handling, and bookmark identity/deduplication rules.
6. **View models remain distinct.** Domain `BookmarkDraft.name` is optional; the UI form draft requires a string. `BookmarkItem` is a presentation projection. Appearance types have one canonical definition with UI re-exports. Preserve these differences and current conversion behavior.
7. **Models can contain domain behavior.** `models/appearance.ts` includes runtime validators, not just erased types. Keep it intact.

## Non-goals

No new feature, CSS/UI change, model or UI type rename, `PopupPage` relocation, utility consolidation, `ui/utils` reorganization, per-service models directories, file-per-function extraction, dependency upgrade, new lint framework, bundle tuning, or unrelated cleanup. Optional naming/layout ideas from research are not requirements for this cutover. The two BookmarkEditor modules retain their distinct presentation/controller roles.

## Documentation and completion

Update the ownership/import guidance in `docs/agents/coding-style.md` and add concise service-navigation guidance to the existing README. Keep this spec as the relocation record; current guidance must describe the new paths rather than preserve old-path recommendations. Historical scratch evidence need not be rewritten.

Product behavior and the high-level architecture in `docs/scope.md` remain unchanged; do not introduce new behavior through documentation. If an implementation decision would change those contracts, stop and resolve that scope change rather than widening this task.

Implementation is complete only when every relocation and caller migration is finished, the old runtime paths are gone, documentation matches, and the checks plus real-extension smoke scenarios in issue 01 have recorded outcomes.
