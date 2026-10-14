import type { Bookmark, Video } from '@/models/bookmark';

export interface BackupVideo {
  id: string;
  title?: string;
  bookmarks: Bookmark[];
}

/** Schema 1 transfers library data only; appVersion is producer metadata. */
export interface Backup {
  format: 'youtube-timestamp-bookmarks';
  schemaVersion: 1;
  appVersion: string;
  videos: BackupVideo[];
}

export type ImportMode = 'merge' | 'replace';

export interface ImportDiagnostic {
  location: string;
  videoId?: string;
  videoTitle?: string;
  timestamp?: number;
  reason: string;
  skippedVideos: number;
  skippedBookmarks: number;
}

export interface ValidatedImport {
  videos: Video[];
  diagnostics: ImportDiagnostic[];
  skippedVideos: number;
  skippedBookmarks: number;
}

export interface ImportConflict {
  videoId: string;
  videoTitle?: string;
  timestamp?: number;
  fields: { field: string; existing: unknown; incoming: unknown }[];
}

export interface ImportDuplicate {
  videoId: string;
  videoTitle?: string;
  timestamp: number;
}

export interface ImportPreview {
  current: Backup;
  incoming: unknown;
  selectedVideoIds: string[];
  mode: ImportMode;
  additions: number;
  addedVideos: number;
  skippedDuplicates: number;
  skippedConflicts: number;
  currentVideos: number;
  currentBookmarks: number;
  incomingVideos: number;
  incomingBookmarks: number;
  diagnostics: ImportDiagnostic[];
  skippedVideos: number;
  skippedBookmarks: number;
  duplicates: ImportDuplicate[];
  conflicts: ImportConflict[];
}

export type ImportCommit =
  | { status: 'stale'; preview: ImportPreview }
  | { status: 'committed'; preview: ImportPreview };

export type ExportReview =
  | { status: 'stale'; backup: Backup }
  | { status: 'ready'; backup: Backup };
