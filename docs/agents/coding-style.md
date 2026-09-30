# Coding style

## Operation names

Name data operations by their effect:

- `getThing`: retrieve one thing.
- `listThings`: retrieve multiple things.
- `createThing`: create a thing; define the existing-identity behavior in that operation's contract.
- `updateThing`: change an existing thing.

Use domain nouns rather than storage shapes in the public name. Player bookmark positions are `timestamp`: a nonnegative, whole-second number, not a formatted clock string. Keep names aligned across the model, request, client, and storage operation.

Keep framework entrypoints thin: dispatch by message type, validate each message in its own private handler, then call the operation. Validation errors should identify the invalid field. Extract helpers when they express a reusable rule or clarify a nontrivial operation, not merely to introduce a generic for one caller. Prefer clear names and structure over comments that narrate the next statement.

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
