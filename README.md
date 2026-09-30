# YouTube Timestamp Bookmarks

A personal Chrome extension for saving and revisiting moments in YouTube videos. Built with WXT and React. The first slice saves moments from the player; browsing and editing are not implemented yet.

The agreed product behavior and boundaries live in [the project scope](docs/scope.md).

## Save a moment

On a standard YouTube watch page, click the **+** control in the player toolbar. The current whole-second position is saved locally without interrupting playback. **Saved** confirms a new bookmark; **Already saved** means that video's second was previously saved. Bookmarks remain in extension storage after reload. The popup, timeline markers, and backup tools are not available yet.

## Develop locally

Requires Node.js and npm. From the repository root:

```sh
npm ci
npm run dev
```

For a production build, run `npm run compile` and `npm run build`. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3/`. The development build lives in `.output/chrome-mv3-dev/`; reload the extension when needed.

Run `npm run lint` to check source code. The ESLint configuration excludes generated WXT/build output and local agent/scratch directories. ESLint and `@eslint/js` stay on matching 9.x versions for compatibility with the React lint plugin; `jiti` loads the TypeScript config.

This is a pre-release learning project. The current extension icon and popup are WXT starter assets. See [initialization](.scratch/initialize/spec.md) for setup decisions and [the icon task](.scratch/initialize/issues/01-replace-starter-icon.md) for remaining branding work. Installed third-party agent skills under `.agents/` are local-only; `skills-lock.json` records their sources.
