import { useEffect, useRef, useState } from 'react';
import { browser } from 'wxt/browser';

import { validateBackup } from '@/services/backup';
import { getBackup, getSettings, importBackup, previewImport, updateSettings } from '@/services/settings-client';

import type { Backup, ImportMode, ImportPreview } from '@/models/backup';
import type { MarkerPreferences } from '@/models/marker-preferences';

type SettingsOperation = 'saving' | 'exporting' | 'reading-file' | 'previewing' | 'importing';

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<MarkerPreferences | null>(null);
  const [isReadingSettings, setIsReadingSettings] = useState(true);
  const [readError, setReadError] = useState<string | null>(null);
  const [retryId, setRetryId] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [hasSavedPreferences, setHasSavedPreferences] = useState(false);
  const [operation, setOperation] = useState<SettingsOperation | null>(null);

  const [exportError, setExportError] = useState<string | null>(null);
  const [exportedFilename, setExportedFilename] = useState<string | null>(null);
  const [incomingBackup, setIncomingBackup] = useState<Backup | null>(null);
  const [selectedFilename, setSelectedFilename] = useState<string | null>(null);
  const [importMode, setImportMode] = useState<ImportMode | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [hasAcknowledgedReplace, setHasAcknowledgedReplace] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importFeedback, setImportFeedback] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDisposedRef = useRef(false);
  const latestOperationIdRef = useRef(0);
  const operationRef = useRef<SettingsOperation | null>(null);
  const downloadControllerRef = useRef<AbortController | null>(null);

  const isBusy = isReadingSettings || operation !== null;

  useEffect(() => {
    isDisposedRef.current = false;

    return () => {
      isDisposedRef.current = true;
      latestOperationIdRef.current++;
      downloadControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    let isReadDisposed = false;
    setIsReadingSettings(true);
    setReadError(null);
    void readSettings();

    return () => {
      isReadDisposed = true;
    };

    async function readSettings() {
      try {
        const savedPreferences = await getSettings();
        if (!isReadDisposed) setPreferences(savedPreferences);
      } catch (failure) {
        if (!isReadDisposed) setReadError(getErrorMessage(failure, 'Unable to load marker preferences.'));
      } finally {
        if (!isReadDisposed) setIsReadingSettings(false);
      }
    }
  }, [retryId]);

  async function savePreferences(nextPreferences: MarkerPreferences) {
    const operationId = beginOperation('saving');
    if (operationId === null) return;

    clearPreview();
    setSaveError(null);
    setHasSavedPreferences(false);

    try {
      const savedPreferences = await updateSettings(nextPreferences);
      if (!isCurrentOperation(operationId)) return;

      setPreferences(savedPreferences);
      setHasSavedPreferences(true);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setSaveError(getErrorMessage(failure, 'Unable to save marker preferences. Your saved values are unchanged.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  async function exportLibrary() {
    const operationId = beginOperation('exporting');
    if (operationId === null) return;

    setExportError(null);
    setExportedFilename(null);

    try {
      const backup = await getBackup();
      if (!isCurrentOperation(operationId)) return;

      const filename = `youtube-timestamp-bookmarks-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
      const controller = new AbortController();
      downloadControllerRef.current = controller;
      await downloadBackup(backup, filename, controller.signal);
      if (isCurrentOperation(operationId)) setExportedFilename(filename);
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
    if (isBusy) return;

    resetImport(false);
    setImportFeedback(null);
    if (!file) return;

    const operationId = beginOperation('reading-file');
    if (operationId === null) return;

    setSelectedFilename(file.name);

    try {
      const text = await file.text();
      if (!isCurrentOperation(operationId)) return;

      const parsed: unknown = JSON.parse(text);
      const backup = validateBackup(parsed);
      setIncomingBackup(backup);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setImportError(getErrorMessage(failure, 'Unable to read this JSON backup.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  function selectImportMode(mode: ImportMode) {
    if (isBusy) return;

    clearPreview();
    setImportMode(mode);
    setImportError(null);
    setImportFeedback(null);
  }

  async function generatePreview() {
    if (!incomingBackup || !importMode) return;

    const operationId = beginOperation('previewing');
    if (operationId === null) return;

    clearPreview();
    setImportError(null);
    setImportFeedback(null);

    try {
      const preview = await previewImport(incomingBackup, importMode);
      if (isCurrentOperation(operationId)) setImportPreview(preview);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setImportError(getErrorMessage(failure, 'Unable to preview this import. Please retry.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  async function confirmImport() {
    if (!importPreview || (importPreview.mode === 'replace' && !hasAcknowledgedReplace)) return;

    const operationId = beginOperation('importing');
    if (operationId === null) return;

    setImportError(null);
    setImportFeedback(null);

    try {
      const result = await importBackup(importPreview);
      if (!isCurrentOperation(operationId)) return;

      setPreferences(result.mode === 'replace' ? result.incoming.settings : result.current.settings);
      setReadError(null);
      setSaveError(null);
      setHasSavedPreferences(false);
      resetImport();
      setImportFeedback(result.mode === 'merge'
        ? `Import complete: ${result.additions} bookmarks added; ${result.skippedDuplicates} duplicates skipped. Existing bookmarks and settings were kept.`
        : `Replace complete: ${result.incomingBookmarks} bookmarks in ${result.incomingVideos} videos and the imported settings are saved.`);
    } catch (failure) {
      if (isCurrentOperation(operationId)) {
        setImportError(getErrorMessage(failure, 'Unable to import the backup. Please retry or generate Preview again.'));
      }
    } finally {
      finishOperation(operationId);
    }
  }

  function cancelImport() {
    if (isBusy) return;

    resetImport();
    setImportFeedback(null);
  }

  function resetImport(clearFileSelection = true) {
    if (clearFileSelection && fileInputRef.current) fileInputRef.current.value = '';
    setIncomingBackup(null);
    setSelectedFilename(null);
    setImportMode(null);
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

  return (
    <div className="settings-page">
      <h1 id="page-heading" aria-live="polite">Settings</h1>

      <section aria-labelledby="player-markers-heading">
        <h2 id="player-markers-heading">Player markers</h2>
        {isReadingSettings && <p role="status">Loading marker preferences…</p>}
        {readError && (
          <div className="read-error">
            <p className="error" role="alert">{readError}</p>
            <button type="button" disabled={isBusy} onClick={() => setRetryId((currentId) => currentId + 1)}>
              Retry
            </button>
          </div>
        )}

        {preferences && (
          <fieldset className="settings-fields" disabled={isBusy || readError !== null}>
            <legend className="visually-hidden">Player marker preferences</legend>
            <label className="settings-checkbox">
              <input
                type="checkbox"
                checked={preferences.showMarkers}
                onChange={(event) => void savePreferences({ ...preferences, showMarkers: event.target.checked })}
              />
              Show player markers
            </label>
            <label className="settings-color">
              Default marker color
              <input
                type="color"
                value={preferences.defaultColor.toLowerCase()}
                aria-describedby="default-marker-color-value"
                onChange={(event) => void savePreferences({ ...preferences, defaultColor: event.target.value })}
              />
            </label>
            <p id="default-marker-color-value" className="help">Saved color: {preferences.defaultColor}</p>
          </fieldset>
        )}

        {operation === 'saving' && <p role="status">Saving preferences…</p>}
        {hasSavedPreferences && <p role="status">Preferences saved.</p>}
        {saveError && <p className="error" role="alert">{saveError} The controls show the last saved values.</p>}
        <p className="help">
          The default color applies only to bookmarks without a custom color. Use default in the bookmark editor restores inheritance.
        </p>
        <p className="help">
          Marker rendering is a separate feature; these preferences do not add timeline markers yet. Quick add and popup browsing are unaffected.
        </p>
      </section>

      <section aria-labelledby="backup-restore-heading">
        <h2 id="backup-restore-heading">Backup &amp; restore</h2>
        <p className="help">Export the entire library and settings, regardless of the active video or title filter.</p>
        <button type="button" disabled={isBusy} onClick={() => void exportLibrary()}>
          {operation === 'exporting' ? 'Exporting…' : 'Export JSON backup'}
        </button>
        {operation === 'exporting' && <p role="status">Waiting for the backup download to finish…</p>}
        {exportedFilename && <p role="status">Backup downloaded: {exportedFilename}</p>}
        {exportError && <p className="error" role="alert">{exportError}</p>}

        <div className="settings-import">
          <h3>Import JSON backup</h3>
          <p className="help">Choose a file, choose a mode, preview the effects, then confirm. Nothing is saved before confirmation.</p>
          <label className="settings-file">
            Choose JSON backup file
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              disabled={isBusy}
              onChange={(event) => void selectImportFile(event.target.files?.[0])}
            />
          </label>
          {operation === 'reading-file' && <p role="status">Reading and validating the backup…</p>}
          {selectedFilename && !incomingBackup && (
            <button type="button" disabled={isBusy} onClick={cancelImport}>Cancel import</button>
          )}
          {incomingBackup && (
            <>
              <p className="help">Validated backup: {selectedFilename}</p>
              <fieldset className="settings-import-modes" disabled={isBusy}>
                <legend>Import mode</legend>
                <label className="settings-checkbox">
                  <input type="radio" name="import-mode" checked={importMode === 'merge'} onChange={() => selectImportMode('merge')} />
                  Merge — keep existing bookmarks and settings
                </label>
                <label className="settings-checkbox">
                  <input type="radio" name="import-mode" checked={importMode === 'replace'} onChange={() => selectImportMode('replace')} />
                  Replace — replace all bookmarks and settings
                </label>
              </fieldset>
              <div className="settings-actions">
                <button type="button" disabled={isBusy || !importMode} onClick={() => void generatePreview()}>
                  {operation === 'previewing' ? 'Previewing…' : importPreview ? 'Preview again' : 'Preview'}
                </button>
                <button type="button" disabled={isBusy} onClick={cancelImport}>Cancel import</button>
              </div>
            </>
          )}

          {importPreview && (
            <section className="settings-preview" aria-labelledby="import-preview-heading">
              <h3 id="import-preview-heading">{importPreview.mode === 'merge' ? 'Merge preview' : 'Replace preview'}</h3>
              {importPreview.mode === 'merge' ? (
                <>
                  <p>{importPreview.additions} bookmarks will be added; {importPreview.skippedDuplicates} duplicate bookmarks will be skipped.</p>
                  <p className="help">Existing bookmarks win for the same video and second, including their name, color, and creation date. Current settings will be kept.</p>
                </>
              ) : (
                <>
                  <p>{importPreview.currentBookmarks} current bookmarks in {importPreview.currentVideos} videos will be replaced by {importPreview.incomingBookmarks} bookmarks in {importPreview.incomingVideos} videos.</p>
                  <dl className="settings-changes">
                    <div>
                      <dt>Show player markers</dt>
                      <dd>{importPreview.current.settings.showMarkers ? 'On' : 'Off'} → {importPreview.incoming.settings.showMarkers ? 'On' : 'Off'}</dd>
                    </div>
                    <div>
                      <dt>Default marker color</dt>
                      <dd>{importPreview.current.settings.defaultColor} → {importPreview.incoming.settings.defaultColor}</dd>
                    </div>
                  </dl>
                  <label className="settings-checkbox">
                    <input
                      type="checkbox"
                      checked={hasAcknowledgedReplace}
                      disabled={isBusy}
                      onChange={(event) => setHasAcknowledgedReplace(event.target.checked)}
                    />
                    I understand that all current bookmarks and settings will be replaced. There is no undo.
                  </label>
                </>
              )}
              <div className="settings-actions">
                <button type="button" disabled={isBusy} onClick={cancelImport}>Cancel</button>
                <button
                  type="button"
                  className={importPreview.mode === 'replace' ? 'destructive' : undefined}
                  disabled={isBusy || (importPreview.mode === 'replace' && !hasAcknowledgedReplace)}
                  onClick={() => void confirmImport()}
                >
                  {operation === 'importing' ? 'Importing…' : importPreview.mode === 'merge' ? 'Confirm merge' : 'Replace all bookmarks and settings'}
                </button>
              </div>
            </section>
          )}
          {operation === 'previewing' && <p role="status">Reading current data and preparing the effect preview…</p>}
          {operation === 'importing' && <p role="status">Saving imported bookmarks and settings…</p>}
          {importError && <p className="error" role="alert">{importError}</p>}
          {importFeedback && <p role="status">{importFeedback}</p>}
        </div>
      </section>
    </div>
  );
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
