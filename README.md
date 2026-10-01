# YouTube Timestamp Bookmarks

A personal Chrome extension for saving and revisiting moments in YouTube videos. Built with WXT and React. Player quick add and This video bookmark management are implemented; the latter is awaiting user review and verification. All videos browsing and Settings operations are not implemented yet.

The agreed product behavior and boundaries live in [the project scope](docs/scope.md).

## Save a moment

On a standard YouTube watch page, click the **+** control in the player toolbar. The current whole-second position is saved locally without interrupting playback. **Saved** confirms a new bookmark; **Already saved** means that video's second was previously saved. Bookmarks remain in extension storage after reload. Timeline markers and backup tools are not available yet.

## Popup navigation

Open the extension from the browser toolbar. A supported standard YouTube watch page opens **This video**, even without bookmarks; other pages open **All videos**. The persistent header keeps **All videos** and **Settings** reachable and offers **This video** only while the active player is supported. Outside YouTube, a notice leaves navigation available. Context-read failures show an error rather than a supported-video shortcut.

This video lists saved moments chronologically. Click a timestamp to seek; use its Actions menu to edit, copy a timestamped link, or confirm deletion. The editor saves name, a native-picker color/default inheritance, and timestamp together; −5/−1/+1/+5-second buttons adjust a draft within the active player's duration. Use default removes a custom color override. Cancel discards the draft, and collisions or failed saves retain it. Delete all bookmarks confirms the video identity and count. All videos and Settings remain page shells. The compact popup follows the system light/dark theme. See [This video](.scratch/popup-ui/issues/02-this-video-page.md) for implementation and review status.

## Develop locally

Requires Node.js and npm. From the repository root:

```sh
npm ci
npm run dev
```

For a production build, run `npm run compile` and `npm run build`. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3/`. The development build lives in `.output/chrome-mv3-dev/`; reload the extension when needed.

After content-script changes, reload the extension and refresh open YouTube tabs so they use the latest injected code. This also applies when a content entrypoint is renamed.

Run `npm run lint` to check source code. The ESLint configuration excludes generated WXT/build output and local agent/scratch directories. ESLint and `@eslint/js` stay on matching 9.x versions for compatibility with the React lint plugin; `jiti` loads the TypeScript config.

This is a pre-release learning project. The current extension icon is still a WXT starter asset; the popup starter UI has been replaced. See [initialization](.scratch/initialize/spec.md) for setup decisions and [the icon task](.scratch/initialize/issues/01-replace-starter-icon.md) for remaining branding work. Installed third-party agent skills under `.agents/` are local-only; `skills-lock.json` records their sources.
