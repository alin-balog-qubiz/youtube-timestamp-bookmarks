import { browser } from 'wxt/browser';

import {
  createBookmark,
  deleteBookmark,
  deleteVideoBookmarks,
  getVideo,
  updateBookmark,
} from '@/services/bookmarks';
import { isMarkerColor } from '@/services/marker-preferences';
import { registerMessageHandlers } from '@/services/messages';
import { getCurrentPage } from '@/utils/current-page';

import type { BookmarkDraft } from '@/models/bookmark';
import type {
  CreateBookmarkResponse,
  DeleteBookmarkResponse,
  DeleteVideoBookmarksResponse,
  GetActiveVideoRequest,
  GetActiveVideoResponse,
  GetPlayerDurationRequest,
  GetPlayerDurationResponse,
  GetVideoResponse,
  Result,
  UpdateBookmarkResponse,
} from '@/models/messages';

const changedContextError = 'The active video changed or is unavailable. Close and reopen the editor.';

export function registerBookmarkHandlers(): () => void {
  return registerMessageHandlers({
    'bookmarks:create': handleCreateBookmark,
    'bookmarks:get-video': handleGetVideo,
    'bookmarks:update': handleUpdateBookmark,
    'bookmarks:delete': handleDeleteBookmark,
    'bookmarks:delete-video': handleDeleteVideoBookmarks,
  });
}

function handleCreateBookmark(message: unknown): Promise<CreateBookmarkResponse> {
  return executeBookmarkOperation(async () => {
    const request = validateVideoRequest(message);
    validateTimestamp(request.timestamp, 'Timestamp');

    if (request.title !== undefined && typeof request.title !== 'string')
      throw new Error('Video title must be text');

    return createBookmark(request.videoId, request.timestamp, request.title);
  }, 'Unable to save bookmark');
}

function handleGetVideo(message: unknown): Promise<GetVideoResponse> {
  return executeBookmarkOperation(async () => {
    const request = validateVideoRequest(message);
    return getVideo(request.videoId);
  }, 'Unable to load bookmarks');
}

function handleUpdateBookmark(message: unknown): Promise<UpdateBookmarkResponse> {
  return executeBookmarkOperation(async () => {
    const request = validateVideoRequest(message);
    validateTimestamp(request.originalTimestamp, 'Original timestamp');

    if (
      typeof request.tabId !== 'number' ||
      !Number.isSafeInteger(request.tabId) ||
      request.tabId < 0
    )
      throw new Error('Source tab ID must be a nonnegative integer');

    const draft = validateBookmarkDraft(request.draft);
    const { videoId, originalTimestamp, tabId } = request;
    return updateBookmark(videoId, originalTimestamp, draft, () => guardBookmarkUpdate(
      tabId, videoId, originalTimestamp, draft.timestamp,
    ));
  }, 'Unable to update bookmark');
}

function validateBookmarkDraft(value: unknown): BookmarkDraft {
  if (typeof value !== 'object' || value === null)
    throw new Error('Bookmark draft must be an object');

  const draft = value as Record<string, unknown>;
  validateTimestamp(draft.timestamp, 'Draft timestamp');

  if (draft.name !== undefined && typeof draft.name !== 'string')
    throw new Error('Bookmark name must be text');

  if (draft.color !== undefined && !isMarkerColor(draft.color))
    throw new Error('Bookmark color must be a six-digit hex color (#rrggbb) or Use default');

  return { timestamp: draft.timestamp, name: draft.name, color: draft.color };
}

async function guardBookmarkUpdate(
  tabId: number,
  videoId: string,
  originalTimestamp: number,
  timestamp: number,
): Promise<void> {
  await validateActiveEditTab(tabId, videoId);
  await validateActiveEditVideo(tabId, videoId);

  if (timestamp !== originalTimestamp) {
    const durationRequest: GetPlayerDurationRequest = { type: 'player:get-duration', videoId };
    const durationResponse: GetPlayerDurationResponse | undefined = await browser.tabs.sendMessage(
      tabId,
      durationRequest,
    );
    if (!durationResponse?.ok)
      throw new Error(durationResponse?.error ?? 'Unable to read the active player duration');

    const duration = durationResponse.value;
    if (duration === null || !Number.isFinite(duration) || duration < 0)
      throw new Error('The active player duration is unavailable. Reopen the editor when it is ready.');

    if (timestamp > Math.floor(duration))
      throw new Error('The bookmark timestamp is outside the active player duration.');
  }

  await validateActiveEditVideo(tabId, videoId);
  await validateActiveEditTab(tabId, videoId);
}

async function validateActiveEditVideo(tabId: number, videoId: string): Promise<void> {
  const request: GetActiveVideoRequest = { type: 'player:get-active-video' };
  const response: GetActiveVideoResponse | undefined = await browser.tabs.sendMessage(tabId, request);
  if (!response?.ok)
    throw new Error(response?.error ?? 'Unable to read the active video');

  if (response.value?.videoId !== videoId)
    throw new Error(changedContextError);
}

async function validateActiveEditTab(tabId: number, videoId: string): Promise<void> {
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  if (
    tab?.id !== tabId ||
    !tab.url ||
    tab.status === 'loading' ||
    getCurrentPage(tab.url).videoId !== videoId
  )
    throw new Error(changedContextError);
}

function handleDeleteBookmark(message: unknown): Promise<DeleteBookmarkResponse> {
  return executeBookmarkOperation(async () => {
    const request = validateVideoRequest(message);
    validateTimestamp(request.timestamp, 'Timestamp');

    return deleteBookmark(request.videoId, request.timestamp);
  }, 'Unable to delete bookmark');
}

function handleDeleteVideoBookmarks(message: unknown): Promise<DeleteVideoBookmarksResponse> {
  return executeBookmarkOperation(async () => {
    const request = validateVideoRequest(message);
    await deleteVideoBookmarks(request.videoId);

    return null;
  }, 'Unable to delete this video’s bookmarks');
}

function validateVideoRequest(message: unknown): Record<string, unknown> & { videoId: string } {
  if (typeof message !== 'object' || message === null)
    throw new Error('Bookmark request must be an object');

  const request = message as Record<string, unknown>;
  if (typeof request.videoId !== 'string' || !request.videoId.trim())
    throw new Error('Video ID must be nonblank text');

  return request as Record<string, unknown> & { videoId: string };
}

function validateTimestamp(value: unknown, field: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw new Error(`${field} must be a nonnegative whole second`);
}

async function executeBookmarkOperation<T>(operation: () => Promise<T>, fallbackError: string): Promise<Result<T>> {
  try {
    return { ok: true, value: await operation() };
  } catch (error) {
    const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    return { ok: false, error: detail.trim() ? detail : fallbackError };
  }
}
