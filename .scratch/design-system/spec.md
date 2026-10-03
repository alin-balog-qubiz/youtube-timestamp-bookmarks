# YouTube Bookmarks design system

Status: production adoption implemented and user-approved; temporary gallery retired
Approved: 2026-10-02

## Deliverable and authority

Replace the popup POC with the supplied design system through exactly two issues:

| Issue | Deliverable | Dependency |
| --- | --- | --- |
| [01 — Create components](issues/01-create-components.md) | Tokens, primitives and app compositions; temporary interactive gallery retired after popup adoption | None |
| [02 — Use components in app](issues/02-use-components-in-app.md) | Complete popup adoption, agreed workflow changes, persisted themes/colors and compatible backups; remove temporary link and gallery | 01 |

[Product scope](../../docs/scope.md) owns product intent. This spec owns the design system; the [popup workflow](../popup-ui/spec.md) owns unchanged operation rules. The prototype supersedes the POC's appearance and the UI behaviors explicitly changed below. Completed POC issues are historical evidence, not authority for retaining replaced UI.

### Reference

- [Archived interactive prototype](reference/index.html): an unchanged local snapshot for visual comparison, not the implementation or components gallery.
- Original: `C:/Users/Alin.Balog/AppData/Roaming/Open Design/namespaces/release-stable-win/data/projects/ff167ce5-c56b-4009-8158-9c87103bec0c/index.html`.
- Use the final computed styles: the source contains successive CSS refinements that override earlier declarations.
- Approved deviations: **YouTube Bookmarks** branding; off-white instead of white; separate danger colors; wider popup/readable text; accessible interactions; Use default inheritance; real-operation safeguards.
- The reference still says ReactionMarks and contains simulated operations, inconsistent sample counts, and stale `#1677ff` color values. Those are not implementation requirements. Its surrounding presentation page and mock YouTube player are not app components to reproduce.

## Scope and ownership

Implement all components in the inventory, including the app-specific compositions, as native React TSX components without Radix UI. Each component has its own file; a shared barrel index exports the inventory. Native color selection remains an `input[type=color]`. Match the quieter reference: text-only branding, restrained functional icons, no obligatory decorative icons beside settings rows.

Use the official `@tabler/icons-react` library, outline variants only, through the shared `Icon` component. Keep action labels beside icons: pencil/copy/trash in bookmark menus, external-link/trash for video actions, download/upload for backup buttons, and sun/moon/desktop for theme choices. Video-group counts show a bookmark icon and number, preserving the full saved-bookmark count for assistive technology; the video-summary badge keeps its bookmark-count text alongside the icon.

The shared `ui/` module exposes its public interface through `ui/index.ts`. TSX files live in `ui/components/`, CSS in `ui/styles/` (`foundations.css`, `compositions.css`, `overlays.css`), and supporting TypeScript in `ui/utils/`. Consumers import from `@/ui`; implementation files import their dependencies directly, not through the barrel.

Presentational components accept data, state, and callbacks. They do not discover browser tabs, query extension storage, or send background messages. Page/controller owners retain those responsibilities. Reuse one production theme owner and one color-resolution rule.

Excluded: changes to the YouTube quick-add control or its feedback; timeline-marker implementation; Welcome/Guide; new search/sort features; undo; shortcuts; direct timestamp entry. Existing player-message operations remain available to popup consumers. Semantic color metadata is in scope, but does not imply implementing its future progress-bar consumer.

## Foundations

### Color tokens

Every white palette token becomes `#F5F5F5`, including dark foreground and text on light accent buttons. Keep the secondary light surface distinct.

| Semantic role | Light | Dark |
| --- | --- | --- |
| Background / flat surface | `#F5F5F5` | `#111111` |
| Secondary surface / navigation well | `#f7f8fa` | `#111111` |
| Foreground | `#111111` | `#F5F5F5` |
| Muted foreground | `#626977` (contrast correction) | `#d9dee7` |
| Gray preset | `#6b7280` | `#d9dee7` |
| Border | `#d9dee7` | `#6b7280` |
| Accent / Accent preset | `#c83f4f` | `#ff7a86` |
| Accent contrast | `#F5F5F5` | `#111111` |
| Danger | `#b91c1c` | `#fca5a5` |
| Ink preset | foreground | foreground |
| Raised surface | background | foreground mixed 6% into background |

Derive dark edge from 22% foreground into background, dark depth from 52% border into background, and dark shadow from 78% background into transparent, matching the reference. Use semantic CSS variables so popup pages, dialogs, menus, and native inputs resolve the same theme. Accent is not an alias for danger. Selection, errors, and destructive actions also use labels/shape/icons, not color alone.

