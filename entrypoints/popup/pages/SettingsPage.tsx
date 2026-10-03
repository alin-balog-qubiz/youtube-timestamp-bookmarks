import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';

import { validateBackup } from '@/services/backup';
import { getBackup, importBackup, previewImport, updateSettings } from '@/services/settings-client';

import type { ColorChoice, ThemePreference } from '@/models/appearance';
import type { Backup, ImportMode, ImportPreview as ImportPreviewData } from '@/models/backup';
import type { MarkerPreferences } from '@/models/marker-preferences';

import {
  Button, ColorPicker, ErrorState, Icon, ImportPreview, Notice, SettingGroup,
  SettingRow, Skeleton, Switch, ThemeChoice, Toast,
} from '@/ui';

type SettingsOperation = 'saving' | 'exporting' | 'reading-file' | 'previewing' | 'importing';
type SettingsPageProps = {
  preferences: MarkerPreferences | null;
  isReadingSettings: boolean;
  readError: string | null;
  onRetry: () => void;
  onPreferencesChange: (saved: MarkerPreferences) => void;
};

const themeLabels: Record<ThemePreference, string> = { light: 'Light', dark: 'Dark', system: 'System' };

export default function SettingsPage({
  preferences, isReadingSettings, readError, onRetry, onPreferencesChange,
}: SettingsPageProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [operation, setOperation] = useState<SettingsOperation | null>(null);

  const [exportError, setExportError] = useState<string | null>(null);
  const [incomingBackup, setIncomingBackup] = useState<Backup | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode>('merge');
  const [importPreview, setImportPreview] = useState<ImportPreviewData | null>(null);
  const [hasAcknowledgedReplace, setHasAcknowledgedReplace] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDisposedRef = useRef(false);
  const latestOperationIdRef = useRef(0);
  const operationRef = useRef<SettingsOperation | null>(null);
  const downloadControllerRef = useRef<AbortController | null>(null);

  const isBusy = isReadingSettings || operation !== null;
  const preferencesDisabled = isBusy || readError !== null;

  useEffect(() => {
    isDisposedRef.current = false;

    return () => {
      isDisposedRef.current = true;
      latestOperationIdRef.current++;
      downloadControllerRef.current?.abort();
    };
  }, []);

  async function savePreferences(nextPreferences: MarkerPreferences) {
    if (!preferences || readError) return;

    const operationId = beginOperation('saving');
    if (operationId === null) return;

    clearPreview();
    setSaveError(null);
    setFeedback(null);

    try {
      const savedPreferences = await updateSettings(nextPreferences);
      if (!isCurrentOperation(operationId)) return;

      onPreferencesChange(savedPreferences);
      setFeedback('Preferences saved.');
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setSaveError(getErrorMessage(failure, 'Unable to save preferences.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  async function exportLibrary() {
    const operationId = beginOperation('exporting');
    if (operationId === null) return;

    setExportError(null);
    setFeedback(null);

    try {
      const backup = await getBackup();
      if (!isCurrentOperation(operationId)) return;

      const filename = `youtube-timestamp-bookmarks-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const controller = new AbortController();
      downloadControllerRef.current = controller;
      await downloadBackup(backup, filename, controller.signal);
      if (isCurrentOperation(operationId)) setFeedback(`Backup downloaded: ${filename}`);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setExportError(getErrorMessage(failure, 'Unable to export the backup. Please retry.'));
      }
    } finally {
      downloadControllerRef.current = null;
      finishOperation(operationId);
    }
  }

  async function selectImportFile(file: File | undefined) {
    if (!file) return;

    const operationId = beginOperation('reading-file');
    if (operationId === null) return;

    resetImport(false);
    setFeedback(null);
    setSelectedFilename(file.name);

    try {
      const text = await file.text();
      if (!isCurrentOperation(operationId)) return;

      const parsed: unknown = JSON.parse(text);
      const backup = validateBackup(parsed);
      setIncomingBackup(backup);
      setImportMode('merge');
      operationRef.current = 'previewing';
      setOperation('previewing');
      await readPreview(backup, 'merge', operationId);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setImportError(getErrorMessage(failure, 'Unable to read this JSON backup.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  async function generatePreview(mode: ImportMode = importMode) {
    if (!incomingBackup) return;

    const operationId = beginOperation('previewing');
    if (operationId === null) return;

    clearPreview();
    setImportMode(mode);
    setImportError(null);
    setFeedback(null);

    try {
      await readPreview(incomingBackup, mode, operationId);
    } finally {
      finishOperation(operationId);
    }
  }

  async function readPreview(backup: Backup, mode: ImportMode, operationId: number) {
    try {
      const preview = await previewImport(backup, mode);
      if (isCurrentOperation(operationId)) setImportPreview(preview);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setImportError(getErrorMessage(failure, 'Unable to preview this import. Refresh the preview to retry.'));
      }
    }
  }

  async function confirmImport() {
    if (
      !importPreview || importError || importPreview.mode !== importMode ||
      (importPreview.mode === 'replace' && !hasAcknowledgedReplace)
    ) return;

    const operationId = beginOperation('importing');
    if (operationId === null) return;

    setImportError(null);
    setFeedback(null);

    try {
      const result = await importBackup(importPreview);
      if (!isCurrentOperation(operationId)) return;

      onPreferencesChange(result.mode === 'replace' ? result.incoming.settings : result.current.settings);
      setSaveError(null);
      resetImport();
      setFeedback(result.mode === 'merge'
        ? `Import complete: ${result.additions} bookmarks added; ${result.skippedDuplicates} duplicates skipped. Existing bookmarks and settings were kept.`
        : `Replace complete: ${result.incomingBookmarks} bookmarks in ${result.incomingVideos} videos and the imported settings are saved.`);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        clearPreview();
        setImportError(getErrorMessage(failure, 'Unable to import the backup. Refresh the preview before retrying.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  function cancelImport() {
    if (isBusy || operationRef.current !== null) return;

    resetImport();
    setFeedback(null);
  }

  function resetImport(clearFileSelection = true) {
    if (clearFileSelection && fileInputRef.current) fileInputRef.current.value = '';
    setIncomingBackup(null);
    setSelectedFilename(null);
    setImportMode('merge');
    clearPreview();
    setImportError(null);
  }

  function clearPreview() {
    setImportPreview(null);
    setHasAcknowledgedReplace(false);
  }

  function beginOperation(nextOperation: SettingsOperation): number | null {
    if (isDisposedRef.current || isReadingSettings || operationRef.current !== null) return null;

    const operationId = ++latestOperationIdRef.current;
    operationRef.current = nextOperation;
    setOperation(nextOperation);
    return operationId;
  }

  function isCurrentOperation(operationId: number): boolean {
    return !isDisposedRef.current && operationId === latestOperationIdRef.current;
  }

  function finishOperation(operationId: number) {
    if (!isCurrentOperation(operationId)) return;

    operationRef.current = null;
    setOperation(null);
  }

  const settingsChanges = importPreview
    ? describeSettingsChanges(importPreview.current.settings, importPreview.incoming.settings)
    : [];

  return (
    <div className="settings-page">
      <h1 id="page-heading" className="yb-sr-only">Settings</h1>
      {isReadingSettings && <Skeleton rows={3} label="Loading preferences" />}
      {readError && (
        <ErrorState title="Unable to load preferences" onRetry={onRetry} pending={isBusy}>
          {readError}
        </ErrorState>
      )}

      {preferences && (
        <>
          <SettingGroup title="Appearance">
            <SettingRow
              label="Theme"
              control={(
                <ThemeChoice
                  labelHidden
                  value={preferences.theme}
                  disabled={preferencesDisabled}
                  pending={operation === 'saving'}
                  onChange={(theme) => void savePreferences({ ...preferences, theme })}
                />
              )}
            />
          </SettingGroup>

          <SettingGroup title="Playback">
            <SettingRow
              label="Show player markers"
              control={(
                <Switch
                  label="Show player markers"
                  labelHidden
                  checked={preferences.showMarkers}
                  disabled={preferencesDisabled}
                  pending={operation === 'saving'}
                  onChange={(showMarkers) => void savePreferences({ ...preferences, showMarkers })}
                />
              )}
            />
            <SettingRow
              label="Default marker color"
              control={(
                <ColorPicker
                  key={saveError ?? 'saved-color'}
                  label="Default marker color"
                  labelHidden
                  value={preferences.defaultColor}
                  defaultChoice={preferences.defaultColor}
                  disabled={preferencesDisabled}
                  onChange={(defaultColor) => {
                    if (defaultColor) void savePreferences({ ...preferences, defaultColor });
                  }}
                />
              )}
            />
          </SettingGroup>
        </>
      )}
      {operation === 'saving' && <p role="status">Saving preferences…</p>}
      {saveError && <Notice variant="error">{saveError} The controls show the last saved values.</Notice>}

      <SettingGroup title="Backup">
        <SettingRow
          label="Export bookmarks"
          help="Download the entire library and settings as JSON."
          control={(
            <Button disabled={isBusy} pending={operation === 'exporting'} onClick={() => void exportLibrary()}>
              <Icon name="download" /> Export JSON
            </Button>
          )}
        />
        <SettingRow
          label="Import bookmarks"
          help="Review a JSON backup before merging or replacing saved data."
          control={(
            <Button disabled={isBusy} onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" /> Import JSON
            </Button>
          )}
        />
        <label className="settings-file">
          <span className="yb-sr-only">Choose JSON backup file</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            disabled={isBusy}
            onChange={(event) => void selectImportFile(event.target.files?.[0])}
          />
        </label>
      </SettingGroup>
      {operation === 'exporting' && <p role="status">Waiting for the backup download to finish…</p>}
      {exportError && <Notice variant="error">{exportError}</Notice>}
      {operation === 'reading-file' && <p role="status">Reading and validating the backup…</p>}
      {importError && !incomingBackup && (
        <Notice variant="error" action={<Button variant="quiet" disabled={isBusy} onClick={cancelImport}>Dismiss</Button>}>
          {importError}
        </Notice>
      )}

      {incomingBackup && (
        <ImportPreview
          open
          fileName={selectedFilename ?? 'JSON backup'}
          mode={importMode}
          onModeChange={(mode) => void generatePreview(mode)}
          current={{ videos: importPreview?.currentVideos ?? 0, bookmarks: importPreview?.currentBookmarks ?? 0 }}
          incoming={{ videos: importPreview?.incomingVideos ?? 0, bookmarks: importPreview?.incomingBookmarks ?? 0 }}
          additions={importPreview?.additions ?? 0}
          duplicates={importPreview?.skippedDuplicates ?? 0}
          settingsChanges={settingsChanges}
          acknowledged={hasAcknowledgedReplace}
          onAcknowledgedChange={setHasAcknowledgedReplace}
          previewReady={importPreview !== null && importPreview.mode === importMode}
          previewPending={operation === 'previewing'}
          pending={operation === 'importing'}
          error={importError ?? undefined}
          onRefresh={() => void generatePreview()}
          onConfirm={() => void confirmImport()}
          onClose={cancelImport}
        />
      )}
      <Toast message={feedback} onDismiss={() => setFeedback(null)} />
    </div>
  );
}

function describeSettingsChanges(current: MarkerPreferences, incoming: MarkerPreferences): string[] {
  const changes: string[] = [];
  if (current.theme !== incoming.theme)
    changes.push(`Theme: ${themeLabels[current.theme]} → ${themeLabels[incoming.theme]}`);
  if (current.showMarkers !== incoming.showMarkers)
    changes.push(`Show player markers: ${current.showMarkers ? 'On' : 'Off'} → ${incoming.showMarkers ? 'On' : 'Off'}`);
  if (JSON.stringify(current.defaultColor) !== JSON.stringify(incoming.defaultColor))
    changes.push(`Default marker color: ${describeColor(current.defaultColor)} → ${describeColor(incoming.defaultColor)}`);

  return changes;
}

function describeColor(choice: ColorChoice): string {
  if (choice.type === 'custom') return `Custom ${choice.value}`;

  return choice.preset === 'accent' ? 'Accent' : choice.preset === 'gray' ? 'Gray' : 'Ink';
}

function downloadBackup(backup: Backup, filename: string, signal: AbortSignal): Promise<void> {
  const { promise, resolve, reject } = Promise.withResolvers<void>();
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(backup, null, 2)}\n`], { type: 'application/json' }));
  let downloadId: number | null = null;
  let hasSettled = false;
  let isListeningForDownload = false;

  try {
    browser.downloads.onChanged.addListener(handleDownloadChanged);
    isListeningForDownload = true;
    signal.addEventListener('abort', handleAbort, { once: true });
    if (signal.aborted) settle(new Error('Backup export was canceled.'));
    else void startDownload();
  } catch (failure) {
    settle(failure);
  }

  return promise;

  async function startDownload() {
    try {
      downloadId = await browser.downloads.download({ url, filename, conflictAction: 'uniquify' });
      if (signal.aborted) {
        await cancelDownload();
        return;
      }

      // Search closes the race where completion happened before download() returned its ID.
      const [download] = await browser.downloads.search({ id: downloadId });
      if (hasSettled) return;
      if (!download) {
        await cancelDownload(new Error('The browser could not find the backup download.'));
        return;
      }
      checkDownloadState(download.state, download.error);
    } catch (failure) {
      if (downloadId !== null && !hasSettled) await cancelDownload(failure);
      else settle(failure);
    }
  }

  function handleDownloadChanged(change: { id: number; state?: { current?: string }; error?: { current?: string } }) {
    if (change.id !== downloadId) return;
    checkDownloadState(change.state?.current, change.error?.current);
  }

  function checkDownloadState(state: string | undefined, error: string | undefined) {
    if (state === 'complete') settle();
    if (state === 'interrupted') settle(new Error(`Backup download was interrupted${error ? `: ${error}` : '.'}`));
  }

  function handleAbort() {
    // A pending download() must return its ID before it can be canceled safely.
    if (downloadId !== null) void cancelDownload();
  }

  async function cancelDownload(failure: unknown = new Error('Backup export was canceled.')) {
    try {
      if (downloadId !== null) await browser.downloads.cancel(downloadId);
      settle(failure);
    } catch (cancelFailure) {
      settle(cancelFailure);
    }
  }

  function settle(failure?: unknown) {
    if (hasSettled) return;
    hasSettled = true;
    if (isListeningForDownload) browser.downloads.onChanged.removeListener(handleDownloadChanged);
    signal.removeEventListener('abort', handleAbort);
    URL.revokeObjectURL(url);
    if (failure !== undefined) reject(failure);
    else resolve();
  }
}

function getErrorMessage(failure: unknown, fallback: string): string {
  return failure instanceof Error ? failure.message : fallback;
}
