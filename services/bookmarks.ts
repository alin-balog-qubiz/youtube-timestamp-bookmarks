import { storage } from 'wxt/utils/storage';
import type { CreateBookmarkResult, Video } from '@/models/bookmark';

const videoPrefix = 'videos:v1:';

const writeQueueTailByVideo = new Map<string, Promise<void>>();

export function createBookmark(
  videoId: string,
  timestamp: number,
  title?: string,
): Promise<CreateBookmarkResult> {
  const previousWrite = writeQueueTailByVideo.get(videoId);
  const bookmarkCreation = previousWrite
    ? previousWrite.then(() => createBookmarkInStorage(videoId, timestamp, title))
    : createBookmarkInStorage(videoId, timestamp, title);

  const queueTail = bookmarkCreation.then(() => undefined, () => undefined);
  writeQueueTailByVideo.set(videoId, queueTail);
  void queueTail.then(() => {
    if (writeQueueTailByVideo.get(videoId) === queueTail) 
      writeQueueTailByVideo.delete(videoId);
  });

  return bookmarkCreation;
}

async function createBookmarkInStorage(
  videoId: string,
  timestamp: number,
  title?: string,
): Promise<CreateBookmarkResult> {
  const key = getVideoStorageKey(videoId);
  const video: Video = await storage.getItem<Video>(key) ?? { id: videoId, bookmarks: {} };
  const existingBookmark = video.bookmarks[timestamp];
  const updatedTitle = title?.trim();
  const titleChanged = !!updatedTitle && updatedTitle !== video.title;

  if (existingBookmark && !titleChanged) 
    return 'already-saved';

  if (updatedTitle) 
    video.title = updatedTitle;

  if (!existingBookmark) 
    video.bookmarks[timestamp] = { timestamp, createdAt: new Date().toISOString() };

  await storage.setItem(key, video);
  return existingBookmark ? 'already-saved' : 'saved';
}

function getVideoStorageKey(videoId: string) {
  return `local:${videoPrefix}${encodeURIComponent(videoId)}` as const;
}

export async function listVideos(): Promise<Video[]> {
  const items = await storage.snapshot('local');
  return Object.entries(items)
    .filter(([key]) => key.startsWith(videoPrefix))
    .map(([, value]) => value as Video);
}
