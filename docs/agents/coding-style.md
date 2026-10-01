# Coding style

## File ownership

- Top-level `entrypoints/`: WXT registration, lifecycle wiring, and thin message dispatch. Keep player detection, feature UI behavior, and persistence operations in their owning modules.
- `services/`: operation implementations and execution-context-specific messaging adapters. Importing a module determines where it executes; its directory does not.
- `models/`: shared data and context shapes. Runtime request/response contracts follow the rule below.
- `utils/`: context-independent rules, such as URL classification; keep browser subscriptions, player DOM access, and feature lifecycle state with their owners.
- `entrypoints/popup/`: React composition, pages, UI components, and popup-local navigation/context state.

Separate responsibilities by ownership, not by creating a file for each function or a component for each CSS class. Keep one owner for shared live state; consumers use that owner's operations rather than initialize parallel copies.

## Operation names

Name data operations by their effect:

- `getThing`: retrieve one thing.
- `listThings`: retrieve multiple things.
- `createThing`: create a thing; define the existing-identity behavior in that operation's contract.
- `updateThing`: change an existing thing.

Use domain nouns rather than storage shapes in the public name. Player bookmark positions are `timestamp`: a nonnegative, whole-second number, not a formatted clock string. Keep names aligned across the model, request, client, and storage operation.

Keep framework entrypoints thin: register context-local message handlers through the shared registration module. Registration validates the envelope and registered type and owns synchronous/asynchronous response delivery. Each private handler validates its operation's payload and returns typed results, including operation failure responses. Validation errors should identify the invalid field. Extract helpers when they express a reusable rule or clarify a nontrivial operation, not merely to introduce a generic for one caller. Prefer clear names and structure over comments that narrate the next statement.

## Intent-based naming

Name a type or module for its complete current responsibility, not merely the first feature that needed it. A multi-feature YouTube content entrypoint is host integration (`youtube.content.ts`); the quick-add control remains a feature-specific module.

`ActiveTabContext` means the extension's current knowledge of the active browser tab, including lookup conditions and supported-video availability. `ActiveVideo` means the supported player video snapshot. Use active-tab terminology for the popup's overall context lookup and active-video terminology for the content-side player request/response.

Keep function names, contracts, state fields, and owning filenames aligned when a responsibility changes. Migrate consumers together rather than retaining aliases with the old meaning.

## Contracts and discriminators

Keep runtime request/response contracts in `models/messages.ts` and data/context models in their model files. Shared popup-only types belong in `entrypoints/popup/types.ts`; component-private props stay beside their component.

- Use `type` for requested operations and object categories.
- Use boolean fields for binary facts, such as `isYoutube` for URL host classification.
- Use `status` for context conditions that include loading, error, and availability.
- Use the existing `Result<T>` discriminator `ok` for operation success/failure. A successful read with no supported video is `{ ok: true, value: null }`, not a failed read.

## UI state and asynchronous work

Name navigation/context values by their data: `currentState`, `detectedContext`, `selectedPage`, and `destinationPage`. Name lifecycle flags by the event they track, such as `hasSelectedInitialPage`, rather than a generic `initialized`. Use explicit conditionals for state transitions with multiple rules.

Keep subscriptions and state-dependent operations within the lifecycle that owns their live state. Extract a hook when it clarifies ownership, not merely to shorten a component. Name refresh IDs and timeout handles for their purpose; preserve stale-result rejection and cleanup when restructuring asynchronous work.

## File ordering

Apply this order to all source files and function scopes:

1. Imports, types, and state/constants that must be initialized before execution.
2. Exported functions or framework entrypoints. Put a private helper used by one caller immediately beneath that caller; keep the caller's helper chain together.
3. Private helpers used by multiple callers at the bottom of the scope.

Declare default-exported functions at their definition rather than adding an export at the bottom. In lifecycle setup functions, initialize state and register behavior before the private helper definitions. Use named function declarations when forward calls are needed; preserve initialization order for executable declarations.

## Execution-context names

Use `client` for host-website-facing extension code: content scripts and their messaging adapters. Use background/storage names for extension-owned persistence and message handling. Popup code is extension UI, not host-website client code.

All of these execute on the user's PC. A content script runs alongside the host website in an isolated JavaScript context; it is not the website's own script. A shared module executes in whichever context imports and calls it, regardless of its filename.

Console logs belong to that execution context:

- Content script and its client adapter: the host tab's DevTools console.
- Popup: the popup's DevTools console, opened by inspecting the popup.
- Background worker and its storage operations: the service-worker console reached through `chrome://extensions`.
