import { browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { createBookmark } from '@/services/bookmarks';
import type { CreateBookmarkRequest, CreateBookmarkResponse, Result } from '@/models/messages';

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (typeof message !== 'object' || message === null || !('type' in message)) return;

    switch (message.type) {
      case 'bookmarks:create':
        void handleCreateBookmark(message).then(sendResponse);
        return true;
      default:
        return;
    }
  });
});

async function handleCreateBookmark(message: unknown): Promise<CreateBookmarkResponse> {
  const validationResult = validateCreateBookmarkRequest(message);
  if (!validationResult.ok) return validationResult;

  const { videoId, timestamp, title } = validationResult.value;
  return createBookmark(videoId, timestamp, title).then(
    (value) => ({ ok: true, value }),
    (error: unknown) => ({
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to save bookmark',
    }),
  );
}

function validateCreateBookmarkRequest(message: unknown): Result<CreateBookmarkRequest> {
  if (typeof message !== 'object' || message === null) 
    return { ok: false, error: 'Bookmark request must be an object' };
  
  const request = message as Partial<CreateBookmarkRequest>;
  if (typeof request.videoId !== 'string' || !request.videoId) 
    return { ok: false, error: 'Video ID is required' };
  
  if (
    typeof request.timestamp !== 'number' ||
    !Number.isSafeInteger(request.timestamp) ||
    request.timestamp < 0
  ) {
    return { ok: false, error: 'Timestamp must be a nonnegative whole second' };
  }

  if (request.title !== undefined && typeof request.title !== 'string') 
    return { ok: false, error: 'Video title must be text' };
  
  return { ok: true, value: request as CreateBookmarkRequest };
}
