import { browser } from 'wxt/browser';
import { storage } from 'wxt/utils/storage';

import {
  getVideoStorageKey,
  serializeLibraryMutation,
  videoStoragePrefix,
} from '@/services/storage/bookmarks';

import { validateColorChoice } from '@/models/appearance';
import type {
  Backup,
  ExportReview,
  ImportCommit,
  ImportConflict,
  ImportDiagnostic,
  ImportDuplicate,
  ImportMode,
  ImportPreview,
  ValidatedImport,
} from '@/models/backup';
import type { Bookmark, Video } from '@/models/bookmark';

const backupFormat = 'youtube-timestamp-bookmarks';
const semVerPattern = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;
const isoCreationDatePattern = /^(\d{4}|[+-]\d{6})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-](\d{2}):(\d{2}))$/;
const daysByMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

type StorageWrite = { key: `local:${string}`; value: Video | null };

/** Validate the schema-1 envelope, retaining every record omission for review. */
export function validateBackup(value: unknown): ValidatedImport {
  const backup = validateEnvelope(value);
  const videoIdCounts = new Map<string, number>();
  for (const value of backup.videos) {
    if (!isObject(value) || typeof value.id !== 'string' || !value.id.trim()) continue;
    videoIdCounts.set(value.id, (videoIdCounts.get(value.id) ?? 0) + 1);
  }

  const videos: Video[] = [];
  const diagnostics: ImportDiagnostic[] = [];
  for (const [index, value] of backup.videos.entries()) {
    const location = `Backup.videos[${index}]`;
    const videoId = isObject(value) && typeof value.id === 'string' ? value.id : undefined;
    const videoTitle = isObject(value) && typeof value.title === 'string' ? value.title : undefined;
    const bookmarkCount = isObject(value) && Array.isArray(value.bookmarks) ? value.bookmarks.length : 0;
    if (videoId !== undefined && (videoIdCounts.get(videoId) ?? 0) > 1) {
      diagnostics.push({
        location,
        videoId,
        ...(videoTitle !== undefined ? { videoTitle } : {}),
        reason: `Repeated video ID "${videoId}"; every record with this identity is skipped`,
        skippedVideos: 1,
        skippedBookmarks: bookmarkCount,
      });
      continue;
    }

    const timestampCounts = new Map<number, number>();
    if (isObject(value) && Array.isArray(value.bookmarks)) {
      for (const bookmark of value.bookmarks) {
        if (!isObject(bookmark) || !isTimestamp(bookmark.timestamp)) continue;
        timestampCounts.set(bookmark.timestamp, (timestampCounts.get(bookmark.timestamp) ?? 0) + 1);
      }
    }

    let source: Record<string, unknown> & { id: string; bookmarks: unknown[] };
    try {
      source = validateVideoRecord(value, location);
    } catch (error) {
      diagnostics.push({
        location,
        ...(videoId !== undefined ? { videoId } : {}),
        ...(videoTitle !== undefined ? { videoTitle } : {}),
        reason: error instanceof Error ? error.message : 'Record validation failed',
        skippedVideos: 1,
        skippedBookmarks: bookmarkCount,
      });
      continue;
    }

    const bookmarks: Video['bookmarks'] = {};
    for (const [bookmarkIndex, value] of source.bookmarks.entries()) {
      const bookmarkLocation = `${location}.bookmarks[${bookmarkIndex}]`;
      const timestamp = isObject(value) && isTimestamp(value.timestamp) ? value.timestamp : undefined;
      if (timestamp !== undefined && (timestampCounts.get(timestamp) ?? 0) > 1) {
        diagnostics.push({
          location: bookmarkLocation,
          videoId: source.id,
          ...(videoTitle !== undefined ? { videoTitle } : {}),
          timestamp,
          reason: `Repeated timestamp ${timestamp}; every bookmark at this second is skipped`,
          skippedVideos: 0,
          skippedBookmarks: 1,
        });
        continue;
      }

      try {
        const bookmark = validateBookmark(value, bookmarkLocation);
        bookmarks[bookmark.timestamp] = bookmark;
      } catch (error) {
        diagnostics.push({
          location: bookmarkLocation,
          videoId: source.id,
          ...(videoTitle !== undefined ? { videoTitle } : {}),
          ...(timestamp !== undefined ? { timestamp } : {}),
          reason: error instanceof Error ? error.message : 'Record validation failed',
          skippedVideos: 0,
          skippedBookmarks: 1,
        });
      }
    }

    if (Object.keys(bookmarks).length === 0) {
      diagnostics.push({
        location,
        videoId: source.id,
        ...(videoTitle !== undefined ? { videoTitle } : {}),
        reason: source.bookmarks.length === 0 ? 'Video has no bookmarks' : 'Video has no accepted bookmarks',
        skippedVideos: 1,
        skippedBookmarks: 0,
      });
      continue;
    }

    videos.push({
      id: source.id,
      ...(typeof source.title === 'string' ? { title: source.title } : {}),
      bookmarks,
    });
  }

  return {
    videos,
    diagnostics,
    skippedVideos: diagnostics.reduce((count, diagnostic) => count + diagnostic.skippedVideos, 0),
    skippedBookmarks: diagnostics.reduce((count, diagnostic) => count + diagnostic.skippedBookmarks, 0),
  };
}

