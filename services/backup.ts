import { storage } from 'wxt/utils/storage';

import {
  getVideoStorageKey,
  serializeLibraryMutation,
  videoStoragePrefix,
} from '@/services/bookmarks';
import {
  defaultMarkerPreferences,
  isMarkerColor,
  markerPreferencesStorageKey,
  validateMarkerPreferences,
} from '@/services/marker-preferences';

import type { Backup, ImportMode, ImportPreview } from '@/models/backup';
import type { Bookmark, Video } from '@/models/bookmark';

const backupFormat = 'youtube-timestamp-bookmarks';
const isoCreationDatePattern = /^(\d{4}|[+-]\d{6})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2})$/;
const daysByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

type StorageWrite = { key: `local:${string}`; value: Video | Backup['settings'] | null };

/** Validate and copy every version-1 field without normalizing metadata values. */
export function validateBackup(value: unknown): Backup {
  const backup = validateObject(value, 'Backup', ['format', 'version', 'videos', 'settings']);
  if (backup.format !== backupFormat)
    throw new Error(`Backup.format must be "${backupFormat}"`);
  if (backup.version !== 1)
    throw new Error('Backup.version must be 1; this backup version is not supported');
  if (!Array.isArray(backup.videos))
    throw new Error('Backup.videos must be an array');

  const videoIds = new Set<string>();
  const videos = backup.videos.map((value, index) => {
    const field = `Backup.videos[${index}]`;
    const video = validateVideo(value, field);
    if (videoIds.has(video.id))
      throw new Error(`${field}.id duplicates video ID "${video.id}"`);

    videoIds.add(video.id);
    return video;
  });
  videos.sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);

  return {
    format: backupFormat,
    version: 1,
    videos,
    settings: validateMarkerPreferences(backup.settings),
  };
}

function validateVideo(value: unknown, field: string): Video {
  const video = validateObject(value, field, ['id', 'title', 'bookmarks']);
  if (typeof video.id !== 'string' || !video.id.trim())
    throw new Error(`${field}.id must be nonblank text`);
  if (Object.hasOwn(video, 'title') && typeof video.title !== 'string')
    throw new Error(`${field}.title must be text when present`);

  const sourceBookmarks = validateObject(video.bookmarks, `${field}.bookmarks`);
  const bookmarks: Record<number, Bookmark> = {};
  const timestamps = Object.keys(sourceBookmarks).map((key) => {
    const timestamp = Number(key);
    if (!Number.isSafeInteger(timestamp) || timestamp < 0 || String(timestamp) !== key)
      throw new Error(`${field}.bookmarks["${key}"] must use a canonical nonnegative whole-second key`);

    return timestamp;
  });
  timestamps.sort((left, right) => left - right);
  for (const timestamp of timestamps) {
    const bookmarkField = `${field}.bookmarks["${timestamp}"]`;
    const bookmark = validateBookmark(sourceBookmarks[timestamp], bookmarkField);
    if (bookmark.timestamp !== timestamp)
      throw new Error(`${bookmarkField}.timestamp must match its bookmark key`);

    bookmarks[timestamp] = bookmark;
  }

  return {
    id: video.id,
    ...(typeof video.title === 'string' ? { title: video.title } : {}),
    bookmarks,
  };
}

function validateBookmark(value: unknown, field: string): Bookmark {
  const bookmark = validateObject(value, field, ['timestamp', 'createdAt', 'name', 'color']);
  if (
    typeof bookmark.timestamp !== 'number' ||
    !Number.isSafeInteger(bookmark.timestamp) ||
    bookmark.timestamp < 0
  )
    throw new Error(`${field}.timestamp must be a nonnegative safe whole second`);
  if (typeof bookmark.createdAt !== 'string' || !isIsoCreationDate(bookmark.createdAt))
    throw new Error(`${field}.createdAt must be a valid ISO creation date with a time zone`);
  if (Object.hasOwn(bookmark, 'name') && typeof bookmark.name !== 'string')
    throw new Error(`${field}.name must be text when present`);
  if (Object.hasOwn(bookmark, 'color') && !isMarkerColor(bookmark.color))
    throw new Error(`${field}.color must be a six-digit hex color (#rrggbb) when present`);

  return {
    timestamp: bookmark.timestamp,
    createdAt: bookmark.createdAt,
    ...(typeof bookmark.name === 'string' ? { name: bookmark.name } : {}),
    ...(typeof bookmark.color === 'string' ? { color: bookmark.color } : {}),
  };
}

function isIsoCreationDate(value: string): boolean {
  const parts = isoCreationDatePattern.exec(value);
  if (!parts || !Number.isFinite(Date.parse(value))) return false;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const hour = Number(parts[4]);
  const minute = Number(parts[5]);
  const second = Number(parts[6]);
  if (month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59)
    return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = month === 2 && isLeapYear ? 29 : daysByMonth[month - 1];
  return daysInMonth !== undefined && day >= 1 && day <= daysInMonth;
}

