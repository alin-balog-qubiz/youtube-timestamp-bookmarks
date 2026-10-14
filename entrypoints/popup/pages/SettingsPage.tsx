import { useEffect, useRef, useState, type RefObject } from 'react';

import { useSettingsPersistence } from '../hooks/useSettingsPersistence';

import type { MarkerPreferences } from '@/models/marker-preferences';

import {
  Button, ColorPicker, ErrorState, Icon, Notice, SettingGroup,
  SettingRow, Skeleton, Switch, ThemeChoice, Toast,
} from '@/ui';
import ExportDialog from '../components/ExportDialog';
import ImportDialog from '../components/ImportDialog';

interface SettingsPageProps {
  readonly preferences: MarkerPreferences | null;
  readonly isReadingSettings: boolean;
  readonly readError: string | null;
  readonly onRetry: () => void;
  readonly onPreferencesChange: (saved: MarkerPreferences) => void;
  readonly beforeLeaveRef: RefObject<(() => Promise<boolean>) | null>;
}

type TransferDialog = { type: 'export' } | { type: 'import'; file: File };

export default function SettingsPage({
  preferences, isReadingSettings, readError, onRetry, onPreferencesChange, beforeLeaveRef,
}: SettingsPageProps) {
  const [saveError, setSaveError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [transferDialog, setTransferDialog] = useState<TransferDialog | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isDisposedRef = useRef(false);
  const isSavingRef = useRef(false);

  const persistence = useSettingsPersistence(
    preferences, onPreferencesChange, () => setFeedback('Default marker color saved.'),
  );
  const preferencesDisabled = (!preferences && isReadingSettings) || isSaving || readError !== null;
  const colorDisabled = (!preferences && isReadingSettings) || readError !== null;

  useEffect(() => {
    isDisposedRef.current = false;
    return () => { isDisposedRef.current = true; };
  }, []);

  useEffect(() => {
    beforeLeaveRef.current = persistence.flushColor;
    return () => { beforeLeaveRef.current = null; };
  }, [beforeLeaveRef, persistence.flushColor]);

  async function savePreferences(patch: Partial<MarkerPreferences>) {
    if (!preferences || readError || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setSaveError(null);
    setFeedback(null);
    try {
      await persistence.savePreferences(patch);
      if (isDisposedRef.current) return;

      setFeedback(patch.theme !== undefined ? 'Theme saved.' : 'Marker visibility saved.');
    } catch (failure) {
      if (!isDisposedRef.current) {
        setSaveError(failure instanceof Error ? failure.message : 'Unable to save preferences.');
      }
    } finally {
      isSavingRef.current = false;
      if (!isDisposedRef.current) setIsSaving(false);
    }
  }

  return (
    <div className="settings-page">
      <h1 id="page-heading" className="yb-sr-only">Settings</h1>
      {isReadingSettings && !preferences && <Skeleton rows={3} label="Loading preferences" />}
      {readError && (
        <ErrorState title="Unable to load preferences" onRetry={onRetry} pending={isReadingSettings}>
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
                  pending={isSaving}
                  onChange={(theme) => void savePreferences({ theme })}
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
                  pending={isSaving}
                  onChange={(showMarkers) => void savePreferences({ showMarkers })}
                />
              )}
            />
            <SettingRow
              label="Default marker color"
              control={(
                <ColorPicker
                  label="Default marker color"
                  labelHidden
                  value={persistence.colorPreview ?? preferences.defaultColor}
                  defaultChoice={preferences.defaultColor}
                  disabled={colorDisabled}
                  onChange={(defaultColor) => {
                    if (!defaultColor) return;
                    setFeedback(null);
                    persistence.selectColor(defaultColor);
                  }}
                  onInput={(defaultColor) => {
                    setFeedback(null);
                    persistence.selectColor(defaultColor, true);
                  }}
                  onCommit={() => { void persistence.commitColor(); }}
                />
              )}
            />
          </SettingGroup>
        </>
      )}
      {isSaving && <p role="status">Saving preferences…</p>}
      {saveError && <Notice variant="error">{saveError} Theme and visibility show their last saved values.</Notice>}
      {persistence.colorError && (
        <Notice variant="error">{persistence.colorError} The color preview is not saved. Choose a color again to retry.</Notice>
      )}
      <SettingGroup title="Backup">
        <SettingRow
          label="Export bookmarks"
          help="Select videos and download their bookmarks as JSON. Preferences are not included."
          control={(
            <Button disabled={transferDialog !== null} onClick={() => setTransferDialog({ type: 'export' })}>
              <Icon name="download" /> Export JSON
            </Button>
          )}
        />
        <SettingRow
          label="Import bookmarks"
          help="Select videos from a JSON backup, then merge or replace the library without changing preferences."
          control={(
            <Button disabled={transferDialog !== null} onClick={() => fileInputRef.current?.click()}>
              <Icon name="upload" /> Import JSON
            </Button>
          )}
        />
        <input
          ref={fileInputRef}
          type="file"
          hidden
          accept=".json,application/json"
          disabled={transferDialog !== null}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0];
            event.currentTarget.value = '';
            if (file) setTransferDialog({ type: 'import', file });
          }}
        />
      </SettingGroup>
      {transferDialog?.type === 'export' && (
        <ExportDialog
          onClose={() => setTransferDialog(null)}
          onCompleted={(filename) => {
            setTransferDialog(null);
            setFeedback(`Backup downloaded: ${filename}`);
          }}
        />
      )}
      {transferDialog?.type === 'import' && (
        <ImportDialog file={transferDialog.file} onClose={() => setTransferDialog(null)} />
      )}
      <Toast message={feedback} onDismiss={() => setFeedback(null)} />
    </div>
  );
}