/** Background-only: coordinate the library snapshot without reading preferences. */
export function getBackup(selectedVideoIds?: string[]): Promise<Backup> {
  const selected = selectedVideoIds === undefined ? undefined : validateSelection(selectedVideoIds);
  return serializeLibraryMutation(async () => {
    const videos = await getLibraryInStorage();
    const backup = createBackup(videos);
    if (selected === undefined) return backup;

    const subset = selectBackupVideos(backup, selected);
    if (subset.videos.length !== selected.length)
      throw new Error('A selected video no longer has bookmarks. Refresh the export selection.');

    return subset;
  });
}

/** Background-only: return a refreshed selected subset rather than downloading stale data. */
export function reviewExport(selectedVideoIds: string[], expectedCurrent: Backup): Promise<ExportReview> {
  const selected = validateSelection(selectedVideoIds);
  const expected = validateCompleteBackup(expectedCurrent);
  const expectedSubset = selectBackupVideos(expected, selected);
  if (expectedSubset.videos.length !== selected.length)
    throw new Error('Export selection must identify videos in the reviewed snapshot');

  return serializeLibraryMutation<ExportReview>(async () => {
    const current = selectBackupVideos(createBackup(await getLibraryInStorage()), selected);
    const status = canonicalBackup(current) === canonicalBackup(expectedSubset) ? 'ready' : 'stale';
    return { status, backup: current };
  });
}

/** Background-only: validate the whole source, then review the selected accepted records. */
export function previewImport(
  incoming: unknown,
  mode: ImportMode,
  selectedVideoIds: string[],
): Promise<ImportPreview> {
  const validated = validateBackup(incoming);
  validateImportMode(mode);
  const selected = validateSelection(selectedVideoIds, true);
  const videos = selectIncomingVideos(validated, selected);
  return serializeLibraryMutation(async () => {
    const current = createBackup(await getLibraryInStorage());
    return createImportPreview(current, incoming, validated, videos, selected, mode);
  });
}

/** Background-only: revalidate, recheck the reviewed effect, and persist one library batch. */
export function importBackup(
  incoming: unknown,
  mode: ImportMode,
  selectedVideoIds: string[],
  expectedCurrent: Backup,
): Promise<ImportCommit> {
  const validated = validateBackup(incoming);
  validateImportMode(mode);
  const selected = validateSelection(selectedVideoIds);
  const videos = selectIncomingVideos(validated, selected);
  if (videos.length === 0)
    throw new Error('Select at least one video with valid bookmarks before importing');
  const expected = validateCompleteBackup(expectedCurrent);

  return serializeLibraryMutation<ImportCommit>(async () => {
    const storedVideos = await getLibraryInStorage();
    const current = createBackup(storedVideos);
    const preview = createImportPreview(current, incoming, validated, videos, selected, mode);
    const isStale = mode === 'replace'
      ? canonicalBackup(current) !== canonicalBackup(expected)
      : canonicalMergeCurrent(current, videos) !== canonicalMergeCurrent(expected, videos);
    if (isStale) return { status: 'stale', preview };
    if (mode === 'merge' && preview.additions === 0)
      throw new Error('Nothing new to import');

    const writes = mode === 'replace'
      ? createReplaceWrites(storedVideos, videos)
      : createMergeWrites(storedVideos, videos);
    // Null tombstones and accepted records share one storage.set batch: there are
    // no separate removals that could survive a failed replacement write.
    await storage.setItems(writes);

    return { status: 'committed', preview };
  });
}

