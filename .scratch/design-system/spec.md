# YouTube Bookmarks design system

Status: components and development gallery implemented; production adoption pending
Approved: 2026-10-02

## Deliverable and authority

Replace the popup POC with the supplied design system through exactly two issues:

| Issue | Deliverable | Dependency |
| --- | --- | --- |
| [01 — Create components](issues/01-create-components.md) | Tokens, primitives, app compositions, and an interactive development-only components page with a temporary popup link | None |
| [02 — Use components in app](issues/02-use-components-in-app.md) | Complete popup adoption, agreed workflow changes, persisted themes/colors and compatible backups; remove temporary link | 01 |

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

Derive dark edge from 22% foreground into background, dark depth from 52% border into background, and dark shadow from 78% background into transparent, matching the reference. Use semantic CSS variables so dialogs, menus, native inputs, and gallery previews resolve the same theme. Accent is not an alias for danger. Selection, errors, and destructive actions also use labels/shape/icons, not color alone.

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

Target **560 px width and up to 700 px height**. Bound the surface to the actual browser-provided space; scroll content instead of clipping. Keep a persistent header and one primary content scroller. Do not carry over the prototype's fixed inner-view height or mobile minimum heights. Dialogs remain compact (approximately 350 px reference width), viewport-bounded, and internally scrollable where necessary. Menus and toasts must remain visible above the scroller.

## Component inventory and contracts

The names below describe responsibilities. Each component has its own TSX file and a named barrel export. Every row must be exercised in the gallery.

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
| ColorPicker | Accent/Gray/Ink swatches and Custom native picker; selected/focus/disabled states, named choices and fixed hex display; optional Use default plus inherited/default indicator in editor |
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

Issue 2 exports version 2 under the existing `youtube-timestamp-bookmarks` format identifier. Keep the existing video/bookmark identity, timestamp keys, title/name/creation metadata and marker visibility fields; represent bookmark color overrides and global default color using the canonical choice above, and include theme preference in settings. Document the final field schema beside validation in the popup spec when implemented.

Accept strict legacy version-1 backups as well as version 2. Convert legacy hex colors to Custom and missing theme to System. Reject unsupported versions or invalid new discriminants/colors/themes before mutations. Merge keeps current settings and duplicate metadata; Replace adopts incoming settings with preview and destructive acknowledgement. Continue whole-library coordination and atomic Replace semantics. Do not weaken existing validation to make the new format fit.

## Development components page

Issue 1 creates an extension-owned `components.html` entrypoint, opened in a browser tab. Register/build it only in development; production build and packaged artifacts must contain neither page nor its fixtures. A development-only **Components** link in the popup opens its extension URL without replacing the popup's three-page navigation. No guessed/dead link may ship.

Show foundation swatches/type/elevation and every inventory component with its variants. Provide Light/Dark/System preview controls, resolved-theme indication, and a 560 px popup-sized composition. Also inspect constrained height, long names/titles, unnamed rows, many rows, empty/no-results, errors, inherited/preset/custom colors, and dialogs/menus near scroll edges.

Examples are interactive: actual draft/selection/expansion/confirmation state changes, working Cancel/Save/reset, and keyboard navigation. Gallery fixtures are labeled examples and isolated from production bookmarks/settings; never call real deletes/imports from sample confirmations. Preview-theme state is gallery-local and defaults to System; production persistence arrives in issue 2. Forced hover/pressed examples may supplement, not replace, real interactions.

Issue 2 deletes the temporary popup link and its opening handler. Keep the gallery development-only and reachable by its direct extension URL; no discoverability link or gallery bundle remains in releases.

## Completion and evidence

Issue 1 is complete only when all inventory rows and applicable states render and interact in the real gallery; capture both themes, constrained popup previews, dialogs/menus, and keyboard behavior. Prove the temporary link resolves and production artifacts exclude the gallery.

Issue 2 is complete only when all real popup workflows use the components, themes survive reopening and follow OS changes correctly, legacy/current backup round trips preserve data, and the temporary link is removed. Capture actual extension-popup evidence, including available browser sizing: CSS preview dimensions alone do not prove a 700 px native popup. Record any browser-imposed height cap and verify scrolling under it.

Run existing source checks after implementation, inspect production artifacts, and record exact exercised scenarios in each issue. Keep permanent regressions for uncertain consumer-visible boundaries (migration, versioned validation, precedence, collisions), not component wiring/source text. Issue 1 implements the components and isolated gallery; issue 2 still owns production migration and persistence.

### Implementation additions — 2026-10-02

User replaced the earlier shadcn/ui recommendation: no Radix UI; native React TSX components in separate files with barrel exports. Use the supplied quieter light/dark bookmark-list reference, not the icon-heavy settings example. Retain functional menu/clear/close/chevron icons and accessible feedback; avoid redundant decoration.

### Visual refinement — 2026-10-02

Dialogs initially focus the title, not the tooltip-bearing Close button. Timestamp editing uses a recessed panel, prominent zero-padded display, and boxed adjustment buttons. Marker selection uses compact accessible preset swatches and a distinct Custom control; switching presets retains the last custom picker value without changing the canonical persisted choice contract. Use default remains explicit.

Settings uses a distinct full-width Appearance/theme group, Playback containing marker visibility and default marker color, then Backup/import/export. Avoid redundant setting subtitles and repeated visible labels; keep required failure/unavailable-duration explanations. User owns final visual verification.
