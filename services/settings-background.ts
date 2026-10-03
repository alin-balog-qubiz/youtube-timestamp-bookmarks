import { getBackup, importBackup, previewImport, validateBackup } from '@/services/backup';
import {
  migrateStoredAppearance,
  updateMarkerPreferences,
  validateMarkerPreferences,
} from '@/services/marker-preferences';
import { registerMessageHandlers } from '@/services/messages';

import type { ImportMode } from '@/models/backup';
import type {
  GetBackupResponse,
  GetSettingsResponse,
  ImportBackupResponse,
  PreviewImportResponse,
  UpdateSettingsResponse,
} from '@/models/messages';

export function registerSettingsHandlers(): () => void {
  return registerMessageHandlers({
    'settings:get': handleGetSettings,
    'settings:update': handleUpdateSettings,
    'backup:get': handleGetBackup,
    'backup:preview': handlePreviewImport,
    'backup:import': handleImportBackup,
  });
}

async function handleGetSettings(): Promise<GetSettingsResponse> {
  return { ok: true, value: await migrateStoredAppearance() };
}

async function handleUpdateSettings(message: unknown): Promise<UpdateSettingsResponse> {
  const request = validateRequest(message);
  const settings = validateMarkerPreferences(request.settings);
  return { ok: true, value: await updateMarkerPreferences(settings) };
}

async function handleGetBackup(): Promise<GetBackupResponse> {
  return { ok: true, value: await getBackup() };
}

async function handlePreviewImport(message: unknown): Promise<PreviewImportResponse> {
  const request = validateRequest(message);
  const backup = validateBackup(request.backup);
  const mode = validateImportMode(request.mode);
  return { ok: true, value: await previewImport(backup, mode) };
}

async function handleImportBackup(message: unknown): Promise<ImportBackupResponse> {
  const request = validateRequest(message);
  const backup = validateBackup(request.backup);
  const mode = validateImportMode(request.mode);
  const expectedCurrent = validateBackup(request.expectedCurrent);
  return { ok: true, value: await importBackup(backup, mode, expectedCurrent) };
}

function validateRequest(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new Error('Settings request must be an object');

  return value as Record<string, unknown>;
}

function validateImportMode(value: unknown): ImportMode {
  if (value !== 'merge' && value !== 'replace')
    throw new Error('Import mode must be Merge or Replace');

  return value;
}
