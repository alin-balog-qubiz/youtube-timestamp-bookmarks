import { storage } from 'wxt/utils/storage';

import {
  normalizeStoredVideo,
  serializeLibraryMutation,
  videoStoragePrefix,
} from '@/services/bookmarks';

import {
  validateColorChoice,
  validateLegacyColor,
  validateThemePreference,
} from '@/models/appearance';
import type { Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

export const markerPreferencesStorageKey = 'local:marker-preferences:v1';
const markerPreferencesSnapshotKey = markerPreferencesStorageKey.slice('local:'.length);

export const defaultMarkerPreferences: Readonly<MarkerPreferences> = {
  showMarkers: true,
  defaultColor: { type: 'preset', preset: 'accent' },
  theme: 'system',
};

const markerPreferences = storage.defineItem<unknown>(markerPreferencesStorageKey, {
  fallback: defaultMarkerPreferences,
});

export async function getMarkerPreferences(): Promise<MarkerPreferences> {
  return normalizeStoredMarkerPreferences(await markerPreferences.getValue());
}

/** Background-only: preference writes share the library barrier with import/export. */
export function updateMarkerPreferences(value: unknown): Promise<MarkerPreferences> {
  const preferences = validateMarkerPreferences(value);
  return serializeLibraryMutation(async () => {
    await markerPreferences.setValue(preferences);

    return preferences;
  });
}

/** Background-only: migrate appearance data before returning authoritative settings. */
export function migrateStoredAppearance(): Promise<MarkerPreferences> {
  return serializeLibraryMutation(migrateStoredAppearanceInStorage);
}

/**
 * Background-only; the caller must already hold the library barrier.
 * Write only legacy records, in one batch, so repeated reads never rewrite normalized data.
 */
export async function migrateStoredAppearanceInStorage(): Promise<MarkerPreferences> {
  const snapshot = await storage.snapshot('local');
  const storedPreferences = snapshot[markerPreferencesSnapshotKey];
  const preferences = normalizeStoredMarkerPreferences(storedPreferences ?? defaultMarkerPreferences);
  const writes: { key: `local:${string}`; value: Video | MarkerPreferences }[] = [];
  for (const [key, value] of Object.entries(snapshot)) {
    if (!key.startsWith(videoStoragePrefix) || value === null) continue;

    const video = normalizeStoredVideo(value as Video);
    if (video !== value)
      writes.push({ key: `local:${key}`, value: video });
  }

  if (storedPreferences !== undefined && storedPreferences !== null) {
    const settings = storedPreferences as Record<string, unknown>;
    if (typeof settings.defaultColor === 'string' || !Object.hasOwn(settings, 'theme'))
      writes.push({ key: markerPreferencesStorageKey, value: preferences });
  }

  if (writes.length > 0)
    await storage.setItems(writes);

  return preferences;
}

export function validateMarkerPreferences(value: unknown): MarkerPreferences {
  const settings = validateSettingsObject(value, ['showMarkers', 'defaultColor', 'theme']);
  return {
    showMarkers: settings.showMarkers,
    defaultColor: validateColorChoice(settings.defaultColor, 'Settings.defaultColor'),
    theme: validateThemePreference(settings.theme, 'Settings.theme'),
  };
}

/** Strict version-1 input; only stored legacy data and backups may omit theme. */
export function validateLegacyMarkerPreferences(value: unknown): MarkerPreferences {
  const settings = validateSettingsObject(value, ['showMarkers', 'defaultColor']);
  return {
    showMarkers: settings.showMarkers,
    defaultColor: validateLegacyColor(settings.defaultColor, 'Settings.defaultColor'),
    theme: 'system',
  };
}

/** Read-only storage normalization is safe in popup consumers before background migration. */
export function normalizeStoredMarkerPreferences(value: unknown): MarkerPreferences {
  const settings = validateSettingsObject(value, ['showMarkers', 'defaultColor', 'theme']);
  return {
    showMarkers: settings.showMarkers,
    defaultColor: typeof settings.defaultColor === 'string'
      ? validateLegacyColor(settings.defaultColor, 'Settings.defaultColor')
      : validateColorChoice(settings.defaultColor, 'Settings.defaultColor'),
    theme: Object.hasOwn(settings, 'theme')
      ? validateThemePreference(settings.theme, 'Settings.theme')
      : 'system',
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
