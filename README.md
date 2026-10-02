# YouTube Timestamp Bookmarks

A personal Chrome extension for saving and revisiting moments in YouTube videos. Built with WXT and React. Player quick add, This video management, All videos browsing, and Settings with JSON backup/restore are implemented. Settings is complete following user review; All videos is awaiting user verification. Timeline-marker rendering remains planned.

The agreed product behavior and boundaries live in [the project scope](docs/scope.md).

## Approved design-system plan

The [YouTube Bookmarks design-system scratch](.scratch/design-system/spec.md) defines the approved replacement UI; implementation has not started. It contains [issue 1: create components and a development inspection page](.scratch/design-system/issues/01-create-components.md) and [issue 2: adopt them throughout the popup and remove the temporary link](.scratch/design-system/issues/02-use-components-in-app.md), plus an [archived interactive reference](.scratch/design-system/reference/index.html). The usage below describes the currently implemented POC, not the planned cutover. Quick add remains unchanged.

## Save a moment

On a standard YouTube watch page, click the **+** control in the player toolbar. The current whole-second position is saved locally without interrupting playback. **Saved** confirms a new bookmark; **Already saved** means that video's second was previously saved. Bookmarks remain in extension storage after reload. Timeline markers are not available yet.

## Popup navigation

Open the extension from the browser toolbar. A supported standard YouTube watch page opens **This video**, even without bookmarks; other pages open **All videos**. The persistent header keeps **All videos** and **Settings** reachable and offers **This video** only while the active player is supported. Outside YouTube, a notice leaves navigation available. Context-read failures show an error rather than a supported-video shortcut.

This video lists saved moments chronologically. Click a timestamp to seek; use its Actions menu to edit, copy a timestamped link, or confirm deletion. The editor saves name, a native-picker color/default inheritance, and timestamp together; −5/−1/+1/+5-second buttons adjust a draft within the active player's duration. Use default removes a custom color override. Cancel discards the draft, and collisions or failed saves retain it. Delete all bookmarks confirms the video identity and count.

All videos lists saved titles and counts, expands into chronological moments, and filters by partial video title. Titles open a watch page; timestamps seek the active video or open that moment in a new tab. Its only management action is confirmed deletion of all bookmarks for a selected video. The compact popup follows the system light/dark theme.

## Settings and backups

Settings saves marker visibility and default color immediately, reporting persistence failures. Default-color changes affect only bookmarks without a custom override. Visibility does not disable quick add or browsing; timeline-marker rendering remains a separate planned feature.

**Export JSON backup** downloads the entire library and settings, independent of the active video or title filter. To restore, choose a backup file, select **Merge** or **Replace**, inspect the preview, and confirm. Merge adds new video/second identities while keeping existing bookmarks and current settings. Replace overwrites all bookmarks and settings, including when importing an empty library, and requires destructive acknowledgement. Cancel and invalid files leave data unchanged. If the library changes after preview, generate a new preview before confirming.

The versioned format is documented in the [popup specification](.scratch/popup-ui/spec.md#backup-format-and-persistence). See the [Settings issue](.scratch/popup-ui/issues/04-settings-page.md#implementation-and-verification) for implementation and smoke evidence.

## Develop locally

Requires Node.js and npm. From the repository root:

```sh
npm ci
npm run dev
```

For a production build, run `npm run compile` and `npm run build`. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3/`. The development build lives in `.output/chrome-mv3-dev/`; reload the extension when needed.

After content-script changes, reload the extension and refresh open YouTube tabs so they use the latest injected code. This also applies when a content entrypoint is renamed.

Run `npm test` for backup validation, persistence, precedence, and concurrency regressions; run `npm run lint` to check source code. The ESLint configuration excludes generated WXT/build output and local agent/scratch directories. ESLint and `@eslint/js` stay on matching 9.x versions for compatibility with the React lint plugin; `jiti` loads the TypeScript config and regression service modules.

This is a pre-release learning project. The current extension icon is still a WXT starter asset; the popup starter UI has been replaced. See [initialization](.scratch/initialize/spec.md) for setup decisions and [the icon task](.scratch/initialize/issues/01-replace-starter-icon.md) for remaining branding work. Installed third-party agent skills under `.agents/` are local-only; `skills-lock.json` records their sources.
