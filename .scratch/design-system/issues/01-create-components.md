# Create design-system components and inspection page

Status: implemented; awaiting user verification
Type: task

## Goal

Implement the complete component inventory and visual foundations in the [design-system spec](../spec.md), with an interactive development-only components page. This issue creates reusable UI; it does not migrate the POC's real pages or change their persisted operations.

## Read first

- [Design-system spec](../spec.md): authoritative tokens, typography, geometry, inventory, gallery lifecycle, and exceptions.
- [Archived prototype](../reference/index.html): final visual appearance; inspect computed styles rather than copying overridden CSS.
- [Product scope](../../../docs/scope.md) and [coding conventions](../../../docs/agents/coding-style.md).

## Implementation

1. Establish one reusable extension-UI component/style owner, consumable by both popup and gallery. Implement native React TSX components without Radix UI, each component in its own file with barrel exports and reference-specific styling; native color selection remains native. Keep WXT entrypoints thin. Avoid duplicating components inside the gallery or letting primitives query browser/storage services.
2. Implement semantic light/dark tokens, separate danger treatment, exact installed-font stack, readable sizes, tabular time, elevation, motion and focus treatment. Replace all white palette tokens with `#F5F5F5`. Preserve raised/recessed/flat distinctions in both themes.
3. Implement every primitive, feedback component, and app composition in the inventory. Controlled props/callbacks own selection/drafts/actions; actual pending/disabled/error state prevents inappropriate activation. Use one theme provider with System default and OS-change subscription/cleanup; gallery preview selections are transient, not persisted production preferences.
4. Add the shared theme-aware color-choice resolver and selection UI. Demonstrate preset/custom/default-inherited values without migrating production data. Use the spec's canonical choice contract so issue 2 does not invent a competing representation.
5. Create a standalone extension-owned `components.html` development entrypoint. Render a foundation section, named component examples, all applicable states, and a 560 px-wide/up-to-700 px popup preview bounded by available space. Reuse the same components, not copied markup that merely resembles them.
6. Make the examples actually interactive using isolated, labeled gallery fixtures: navigation, search/clear, switches, theme/radio/color choices, multiple expanded groups, menus, dialogs, editor Save/Cancel, import mode/confirmation, toast and error/retry demonstrations. Reset restores examples. These sample operations must not touch the user's library or persisted settings.
7. Add a temporary development-only **Components** link to the existing popup. Open the actual extension page in a new browser tab; keep existing popup navigation and behavior unchanged. Keep the link styling local so it does not require premature app adoption.
8. Gate the gallery entrypoint, its fixture imports, and link from production builds. Do not merely hide the page/link using CSS. Add developer documentation describing the temporary link and direct development URL so issue 2 can remove the link while retaining usable tooling.

## Acceptance and smoke evidence

- [x] Inventory coverage: every row has a named rendered example; isolated fixtures exercise navigation, input, choices, feedback and compositions.
- [x] Opened the gallery through the temporary popup link in a real development extension; separate extension tab and resolving URL.
- [x] Captured light/dark popup, rows, settings, editor, import and confirmation evidence. Screenshots below precede the final user-requested visual refinements unless marked refined.
- [x] System followed browser-emulated OS changes; explicit Light/Dark stayed fixed. Production storage remained unchanged during gallery color/visibility/Replace operations.
- [x] Exercised tabs/segmented/radio keyboard choices, switch Space, independent groups, menu arrows/Escape/restore, focus tooltip, dialog focus wrapping and dismissal.
- [x] Exercised fixture Save/Cancel, timestamp boundaries/unknown duration, Custom input events/Use default, import mode/acknowledgement/pending, and failed deletion/retry. Native OS color-picker dialog is **not verified**.
- [x] Inspected long/unnamed/many rows, 360 px preview, bottom menu and a 505 px viewport dialog. Content scrolled, footer remained visible, and reduced-motion removed transitions.
- [x] Measured text/control contrast; documented stronger muted/focus/control tokens. Actual platform rendering used installed Bahnschrift; no remote font resources.
- [x] Built and inspected production output and ZIP: no gallery/fixtures/temporary link/link CSS. Existing popup All videos/Settings navigation rechecked.
- [x] Final `npm run compile`, `npm run lint`, and `npm run zip` passed. README/spec/scope updated; no throwaway scripts retained in the repository.