/** Background-only: the barrier makes the library and settings one consistent snapshot. */
export function getBackup(): Promise<Backup> {
  return serializeLibraryMutation(getBackupInStorage);
}

async function getBackupInStorage(): Promise<Backup> {
  const snapshot = await storage.snapshot('local');
  const videos = Object.entries(snapshot)
    .filter(([key, value]) => key.startsWith(videoStoragePrefix) && value !== null)
    .map(([, value]) => value);

  return validateBackup({
    format: backupFormat,
    version: 1,
    videos,
    settings: snapshot[markerPreferencesStorageKey.slice('local:'.length)] ?? defaultMarkerPreferences,
  });
}

/** Background-only: preview is read-only; confirmation must send this current snapshot back. */
export function previewImport(backup: Backup, mode: ImportMode): Promise<ImportPreview> {
  const incoming = validateBackup(backup);
  validateImportMode(mode);
  return serializeLibraryMutation(async () => {
    const current = await getBackupInStorage();
    return createImportPreview(current, incoming, mode);
  });
}

/** Background-only: recheck the preview and commit all affected records before returning success. */
export function importBackup(
  backup: Backup,
  mode: ImportMode,
  expectedCurrent: Backup,
): Promise<ImportPreview> {
  const incoming = validateBackup(backup);
  const expected = validateBackup(expectedCurrent);
  validateImportMode(mode);
  return serializeLibraryMutation(async () => {
    const current = await getBackupInStorage();
    if (JSON.stringify(current) !== JSON.stringify(expected))
      throw new Error('The library or settings changed since this preview. Create a new preview before importing.');

    const preview = createImportPreview(current, incoming, mode);
    const writes = mode === 'replace'
      ? createReplaceWrites(current, incoming)
      : createMergeWrites(current, incoming);
    if (writes.length > 0)
      await storage.setItems(writes);

    return preview;
  });
}

function createReplaceWrites(current: Backup, incoming: Backup): StorageWrite[] {
  const incomingIds = new Set(incoming.videos.map((video) => video.id));
  const writes: StorageWrite[] = [];
  for (const video of current.videos) {
    if (!incomingIds.has(video.id))
      writes.push({ key: getVideoStorageKey(video.id), value: null });
  }
  for (const video of incoming.videos)
    writes.push({ key: getVideoStorageKey(video.id), value: video });
  writes.push({ key: markerPreferencesStorageKey, value: incoming.settings });

  // WXT setItems forwards null to one local storage.set batch. Tombstones hide removed
  // records without separate removes that could lose data if the replacement write fails.
  return writes;
}

function createMergeWrites(current: Backup, incoming: Backup): StorageWrite[] {
  const currentById = new Map(current.videos.map((video) => [video.id, video]));
  const writes: StorageWrite[] = [];
  for (const video of incoming.videos) {
    const existing = currentById.get(video.id);
    const additions = Object.entries(video.bookmarks)
      .filter(([timestamp]) => !existing || !Object.hasOwn(existing.bookmarks, timestamp));
    if (additions.length === 0) continue;

    const mergedVideo = existing
      ? { ...existing, bookmarks: { ...existing.bookmarks, ...Object.fromEntries(additions) } }
      : video;
    writes.push({ key: getVideoStorageKey(video.id), value: mergedVideo });
  }

  return writes;
}

function createImportPreview(current: Backup, incoming: Backup, mode: ImportMode): ImportPreview {
  const currentById = new Map(current.videos.map((video) => [video.id, video]));
  const currentBookmarks = current.videos
    .reduce((count, video) => count + Object.keys(video.bookmarks).length, 0);
  const incomingBookmarks = incoming.videos
    .reduce((count, video) => count + Object.keys(video.bookmarks).length, 0);
  let skippedDuplicates = 0;
  if (mode === 'merge') {
    for (const video of incoming.videos) {
      const existing = currentById.get(video.id);
      if (!existing) continue;

      skippedDuplicates += Object.keys(video.bookmarks)
        .filter((timestamp) => Object.hasOwn(existing.bookmarks, timestamp)).length;
    }
  }

  return {
    current,
    incoming,
    mode,
    additions: incomingBookmarks - skippedDuplicates,
    skippedDuplicates,
    currentVideos: current.videos.filter((video) => Object.keys(video.bookmarks).length > 0).length,
    currentBookmarks,
    incomingVideos: incoming.videos.filter((video) => Object.keys(video.bookmarks).length > 0).length,
    incomingBookmarks,
  };
}

function validateImportMode(mode: ImportMode): void {
  if (mode !== 'merge' && mode !== 'replace')
    throw new Error('Import mode must be merge or replace');
}

function validateObject(value: unknown, field: string, allowedFields?: string[]): Record<string, unknown> {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  )
    throw new Error(`${field} must be an object`);

  const object = value as Record<string, unknown>;
  if (allowedFields) {
    for (const key of Object.keys(object)) {
      if (!allowedFields.includes(key))
        throw new Error(`${field}.${key} is not supported in backup version 1`);
    }
  }

  return object;
}
