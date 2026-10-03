import { storage } from 'wxt/utils/storage';

import { formatTimestamp } from '@/utils/bookmark-time';

import { validateColorChoice, validateLegacyColor } from '@/models/appearance';
import type { BookmarkDraft, CreateBookmarkResult, Video } from '@/models/bookmark';

export const videoStoragePrefix = 'videos:v1:';

const writeQueueTailByVideo = new Map<string, Promise<void>>();
let libraryQueueTail = Promise.resolve();

/** Background-only: duplicate saves retain bookmark metadata but may refresh the video title. */
export function createBookmark(
  videoId: string,
  timestamp: number,
  title?: string,
): Promise<CreateBookmarkResult> {
  return serializeVideoMutation(videoId, () => createBookmarkInStorage(videoId, timestamp, title));
}

async function createBookmarkInStorage(
  videoId: string,
  timestamp: number,
  title?: string,
): Promise<CreateBookmarkResult> {
  const key = getVideoStorageKey(videoId);
  const savedVideo = await storage.getItem<Video>(key);
  const storedVideo = savedVideo ? normalizeStoredVideo(savedVideo) : null;
  const existingBookmark = storedVideo?.bookmarks[timestamp];
  const updatedTitle = title?.trim();
  const titleChanged = !!updatedTitle && updatedTitle !== storedVideo?.title;
  if (existingBookmark && !titleChanged && storedVideo === savedVideo)
    return 'already-saved';

  const video: Video = storedVideo
    ? { ...storedVideo, bookmarks: existingBookmark ? storedVideo.bookmarks : { ...storedVideo.bookmarks } }
    : { id: videoId, bookmarks: {} };
  if (updatedTitle)
    video.title = updatedTitle;

  if (!existingBookmark)
    video.bookmarks[timestamp] = { timestamp, createdAt: new Date().toISOString() };

  await storage.setItem(key, video);

  return existingBookmark ? 'already-saved' : 'saved';
}

export async function getVideo(videoId: string): Promise<Video | null> {
  const video = await storage.getItem<Video>(getVideoStorageKey(videoId));
  return video ? normalizeStoredVideo(video) : null;
}

/** Background-only: accepts a validated draft and runs the live-context guard while holding the video's mutation queue. */
export function updateBookmark(
  videoId: string,
  originalTimestamp: number,
  draft: BookmarkDraft,
  guard: () => Promise<void>,
): Promise<Video> {
  return serializeVideoMutation(videoId, async () => {
    const key = getVideoStorageKey(videoId);
    const video = await getVideo(videoId);
    const bookmark = video?.bookmarks[originalTimestamp];
    if (!video || !bookmark)
      throw new Error('This bookmark no longer exists. Close and reopen the editor.');

    if (draft.timestamp !== originalTimestamp && video.bookmarks[draft.timestamp])
      throw new Error(`A bookmark already exists at ${formatTimestamp(draft.timestamp)}.`);

    const name = draft.name?.trim();
    const bookmarks = { ...video.bookmarks };
    delete bookmarks[originalTimestamp];
    bookmarks[draft.timestamp] = {
      timestamp: draft.timestamp,
      createdAt: bookmark.createdAt,
      ...(name ? { name } : {}),
      ...(draft.color ? { color: draft.color } : {}),
    };

    const updatedVideo = { ...video, bookmarks };

    await guard();
    await storage.setItem(key, updatedVideo);

    return updatedVideo;
  });
}

export function deleteBookmark(videoId: string, timestamp: number): Promise<Video | null> {
  return serializeVideoMutation(videoId, async () => {
    const key = getVideoStorageKey(videoId);
    const video = await getVideo(videoId);
    if (!video || !video.bookmarks[timestamp]) return video;

    const bookmarks = { ...video.bookmarks };
    delete bookmarks[timestamp];

    if (Object.keys(bookmarks).length === 0) {
      await storage.removeItem(key);

      return null;
    }

    const updatedVideo = { ...video, bookmarks };
    await storage.setItem(key, updatedVideo);

    return updatedVideo;
  });
}

export function deleteVideoBookmarks(videoId: string): Promise<void> {
  return serializeVideoMutation(videoId, () => storage.removeItem(getVideoStorageKey(videoId)));
}

/**
 * Background-only: wait for existing video writes and earlier library operations.
 * Video writes queued afterward wait for this barrier; operations must not nest it.
 */
export function serializeLibraryMutation<T>(operation: () => Promise<T>): Promise<T> {
  const previousWrites = [libraryQueueTail, ...writeQueueTailByVideo.values()];
  const mutation = Promise.all(previousWrites).then(operation);
  libraryQueueTail = mutation.then(() => undefined, () => undefined);

  return mutation;
}

export async function listVideos(): Promise<Video[]> {
  const items = await storage.snapshot('local');
  return Object.entries(items)
    .filter(([key, value]) => key.startsWith(videoStoragePrefix) && value !== null)
    .map(([, value]) => normalizeStoredVideo(value as Video))
    .filter((video) => Object.keys(video.bookmarks).length > 0);
}

/** Read-only normalization; callers persist migrated records only through the background queues. */
export function normalizeStoredVideo(video: Video): Video {
  let bookmarks: Video['bookmarks'] | undefined;
  for (const [timestamp, bookmark] of Object.entries(video.bookmarks)) {
    if (!Object.hasOwn(bookmark, 'color')) continue;

    const field = `Video "${video.id}".bookmarks["${timestamp}"].color`;
    if (typeof bookmark.color !== 'string') {
      validateColorChoice(bookmark.color, field);
      continue;
    }

    const color = validateLegacyColor(bookmark.color, field);
    bookmarks ??= { ...video.bookmarks };
    bookmarks[Number(timestamp)] = { ...bookmark, color };
  }

  return bookmarks ? { ...video, bookmarks } : video;
}

export function getVideoStorageKey(videoId: string) {
  return `local:${videoStoragePrefix}${encodeURIComponent(videoId)}` as const;
}

function serializeVideoMutation<T>(videoId: string, operation: () => Promise<T>): Promise<T> {
  const previousWrite = writeQueueTailByVideo.get(videoId) ?? Promise.resolve();
  const mutation = Promise.all([libraryQueueTail, previousWrite]).then(operation);
  const queueTail = mutation.then(() => undefined, () => undefined);
  writeQueueTailByVideo.set(videoId, queueTail);
  void queueTail.then(() => {
    if (writeQueueTailByVideo.get(videoId) === queueTail)
      writeQueueTailByVideo.delete(videoId);
  });

  return mutation;
}
