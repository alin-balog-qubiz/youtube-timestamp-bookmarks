# Create design-system components and inspection page

Status: ready
Type: task

## Goal

Implement the complete component inventory and visual foundations in the [design-system spec](../spec.md), with an interactive development-only components page. This issue creates reusable UI; it does not migrate the POC's real pages or change their persisted operations.

## Read first

- [Design-system spec](../spec.md): authoritative tokens, typography, geometry, inventory, gallery lifecycle, and exceptions.
- [Archived prototype](../reference/index.html): final visual appearance; inspect computed styles rather than copying overridden CSS.
- [Product scope](../../../docs/scope.md) and [coding conventions](../../../docs/agents/coding-style.md).

## Implementation

1. Establish one reusable extension-UI component/style owner, consumable by both popup and gallery. Use actual shadcn/ui primitives where helpful, with reference-specific styling; native color selection remains native. Keep WXT entrypoints thin. Avoid duplicating components inside the gallery or letting primitives query browser/storage services.
2. Implement semantic light/dark tokens, separate danger treatment, exact installed-font stack, readable sizes, tabular time, elevation, motion and focus treatment. Replace all white palette tokens with `#F5F5F5`. Preserve raised/recessed/flat distinctions in both themes.
3. Implement every primitive, feedback component, and app composition in the inventory. Controlled props/callbacks own selection/drafts/actions; actual pending/disabled/error state prevents inappropriate activation. Use one theme provider with System default and OS-change subscription/cleanup; gallery preview selections are transient, not persisted production preferences.
4. Add the shared theme-aware color-choice resolver and selection UI. Demonstrate preset/custom/default-inherited values without migrating production data. Use the spec's canonical choice contract so issue 2 does not invent a competing representation.
5. Create a standalone extension-owned `components.html` development entrypoint. Render a foundation section, named component examples, all applicable states, and a 560 px-wide/up-to-700 px popup preview bounded by available space. Reuse the same components, not copied markup that merely resembles them.
6. Make the examples actually interactive using isolated, labeled gallery fixtures: navigation, search/clear, switches, theme/radio/color choices, multiple expanded groups, menus, dialogs, editor Save/Cancel, import mode/confirmation, toast and error/retry demonstrations. Reset restores examples. These sample operations must not touch the user's library or persisted settings.
7. Add a temporary development-only **Components** link to the existing popup. Open the actual extension page in a new browser tab; keep existing popup navigation and behavior unchanged. Keep the link styling local so it does not require premature app adoption.
8. Gate the gallery entrypoint, its fixture imports, and link from production builds. Do not merely hide the page/link using CSS. Add developer documentation describing the temporary link and direct development URL so issue 2 can remove the link while retaining usable tooling.

## Acceptance and smoke evidence

- [ ] Inventory coverage: every row in the spec has a named, rendered, interactive example. Foundation colors/type/elevation and applicable default/hover/pressed/focus/disabled/pending/selected/invalid/error states are inspectable.
- [ ] Open the actual gallery through the temporary popup link in a development extension. It is a separate tab, not a fourth popup page, and its URL resolves.
- [ ] Capture light and dark visual evidence of the popup preview, bookmark/video rows, settings controls, editor, import preview, and confirmation dialog. No ReactionMarks branding in new components; archived reference remains unchanged.
- [ ] Select System and change OS/browser-emulated color preference: preview updates. Explicit Light/Dark stays fixed. The gallery does not overwrite production theme or marker preferences.
- [ ] Exercise mouse and keyboard operation: tabs/segmented/radio choices, switch, collapsibles, menu navigation, tooltip focus, dialog focus trap, Escape/Cancel, and focus restoration. Dialog/confirmation dismissal commits nothing.
- [ ] Exercise real editor Save/Cancel, boundary-disabled timestamp controls, color presets/Custom/Use default, import mode changes, pending confirmation, and displayed error/retry in fixture state. Report native color-picker dialog verification separately from driving input events.
- [ ] Inspect long titles/names, unnamed rows, many rows, shortened available height, bottom-row menus, and dialogs. Header stays reachable; scroll/overlay content is not clipped; reduced-motion disables animation.
- [ ] Measure text/control contrast and record any semantic focus/outline correction. Check typography uses the requested installed stack and no remote font requests.
- [ ] Build production and inspect output/packaged files: no components entrypoint, fixture bundle, or temporary link. Recheck existing popup navigation after the link-only change.
- [ ] Run existing source checks once after implementation; record actual commands and results. Update developer docs and issue evidence; remove throwaway fixtures outside the retained isolated gallery.

## Non-goals

No real-page migration, production theme persistence, backup schema change, data migration, quick-add restyling, player markers, Guide, or Welcome. Compositions must be complete and interactive in the gallery; production service wiring belongs to issue 2, not placeholder production controls.

## Comments

### Approval — 2026-10-02

User confirmed the full design contract after grilling, including off-white, installed-font stack, 560 px width, development-only gallery, and shadcn/ui foundation. Native browser popup height may be capped; the preview must not be presented as proof of native 700 px sizing.
