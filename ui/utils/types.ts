import type { ColorChoice } from '@/models/appearance';

export type { ColorChoice, ResolvedTheme, ThemePreference } from '@/models/appearance';

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
