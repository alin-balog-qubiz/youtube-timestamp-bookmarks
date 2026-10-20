<div align="center">
  <img src="public/icon/128.png" alt="YouTube Bookmarks icon" width="96" height="96" />

  # YouTube Bookmarks

  Save the moments worth coming back to.
</div>

YouTube Bookmarks is a Chrome extension for saving and revisiting timestamps in YouTube videos. Add a bookmark from the player without pausing, find it again from the extension popup, and back up your saved videos as JSON.

## What you can do

- **Save in one click.** On a standard YouTube watch page, use the **+** player control to save the current second. Playback continues; repeated saves of the same second are ignored.
- **Jump from the timeline.** Colored markers show saved moments. Focus or hover to see a timestamp and optional name, then select a marker to seek.
- **Browse and manage bookmarks.** Open **This video** for the current video or **All videos** to search saved titles, open timestamps, edit or delete bookmarks, and remove a video's saved data.
- **Choose your look.** Select Light, Dark, or System appearance; show or hide timeline markers; choose a default marker color and optional per-bookmark colors.
- **Back up your library.** Import and export readable JSON containing videos and bookmarks, without transferring appearance or other settings.

Bookmarks and preferences are stored locally in the extension. There is no account or cross-device sync. Playback integration supports standard YouTube watch pages; Shorts, live streams, embeds, and `youtu.be` pages are not supported.

## Install from source

Requires Node.js and npm.

1. Clone this repository and open its directory.
2. Install dependencies and build the extension:

   ```sh
   npm ci
   npm run build
   ```

3. In Chrome, open `chrome://extensions` and enable **Developer mode**.
4. Choose **Load unpacked** and select `.output/chrome-mv3/`.

To run the WXT development server instead, use `npm run dev`. After changing YouTube content scripts, reload the extension and refresh open YouTube tabs.

## Back up and restore

In the popup's **Settings**, choose **Export JSON** to select videos and download their bookmarks, or **Import JSON** to review a file before applying it. Transfers include bookmark timestamps, names, creation dates, video titles, and explicit color overrides. They never include theme, marker visibility, or the default marker color.

- **Merge** adds missing videos and timestamps. Existing video titles and bookmark data take precedence.
- **Replace library** replaces the entire saved library with the accepted videos you selected. Videos not in that selection are removed.

> [!WARNING]
> Replace library affects the entire library, not just matching videos. Review the selected videos and removal totals before confirming.

Files use the `youtube-timestamp-bookmarks` format with `schemaVersion: 1`. Unsupported schemas and legacy development backups are rejected.

## Development commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the WXT development server |
| `npm run build` | Build the Chrome extension |
| `npm run compile` | Run TypeScript checks |
| `npm run lint` | Run ESLint |
| `npm run zip` | Build and package the extension |

The extension is built with [WXT](https://wxt.dev/) and [React](https://react.dev/).
