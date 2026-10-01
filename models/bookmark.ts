export interface Bookmark {
  timestamp: number;
  createdAt: string;
  name?: string;
  color?: string;
}

/** Complete editable state; omitted name/color remove the stored name/override. */
export interface BookmarkDraft {
  timestamp: number;
  name?: string;
  color?: string;
}

export interface Video {
  id: string;
  title?: string;
  bookmarks: Record<number, Bookmark>;
}

export type CreateBookmarkResult = 'saved' | 'already-saved';