## Non-goals

No real-page migration, production theme persistence, backup schema change, data migration, quick-add restyling, player markers, Guide, or Welcome. Compositions must be complete and interactive in the gallery; production service wiring belongs to issue 2, not placeholder production controls.

## Comments

### Approval — 2026-10-02

User confirmed the full design contract after grilling, including off-white, installed-font stack, 560 px width, development-only gallery, and shadcn/ui foundation. Native browser popup height may be capped; the preview must not be presented as proof of native 700 px sizing.

### Implementation additions — 2026-10-02

User requested no Radix UI, TSX components in separate files with barrel exports, and restrained icons matching the supplied quieter light/dark bookmark-list reference. Text-only product branding and settings labels replace the icon-heavy example.

## Implementation and verification — 2026-10-02

- Shared owner: `ui/`, one TSX file per component in `ui/components/`, CSS in `ui/styles/`, supporting TypeScript in `ui/utils/`, named exports in `ui/index.ts`, controlled callbacks and no extension-service imports. Native dialog/popover/radio/switch/color input; no Radix dependency.
- Development fixtures: `development/components/`; thin `entrypoints/components/` bootstrap. WXT filters the entrypoint before production imports/building. Temporary popup link and lazy local stylesheet are DEV-gated.
- Actual browser evidence: Chrome development extension `pghhebfalkojagfbbpmdaaaaacbehipp`; popup link opened `chrome-extension://pghhebfalkojagfbbpmdaaaaacbehipp/components.html` in a separate tab. This is an isolated automation profile, not the user's production profile.
- Editor Cancel retained the original name; Save committed a changed name; pending Escape was blocked. Failed sample deletion retained 4 rows and released pending; retry deleted only the requested row, leaving 3.
- Import Replace required acknowledgement; dismissal retained 4 rows. Merge added 6 and skipped 2 duplicates, leaving 10 bookmarks. Fixture Replace/color/visibility changes left `chrome.storage.local` unchanged (`{}` before and after).
- Timestamp zero/end boundaries and unknown-duration disabling were exercised; name remained editable when duration was unknown. Custom input/change events updated fixed hex; Use default restored inheritance. OS-native picker interaction remains a manual check, not covered by input events.
- Short preview: 360 px, 28 rows, independent content scroller. Bottom menu remained within the 784 × 505 px available viewport. Dialog: top 16, bottom 489, height 473; body scrolled from 348 px available to 607 px content, footer visible. Native toolbar-popup maximum height is **not established** by the gallery.
- Contrast ratios (Light / Dark): foreground 17.32 / 17.32; muted on raised 5.06 / 12.21; accent text/button 4.50 / 7.54; danger button 5.93 / 9.95; focus on raised 6.38 / 6.58; essential control border on raised 4.43 / 5.39. Light muted `#626977`, focus `#a42d3b`, essential borders `#6b7280` Light / `#8d949f` Dark, including selected tabs. Gray preset stays canonical `#6b7280`.
- Computed font stack matches the spec; CDP platform-font inspection reported `Bahnschrift-Bold`, `isCustomFont: false`. No font/woff/ttf network resources.
- Source checks: initial compile found unchecked-index errors; corrected. Final `npm run compile && npm run lint && npm run zip` passed after visual refinements. `npm run build` also passed before those gallery-only refinements. Final package: 103.59 kB; gallery/source markers and development-link CSS absent from release output. No test script currently exists.

### Visual evidence

| Surface | Light | Dark |
| --- | --- | --- |
| Bookmarks / preview | [Light](../evidence/light-bookmarks.png) | [Dark](../evidence/dark-bookmarks.png) |
| Videos / compact launchers | [Light](../evidence/light-videos.png) | [Dark](../evidence/dark-videos.png) |
| Settings (before final refinement) | [Light](../evidence/light-settings.png) | [Dark](../evidence/dark-settings.png) |
| Editor (before final refinement) | [Light](../evidence/light-editor.png) | [Dark](../evidence/dark-editor.png) |
| Import preview | [Light](../evidence/light-import.png) | [Dark](../evidence/dark-import.png) |
| Confirmation | [Light](../evidence/light-confirmation.png) | [Dark](../evidence/dark-confirmation.png) |

