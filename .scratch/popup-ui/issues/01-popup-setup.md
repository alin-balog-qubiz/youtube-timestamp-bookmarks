# Popup setup: minimal pages and navigation

Status: complete

## Goal

Replace the starter popup with the smallest usable three-page shell. This is the first implementation/review slice of the [approved popup workflow](../spec.md); it delivers navigation, not bookmark or Settings features.

## Scope

- Create minimal **All videos**, **This video**, and **Settings** pages with a persistent navigation header and page headings. No sample bookmark data or unfinished feature controls.
- Read the real active-tab context. Open This video on a supported standard YouTube watch page, including one with no bookmarks; open All videos elsewhere.
- Keep All videos and Settings reachable. Offer This video only in supported active-video context; selecting it always refers to that active video.
- Outside YouTube, show the agreed notice without blocking navigation. Unsupported playback pages do not expose This video.
- Keep active-video context available to later page slices. Navigation/context failures must not masquerade as a supported video; explain the failure while leaving All videos and Settings usable.
- Use a compact, scrollable layout, roughly 380–420 px wide, system light/dark theme, labeled keyboard-accessible navigation, and actual shadcn/ui components where helpful. Keep styling minimal.

## Boundaries and ownership

This slice owns the popup shell, shared navigation, and active-tab/video context. Preserve completed storage and player quick add. Bookmark reads/actions, player seek/duration integration, preferences, import/export, Welcome, Guide, and marker rendering belong elsewhere.

The page shells are an intentional review boundary, not a completed popup-feature claim. They show headings without fake data, inert buttons, or success feedback for operations that do not exist.

## Acceptance and smoke verification

1. Load the actual extension popup on a supported watch page: This video opens and all three header destinations work.
2. Open it on another YouTube page and outside YouTube: All videos opens, Settings remains reachable, and This video is absent. The outside-YouTube notice appears only in the appropriate context.
3. Change active-video context while the popup remains open: the shortcut and context follow the supported video without retaining an obsolete editable destination.
4. Exercise navigation by keyboard and inspect the compact, scrollable surface in system light/dark theme. No starter counter/logos, fabricated bookmarks, or unfinished feature controls remain.
5. Record the actual popup smoke evidence and run the existing source checks after implementation. Update this issue's status only when its scoped behavior works.

## Comments

### Implementation and smoke verification — 2026-09-30

- Replaced the starter popup with All videos, This video, and Settings headings and persistent, labeled navigation. Native buttons support keyboard activation and visible focus; no bookmark data, unfinished feature controls, or Guide links ship.
- Shared URL classification and a typed `player:get-active-video` content-script response reuse quick add's player/live/media/navigation guards. The popup retains the supported tab ID, video ID, and optional title for later slices. It refreshes on active-tab/navigation events and checks player availability every 750 ms only while mounted; listeners and the timer are cleaned up on unmount. Stale async responses cannot overwrite newer context.
- Added `activeTab`, not broad `tabs` access. Open the popup through the toolbar: opening `popup.html` as an ordinary tab does not grant active-tab URL access.
- Passed `npm run lint`, `npm run compile`, and `npm run build`.
- Loaded the production extension in an isolated Opera GX profile and exercised the actual 400 × 240 px toolbar popup against live YouTube. Extension local storage was empty (`{}`); the supported watch page still opened This video with its real title. All three destinations worked.
- Mouse navigation and Tab/Enter navigation worked, with a visible focus outline. Inspected actual light/dark popup screenshots; background colors changed from `rgb(255, 255, 255)` to `rgb(24, 24, 27)`.
- Clicked a real YouTube recommendation without closing the popup: context changed from `dQw4w9WgXcQ` to `lMRr7O2ineA`, and This video showed the new player title. A subsequent `/shorts/` history transition removed the shortcut and obsolete This video destination without showing an outside-YouTube notice.
- The live YouTube homepage opened All videos with only All videos/Settings navigation and no outside notice. An `example.com` tab opened All videos with the outside notice; Settings remained keyboard-reachable.
- On the restricted extension-management tab, context reading produced a visible alert, not a supported video or outside notice; All videos and Settings remained usable.
- Temporary overflow text confirmed content scrolling at a 560 px popup height while the header stayed at the same position; the text was removed immediately. No throwaway scripts or simulated bookmark data were added to the repository.
- GX's existing signed-in session was not reachable through the relay. Verification used an isolated profile without Premium and left the normal GX profile untouched.
- Removed the unused starter React/WXT SVGs and rebuilt the final distribution successfully. Removed the temporary smoke-only extension shortcut and released the automation browser sessions.

