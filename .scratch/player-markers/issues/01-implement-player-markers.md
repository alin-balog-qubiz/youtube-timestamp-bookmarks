# Implement player bookmark markers

Status: implemented locally; user smoke test pending
Type: task

## Requirement

Implement [the player-marker spec](../spec.md) using the shared YouTube player lifecycle, authoritative bookmark records/preferences, existing seek operation, and established color resolver. No commits, pushes, or pull requests.

## Implementation

- `services/client/player-markers.ts` owns shadow-DOM marker controls, persisted-state refreshes, stale-read rejection, event isolation, resize alignment, and cleanup. Markers are siblings of YouTube's timeline slider inside the bottom controls, so they inherit controls visibility rather than remaining visible over hidden controls.
- `services/client/player.ts` exposes the current progress-bar element and extends its existing lifecycle with duration/emptied events and a batched DOM observer. Replacement player, controls, video, and progress-bar elements notify existing consumers through `onChange`.
- `services/client/index.ts` exports marker initialization; `entrypoints/youtube.content.ts` initializes it against the same player client used by quick add and player messages.
- Marker buttons retain their DOM identity for unchanged timestamps, expose timestamp/name through accessible labels and hover/focus tooltips, and support native Enter/Space activation. Only marker controls intercept input; the host has `pointer-events: none`.
- Reads reuse `getVideo`, `getMarkerPreferences`, and the existing storage keys. Local storage notifications reconcile successful saves, edits, deletion, and imports. Rendering/seeking perform no storage writes.
- Color inheritance and presets reuse `ui/utils/color.ts`; System follows the OS media query. Custom overrides remain fixed.
- Positive finite duration is required. Zero timestamps render at the beginning; out-of-range timestamps are omitted without changing stored records.
- README/spec status updated. `docs/scope.md` intentionally unchanged: approved product behavior has not changed.

## Observed verification

- `npm run compile`: passed.
- ESLint on the four changed TypeScript files: passed.
- `npm run build`: passed; production output is `.output/chrome-mv3/`.
- `npm run lint`: failed on the unchanged popup file `entrypoints/popup/pages/AllVideosPage.tsx:233:29` (`react/no-unescaped-entities`, an unescaped apostrophe). Left that unrelated file unchanged.
- Ran the actual player lifecycle and marker modules in an isolated Chromium DOM fixture with fake storage reads/notifications and controlled media metadata. Observed:
  - timestamps 0, 20, and 90 positioned at 0%, 20%, and 90% for a 100-second duration; timestamp 101 omitted;
  - named/unnamed accessible labels, hover tooltip, real mouse click, and Enter/Space seeking;
  - marker input did not bubble into simulated player handlers; ordinary timeline input did;
  - persisted-state notification updates for creation, same-second deduplication, rename, and deletion;
  - hide/restore, Light/Dark preset/default changes, and unchanged fixed Custom override;
  - unknown-duration deferral and restoration;
  - progress-bar replacement, externally removed marker-host recovery, and proportional alignment after resizing;
  - A → B → A navigation with one host, ignored late A read while B was active, failed-load clearing, and recovery on a later notification;
  - live/Shorts exclusion and UI/storage-subscription removal on departure/disposal.
- Inspected the fixture's accessibility surface and screenshot. Keyboard focus exposed the saved timestamp/name tooltip and a solid focus outline (`:focus-visible` true).
- Removed temporary fixture files and closed the verification browser tab. No permanent tests or extra runtime dependencies added.

## Verification boundary

The user requested ownership of the real YouTube smoke test. No real YouTube page or installed-extension session was exercised. The fixture verifies DOM/state behavior, not YouTube's current markup or real extension storage/messaging.

Pending user scenarios: actual quick-add success/failure and duplicate saves; popup timestamp/color/name edits; individual/video deletion; confirmed Merge/Replace imports; System appearance changes; ordinary YouTube seek/drag behavior; reload and SPA navigation; theater/fullscreen transitions; nearby-marker overlap; and unsupported playback contexts. Follow all acceptance scenarios in the spec. Reload the extension and refresh existing YouTube tabs before testing the new content script.

## Comments

- Implementation kept local as requested. No commit, push, or PR created.
- User presentation refinement: reduced markers from 12 × 18 px to 8 × 12 px and moved them 3 px above the bar. Kept timestamp/name in the existing hover/focus tooltip and adjusted its spacing for the smaller marker. Updated the feature spec, product scope, and README together.
- Refinement checks: TypeScript compilation, marker-file lint, and production build passed. In an isolated Chromium fixture using the source CSS and marker-label updater, measured 8 × 12 px and a 3 px gap; the named tooltip was hidden at rest and visible on hover. Screenshot confirmed the elevated marker and tooltip. Real YouTube verification remains user-owned.
- User correction supersedes the elevated-marker refinement: keep 8 × 12 px, but center markers on the bar. Removed the em dash between time and name. Matched the supplied YouTube controls-tooltip reference with a translucent dark background, 8 px corner radius, 14 px medium-weight white text, and 8 × 12 px padding; retained hover/focus behavior.
- In an isolated Chromium presentation fixture using the actual source CSS and label updater, measured 8 × 12 px and zero vertical center difference from the bar. Verified `8:59 Tatal lui Erik` without a separator dash in both tooltip and accessible label, tooltip hidden at rest, visible on hover and keyboard focus, and visible focus outline. Screenshot inspected; real YouTube verification remains user-owned.
- Correction source checks: `npm run compile`, marker-file ESLint, and `npm run build` passed. Production output refreshed in `.output/chrome-mv3/`. No commits, pushes, or PRs.