function createReplaceWrites(current: Video[], incoming: Video[]): StorageWrite[] {
  const incomingIds = new Set(incoming.map((video) => video.id));
  const writes: StorageWrite[] = [];
  for (const video of current) {
    if (!incomingIds.has(video.id))
      writes.push({ key: getVideoStorageKey(video.id), value: null });
  }
  for (const video of incoming)
    writes.push({ key: getVideoStorageKey(video.id), value: video });

  return writes;
}

function createMergeWrites(current: Video[], incoming: Video[]): StorageWrite[] {
  const currentById = new Map(current
    .filter((video) => Object.keys(video.bookmarks).length > 0)
    .map((video) => [video.id, video]));
  const writes: StorageWrite[] = [];
  for (const video of incoming) {
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

function createImportPreview(
  current: Backup,
  incoming: unknown,
  validated: ValidatedImport,
  videos: Video[],
  selectedVideoIds: string[],
  mode: ImportMode,
): ImportPreview {
  const currentById = new Map(current.videos.map((video) => [video.id, video]));
  const duplicates: ImportDuplicate[] = [];
  const conflicts: ImportConflict[] = [];
  let additions = 0;
  let addedVideos = 0;
  let skippedConflicts = 0;
  for (const video of videos) {
    const existing = currentById.get(video.id);
    if (mode === 'replace' || !existing) {
      additions += Object.keys(video.bookmarks).length;
      addedVideos += 1;
      continue;
    }

    const videoTitle = video.title?.trim() ? video.title : existing.title;
    if (existing.title !== video.title) {
      conflicts.push({
        videoId: video.id,
        ...(videoTitle !== undefined ? { videoTitle } : {}),
        fields: [{ field: 'title', existing: existing.title, incoming: video.title }],
      });
    }

    const existingBookmarks = new Map(existing.bookmarks.map((bookmark) => [bookmark.timestamp, bookmark]));
    for (const bookmark of Object.values(video.bookmarks)) {
      const stored = existingBookmarks.get(bookmark.timestamp);
      if (!stored) {
        additions += 1;
        continue;
      }

      const fields: ImportConflict['fields'] = [];
      if (stored.name !== bookmark.name)
        fields.push({ field: 'name', existing: stored.name, incoming: bookmark.name });
      if (canonicalColor(stored.color) !== canonicalColor(bookmark.color))
        fields.push({ field: 'color', existing: stored.color, incoming: bookmark.color });
      if (Date.parse(stored.createdAt) !== Date.parse(bookmark.createdAt))
        fields.push({ field: 'createdAt', existing: stored.createdAt, incoming: bookmark.createdAt });

      if (fields.length === 0) {
        duplicates.push({
          videoId: video.id,
          ...(videoTitle !== undefined ? { videoTitle } : {}),
          timestamp: bookmark.timestamp,
        });
      } else {
        conflicts.push({
          videoId: video.id,
          ...(videoTitle !== undefined ? { videoTitle } : {}),
          timestamp: bookmark.timestamp,
          fields,
        });
        skippedConflicts += 1;
      }
    }
  }

  return {
    current,
    incoming,
    selectedVideoIds,
    mode,
    additions,
    addedVideos,
    skippedDuplicates: duplicates.length,
    skippedConflicts,
    currentVideos: current.videos.length,
    currentBookmarks: current.videos.reduce((count, video) => count + video.bookmarks.length, 0),
    incomingVideos: videos.length,
    incomingBookmarks: videos.reduce((count, video) => count + Object.keys(video.bookmarks).length, 0),
    diagnostics: validated.diagnostics.map((diagnostic) => {
      if (diagnostic.videoTitle?.trim() || diagnostic.videoId === undefined) return diagnostic;

      const videoTitle = currentById.get(diagnostic.videoId)?.title;
      return videoTitle?.trim() ? { ...diagnostic, videoTitle } : diagnostic;
    }),
    skippedVideos: validated.skippedVideos,
    skippedBookmarks: validated.skippedBookmarks,
    duplicates,
    conflicts,
  };
}

async function getLibraryInStorage(): Promise<Video[]> {
  const snapshot = await storage.snapshot('local');
  const videos: Video[] = [];
  for (const [key, value] of Object.entries(snapshot)) {
    if (!key.startsWith(videoStoragePrefix) || value === null) continue;
    const source = validateObject(value, `Stored video "${key}"`, ['id', 'title', 'bookmarks']);
    if (typeof source.id !== 'string' || !source.id.trim())
      throw new Error(`Stored video "${key}".id must be nonblank text`);
    if (Object.hasOwn(source, 'title') && typeof source.title !== 'string')
      throw new Error(`Stored video "${key}".title must be text when present`);
    if (getVideoStorageKey(source.id).slice('local:'.length) !== key)
      throw new Error(`Stored video "${key}" does not match its video identity`);

    const sourceBookmarks = validateObject(source.bookmarks, `Stored video "${key}".bookmarks`);
    const bookmarks: Video['bookmarks'] = {};
    for (const [timestampKey, value] of Object.entries(sourceBookmarks)) {
      const timestamp = Number(timestampKey);
      if (!isTimestamp(timestamp) || String(timestamp) !== timestampKey)
        throw new Error(`Stored video "${key}".bookmarks["${timestampKey}"] must use a canonical whole-second key`);
      const bookmark = validateBookmark(value, `Stored video "${key}".bookmarks["${timestampKey}"]`);
      if (bookmark.timestamp !== timestamp)
        throw new Error(`Stored video "${key}".bookmarks["${timestampKey}"].timestamp must match its key`);
      bookmarks[timestamp] = bookmark;
    }

    videos.push({
      id: source.id,
      ...(typeof source.title === 'string' ? { title: source.title } : {}),
      bookmarks,
    });
  }

  return videos;
}

function createBackup(videos: Video[]): Backup {
  const manifest = browser.runtime.getManifest();
  const appVersion = manifest.version_name ?? manifest.version;
  if (!semVerPattern.test(appVersion) || appVersion.trim() !== appVersion)
    throw new Error('The extension manifest version must be valid SemVer to export a backup');

  return {
    format: backupFormat,
    schemaVersion: 1,
    appVersion,
    videos: videos
      .filter((video) => Object.keys(video.bookmarks).length > 0)
      .map((video) => ({
        id: video.id,
        ...(video.title !== undefined ? { title: video.title } : {}),
        bookmarks: Object.values(video.bookmarks).sort((left, right) => left.timestamp - right.timestamp),
      }))
      .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0),
  };
}

function validateEnvelope(value: unknown): Record<string, unknown> & { appVersion: string; videos: unknown[] } {
  const backup = validateObject(value, 'Backup', ['format', 'schemaVersion', 'appVersion', 'videos']);
  if (backup.format !== backupFormat)
    throw new Error(`Backup.format must be "${backupFormat}"`);
  if (backup.schemaVersion !== 1)
    throw new Error('Backup.schemaVersion must be 1; this schema is not supported');
  if (typeof backup.appVersion !== 'string' || !semVerPattern.test(backup.appVersion) || backup.appVersion.trim() !== backup.appVersion)
    throw new Error('Backup.appVersion must be a valid SemVer string');
  if (!Array.isArray(backup.videos))
    throw new Error('Backup.videos must be an array');

  return { ...backup, appVersion: backup.appVersion, videos: backup.videos };
}

function validateCompleteBackup(value: unknown): Backup {
  const validated = validateBackup(value);
  const [diagnostic] = validated.diagnostics;
  if (diagnostic)
    throw new Error(`Reviewed snapshot is invalid: ${diagnostic.reason}`);
  const envelope = validateEnvelope(value);

  return {
    format: backupFormat,
    schemaVersion: 1,
    appVersion: envelope.appVersion,
    videos: validated.videos.map((video) => ({
      id: video.id,
      ...(video.title !== undefined ? { title: video.title } : {}),
      bookmarks: Object.values(video.bookmarks),
    })),
  };
}

function validateVideoRecord(value: unknown, field: string): Record<string, unknown> & { id: string; bookmarks: unknown[] } {
  const video = validateObject(value, field, ['id', 'title', 'bookmarks']);
  if (typeof video.id !== 'string' || !video.id.trim())
    throw new Error(`${field}.id must be nonblank text`);
  if (Object.hasOwn(video, 'title') && typeof video.title !== 'string')
    throw new Error(`${field}.title must be text when present`);
  if (!Array.isArray(video.bookmarks))
    throw new Error(`${field}.bookmarks must be an array`);

  return { ...video, id: video.id, bookmarks: video.bookmarks };
}

function validateBookmark(value: unknown, field: string): Bookmark {
  const bookmark = validateObject(value, field, ['timestamp', 'createdAt', 'name', 'color']);
  if (!isTimestamp(bookmark.timestamp))
    throw new Error(`${field}.timestamp must be a nonnegative safe whole second`);
  if (typeof bookmark.createdAt !== 'string' || !isIsoCreationDate(bookmark.createdAt))
    throw new Error(`${field}.createdAt must be a valid ISO creation date with a time zone`);
  if (Object.hasOwn(bookmark, 'name') && typeof bookmark.name !== 'string')
    throw new Error(`${field}.name must be text when present`);
  const color = Object.hasOwn(bookmark, 'color')
    ? validateColorChoice(bookmark.color, `${field}.color`)
    : undefined;

  return {
    timestamp: bookmark.timestamp,
    createdAt: bookmark.createdAt,
    ...(typeof bookmark.name === 'string' ? { name: bookmark.name } : {}),
    ...(color ? { color } : {}),
  };
}

function isIsoCreationDate(value: string): boolean {
  const parts = isoCreationDatePattern.exec(value);
  if (!parts || parts[0] !== value || !Number.isFinite(Date.parse(value))) return false;

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);
  const hour = Number(parts[4]);
  const minute = Number(parts[5]);
  const second = Number(parts[6]);
  if (parts[1] === '-000000' || month < 1 || month > 12 || hour > 23 || minute > 59 || second > 59)
    return false;
  if (parts[7] !== 'Z' && (Number(parts[8]) > 23 || Number(parts[9]) > 59))
    return false;

  const isLeapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysInMonth = month === 2 && isLeapYear ? 29 : daysByMonth[month - 1];
  return daysInMonth !== undefined && day >= 1 && day <= daysInMonth;
}

