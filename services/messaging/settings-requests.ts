import { browser } from 'wxt/browser';

import { validateMarkerPreferences } from '@/services/storage/marker-preferences';

import type { Backup, ExportReview, ImportCommit, ImportMode, ImportPreview } from '@/models/backup';
import type { MarkerPreferences } from '@/models/marker-preferences';
import type {
  GetBackupRequest,
  GetBackupResponse,
  GetSettingsRequest,
  GetSettingsResponse,
  ImportBackupRequest,
  ImportBackupResponse,
  PreviewImportRequest,
  PreviewImportResponse,
  ReviewExportRequest,
  ReviewExportResponse,
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from '@/models/messages';

export async function getSettings(): Promise<MarkerPreferences> {
  const response = await browser.runtime.sendMessage<GetSettingsRequest, GetSettingsResponse>({
    type: 'settings:get',
  });
  if (response?.ok) return validateMarkerPreferences(response.value);

  throw new Error(response?.error ?? 'Settings storage did not respond');
}

export async function updateSettings(settings: MarkerPreferences): Promise<MarkerPreferences> {
  const response = await browser.runtime.sendMessage<UpdateSettingsRequest, UpdateSettingsResponse>({
    type: 'settings:update',
    settings,
  });
  if (response?.ok) return validateMarkerPreferences(response.value);

  throw new Error(response?.error ?? 'Settings storage did not respond');
}

export async function getBackup(selectedVideoIds?: string[]): Promise<Backup> {
  const response = await browser.runtime.sendMessage<GetBackupRequest, GetBackupResponse>({
    type: 'backup:get',
    ...(selectedVideoIds !== undefined ? { selectedVideoIds } : {}),
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Backup storage did not respond');
}

export async function reviewExport(selectedVideoIds: string[], expectedCurrent: Backup): Promise<ExportReview> {
  const response = await browser.runtime.sendMessage<ReviewExportRequest, ReviewExportResponse>({
    type: 'backup:review-export',
    selectedVideoIds,
    expectedCurrent,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Export review did not respond');
}

export async function previewImport(
  incoming: unknown,
  mode: ImportMode,
  selectedVideoIds: string[],
): Promise<ImportPreview> {
  const response = await browser.runtime.sendMessage<PreviewImportRequest, PreviewImportResponse>({
    type: 'backup:preview',
    incoming,
    mode,
    selectedVideoIds,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Import preview did not respond');
}

export async function importBackup(preview: ImportPreview): Promise<ImportCommit> {
  const response = await browser.runtime.sendMessage<ImportBackupRequest, ImportBackupResponse>({
    type: 'backup:import',
    incoming: preview.incoming,
    mode: preview.mode,
    selectedVideoIds: preview.selectedVideoIds,
    expectedCurrent: preview.current,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Import storage did not respond');
}
