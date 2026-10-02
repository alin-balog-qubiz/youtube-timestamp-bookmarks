import type { BookmarkItem, ColorChoice } from '@/ui';

export const sampleDefaultColor: ColorChoice = { type: 'preset', preset: 'accent' };
export const sampleVideoTitle = 'Why Practical Effects Still Matter in Modern Movies';
export const sampleBookmarks: readonly BookmarkItem[] = [
  { id: 'opening', timestamp: 134, name: 'Great opening argument' },
  { id: 'miniature', timestamp: 347, name: 'Miniature city reveal', color: { type: 'preset', preset: 'gray' } },
  { id: 'unnamed', timestamp: 522, color: { type: 'preset', preset: 'ink' } },
  { id: 'closing', timestamp: 849, name: 'Strong closing quote' },
];
export const sampleVideos = [
  { id: 'practical-effects', title: sampleVideoTitle, bookmarks: sampleBookmarks },
  { id: 'sound-design', title: 'The Small Sounds That Make a Scene Feel Real', bookmarks: [
    { id: 'sound-opening', timestamp: 38, name: 'Building the atmosphere' },
    { id: 'sound-room', timestamp: 196 },
  ] satisfies BookmarkItem[] },
];
export const sampleImportBookmarks: readonly BookmarkItem[] = [
  ...sampleBookmarks.slice(0, 2),
  ...Array.from({ length: 6 }, (_, index): BookmarkItem => ({
    id: `imported-${index}`, timestamp: 900 + index * 10, name: `Imported sample ${index + 1}`,
  })),
];
export const sampleIncoming = { videos: 1, bookmarks: sampleImportBookmarks.length };
export const sampleSettingsChanges = ['Appearance: System → Dark', 'Default marker color: Accent → Gray', 'Player markers: shown → hidden'];
