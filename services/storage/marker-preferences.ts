import { storage } from 'wxt/utils/storage';

import { serializeLibraryMutation } from '@/services/storage/bookmarks';

import {
  validateColorChoice,
  validateThemePreference,
} from '@/models/appearance';
import type { MarkerPreferences } from '@/models/marker-preferences';

export const markerPreferencesStorageKey = 'local:marker-preferences:v1';

export const defaultMarkerPreferences: Readonly<MarkerPreferences> = {
  showMarkers: true,
  defaultColor: { type: 'preset', preset: 'accent' },
  theme: 'system',
};

const markerPreferences = storage.defineItem<unknown>(markerPreferencesStorageKey, {
  fallback: defaultMarkerPreferences,
});

export async function getMarkerPreferences(): Promise<MarkerPreferences> {
  return validateMarkerPreferences(await markerPreferences.getValue());
}

/** Background-only: serialize preference writes with other background mutations. */
export function updateMarkerPreferences(value: unknown): Promise<MarkerPreferences> {
  const preferences = validateMarkerPreferences(value);
  return serializeLibraryMutation(async () => {
    await markerPreferences.setValue(preferences);

    return preferences;
  });
}

export function validateMarkerPreferences(value: unknown): MarkerPreferences {
  const settings = validateSettingsObject(value, ['showMarkers', 'defaultColor', 'theme']);
  return {
    showMarkers: settings.showMarkers,
    defaultColor: validateColorChoice(settings.defaultColor, 'Settings.defaultColor'),
    theme: validateThemePreference(settings.theme, 'Settings.theme'),
  };
}

function validateSettingsObject(
  value: unknown,
  allowedFields: string[],
): Record<string, unknown> & { showMarkers: boolean } {
  if (
    typeof value !== 'object' ||
    value === null ||
    Array.isArray(value) ||
    (Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)
  )
    throw new Error('Settings must be an object');

  const settings = value as Record<string, unknown>;
  for (const field of Object.keys(settings)) {
    if (!allowedFields.includes(field))
      throw new Error(`Settings.${field} is not supported`);
  }

  if (typeof settings.showMarkers !== 'boolean')
    throw new Error('Settings.showMarkers must be a boolean');

  return settings as Record<string, unknown> & { showMarkers: boolean };
}
