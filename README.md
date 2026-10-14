# YouTube Bookmarks

A personal Chrome extension for saving and revisiting moments in YouTube videos. Built with WXT and React. Player quick add and timeline markers, popup management/browsing, persisted appearance/color preferences, and schema-1 JSON video/bookmark transfers are implemented locally. The import/export rewrite has not been runtime-verified; no tests, builds, or commits were run for it. The user has approved the design-system implementation; detailed exercised evidence and remaining behavioral verification are recorded in issue 2. [Player-marker verification](.scratch/player-markers/issues/01-implement-player-markers.md) records local checks and the user-owned YouTube smoke test.

The agreed product behavior and boundaries live in [the project scope](docs/scope.md).

## Design-system components

The [YouTube Bookmarks design system](.scratch/design-system/spec.md) supplies the actual popup. Each component lives in its own `ui/components/*.tsx` file; CSS lives in `ui/styles/`, and supporting TypeScript lives in `ui/utils/`. Public exports stay in `ui/index.ts`; consumers import from `@/ui` and render inside the shared `ThemeProvider`. Components receive state/callbacks and do not access extension services. Domain appearance choices live in `models/appearance.ts`; popup controllers and background operations retain their existing responsibilities. [Issue 2](.scratch/design-system/issues/02-use-components-in-app.md) records the cutover and verification handoff. Quick add remains unchanged.

