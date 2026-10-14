import { getBackup, importBackup, previewImport, reviewExport, validateBackup } from '@/services/storage/backup';
import {
  getMarkerPreferences,
  updateMarkerPreferences,
  validateMarkerPreferences,
} from '@/services/storage/marker-preferences';
import { registerMessageHandlers } from '@/services/messaging/register-handlers';

import type { Backup, ImportMode } from '@/models/backup';
import type {
  GetBackupResponse,
  GetSettingsResponse,
  ImportBackupResponse,
  PreviewImportResponse,
  ReviewExportResponse,
  UpdateSettingsResponse,
} from '@/models/messages';

export function registerSettingsHandlers(): () => void {
  return registerMessageHandlers({
    'settings:get': handleGetSettings,
    'settings:update': handleUpdateSettings,
    'backup:get': handleGetBackup,
    'backup:review-export': handleReviewExport,
    'backup:preview': handlePreviewImport,
    'backup:import': handleImportBackup,
  });
}

async function handleGetSettings(): Promise<GetSettingsResponse> {
  return { ok: true, value: await getMarkerPreferences() };
}

async function handleUpdateSettings(message: unknown): Promise<UpdateSettingsResponse> {
  const request = validateRequest(message);
  const settings = validateMarkerPreferences(request.settings);
  return { ok: true, value: await updateMarkerPreferences(settings) };
}

async function handleGetBackup(message: unknown): Promise<GetBackupResponse> {
  const request = validateRequest(message);
  const selectedVideoIds = request.selectedVideoIds === undefined
    ? undefined
    : validateSelectedVideoIds(request.selectedVideoIds);
  return { ok: true, value: await getBackup(selectedVideoIds) };
}

async function handleReviewExport(message: unknown): Promise<ReviewExportResponse> {
  const request = validateRequest(message);
  const selectedVideoIds = validateSelectedVideoIds(request.selectedVideoIds);
  const expectedCurrent = validateReviewedSnapshot(request.expectedCurrent);
  return { ok: true, value: await reviewExport(selectedVideoIds, expectedCurrent) };
}

async function handlePreviewImport(message: unknown): Promise<PreviewImportResponse> {
  const request = validateRequest(message);
  const mode = validateImportMode(request.mode);
  const selectedVideoIds = validateSelectedVideoIds(request.selectedVideoIds);
  return { ok: true, value: await previewImport(request.incoming, mode, selectedVideoIds) };
}

async function handleImportBackup(message: unknown): Promise<ImportBackupResponse> {
  const request = validateRequest(message);
  const mode = validateImportMode(request.mode);
  const selectedVideoIds = validateSelectedVideoIds(request.selectedVideoIds);
  const expectedCurrent = validateReviewedSnapshot(request.expectedCurrent);
  return { ok: true, value: await importBackup(request.incoming, mode, selectedVideoIds, expectedCurrent) };
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

function validateSelectedVideoIds(value: unknown): string[] {
  if (!Array.isArray(value) || !value.every((id): id is string => typeof id === 'string' && !!id.trim()))
    throw new Error('Selected video IDs must be an array of nonblank strings');
  if (new Set(value).size !== value.length)
    throw new Error('Selected video IDs must not contain duplicates');

  return value;
}

function validateReviewedSnapshot(value: unknown): Backup {
  const validated = validateBackup(value);
  if (validated.diagnostics.length > 0)
    throw new Error('The reviewed snapshot contains invalid library records. Refresh the review.');

  // Full schema validation above makes this a trusted, unmodified wire snapshot.
  return value as Backup;
}
