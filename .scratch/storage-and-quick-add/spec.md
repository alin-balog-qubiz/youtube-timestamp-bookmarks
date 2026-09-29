# Storage and instant player save

Status: Approved for implementation

## Goal and boundary

Deliver the first usable vertical slice from [product scope](../../docs/scope.md): save the current moment from a standard YouTube watch page with one click, and retain it after reload. This spec covers persisted bookmark data and the player quick-add interaction. It does **not** deliver progress-bar markers, popup browsing/editing, settings UI, import/export, or Guide. Those features must use the same persisted bookmarks later.

## User flow

1. On a standard `youtube.com/watch` page with a playable video, a small `+` control appears among the player controls. It has an accessible name and tooltip. No save control is added on non-watch pages or when there is no usable video ID/playback position.
2. Clicking saves the current playback position at whole-second precision without pausing or opening a form. Capture the video ID from the current watch page and its displayed title when available.
3. Beside the control, briefly show **Saved** after a new bookmark or **Already saved** when that video and second already exist. A duplicate preserves the existing bookmark, including its name, color, and creation date. A storage failure must not report **Saved**; show a short failure message instead.
4. Repeated watch-page navigation in YouTube's single-page app must use the newly active video's ID, title, and playback position; avoid leaving a control attached to a departed player or adding duplicate controls.

## Data contract

Use `wxt/utils/storage` with **local** extension storage. The conceptual persisted model is:

- **Video**: YouTube video ID and latest available display title. A missing title falls back to the ID in later UIs. Do not overwrite a known title with a missing one.
- **Bookmark**: video ID, integer timestamp in seconds (zero is valid), optional user-written name, optional marker-color override, and creation date. Quick add leaves name and color unset; later features can edit them.
- **Identity**: `(video ID, integer second)`; the first successful save owns that identity. A later save of the same identity changes no bookmark fields. Two different seconds in one video, or the same second in different videos, are distinct bookmarks.

Persist a numeric whole-second value, not a formatted clock string or a fractional playback time. The implementation owns the TypeScript types, key layout, and date encoding; keep consumers on one storage contract rather than introducing another store or representation. Bookmark creation should not depend on title availability. Data must remain available across page reloads and browser restarts, subject to normal local-extension storage behavior.

## Implementation constraints

- Use the current active watch-page video and HTML video playback position at click time, not the time when the button was mounted. Treat an unavailable or non-finite playback position as unavailable rather than saving an invalid bookmark.
- Ensure an already-saved result is based on persisted state, not only transient button state. A successful UI message follows a successful storage operation.
- The player control should coexist with YouTube's controls and not obscure video content. No marker rendering is required in this slice.
- Keep browser-facing storage operations in a reusable module so later popup, marker, and backup features read and modify the same data contract.

## Acceptance scenarios

1. On a watch page, saving at `01:24.x` stores second `84`, gives **Saved** feedback, leaves playback running, and survives reload.
2. Saving again within second `84` gives **Already saved**, leaves the original creation date/name/color intact, and does not create another bookmark; saving at second `85` creates another.
3. Saving second `84` on a different video creates a separate bookmark. Navigating between watch videos without reloading saves against the currently playing video's ID and does not duplicate the control.
4. A missing video title does not prevent a save. A missing video ID or unusable playback position does not create a bookmark or claim success.
5. Reloading a watch page allows the saved second to be recognized as a duplicate. A failed write produces failure feedback instead of success.

## Documentation boundary

If implementation changes the agreed user behavior or identity/data meanings, update this spec and `docs/scope.md` in the same change. Storage types and key layout are code-level choices; do not duplicate their source in the product scope. The next feature specs should link here for the shared bookmark contract.