### Readability and contract refactor — 2026-10-01

- Retained the existing header, notice, and three page components, with shared navigation types owned by popup-local `types.ts`.
- Renamed popup state to `activeVideoContext`, `selectedPage`, and `hasSelectedInitialPage`; renamed refresh lifecycle values to `isDisposed`, `latestRefreshId`, `refreshId`, `detectedContext`, and `refreshTimeout`. Replaced the page-selection ternary with explicit conditionals.
- Context conditions use `status`; URL categories and message operations use `type`; operation results retain `ok`. Moved active-video request/response contracts into `models/messages.ts` and updated all consumers.
- Content-script messaging now dispatches through `handleMessage`, returns a typed result from `handleGetActiveVideo`, and performs player detection in `getActiveVideo`. Player navigation/media state remains inside the existing content lifecycle.
- Kept the popup lifecycle in App rather than extracting a hook solely to move code. Preserved polling, cleanup, latest-refresh protection, broad tab-removal invalidation, and the existing loading/navigation behavior.
- Non-browser smoke transpiled the actual source in memory, adapted browser APIs/timers and React hooks, and rendered the actual popup components through React server rendering. It covered supported initial selection, preserving Settings through refreshes, navigation before initial detection, stale reads, unmount protection, unsupported URLs, and unavailable versus failed reads.
- A separate in-memory content-script smoke covered request dispatch, real detection logic against a DOM adapter, title extraction, navigating/stale-media rejection, new-video identity, live/Shorts exclusion, and receiver cleanup.
- No browser automation was run for this refactor, as requested. These smokes do not replace manual visual/keyboard verification of the latest build. No smoke files or permanent test suite were added.
- Additional non-browser smoke covered loading-to-supported initial selection, video-ID title fallback, the intentionally unchanged broad tab-removal navigation behavior, and the `YoutubePage.type` classification contract.
- Final source checks passed: `npm run lint`, `npm run compile`, and `npm run build`. The updated production output is `.output/chrome-mv3/`; reload that extension build for manual popup verification.

### Naming and shared player ownership — 2026-10-01

Implemented; source checks and non-browser integration smoke passed. Manual browser verification was not rerun.

- Renamed popup-side context to `ActiveTabContext` in `models/active-tab.ts`, its lookup to `getActiveTabContext` in `services/active-tab.ts`, and popup state/notice props to `activeTabContext`. Kept `ActiveVideo` and `player:get-active-video` as the content-side video snapshot contract.
- Replaced `entrypoints/quick-add.content.ts` with the thin `entrypoints/youtube.content.ts` bootstrap and message dispatcher.
- `services/player-client.ts` owns one initialized player lifecycle: navigation/departing-media state, supported player detection, video snapshots, and change subscriptions. Its player-context result distinguishes an unavailable route/transition from a player awaiting readiness so quick add retains its existing retry behavior.
- `services/quick-add-client.ts` owns the control, DOM observer, retry/feedback timers, bookmark capture, and stale-save feedback protection. It and message handling consume the same player instance; no second injected script or duplicate navigation/media state was introduced.

Durable file-ownership and intent-based naming rules are recorded in [coding conventions](../../../docs/agents/coding-style.md). The shared-player architecture remains synchronized in the product scope and popup specification.

Verification:

- `npm run lint`, `npm run compile`, and `npm run build` passed. The production manifest registers exactly one YouTube content script, `content-scripts/youtube.js`; obsolete context names and source paths have no remaining runtime consumers.
- In-memory integration smoke exercised the actual YouTube entrypoint, shared player, quick-add UI, bookmark messaging adapter, background handler, storage operations, and active-tab lookup with DOM/browser/storage adapters.
- Both consumers rejected the new URL while departed media remained, then agreed on the new video after media changed. Quick add persisted floored timestamps (including zero) without pausing, preserved duplicate creation dates, reported failed writes, and succeeded after a failure.
- Replacing player controls produced one working control. A delayed save from the previous video did not produce feedback on the new control. Metadata retry, live/Shorts exclusion, and invalidation cleanup of controls/observers/timers/message listeners passed.
- Actual React components rendered through server rendering verified renamed context imports/props, supported initial selection, Settings preservation, outside notice, and popup cleanup.
- No browser automation, permanent tests, or smoke files were added. Reload the production extension and refresh open YouTube tabs for manual visual/keyboard verification.

