export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export type ColorChoice =
  | { type: 'preset'; preset: 'accent' | 'gray' | 'ink' }
  | { type: 'custom'; value: string };

export type BookmarkDraft = {
  name: string;
  timestamp: number;
  color?: ColorChoice;
};

export type BookmarkItem = {
  id: string;
  timestamp: number;
  name?: string;
  color?: ColorChoice;
};

export type PopupPage = 'this-video' | 'all-videos' | 'settings';
