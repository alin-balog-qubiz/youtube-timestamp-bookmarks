# YouTube Timestamp Bookmarks — product scope

## Purpose

A personal Chrome extension for quickly saving moments in YouTube videos and returning to them. This is an open-source learning project maintained by its author and coding agents. The first version favors a small, usable workflow over a general bookmarking platform.

## First-version use cases

1. On a standard `youtube.com/watch` page, click a small `+` button among the player controls to save the current whole-second position instantly, without pausing or prompting. Brief feedback near the button says **Saved** or **Already saved**. The same video and second identify one bookmark; saving it again leaves the existing bookmark unchanged.
2. See saved moments as clickable colored markers on that video's progress bar. Hovering reveals time and optional name; clicking seeks within the player without taking over normal progress-bar controls. Nearby markers may overlap; the popup list remains the reliable way to select them.
3. Open the extension popup to browse saved videos and timestamps. On a watch page, start in that video's view; on other YouTube pages or outside YouTube, start on Home. Outside YouTube, show a notice but keep browsing and Settings available. Home shows each saved video's title and bookmark count; fall back to video ID if the title is unavailable. Visiting a video may refresh its stored title.
4. In a video's popup view, see timestamps with their formatted time, optional name, and color. Edit the optional name and color; copy a timestamped YouTube URL; delete one bookmark or delete all for that video. Confirm bulk deletion with the video and bookmark count. A video with no bookmarks disappears from Home. Clicking a timestamp for the active video seeks in that tab; clicking one for a different video opens a new tab at that time. Home remains reachable from any video view.
5. In Settings, show/hide player markers without disabling quick add or popup browsing. Choose a global default marker color from a small accessible preset palette; each bookmark may override it or return to **Use default**. Changing the global default affects bookmarks without an override.
6. Export a readable JSON backup containing all bookmarks and settings. Import offers **Merge** (add non-duplicates, keep existing bookmarks and current settings) or **Replace** (replace bookmarks and settings). Show the effect before importing; reject invalid files without changing stored data.
7. Open a separate, extension-owned Guide page in a browser tab from the popup. Use short text steps for quick add, markers/colors, popup management, and JSON backup/restore. Empty states say nothing is saved yet, point to the player `+` button on a watch page or to YouTube elsewhere, and link to Guide.

## Bookmark information

A bookmark belongs to a YouTube video ID and a whole-second position. It has an optional name, an optional color override, and a creation date; the video also has a stored title for display. Unnamed bookmarks display their formatted time. The storage contract and precise field shapes belong in the relevant implementation spec and code, not in this document.

## Interface expectations

Use actual shadcn/ui components where helpful in a compact, scrollable popup (roughly 380–420 px wide): restrained layout, system light/dark theme, video title/count on Home, and time/name/color on video rows. Put edit/copy/delete actions in clearly labeled row menus. Keep Home and Settings reachable from a persistent header and provide Back from a video view. The player control should fit YouTube, have an accessible label and tooltip, and not cover the video; feedback stays beside it. The Guide is a separate page, not a popup view.

## Boundaries and later ideas

First-version playback integration covers standard YouTube watch pages. Shorts, live streams, embeds, and `youtu.be` entry points are outside that integration. Use local extension storage via `wxt/utils/storage`; no account or cross-device sync. No search, tags, playlists, thumbnail previews, keyboard shortcuts, manual theme toggle, free-form color picker, timestamp precision mode, undo, or popup quick-add action. These are possible later ideas, not commitments.

## Project architecture

- Separate domain models, bookmark/storage logic, host-website messaging adapters, and thin WXT entrypoints. Popup, player markers, and backup features must use the same persisted model rather than creating independent stores.
- Store each video and its bookmarks together as one authoritative video record. Derive video lists and bookmark counts from those records rather than maintaining separate indexes or counts.
- Route bookmark mutations through the background worker. Serialize mutations for the same video so concurrent read-modify-write operations cannot overwrite each other's changes; a failed operation must not block subsequent ones.
- Use typed request/response messages with explicit success or failure results. Request validation returns a failure value; storage failures must also become failure responses, not successful feedback.
- Follow [coding conventions](agents/coding-style.md) for operation names, file ordering, helper placement, and execution-context terminology. Exact TypeScript fields, storage-key versions, and private implementation names belong in code.

## Documentation maintenance

This file is the project-intent source of truth for approved behavior, boundaries, and architecture. Feature specs in `.scratch/<feature>/spec.md` elaborate that intent; they do not override it. The first is [storage and quick add](../.scratch/storage-and-quick-add/spec.md). Update this scope and affected specs together when agreed behavior or architecture changes. Handoffs record implementation state and verification evidence, not additional project requirements. Keep the user-facing Guide synchronized with UI changes once it exists. ADRs may record rationale for decisions stated here, and `CONTEXT.md` may hold stable domain vocabulary; create them only when useful. Keep unresolved ideas here until they are concrete enough for a spec. The README covers setup and usage, not the detailed project contract.