### Nullable YouTube URL video identity — 2026-10-01

- Simplified `YoutubePage` to outside-YouTube or YouTube with an explicitly present `videoId: string | null`. YouTube pages without an eligible watch URL return null, never an omitted/undefined ID.
- Updated active-tab discovery and the shared player's watch-ID lookup. Non-null IDs still require supported-player validation; the classifier does not claim that a watch URL is playable or non-live.
- Kept hostname, standard `/watch` path, and 11-character ID validation. Shorts, embeds, `/live/` routes, mobile watch URLs, and `youtu.be` entry points remain outside standard-watch integration.
- Non-browser smoke passed 13 URL scenarios, including missing/empty/invalid IDs and unsupported routes with misleading `v` parameters. Shared entrypoint integration rejected `is-live`, `is-live-now`, `ytp-live`, and infinite-duration players, while ordinary watch playback still saved second zero. Unsupported routes removed the control and returned no active-video snapshot.
- No browser automation or permanent smoke files were added; product playback exclusions remain unchanged.
- Final `npm run lint`, `npm run compile`, and `npm run build` passed. Reload `.output/chrome-mv3/` and refresh YouTube tabs for manual verification.
- Extracted the shared `YoutubePage` contract into `models/youtube-page.ts`; the utility now imports that type and owns only URL classification. No compatibility re-export was retained. All 13 classifier smoke scenarios still passed after extraction.

### Boolean YouTube URL classification — 2026-10-01

- Replaced the URL category discriminator with `YoutubePage.isYoutube`; every result includes `videoId: string | null`, including a null ID outside YouTube. The model remains in `models/youtube-page.ts`, with no old discriminator or compatibility alias.
- Migrated active-tab discovery and shared-player lookup. Existing popup context statuses and playback eligibility are unchanged.
- Non-browser smoke passed 17 URL scenarios and shared-entrypoint integration: supported watch lookup, a zero-second save, all four live-player signals, Shorts/embed/live routes, and outside-YouTube cleanup. No browser automation or permanent smoke files were added.
- Final lint, TypeScript compilation, and production build passed. Reload `.output/chrome-mv3/` and refresh YouTube tabs for manual verification.

### Current page naming and model colocation — 2026-10-01

- Renamed the URL snapshot to `CurrentPage` and colocated its declaration in `models/active-tab.ts`. `ActiveTabContext` retains its existing shape; no nested page field or duplicated context state was added.
- Renamed the classifier to `getCurrentPage()` in `utils/current-page.ts` and migrated active-tab discovery and shared-player lookup. Removed `models/youtube-page.ts`; no old-name aliases or re-exports remain.
- Lint, TypeScript compilation, and production build passed. Non-browser smoke passed all 17 URL scenarios and the renamed consumers' supported-watch, zero-second save, live-player rejection, unsupported-route, outside-YouTube, and cleanup behavior.
- Playback eligibility and product scope are unchanged. No browser automation or permanent smoke files were added.

### Shared message registration — 2026-10-01

- Added `services/messages.ts` with `registerMessageHandlers()`. It validates the non-null object/string-type envelope, dispatches only own registered types, delivers immediate results synchronously, keeps asynchronous response channels open, and returns listener cleanup.
- Background registers bookmark creation; YouTube content registers active-video lookup and disposes its registration on context invalidation. Each context executes its own registration module; player lifecycle and quick-add initialization remain content-owned.
- Payload validation and operation failure responses remain in their handlers. Recognized invalid bookmark requests return failed results; malformed envelopes and unregistered types are ignored.
- Non-browser registration smoke covered synchronous success/failure, delayed asynchronous responses, a foreign-realm promise, malformed/unknown/prototype route names, and cleanup preserving unrelated listeners.
- Real entrypoint integration covered supported player snapshots, bookmark field validation, zero-second quick add without pausing, duplicate creation-date preservation, storage failure/recovery, live-player rejection, and invalidation removing player messaging. No browser automation or permanent smoke files were added.
- Final lint, TypeScript compilation, and production build passed after adding the explicit indexed-handler guard; the registration and real-consumer smokes also passed against that final code. Reload `.output/chrome-mv3/` and refresh YouTube tabs for manual verification.

### Accepted — 2026-10-01

- User accepted Popup setup and the accompanying model, ownership, and message-registration refactors as complete. Issue 01 remains complete; popup slices 02–04 remain open.
- Commit and push are left to the user.
