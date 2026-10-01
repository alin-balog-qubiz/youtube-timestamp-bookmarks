import type { BookmarkDraft, CreateBookmarkResult, Video } from './bookmark';
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

export interface GetVideoRequest {
  type: 'bookmarks:get-video';
  videoId: string;
}

export type GetVideoResponse = Result<Video | null>;

export interface UpdateBookmarkRequest {
  type: 'bookmarks:update';
  videoId: string;
  originalTimestamp: number;
  draft: BookmarkDraft;
  tabId: number;
}

export type UpdateBookmarkResponse = Result<Video>;

export interface DeleteBookmarkRequest {
  type: 'bookmarks:delete';
  videoId: string;
  timestamp: number;
}

export type DeleteBookmarkResponse = Result<Video | null>;

export interface DeleteVideoBookmarksRequest {
  type: 'bookmarks:delete-video';
  videoId: string;
}

export type DeleteVideoBookmarksResponse = Result<null>;

export interface GetActiveVideoRequest {
  type: 'player:get-active-video';
}

export type GetActiveVideoResponse = Result<ActiveVideo | null>;

export interface GetPlayerDurationRequest {
  type: 'player:get-duration';
  videoId: string;
}

export type GetPlayerDurationResponse = Result<number | null>;

export interface SeekBookmarkRequest {
  type: 'player:seek';
  videoId: string;
  timestamp: number;
}

export type SeekBookmarkResponse = Result<null>;
