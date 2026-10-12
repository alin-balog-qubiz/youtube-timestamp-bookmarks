import { browser } from 'wxt/browser';

import type { BookmarkDraft, CreateBookmarkResult, Video } from '@/models/bookmark';
import type {
  CreateBookmarkRequest,
  CreateBookmarkResponse,
  DeleteBookmarkRequest,
  DeleteBookmarkResponse,
  DeleteVideoBookmarksRequest,
  DeleteVideoBookmarksResponse,
  GetVideoRequest,
  GetVideoResponse,
  UpdateBookmarkRequest,
  UpdateBookmarkResponse,
} from '@/models/messages';

export async function createBookmark(
  videoId: string,
  timestamp: number,
  title?: string,
): Promise<CreateBookmarkResult> {
  const response = await browser.runtime.sendMessage<CreateBookmarkRequest, CreateBookmarkResponse>({
    type: 'bookmarks:create',
    videoId,
    timestamp,
    title,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Bookmark storage did not respond');
}

export async function getVideo(videoId: string): Promise<Video | null> {
  const response = await browser.runtime.sendMessage<GetVideoRequest, GetVideoResponse>({
    type: 'bookmarks:get-video',
    videoId,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Bookmark storage did not respond');
}

export async function updateBookmark(
  videoId: string,
  originalTimestamp: number,
  draft: BookmarkDraft,
  tabId: number,
): Promise<Video> {
  const response = await browser.runtime.sendMessage<UpdateBookmarkRequest, UpdateBookmarkResponse>({
    type: 'bookmarks:update',
    videoId,
    originalTimestamp,
    draft,
    tabId,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Bookmark storage did not respond');
}

export async function deleteBookmark(videoId: string, timestamp: number): Promise<Video | null> {
  const response = await browser.runtime.sendMessage<DeleteBookmarkRequest, DeleteBookmarkResponse>({
    type: 'bookmarks:delete',
    videoId,
    timestamp,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Bookmark storage did not respond');
}

export async function deleteVideoBookmarks(videoId: string): Promise<void> {
  const response = await browser.runtime.sendMessage<DeleteVideoBookmarksRequest, DeleteVideoBookmarksResponse>({
    type: 'bookmarks:delete-video',
    videoId,
  });
  if (response?.ok) return;

  throw new Error(response?.error ?? 'Bookmark storage did not respond');
}
