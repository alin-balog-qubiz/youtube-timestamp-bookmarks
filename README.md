# YouTube Bookmarks

A personal Chrome extension for saving and revisiting moments in YouTube videos. Built with WXT and React. Player quick add, popup management/browsing, persisted appearance/color preferences, and compatible JSON backup/restore are implemented. The user has approved the design-system implementation; detailed exercised evidence and remaining behavioral verification are recorded in issue 2. Timeline-marker rendering remains planned.

The agreed product behavior and boundaries live in [the project scope](docs/scope.md).

## Design-system components

The [YouTube Bookmarks design system](.scratch/design-system/spec.md) supplies the actual popup. Each component lives in its own `ui/components/*.tsx` file; CSS lives in `ui/styles/`, and supporting TypeScript lives in `ui/utils/`. Public exports stay in `ui/index.ts`; consumers import from `@/ui` and render inside the shared `ThemeProvider`. Components receive state/callbacks and do not access extension services. Domain appearance choices live in `models/appearance.ts`; popup controllers and background operations retain their existing responsibilities. [Issue 2](.scratch/design-system/issues/02-use-components-in-app.md) records the cutover and verification handoff. Quick add remains unchanged.

Shared icons use the official [Tabler React library](https://docs.tabler.io/icons/libraries/react), outline variants only, through `ui/components/Icon.tsx`. Icons supplement action labels; compact video-group counts retain full accessible text.

## Save a moment

On a standard YouTube watch page, click the **+** control in the player toolbar. The current whole-second position is saved locally without interrupting playback. **Saved** confirms a new bookmark; **Already saved** means that video's second was previously saved. Bookmarks remain in extension storage after reload. Timeline markers are not available yet.

## Popup navigation

Open the extension from the browser toolbar. A supported standard YouTube watch page opens **This video**, even without bookmarks; other pages open **All videos**. The persistent header keeps **All videos** and **Settings** reachable and offers **This video** only while the active player is supported. Outside YouTube, navigation remains available without an informational banner. If the tab context cannot be read, a concise notice offers a **YouTube** link opening in a new tab.

This video lists saved moments chronologically, displaying **Unnamed bookmark** when no name is saved. Click a timestamp to seek; use its Actions menu to edit, copy a timestamped link, or confirm deletion. The editor saves name, color choice/default inheritance, and timestamp together; −5/−1/+1/+5-second buttons adjust a draft within the active player's duration. Use default removes any color override. Cancel discards the draft, and collisions or failed saves retain it. Video-level deletion is available only in All videos.

All videos lists saved titles and counts and filters by partial video title only. Each group header expands its chronological moments independently; **Go to video** opens the watch page, while timestamps seek the active video or open that moment in a new tab. **Delete video** confirms the saved-data identity and count and does not affect the YouTube source. The popup requests 560 × 600 px to respect Chromium's toolbar-popup height limit, with persistent navigation and a primary content scroller.

## Settings and backups

Settings groups **Appearance**, **Playback**, and **Backup**. Light/Dark/System, marker visibility, and default color persist immediately through the background boundary; failures do not claim success. Accent/Gray/Ink follow the selected theme, while Custom retains a fixed native-picker hex color. Default-color changes affect only bookmarks without an override. Existing saved hex colors migrate to Custom without changing their values or bookmark metadata. Missing theme means System; fresh installations default to Accent. Visibility does not disable quick add or browsing; timeline-marker rendering remains separate.

**Export JSON backup** downloads the entire library and settings, independent of the active video or title filter. To restore, choose a backup file, select **Merge** or **Replace**, inspect the preview, and confirm. Merge adds new video/second identities while keeping existing bookmarks and current settings. Replace overwrites all bookmarks and settings, including when importing an empty library, and requires destructive acknowledgement. Cancel and invalid files leave data unchanged. If the library changes after preview, generate a new preview before confirming.

Exports use backup version 2, including theme and semantic color choices under the unchanged `youtube-timestamp-bookmarks` identifier. Strict version-1 imports remain supported: their hex colors become Custom and Replace selects System. The complete schema and operation/regression contracts are documented in the [popup specification](.scratch/popup-ui/spec.md#backup-format-and-persistence).

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
