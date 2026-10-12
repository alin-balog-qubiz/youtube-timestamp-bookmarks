# Organize services and adopt scoped barrels

Status: claimed
Type: task

**NO COMMIT ON MY BEHALF. Keep everything local.** Follow the spec's [local-only execution rule](../spec.md#local-only-execution) throughout implementation and verification.

## Goal

Implement the complete structural cutover in the [service organization spec](../spec.md), preserving current behavior. One integration owner should perform the moves, caller migration, and verification together: these changes share entrypoints, service dependencies, and popup imports.

## Read first

- [Service organization spec](../spec.md): exact relocation table, barrel exports, invariants, and non-goals.
- [Product scope](../../../docs/scope.md): current behavior and mutation ownership.
- [Coding conventions](../../../docs/agents/coding-style.md): import ordering, local types, execution contexts, and naming.
- [Storage and quick-add spec](../../storage-and-quick-add/spec.md), [popup spec](../../popup-ui/spec.md), and [design-system spec](../../design-system/spec.md): consult the relevant operation contracts when exercising the scenarios below.
- Root agent instructions and applicable coding/design skills before implementation; writing-for-agents guidance before changing coding conventions.

## Implementation

1. Mark this ticket claimed. Inspect the current files and consumers rather than assuming the handoff snapshot is unchanged. Use language-server references/file moves if available; otherwise trace the complete import graph with the available tools. Respect unrelated work.
2. Apply every relocation and the three explicit barrels defined in the spec. Migrate all affected entrypoints, popup callers, service dependencies, and any existing affected checks. Keep internal sibling imports direct and storage/messaging imports leaf-specific. Completion: every listed module has one implementation at its target path, and no runtime source imports an obsolete path.
3. Update the existing documentation named in the spec. Completion: current ownership/import guidance agrees with the code; retained historical paths are identifiable as history or the relocation table.
4. Run verification after integration, not between file moves. Fix refactor-caused failures and record actual outcomes below. Completion: static/build checks and real-extension scenarios are exercised, with any environment limits explicitly distinguished from passes.
5. Remove throwaway verification artifacts. Mark the ticket resolved only when the acceptance criteria are satisfied; update the spec status to match. Leave all changes local and uncommitted under the local-only execution rule above.

## Acceptance criteria

- [ ] All thirteen source files follow the relocation table; no old-path shims or duplicate implementations remain.
- [ ] The background/client/popup barrels expose exactly the agreed operations; external callers use them and their implementations do not import through their own barrel.
- [ ] Storage and messaging use direct leaf imports. There is no global services barrel or catch-all shared folder.
- [ ] Mutation queues, player lifecycle, handler registration timing/cleanup, storage keys, message contracts, schemas, and failure behavior are preserved.
- [ ] Shared models, both utility folders, UI contracts, and presentation/controller ownership remain unchanged.
- [ ] Current docs describe the new organization, and all affected source references resolve.
- [ ] Type checking, lint, and production build succeed using the repository's current package scripts.
- [ ] The following runtime scenarios have recorded observations from the refactored extension, not just mocked imports or a compiling bundle.

## Runtime verification

Use an isolated browser profile/library, not the user's saved data. Load the actual extension, reload it after building, and refresh YouTube tabs so content code matches the build. Inspect popup, content, and background consoles for new initialization/import errors. Preserve visible evidence for popup behavior.

1. **Content to background:** on a supported watch page, quick-add a timestamp, repeat it, and observe Saved then Already saved without duplicate storage. Navigate to a second video through YouTube navigation; verify the control follows the current player and does not save against the old video.
2. **Popup reads and player messaging:** open This video, observe the saved timestamp, and seek through the popup. Open All videos and launch a bookmark for a different video. Open the popup outside YouTube and confirm library/Settings remain reachable.
3. **Mutation adapters:** edit a saved bookmark's name/color/timestamp and confirm the persisted result after reopening; cancel another edit and confirm no change. Exercise individual deletion and video deletion on isolated fixtures. Include a timestamp-collision rejection to confirm the error path still reaches the UI.
4. **Settings:** change appearance, marker visibility, and default color, reopen the popup, and observe persisted values. Visibility remains a setting; this task does not implement timeline markers.
5. **Backup:** export, validate/import with Merge, and confirm a Replace in the isolated library. Confirm preview and resulting data agree. Reject an invalid file and cancel an import without storage changes. If data changes between preview and confirmation, verify the existing stale-preview rejection.

Use current package scripts for checks rather than inventing a new test framework. If existing tests are present at implementation time, update/run those affected by the move. Do not add permanent tests that only assert filenames, barrel wiring, or import text. A build is not proof that the popup, content script, and background still communicate.

If runtime access or dependencies are unavailable, document the exact missing prerequisite and the attempted setup; leave the affected acceptance boxes unchecked. Do not claim the refactor verified or resolved on static checks alone.

## Comments

### Planning handoff — 2026-10-12

User approved the research recommendation and requested scratch planning before a different agent implements it. Only this ticket and its spec were created; application code was not changed and no commit was requested. Research found no configured language server and could not run a Rollup probe because the package was unavailable; re-check the implementation environment instead of assuming those constraints persist. Research did not establish production bundle/performance gains.
