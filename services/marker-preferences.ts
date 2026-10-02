import { storage } from 'wxt/utils/storage';

import { serializeLibraryMutation } from '@/services/bookmarks';

import type { Bookmark } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

const markerColorPattern = /^#[0-9a-f]{6}$/i;
export const markerPreferencesStorageKey = 'local:marker-preferences:v1';

export const defaultMarkerPreferences: Readonly<MarkerPreferences> = {
  showMarkers: true,
  defaultColor: '#2563eb',
};

const markerPreferences = storage.defineItem<MarkerPreferences>(markerPreferencesStorageKey, {
  fallback: defaultMarkerPreferences,
});

export async function getMarkerPreferences(): Promise<MarkerPreferences> {
  return markerPreferences.getValue();
}

/** Background-only: preference writes share the library barrier with import/export. */
export function updateMarkerPreferences(value: unknown): Promise<MarkerPreferences> {
  const preferences = validateMarkerPreferences(value);
  return serializeLibraryMutation(async () => {
    await markerPreferences.setValue(preferences);

    return preferences;
  });
}

export function validateMarkerPreferences(value: unknown): MarkerPreferences {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  )
    throw new Error('Settings must be an object');

  const settings = value as Record<string, unknown>;
  for (const field of Object.keys(settings)) {
    if (field !== 'showMarkers' && field !== 'defaultColor')
      throw new Error(`Settings.${field} is not supported in backup version 1`);
  }

  if (typeof settings.showMarkers !== 'boolean')
    throw new Error('Settings.showMarkers must be a boolean');
  if (!isMarkerColor(settings.defaultColor))
    throw new Error('Settings.defaultColor must be a six-digit hex color (#rrggbb)');

  return { showMarkers: settings.showMarkers, defaultColor: settings.defaultColor };
}

export function resolveBookmarkColor(bookmark: Bookmark, preferences: MarkerPreferences): string {
  return bookmark.color ?? preferences.defaultColor;
}

export function isMarkerColor(value: unknown): value is string {
  return typeof value === 'string' && markerColorPattern.test(value);
}
