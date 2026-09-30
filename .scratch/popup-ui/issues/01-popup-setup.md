# Popup setup: minimal pages and navigation

Status: open

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
