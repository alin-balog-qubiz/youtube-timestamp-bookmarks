import type { CreateBookmarkResult } from './bookmark';

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export interface CreateBookmarkRequest {
  type: 'bookmarks:create';
  videoId: string;
  timestamp: number;
  title?: string;
}

export type CreateBookmarkResponse = Result<CreateBookmarkResult>;
