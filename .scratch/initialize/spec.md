# Initialize the project

Status: complete

## Goal

Make this WXT + React starter a reproducible, publicly hosted starting point for [YouTube Timestamp Bookmarks](../../docs/scope.md), before implementing bookmark features. Keep project work in the existing local-Markdown issue tracker even after adding a GitHub remote.

## Deliverables

- Initialize Git on `main`; create and push the initial commit to the public GitHub repository `alin-balog-qubiz/youtube-timestamp-bookmarks`.
- Rename the npm package to `youtube-timestamp-bookmarks` in the manifest and lockfile. Set the Chrome extension's displayed name to **YouTube Timestamp Bookmarks** and description to **Save and revisit moments in YouTube videos.** Keep version `0.0.0` during pre-release.
- Add an MIT license with `Copyright (c) 2026 Alin Balog` and concise README instructions to install dependencies, run the development build, compile, build Chrome, and load the unpacked extension.
- Keep npm, WXT, React, and their current dependency set. Do not add shadcn/ui, a test runner, or a linter yet; introduce UI dependencies with the popup feature that needs them.
- Commit `skills-lock.json`, but exclude the downloaded third-party `.agents/` tree from the public commit pending a redistribution review. Existing `.scratch/` specs and issues remain tracked.
- Retain the starter icon temporarily and record its replacement as an explicit deferred branding issue under this feature.

## Acceptance

1. The package name, lockfile name, and generated Chrome manifest name/description agree with the chosen project identity.
2. `npm run compile` and `npm run build` complete successfully with the current dependency set.
3. The README tells a fresh-clone contributor how to install and locally load the Chrome extension; the MIT license is present.
4. The GitHub repository is public on `main`, the initial commit is pushed, and neither `.agents/` nor generated output or `node_modules/` appears in the commit; `.scratch/` and `skills-lock.json` do.
5. The starter icon's replacement remains a separately trackable task, not a claim that branding is complete.

## Boundary

This is environment and identity setup only: no bookmark storage, player button, popup redesign, or additional dependencies. Product behavior is governed by `docs/scope.md`; the first feature is [storage and quick add](../storage-and-quick-add/spec.md).
