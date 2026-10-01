import type { CreateBookmarkResult } from './bookmark';
import type { ActiveVideo } from './active-video';

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

export interface GetActiveVideoRequest {
  type: 'player:get-active-video';
}

export type GetActiveVideoResponse = Result<ActiveVideo | null>;