function validateSelection(value: unknown, allowEmpty = false): string[] {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0))
    throw new Error('Select at least one video with valid bookmarks');
  const identities = new Set<string>();
  for (const id of value) {
    if (typeof id !== 'string' || !id.trim())
      throw new Error('Selected video IDs must be nonblank text');
    if (identities.has(id))
      throw new Error(`Selected video ID "${id}" is repeated`);
    identities.add(id);
  }

  return Array.from(identities);
}

function selectIncomingVideos(validated: ValidatedImport, selected: string[]): Video[] {
  const identities = new Set(selected);
  const videos = validated.videos.filter((video) => identities.has(video.id));
  if (videos.length !== selected.length)
    throw new Error('Import selection must identify accepted videos with valid bookmarks');

  return videos;
}

function selectBackupVideos(backup: Backup, selected: string[]): Backup {
  const identities = new Set(selected);
  return { ...backup, videos: backup.videos.filter((video) => identities.has(video.id)) };
}

function canonicalBackup(backup: Backup): string {
  const videos = backup.videos.map((video) => ({
    id: video.id,
    title: video.title,
    bookmarks: video.bookmarks.map((bookmark) => ({
      timestamp: bookmark.timestamp,
      createdAt: bookmark.createdAt,
      name: bookmark.name,
      color: bookmark.color,
    })).sort((left, right) => left.timestamp - right.timestamp),
  })).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  return JSON.stringify(videos);
}

