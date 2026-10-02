import type { Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

export interface Backup {
  format: 'youtube-timestamp-bookmarks';
  version: 1;
  videos: Video[];
  settings: MarkerPreferences;
}

export type ImportMode = 'merge' | 'replace';

export interface ImportPreview {
  current: Backup;
  incoming: Backup;
  mode: ImportMode;
  additions: number;
  skippedDuplicates: number;
  currentVideos: number;
  currentBookmarks: number;
  incomingVideos: number;
  incomingBookmarks: number;
}