Check normal text at 4.5:1, large text at 3:1, and essential control/focus boundaries at 3:1 against adjacent surfaces. Decorative separators may retain the low-contrast reference border; essential outlines may need a stronger semantic token. A documented contrast correction takes precedence over literal pixel matching.

Implemented contrast corrections: essential control borders (including selected tabs) use `#6b7280` in Light and `#8d949f` in Dark; Light focus uses `#a42d3b`. Light muted text uses `#626977`, while canonical Gray remains `#6b7280`. Decorative border/elevation tokens retain the reference values. Measured ratios are recorded in [issue 1](issues/01-create-components.md#implementation-and-verification--2026-10-02).

### Typography

```css
font-family: Bahnschrift, 'DIN Alternate', 'Franklin Gothic Medium',
  'Nimbus Sans Narrow', sans-serif-condensed, sans-serif;
font-weight: normal;
font-synthesis: none;
```

No bundled fonts or network font requests. Installed fallback availability may change rendering across operating systems; do not silently substitute a different family. Root weight is normal; headings/labels/actions may use the prototype's component-specific emphasis.

- Helper text, metadata, uppercase section labels: at least 12 px.
- Primary row content, inputs, buttons, tabs: 13–14 px; timestamps 14 px.
- Product/video/dialog titles: approximately 15–16 px; timestamp editor display: 24 px.
- Body line-height around 1.4; preserve uppercase label tracking and title emphasis.
- All timestamps use tabular numerals. Keep readable full accessible names when visual text truncates.

### Geometry, elevation, and motion

- Spacing foundation: 4 / 8 / 12 / 16 / 24 / 32 px; retain reference-specific 10–18 px paddings where matching the component requires them.
- Radii: controls 8–9 px; cards/navigation 12 px; dialogs 16 px; showcase popup shell 20 px; pills fully rounded. The standalone shell's rounding does not require blank margins in the actual browser popup.
- Standard raised depth: 3 px; small/button depth: 2 px; large depth: 5 px. Navigation wells use inset depth. Passive bookmark lists/notices stay flat. Raised dark surfaces retain depth and an inset edge rather than becoming flat.
- Cards: video summary, video group, and setting groups raised. Tabs: recessed rail and raised active item. Theme choices: flat selected foreground/background inversion. Dialogs retain a crisp 5 px depth and inset edge without blurred outer shadows or glow. Action menus retain crisp standard depth and an inset edge without blurred outer shadows or glow.
- Inputs about 38 px high; tab targets at least 40 px; icon-button visual box about 36 px; setting rows at least 58 px. Preserve compact pointer targets while maintaining keyboard access and adequate spacing.
- Standard transition 180 ms. Pressed buttons move 1 px and reduce elevation; dialog secondary controls use restrained recessed hover. Reduced-motion disables animated transitions/transforms.
- Stroke icons follow the reference: 24-unit view box, rounded joins/caps, approximately 1.8 stroke; 18 px default and 15–16 px small. Decorative icons are hidden from accessibility APIs; icon-only actions have labels.

### Popup layout

Target **560 px width and up to 600 px height**, respecting Chromium's native toolbar-popup limit. The earlier 700 px design target exceeds that limit. Bound the surface to the actual browser-provided space; scroll content instead of clipping. Keep a persistent header and one primary content scroller. Do not carry over the prototype's fixed inner-view height or mobile minimum heights. Dialogs remain compact (approximately 350 px reference width), viewport-bounded, and internally scrollable where necessary. Menus and toasts must remain visible above the scroller.

The popup document establishes an intrinsic 560 × 600 px request without viewport-relative width/height caps. Its fixed, inset-zero application shell fills the viewport Chrome actually grants; the flex content region scrolls below the persistent header. Keep `overflow: hidden` on `html` and `body`, and `overflow-y: auto` on `.popup-content`. CSS overflow alone does not prevent native outer scrollbars: Chromium's autosizer forces them when the measured document exceeds its maximum size. Do not use `100vw`/`100dvh` to cap the document's initial intrinsic size: the initial native popup viewport can feed back into preferred-size calculation and collapse the popup. See [Chrome's action popup contract](https://developer.chrome.com/docs/extensions/reference/api/action#popup) and [Chromium's autosize implementation](https://github.com/chromium/chromium/blob/main/third_party/blink/renderer/core/frame/frame_view_auto_size_info.cc).

## Component inventory and contracts

The names below describe responsibilities. Each component has its own TSX file and a named barrel export. Inventory inspection now uses the actual popup; the temporary gallery's earlier coverage remains historical evidence in issue 1.

| Component | Required variants/state and responsibility |
| --- | --- |
| ThemeProvider / ThemeChoice | Light, Dark, System; System default; expose selected preference separately from resolved theme; react to OS changes only in System; apply `color-scheme` and themed overlay roots |
| Icon | Shared stroke treatment; decorative and labeled usage; small/default sizes |
| Button | Accent, neutral raised, destructive, quiet/text; optional leading icon; normal/hover/pressed/focus/disabled/pending; pending blocks duplicate activation without losing the accessible name |
| IconButton | Quiet icon action, accessible label, Tooltip; normal/hover/pressed/focus/disabled |
| TextInput / SearchInput | Associated label, placeholder, value/change, disabled, invalid and linked help/error; SearchInput adds decorative search icon and clear action |
| Switch | Controlled checked state, associated label, disabled/pending; native keyboard semantics |
| SegmentedChoice | Controlled single selection; Light/Dark/System specialization; labeled group, keyboard selection, visible selected and focused states |
| RadioChoice | Merge / Replace all cards; mutually exclusive selection, labeled group, focus and disabled states |
| ColorPicker | Accent/Gray/Ink swatches and Custom native picker; selected/focus/disabled states and named choices without a separate hex-code readout; optional Use default plus accessible inherited/default indicator in editor |
| Link / Tooltip | Distinguish navigation from action buttons; descriptive destinations; tooltip opens on focus as well as hover, with no essential information available only in tooltip |
| Surface / Card | Flat, raised, recessed treatment; allow sections/rows inside without enforcing business state |
| SectionHeader | Heading and optional metadata/action; heading level supplied by composition |
| Badge | Bookmark/video count; compact, non-interactive; count comes from caller |
| Tabs | Persistent popup navigation with selected, unavailable, and focus states; associated panels and keyboard behavior |
| CollapsibleGroup | Labeled header, expanded state and panel; independent groups may be open simultaneously |
| ActionMenu | Trigger, edit/copy/delete items, destructive styling; keyboard navigation, Escape/outside close, focus restoration; overlay avoids scroller clipping |
| Dialog | Labeled title/description, optional title icon, close control and footer; focus trap/restore, Escape, bounded scrolling; closing discards draft rather than saving |
| ConfirmationDialog | Explicit Cancel/destructive confirm, identified affected data, pending/error feedback; no destructive action on dismissal |
| Notice | Informational/warning/error with icon and optional action; accurate operation/context explanation |
| Toast | Brief nonblocking status confirmation, polite live region; show success only after actual operation; persistent/actionable errors belong inline |
| Skeleton | Representative loading rows/cards, busy state, no misleading fake totals |
| EmptyState / ErrorState | Icon, heading, explanation, optional next-step/retry action; no results distinct from empty library; failed reads never render as empty |
| PopupHeader | YouTube Bookmarks name and This video / All videos / Settings navigation; This video available only in supported active-video context |
| VideoSummary | Active title/ID fallback, optional real metadata, derived bookmark count; raised surface; do not invent channel data |
| BookmarkRow | Vertical color marker, clickable timestamp/name region, Unnamed bookmark fallback, labeled action menu; seek action separate from menu trigger |
| CompactBookmarkLink | Dot, timestamp, name/Unnamed bookmark, trailing play icon; chronological launcher with no individual-management menu |
| VideoGroup | Raised collapsible header with title/count/chevron; expanded Go to video and Delete video actions plus compact bookmark links |
| SettingRow / SettingGroup | Label, optional help/icon, control/action; divider treatment and raised group; Appearance / Playback / Backup headings |
| TimestampAdjuster | Tabular draft time, −5s/−1s/+1s/+5s buttons; caller supplies legal range/availability; disable illegal steps, explain unknown duration; no direct entry |
| BookmarkEditor | Optional name, timestamp adjuster, color picker with Use default, Cancel / Save changes; caller-owned draft, pending and error/context-change states |
| ImportPreview | File identity, Merge/Replace all choices, actual current/incoming/addition/duplicate totals and settings changes, warning, Cancel / Confirm import; destructive acknowledgement for Replace |

## Production behavior and persistence

### UI cutover

- User-facing popup and extension metadata name: **YouTube Bookmarks**. Keep existing storage keys and backup format identifier stable; do not rename data because of branding.
- Initial navigation, supported-context gating, chronology, recent-bookmark video ordering, title-only filtering, and seek/new-tab routing retain the popup operation contract.
- Active-tab lookup failures use the concise recovery notice **Having trouble reading this tab’s context. Try opening YouTube.**, with YouTube linking to `https://www.youtube.com/` in a new tab. Keep the error treatment and existing navigation/context gating; do not replace lookup logic or suppress failures.
- Show **Unnamed bookmark** alongside its time in both row styles; this is display fallback, not a persisted name.
- All videos header/title/chevron toggles expansion. **Go to video** opens the watch page separately. **Delete video** confirms identity and bookmark count and removes that video's saved records; clearly explain that the YouTube source is unaffected.
- This video retains individual edit, copy, and delete menus. Remove its old bulk-delete control; per-video deletion is available in All videos.
- Editor and import use the prototype's dialog structures and labels. Preserve atomic edits, duration bounds, collision rejection, draft retention on failure, and stale-context prevention. Replace imports require explicit destructive confirmation and stale-preview checks.
- Popup empty guidance continues to refer to the actual player **+** control, which this effort leaves unchanged.

### Theme

Store `light | dark | system` as preference, not the resolved OS color. Absent preference means System. Preference writes use the background settings boundary; successful selection persists across popup/browser restarts and is shared by extension-owned production UI. Display read/write failures truthfully; a failed write must not leave a falsely saved selection. Apply the known preference before displaying the surface where feasible to avoid a wrong-theme flash.

In System, subscribe to OS theme changes with cleanup. Explicit Light/Dark ignores them. Backups include preference; Merge retains current preference, Replace adopts incoming preference. A legacy backup without theme resolves to System on Replace.

### Marker color model and migration

Canonical color choice is a discriminated value: `{ type: 'preset', preset: 'accent' | 'gray' | 'ink' }` or `{ type: 'custom', value: '#rrggbb' }`. A bookmark without an override inherits the global default choice. Use default removes the override; it is not a fourth preset. New installations default to Accent.

Resolve presets from the table above using the resolved theme; Custom is an opaque six-digit hex value independent of theme. Never persist resolved preset hex values as though they were Custom. Existing global/default and bookmark hex colors migrate to Custom, even if they resemble a preset, preserving the user's saved values and identity/creation dates. Explicit presets follow theme changes; overrides never start inheriting accidentally.

One resolver serves popup rows and previews; retain the host integration's existing behavior without restyling quick add. Future marker rendering must consume the same choice model. Do not implement markers or infer a marker rendering theme in this effort.

### Backup compatibility

Exports use version 2 under the existing `youtube-timestamp-bookmarks` format identifier. Keep the existing video/bookmark identity, timestamp keys, title/name/creation metadata and marker visibility fields; represent bookmark color overrides and global default color using the canonical choice above, and include theme preference in settings. The implemented field schema and regression contracts are documented in the [popup specification](../popup-ui/spec.md#backup-format-and-persistence).

Accept strict legacy version-1 backups as well as version 2. Convert legacy hex colors to Custom and missing theme to System. Reject unsupported versions or invalid new discriminants/colors/themes before mutations. Merge keeps current settings and duplicate metadata; Replace adopts incoming settings with preview and destructive acknowledgement. Continue whole-library coordination and atomic Replace semantics. Do not weaken existing validation to make the new format fit.

## Components gallery lifecycle

Issue 1 used an isolated interactive development gallery to inspect the inventory before production adoption. After approving the popup implementation on 2026-10-03, the user requested its removal: only the actual popup is relevant now.

Remove `entrypoints/components/`, the gallery-only examples, fixtures and styles in `development/components/`, and the obsolete WXT production-exclusion hook. Neither development nor production builds expose `components.html`. Keep the shared `ui/` components, production theme owner, and archived visual reference; inspect the actual popup going forward.

## Completion and evidence

Issue 1's inventory, interaction, theme and keyboard evidence remains a historical record of the temporary gallery. Retiring that tooling does not remove the shared component contracts.

Issue 2 is complete only when all real popup workflows use the components, themes survive reopening and follow OS changes correctly, legacy/current backup round trips preserve data, and the temporary link is removed. Capture actual extension-popup evidence, including native 560 × 600 px sizing and scrolling. A regular HTTP tab does not exercise Chromium's native popup autosizer; record any smaller browser-imposed cap separately.

Run existing source checks after implementation, inspect production artifacts, and record exact exercised scenarios in each issue. Keep permanent regressions for uncertain consumer-visible boundaries (migration, versioned validation, precedence, collisions), not component wiring/source text. Issue 1 established the shared components; issue 2 owns production migration and persistence.

### Implementation additions — 2026-10-02

User replaced the earlier shadcn/ui recommendation: no Radix UI; native React TSX components in separate files with barrel exports. Use the supplied quieter light/dark bookmark-list reference, not the icon-heavy settings example. Retain functional menu/clear/close/chevron icons and accessible feedback; avoid redundant decoration.

### Visual refinement — 2026-10-02

Dialogs initially focus the title, not the tooltip-bearing Close button. Timestamp editing uses a recessed panel, prominent zero-padded display, and boxed adjustment buttons. Marker selection uses compact accessible preset swatches and a distinct Custom control; switching presets retains the last custom picker value without changing the canonical persisted choice contract. Use default remains explicit.

Settings uses a distinct full-width Appearance/theme group, Playback containing marker visibility and default marker color, then Backup/import/export. Avoid redundant setting subtitles and repeated visible labels; keep required failure/unavailable-duration explanations. User owns final visual verification.

### Production adoption — 2026-10-02

Popup pages, header/notices, row menus, editor, import and destructive confirmations now compose the shared components. The shell has a 560 px target width, viewport-bounded 700 px target height, persistent navigation and a primary content scroller. All videos expands headers and separates Go to video/Delete video; This video retains only individual management. Missing names remain display-only Unnamed bookmark.

`models/appearance.ts` owns canonical choices/themes and strict runtime validation. Background settings reads durably migrate legacy preferences/video overrides through the library barrier; popup reads and backup previews normalize read-only. Existing hex values retain their exact spelling as Custom. Settings adopts the committed theme preference through the same provider used by the gallery; failed writes retain the saved selection. Version-2 exports and strict legacy imports preserve the existing format identifier and import coordination.

The user owns lint, compilation, builds, packaging and visual/behavioral verification. No test suite or source/build commands were run for this cutover. A direct runtime invocation of the appearance validators/resolver returned Accent `#c83f4f` in Light and `#ff7a86` in Dark, and retained legacy Custom `#A1b2C3` in Dark. That does not verify popup, migration persistence, backup round trips, native sizing or OS dialogs. Acceptance evidence remains unchecked in issue 2.

### Popup simplification — 2026-10-03

Approved from the user's screenshots: remove Settings' informational notice about default-color inheritance and unfinished markers between Playback and Backup. Preserve actual read/write failures and editor inheritance behavior. All videos starts with the search field without a repeated visible All videos heading or Filter by video title label; keep both screen-reader-accessible. Leave 16 px between the search field and video cards. The shared SearchInput supports optional hidden labels; gallery consumers retain their visible labels.

Verified the rebuilt production popup in an isolated Chromium HTTP surface with simulated extension APIs at 560 × 700 px: inspected screenshots of All videos and Settings, measured a 16 px search-to-first-card gap, confirmed the accessible search name remained Filter by video title, filtered two sample videos down to the matching title and restored both with Clear search. Settings showed Playback followed by Backup without the removed notice. No page errors; `npm run compile` and `npm run build` passed. This verifies rendered UI, not native Chrome toolbar sizing or real persistence. No permanent presentation tests or fixture files were added.

The user's subsequent screenshot removes the This video eyebrow inside VideoSummary. The shared card now starts directly with its video title, without the old 6 px heading offset, and retains its bookmark count. Inspected the rebuilt current-video popup with a simulated supported player and one bookmark at 560 × 700 px: title/count and bookmark actions remained visible, title top margin was 0 px, and no page errors occurred. Production build passed; native toolbar/persistence remain outside this isolated visual check.

The outside-YouTube informational banner is also removed at the user's request. Outside YouTube still opens All videos, with Settings available and This video unavailable; actual lookup failures and loading feedback remain. Inspected the rebuilt empty-library popup and Settings in the isolated Chromium HTTP surface with a simulated outside-YouTube tab: no banner, correct navigation/empty guidance, no page errors. A simulated failed tab lookup still displayed its error. Production build passed; no native extension/persistence claim is made.

Remove the standalone hex-code readout beneath Custom colors at the user's request. The shared picker retains preset swatches, the native Custom input, its remembered custom value, and an accessible inherited-default description only while Use default is selected. Removed obsolete readout styles. Inspected rebuilt Settings and editor in the isolated Chromium HTTP surface with a blue Custom default: no hex readout or leftover spacing, Custom → Gray → Custom retained the native input's `#2563eb` value, and editor inheritance remained selected/described until choosing an override. No page errors; build and compilation passed. Native color-picker dialogs and real persistence were not exercised.

### Gallery retirement — 2026-10-03

User approved the implementation and requested removal of the previous issue's gallery. Deleted its WXT entrypoint, local examples/fixtures/styles, and production-exclusion hook. The shared popup components and production behavior remain unchanged; README inspection guidance now points to the popup. Earlier gallery evidence above and in issue 1 is historical, not a requirement to retain the page.
