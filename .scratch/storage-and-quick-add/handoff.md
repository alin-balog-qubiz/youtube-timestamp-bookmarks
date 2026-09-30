# Storage and quick-add handoff

Status: complete

## Start here

This feature is complete. The user will provide a new task; do not infer that the next task is popup, markers, or another remaining product feature.

Read the root `AGENTS.md`, [project intent](../../docs/scope.md), [coding conventions](../../docs/agents/coding-style.md), and the next task's spec before editing. Project intent is authoritative; this handoff is an implementation snapshot, not a separate source of requirements. The completed feature contract is [spec.md](spec.md).

The user explicitly requires inspecting and reviewing changes before committing. No commits or pushes were performed by the assistant. Preserve existing working-tree changes; check the current state rather than assuming all changes belong to you.

## Implemented behavior

- Accessible `+` control in the standard YouTube watch player toolbar.
- Captures the active video's ID, available title, and floored playback timestamp at click time without pausing playback or opening a form.
- Brief Saved / Already saved / Unable to save feedback. Success follows persistence.
- Duplicate identity is video ID plus whole-second timestamp, including zero. Existing bookmark fields remain unchanged; available video titles can refresh independently.
- Handles SPA watch navigation, stale media, player replacement, and content-context invalidation without leaving duplicate controls.
- Local extension storage through WXT; no legacy data migration. The user deleted the earlier experimental data and explicitly chose a clean cutover.

## Code map

| File | Responsibility |
| --- | --- |
| `models/bookmark.ts` | Video and bookmark types; creation result |
| `models/messages.ts` | Shared Result union and typed bookmark-create request/response |
| `services/bookmark-client.ts` | Host-page-facing adapter: sends `bookmarks:create`, unwraps response |
| `entrypoints/background.ts` | Runtime listener, switch dispatch, private handler and Result-returning validation |
| `services/bookmarks.ts` | Per-video write serialization, persistence, video listing |
| `entrypoints/quick-add.content.ts` | Content-script entrypoint, player control, navigation/lifecycle management |
| `wxt.config.ts` | Extension identity and storage permission |
| `eslint.config.ts` | TypeScript and React flat lint configuration |

`utils/bookmarks.ts` was removed; there is no compatibility alias.

## Verification evidence

Latest source checks passed: `npm run lint`, `npm run compile`, `npm run build`.

Latest throwaway storage smoke exercised the actual transpiled storage module with an in-memory browser-storage adapter: concurrent same-video creates preserved both timestamps, duplicates retained creation date/name/color, titles refreshed without being erased by missing titles, zero and different-video identities worked, and a failed write did not mutate persisted state or block the next write.

Latest Chromium smoke used a simulated YouTube DOM and a stubbed messaging adapter: 84.9 captured as 84, duplicate feedback appeared, SPA navigation saved the new video at second 7 with one control, and invalidation removed the control. A screenshot confirmed toolbar placement. This was not a live-YouTube end-to-end run of the final refactor.

Earlier in the session, the user manually tested the control on live YouTube and supplied a screenshot showing local extension-storage entries. That was before the final aggregate-storage and naming refactors. Earlier message-handler smokes covered field validation and rejected writes. No permanent test suite or throwaway smoke files were added.

## Tooling notes and remaining boundary

- ESLint and `@eslint/js` are on matching 9.x versions because the current React plugin's peer range excludes ESLint 10. npm warns that ESLint 9 is unsupported; do not silently mix major versions or bypass peers with force flags.
- npm incremental installation dropped optional native bindings from the lockfile. Their entries were repaired without changing existing locked package versions; an approved `npm ci --include=optional` then succeeded, followed by lint, compile, and build. The repaired `package-lock.json` belongs with dependency-manifest changes.
- Popup browsing/editing, timeline markers, settings, import/export, Guide, and replacement branding remain outside this completed slice. The popup and icon are still starter assets; only unused popup code, link safety, and export ordering were cleaned up.
