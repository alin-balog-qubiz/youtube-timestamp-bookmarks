# YouTube Timestamp Bookmarks

A personal Chrome extension for saving and revisiting moments in YouTube videos. Built with WXT and React; implementation is not yet started.

The agreed product behavior and boundaries live in [the project scope](docs/scope.md). The first implementation slice is specified in [storage and quick add](.scratch/storage-and-quick-add/spec.md).

## Develop locally

Requires Node.js and npm. From the repository root:

```sh
npm ci
npm run dev
```

For a production build, run `npm run compile` and `npm run build`. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose **Load unpacked**, and select `.output/chrome-mv3/`. The development build lives in `.output/chrome-mv3-dev/`; reload the extension when needed.

This is a pre-release learning project. Bookmark features are not implemented yet; the current extension icon is the WXT starter icon. See [initialization](.scratch/initialize/spec.md) for setup decisions and [the icon task](.scratch/initialize/issues/01-replace-starter-icon.md) for remaining branding work. Installed third-party agent skills under `.agents/` are local-only; `skills-lock.json` records their sources.
