# Player quick-add alignment and tooltips

Status: implemented locally — user verification pending

## Request

Align the player quick-add `+` button with neighboring YouTube controls and replace its browser-native tooltip with an extension-owned tooltip that fits the player. Reuse the existing marker pill styling for both surfaces, improving readability where needed, with shared CSS constants if useful.

## Work constraints

- No commit, push, or pull request; local changes only.
- The user owns verification and explicitly requested no builds or tests until they authorize them.


## References and observed problem

The user supplied four screenshots:

1. The quick-add button is visibly misaligned with neighboring right-side YouTube controls. Its hover surface is rectangular and a browser-native tooltip appears beneath the controls.
2. YouTube's **Subtitles/closed captions** control has a dark label above the control row, including its shortcut badge.
3. Our marker tooltip shows **1:58** in a translucent rounded pill above the progress bar.
4. YouTube's seek preview shows a thumbnail and a rounded **1:45** time pill. The pill is a visual reference only; thumbnail previews and precise seeking are not requested.

The screenshots establish the reported defect. No live YouTube CSS measurements have been taken; exact alignment causes and native dimensions remain to be verified during implementation.

## Pre-change implementation evidence

- [`services/client/quick-add.ts`](../../services/client/quick-add.ts), `mount`: shadow-root host uses `inline-flex`, `height: 100%`, and `vertical-align: top`. The button uses a fixed 40 px width, full height, and a text `+` in 26 px Arial. Hover/focus paints a translucent rectangular background. These are implementation facts, not a confirmed explanation of the misalignment.
- Quick add set `title = 'Save current moment'`, producing a browser-owned tooltip rather than a styled player tooltip. The separate accessible name was already present.
- Quick-add feedback was an inline live status next to the button, displayed for 2.5 seconds. Preserve **Saved**, **Already saved**, and truthful failure feedback.
- [`services/client/player-markers.ts`](../../services/client/player-markers.ts), `mountMarkers`: marker tooltips already supported hover and visible keyboard focus. Their appearance was 12 px medium Roboto/Arial, 8 × 14 px padding, 28 px corner radius, and `rgba(0, 0, 0, 0.3)` background. Positioning was marker-specific and adjusted at timeline edges.
- The marker spec previously described 14 px text, 8 × 12 px padding, and 8 px corners, differing from the current code. It now records the approved shared-pill direction rather than requiring a return to the earlier control-label styling.

## Agreed scope

### Quick-add button alignment

- Keep the `+` control in its existing position before the other right-side player controls.
- Match the neighboring controls' visual center, effective control height, spacing, and hover treatment on the active YouTube layout, rather than merely offsetting the glyph until one screenshot looks correct.
- Preserve a usable click target, accessible name, visible keyboard focus, and disabled/pending behavior.
- Verify normal, theater, and fullscreen layouts plus player resizing and YouTube single-page navigation.

### Player tooltips

- Replace quick add's native `title` tooltip with an extension-owned **Save current moment** tooltip above the control, visible on hover and keyboard focus without shifting the control row.
- Use the existing marker-style pill for both quick add and markers, tuning contrast/readability where needed. This is one extension-owned visual family, not an exact copy of YouTube's control labels.
- Preserve marker content: formatted time and optional bookmark name separated by a space. Keep long names readable and tooltips within the player near either timeline edge.
- Preserve all save, duplicate, error, seek, and marker-visibility behavior. Do not add shortcut badges for shortcuts the extension does not provide.
- Reuse shared appearance CSS through a small constant/module if both surfaces use it. Keep control and marker positioning separate; avoid a general tooltip framework or coupling to YouTube's private tooltip machinery.

## Decision

The user selected **Shared marker-style pill**: use our existing rounded marker tooltip for both markers and the add button; improve readability where needed.

YouTube's control-label style remains a reference, not the chosen shape. No unresolved product questions remain for this scratch.

Exact CSS values are implementation details to establish from the chosen reference and live player inspection, not additional product decisions.

## Acceptance criteria

1. At rest, hover, and keyboard focus, the `+` is visually centered alongside adjacent YouTube controls without an unintended full-height rectangular hover patch.
2. Hovering or focusing quick add shows **Save current moment** above the control. No duplicate browser-native tooltip appears; tooltip display does not change button spacing.
3. Quick-add and marker tooltips follow the approved visual direction, with readable text over bright and dark video content and no interception of normal player input.
4. Named and unnamed markers retain correct text, hover/focus visibility, edge handling, and click/keyboard seeking.
5. Saving still gives correct saved/duplicate/failure feedback and does not pause playback. Feedback does not disturb the intended control alignment.
6. Normal, theater, fullscreen, resizing, and watch-to-watch navigation preserve positioning and do not duplicate controls or leave stale tooltips.

## Verification and documentation boundary

Implementation is local. The user confirmed the button looks good but reported that its tooltip is missing. A clipping fix has been applied; tooltip visibility and the remaining scenarios still await user verification. No builds, tests, browser inspection, or runtime smoke checks were run by the assistant, as requested.

When verification is authorized, inspect the actual YouTube control row and computed styles, then exercise the extension on a real watch page. Check alignment, hover/focus, marker edge cases, save feedback, and player modes. An isolated DOM fixture cannot establish visual parity with YouTube.

The [product scope](../../docs/scope.md), [quick-add spec](../storage-and-quick-add/spec.md), and [marker spec](../player-markers/spec.md) record the shared-pill implementation and pending user verification. Storage, popup styling, new shortcuts, thumbnail previews, and unsupported playback contexts remain outside this effort.

## Implementation notes

- Quick add's shadow host now uses YouTube's `ytp-button` styling hook for control sizing and alignment instead of an independently sized 40 px control. The inner button fills that host and centers a 24 px outline SVG plus rather than a font glyph.
- The button retains its accessible name and pending-state behavior. The user's subsequent local removal of the custom hover background is preserved; this follow-up does not change the approved button appearance.
- Removed the native `title`; hover and keyboard focus reveal an extension-owned **Save current moment** pill above the button.
- `ui/styles/player-tooltip.ts` owns shared appearance declarations as a TypeScript CSS string consumed by both shadow roots. Both tooltip surfaces retain 12 px medium text, 8 × 14 px padding, and 28 px corners; black background opacity increases from 0.3 to 0.65 for contrast over bright video content. Position and visibility remain with each feature. No styling framework or service-layer re-export is introduced.
- Save/duplicate/error feedback uses the same absolute-positioned pill and temporarily takes precedence over the hover label. Its 2.5-second lifetime and live-region semantics remain; it no longer occupies space in the control row.
- Save requests, duplicate detection, seeking, marker label formatting, edge positioning, subscriptions, and cleanup remain unchanged. Existing local marker-label changes were preserved.
- Native `ytp-button` geometry is an intentional YouTube CSS dependency. The user confirmed the button looks good in their screenshot; other player modes remain unverified.

## Tooltip follow-up

- Report: button appearance is good, but the quick-add tooltip does not appear.
- [INFERENCE] YouTube's page-level button rules can override the normal shadow-host `overflow: visible` declaration and clip the absolutely positioned tooltip and feedback.
- Change: use `overflow: visible !important` on the shadow host so its overflow rule wins across the shadow boundary. Keep native geometry, existing hover/focus selectors, and save feedback behavior unchanged.
- Verification remains user-owned. This patch has not been runtime-verified; no build, test, or commit was performed.