function canonicalMergeCurrent(current: Backup, incoming: Video[]): string {
  const currentById = new Map(current.videos.map((video) => [video.id, video]));
  const relevant = incoming.map((video) => {
    const existing = currentById.get(video.id);
    if (!existing) return { id: video.id, exists: false };
    const incomingTimestamps = new Set(Object.keys(video.bookmarks));
    return {
      id: video.id,
      exists: true,
      title: existing.title,
      bookmarks: existing.bookmarks
        .filter((bookmark) => incomingTimestamps.has(String(bookmark.timestamp)))
        .map((bookmark) => ({
          timestamp: bookmark.timestamp,
          createdAt: bookmark.createdAt,
          name: bookmark.name,
          color: bookmark.color,
        }))
        .sort((left, right) => left.timestamp - right.timestamp),
    };
  }).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  return JSON.stringify(relevant);
}

function canonicalColor(color: Bookmark['color']): string | undefined {
  if (!color) return undefined;
  return color.type === 'custom' ? `custom:${color.value.toLowerCase()}` : `preset:${color.preset}`;
}

function validateImportMode(mode: unknown): void {
  if (mode !== 'merge' && mode !== 'replace')
    throw new Error('Import mode must be merge or replace');
}

function isTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

function validateObject(value: unknown, field: string, allowedFields?: string[]): Record<string, unknown> {
  if (!isObject(value)) throw new Error(`${field} must be an object`);
  if (allowedFields) {
    for (const key of Object.keys(value)) {
      if (!allowedFields.includes(key))
        throw new Error(`${field}.${key} is not supported in this backup schema`);
    }
  }

  return value;
}