Shared icons use the official [Tabler React library](https://docs.tabler.io/icons/libraries/react), outline variants only, through `ui/components/Icon.tsx`. Icons supplement action labels; compact video-group counts retain full accessible text.

## Save a moment

On a standard YouTube watch page, click the **+** control in the player toolbar. The current whole-second position is saved locally without interrupting playback. **Saved** confirms a new bookmark; **Already saved** means that video's second was previously saved. Bookmarks remain in extension storage after reload.

Saved moments appear as small colored markers centered on the progress bar once the player has a usable duration. Hover or focus a marker to see its timestamp and optional name, separated by a space, in a rounded translucent dark tooltip styled like YouTube's controls tooltips; click it or press Enter/Space to seek within the current video. Ordinary timeline input stays available outside markers. Markers update from persisted bookmark/settings changes, follow the selected appearance and color inheritance, and stay aligned as the player resizes. Out-of-range timestamps remain stored but are not rendered; overlapping markers remain individually selectable through the popup.

## Popup navigation

Open the extension from the browser toolbar. A supported standard YouTube watch page opens **This video**, even without bookmarks; other pages open **All videos**. The persistent header keeps **All videos** and **Settings** reachable and offers **This video** only while the active player is supported. Outside YouTube, navigation remains available without an informational banner. If the tab context cannot be read, a concise notice offers a **YouTube** link opening in a new tab.

This video lists saved moments chronologically, displaying **Unnamed bookmark** when no name is saved. Click a timestamp to seek; use its Actions menu to edit, copy a timestamped link, or confirm deletion. The editor saves name, color choice/default inheritance, and timestamp together; −5/−1/+1/+5-second buttons adjust a draft within the active player's duration. Use default removes any color override. Cancel discards the draft, and collisions or failed saves retain it. Video-level deletion is available only in All videos.

All videos lists saved titles and counts and filters by partial video title only. Each group header expands its chronological moments independently; **Go to video** opens the watch page, while timestamps seek the active video or open that moment in a new tab. **Delete video** confirms the saved-data identity and count and does not affect the YouTube source. The popup requests 560 × 600 px to respect Chromium's toolbar-popup height limit, with persistent navigation and a primary content scroller.

## Settings and backups

Settings groups **Appearance**, **Playback**, and **Backup**. Light/Dark/System, marker visibility, and default color persist through the background boundary; failures do not claim success. Accent/Gray/Ink follow the selected theme, while Custom retains a fixed native-picker hex color. Default-color changes affect only bookmarks without an override. Fresh installations default to Accent/System. Visibility hides/restores player markers without disabling quick add or browsing. Continuous Custom input persists quietly after a pause, with feedback on native commit; transfers do not flush or replace preferences.

**Export JSON** opens a video-selection dialog, initially selecting every available video. Select individual videos or use Select all; title-only search hides rows without changing selection, including hidden rows. Review selected video/bookmark totals and an optional filename, then choose **Export** once. Blank filenames use local time: `youtube-bookmarks-YYYY-MM-DD-HHmmss.json`; supplied names are made safe with one `.json` extension. Only selected videos and bookmarks are downloaded, never preferences. If selected data changes before export, review refreshes and requires another action. Completion is reported only after the browser confirms the download.

**Import JSON** validates the file without writing, then shows accepted videos, selection, **Merge / Replace**, and inspectable omissions, duplicates, and conflicts. Merge adds missing video/second identities while keeping existing titles and bookmark metadata; identical duplicates and differing-field conflicts are separate, and **Nothing new to import** disables a no-op. **Replace library** installs only the accepted selected subset as the entire library, deleting every absent/deselected record while leaving preferences unchanged. One final destructive action commits the reviewed replacement; empty/all-invalid files or empty selections cannot clear the library. Relevant library changes refresh the review before commit. Persistence errors retain the review, and completion keeps skip/conflict details inspectable.

Files declare `format: "youtube-timestamp-bookmarks"`, `schemaVersion: 1`, producer `appVersion`, and videos with bookmark arrays. Explicit preset/Custom overrides and their spelling are preserved; omitted colors inherit the destination default. Known-schema invalid records are skipped with file locations and reasons; every repeated video ID or timestamp is skipped rather than selecting a winner. Broken/unsupported envelopes and development backups using `version` or settings are rejected. Legacy storage/color migrations have been removed; development data has no preservation guarantee, but this implementation does not reset extension storage.

The [rewrite spec](.scratch/import-export-rewrite/spec.md) owns the full transfer and versioning contract. `package.json` remains the app-version source; exports read generated manifest metadata rather than a separately maintained version constant. Package and lockfile remain at `0.0.0` until the required launch verification authorizes `1.0.0`. No build or packaged-artifact verification was performed for this local implementation. File-schema compatibility is independent of producer app-version ordering.

## Service navigation

- `services/background/`: bookmark/settings handler registration, called explicitly by the background entrypoint.
- `services/client/`: the shared YouTube player lifecycle, player message handlers, quick add, and player markers.
- `services/popup/`: active-tab discovery, bookmark/player navigation, and export filename/download resource ownership.
- `services/storage/`: bookmarks and mutation queues, preferences, and backup validation/import/export.
- `services/messaging/`: context-local message registration and bookmark/settings requests to the background.

External callers use the background/client/popup scoped barrels; storage and messaging use direct leaf imports. Internal siblings stay direct. Folder names describe ownership, not an execution switch: popup reads remain direct, while writes and backup coordination remain background-owned through request adapters. See [coding conventions](docs/agents/coding-style.md#service-imports) for import and type ownership.

## Develop locally

Requires Node.js and npm. From the repository root:

```sh
npm ci --include=optional
npm run dev
```

For a production build, run `npm run compile` and `npm run build`. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3/`. The development build lives in `.output/chrome-mv3-dev/`; reload the extension when needed.

Build tooling requires platform-specific optional native packages (including Lightning CSS). Keep them enabled and retain the committed lockfile. On Windows, stop running development/build processes before reinstalling dependencies to avoid locked `.node` binaries. A missing Lightning CSS native-binding error is an installation problem, not invalid popup CSS; reinstall with `npm ci --include=optional` rather than disabling CSS minification.

### Inspect the popup

Use the actual extension popup to inspect shared components and their Light/Dark/System appearance. The temporary components gallery, its fixtures, and its entrypoint have been removed after popup adoption; there is no `components.html` page in development or production. Earlier gallery evidence remains recorded in issue 1.

After content-script changes, reload the extension and refresh open YouTube tabs so they use the latest injected code. This also applies when a content entrypoint is renamed.

Run `npm run compile` and `npm run lint` for source checks; `npm run zip` builds and packages the production extension. No test command is currently configured. ESLint excludes generated WXT/build output and local agent/scratch directories. ESLint and `@eslint/js` stay on matching 9.x versions for compatibility with the React lint plugin; `jiti` loads the TypeScript configuration.

This is a pre-release learning project. The current extension icon is still a WXT starter asset; the popup starter UI has been replaced. See [initialization](.scratch/initialize/spec.md) for setup decisions and [the icon task](.scratch/initialize/issues/01-replace-starter-icon.md) for remaining branding work. Installed third-party agent skills under `.agents/` are local-only; `skills-lock.json` records their sources.