[Constrained bottom-row menu](../evidence/constrained-bottom-menu.png).

### User refinement and verification handoff

User requested initial dialog focus not land on Close, the recessed timestamp well/boxed step controls, compact preset swatches with a distinct Custom control, no redundant subtitles, and Settings grouped as distinct Appearance, Playback (visibility plus default color), and Backup.

Implemented those changes. Initial heading focus/no automatically open tooltip and solid timestamp panel/button borders were observed in the real gallery after refinement. The latest compile/lint/ZIP passed. Presets remain semantic; Custom stays explicitly fixed even if its hex matches a preset, and the control remembers its last custom value while switching to presets.

User owns remaining visual/interaction verification: check Custom/preset switching, native picker, Use default, Settings hierarchy/subtitle removal, timestamp boundaries, and Save/Cancel/Escape. No production-page migration or persisted operation changes were made.

User review: added 12 px spacing between adjacent video groups so raised card edges do not touch, whether expanded or collapsed. Visual verification remains with the user.

User review: removed blurred outer shadows/glow from all shared dialogs. Kept the crisp 5 px depth and inset edge; menu and popup-shell shadows are unchanged. Visual verification remains with the user.

User-requested file organization: moved all 37 TSX components to `ui/components/`, three CSS files to `ui/styles/` (renaming `styles.css` to `foundations.css`), and `color.ts`, `theme.ts`, `types.ts` to `ui/utils/`. Updated imports without compatibility files; `@/ui` remains the public interface. `npm run compile` and `npm run lint` passed. An in-memory browser-target bundle of the public barrel, configured with WXT's root alias, successfully emitted JavaScript and CSS. No UI behavior changed; visual testing remains with the user.

User-requested icon refinement: installed `@tabler/icons-react` and replaced the shared hand-drawn SVGs with Tabler outline components. Added pencil/copy/trash icons to bookmark menus; compact bookmark icon/counts to video groups with full accessible text; bookmark icon plus count text to the video-summary badge; external-link/trash to video actions; download/upload to gallery backup buttons; sun/moon/desktop to theme choices. Removed blurred action-menu shadows while retaining crisp depth and the inset edge.

Verification already exercised: `npm run compile` and `npm run lint` passed; the in-memory public UI bundle emitted JavaScript (140,720 bytes) and CSS (30,460 bytes). An isolated in-memory gallery rendered the summary badge and outline bookmark menu; menu text, decorative accessibility attributes, outline fill, and computed crisp/no-blur shadow were observed. The running development server returned an unresolved-package error for the newly installed library; restart it before user review. User explicitly owns all remaining testing; stopped UI checks on request. No production-popup migration or storage changes.

Development-startup repair: the Tabler installation changed the resolved development toolchain to WXT 0.21.4 / Vite 8.3.1 and left Rolldown 1.2.11's Windows x64 native binding missing. WXT's builder discovery catches the Vite import failure and reports the misleading “Builder not found” message. Restored the exact Windows binding without deleting `node_modules` or stopping existing processes. Recovered npm-generated lock metadata for all 15 native packages already declared by Rolldown's optional dependencies; existing locked versions and root dependency declarations remain unchanged.

Startup-only verification: WXT's `createServer` with browser launching disabled and a temporary output directory started on port 3013, completed the development extension build, and printed `WXT_STARTUP_OK`; its server was then stopped. Temporary output and dependency-repair files were removed. No browser or UI tests ran for this repair; user owns UI testing.

### Gallery retirement after popup adoption — 2026-10-03

User approved issue 2's implementation and requested removing the temporary gallery. Its entrypoint and isolated examples/fixtures/styles are retired; shared `ui/` components remain in use by the popup. Gallery requirements and verification above record the original implementation stage, not a current tooling requirement. Inspect the actual popup going forward; see [issue 2](02-use-components-in-app.md#user-approval-and-gallery-retirement--2026-10-03).
