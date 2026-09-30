import { browser } from 'wxt/browser';
import type { CreateBookmarkResult } from '@/models/bookmark';
import type { CreateBookmarkRequest, CreateBookmarkResponse } from '@/models/messages';

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
