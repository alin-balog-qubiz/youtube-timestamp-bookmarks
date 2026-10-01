import { storage } from 'wxt/utils/storage';

import { formatTimestamp } from '@/utils/bookmark-time';

import type { BookmarkDraft, CreateBookmarkResult, Video } from '@/models/bookmark';

const videoPrefix = 'videos:v1:';

const writeQueueTailByVideo = new Map<string, Promise<void>>();

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
  const storedVideo = await storage.getItem<Video>(key);
  const existingBookmark = storedVideo?.bookmarks[timestamp];
  const updatedTitle = title?.trim();
  const titleChanged = !!updatedTitle && updatedTitle !== storedVideo?.title;
  if (existingBookmark && !titleChanged)
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
  return storage.getItem<Video>(getVideoStorageKey(videoId));
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
    const video = await storage.getItem<Video>(key);
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
    const video = await storage.getItem<Video>(key);
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

export async function listVideos(): Promise<Video[]> {
  const items = await storage.snapshot('local');
  return Object.entries(items)
    .filter(([key]) => key.startsWith(videoPrefix))
    .map(([, value]) => value as Video)
    .filter((video) => Object.keys(video.bookmarks).length > 0);
}

function getVideoStorageKey(videoId: string) {
  return `local:${videoPrefix}${encodeURIComponent(videoId)}` as const;
}

function serializeVideoMutation<T>(videoId: string, operation: () => Promise<T>): Promise<T> {
  const previousWrite = writeQueueTailByVideo.get(videoId);
  const mutation = previousWrite ? previousWrite.then(operation) : operation();
  const queueTail = mutation.then(() => undefined, () => undefined);
  writeQueueTailByVideo.set(videoId, queueTail);
  void queueTail.then(() => {
    if (writeQueueTailByVideo.get(videoId) === queueTail)
      writeQueueTailByVideo.delete(videoId);
  });

  return mutation;
}
