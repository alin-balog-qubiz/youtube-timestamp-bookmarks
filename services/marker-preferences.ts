import { storage } from 'wxt/utils/storage';

import type { Bookmark } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

const markerColorPattern = /^#[0-9a-f]{6}$/i;

export const defaultMarkerPreferences: Readonly<MarkerPreferences> = {
  showMarkers: true,
  defaultColor: '#2563eb',
};

const markerPreferences = storage.defineItem<MarkerPreferences>('local:marker-preferences:v1', {
  fallback: defaultMarkerPreferences,
});

export async function getMarkerPreferences(): Promise<MarkerPreferences> {
  return markerPreferences.getValue();
}

export function resolveBookmarkColor(bookmark: Bookmark, preferences: MarkerPreferences): string {
  return bookmark.color ?? preferences.defaultColor;
}

export function isMarkerColor(value: unknown): value is string {
  return typeof value === 'string' && markerColorPattern.test(value);
}
