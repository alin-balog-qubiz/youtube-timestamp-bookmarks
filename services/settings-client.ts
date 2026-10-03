import { browser } from 'wxt/browser';

import { normalizeStoredMarkerPreferences } from '@/services/marker-preferences';

import type { Backup, ImportMode, ImportPreview } from '@/models/backup';
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
  UpdateSettingsRequest,
  UpdateSettingsResponse,
} from '@/models/messages';

export async function getSettings(): Promise<MarkerPreferences> {
  const response = await browser.runtime.sendMessage<GetSettingsRequest, GetSettingsResponse>({
    type: 'settings:get',
  });
  if (response?.ok) return normalizeStoredMarkerPreferences(response.value);

  throw new Error(response?.error ?? 'Settings storage did not respond');
}

export async function updateSettings(settings: MarkerPreferences): Promise<MarkerPreferences> {
  const response = await browser.runtime.sendMessage<UpdateSettingsRequest, UpdateSettingsResponse>({
    type: 'settings:update',
    settings,
  });
  if (response?.ok) return normalizeStoredMarkerPreferences(response.value);

  throw new Error(response?.error ?? 'Settings storage did not respond');
}

export async function getBackup(): Promise<Backup> {
  const response = await browser.runtime.sendMessage<GetBackupRequest, GetBackupResponse>({
    type: 'backup:get',
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Backup storage did not respond');
}

export async function previewImport(backup: Backup, mode: ImportMode): Promise<ImportPreview> {
  const response = await browser.runtime.sendMessage<PreviewImportRequest, PreviewImportResponse>({
    type: 'backup:preview',
    backup,
    mode,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Import preview did not respond');
}

export async function importBackup(preview: ImportPreview): Promise<ImportPreview> {
  const response = await browser.runtime.sendMessage<ImportBackupRequest, ImportBackupResponse>({
    type: 'backup:import',
    backup: preview.incoming,
    mode: preview.mode,
    expectedCurrent: preview.current,
  });
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'Import storage did not respond');
}
