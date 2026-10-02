import { useId } from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';
import { Notice } from './Notice';
import { RadioChoice } from './RadioChoice';

export interface ImportPreviewProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  fileName: string;
  mode: 'merge' | 'replace';
  onModeChange: (mode: 'merge' | 'replace') => void;
  current: { videos: number; bookmarks: number };
  incoming: { videos: number; bookmarks: number };
  additions: number;
  duplicates: number;
  settingsChanges: readonly string[];
  acknowledged: boolean;
  onAcknowledgedChange: (acknowledged: boolean) => void;
  pending?: boolean;
  error?: string;
}

const importModes = [
  { value: 'merge', label: 'Merge', description: 'Add new bookmarks. Keep existing bookmarks and current settings.' },
  { value: 'replace', label: 'Replace all', description: 'Remove the current library and use the backup bookmarks and settings.' },
] as const;

export function ImportPreview({
  open, onClose, onConfirm, fileName, mode, onModeChange, current, incoming,
  additions, duplicates, settingsChanges, acknowledged, onAcknowledgedChange, pending = false, error,
}: ImportPreviewProps) {
  const acknowledgementId = useId();
  const confirmationBlocked = pending || (mode === 'replace' && !acknowledged);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Import bookmarks"
      description="Review this backup before making changes."
      pending={pending}
      footer={(
        <>
          <Button variant="quiet" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button
            variant={mode === 'replace' ? 'danger' : 'accent'}
            pending={pending}
            disabled={confirmationBlocked}
            onClick={() => {
              if (!confirmationBlocked) onConfirm();
            }}
          >
            Confirm import
          </Button>
        </>
      )}
    >
      <div className="yb-dialog-fields">
        <div className="yb-import-file">
          <span className="yb-dialog-field-label">Backup file</span>
          <strong>{fileName}</strong>
        </div>

        <RadioChoice
          label="Import mode"
          value={mode}
          options={importModes}
          disabled={pending}
          onChange={(value) => {
            if (pending || (value !== 'merge' && value !== 'replace') || value === mode) return;
            onAcknowledgedChange(false);
            onModeChange(value);
          }}
        />

        <dl className="yb-import-counts">
          <div><dt>Current library</dt><dd>{current.videos} videos · {current.bookmarks} bookmarks</dd></div>
          <div><dt>Incoming backup</dt><dd>{incoming.videos} videos · {incoming.bookmarks} bookmarks</dd></div>
          <div><dt>New bookmarks in backup</dt><dd>{additions}</dd></div>
          <div><dt>Duplicates already saved</dt><dd>{duplicates}</dd></div>
        </dl>

        {mode === 'merge' ? (
          <Notice>
            Merge adds {additions} new bookmarks and skips {duplicates} duplicates. Existing bookmark details and current settings are kept.
          </Notice>
        ) : (
          <Notice variant="warning">
            Replace all removes the current {current.bookmarks} bookmarks across {current.videos} videos and replaces them with {incoming.bookmarks} bookmarks across {incoming.videos} videos from this backup. This cannot be undone.
          </Notice>
        )}

        <section className="yb-import-settings" aria-label="Settings changes">
          <h3>{mode === 'replace' ? 'Settings changes' : 'Backup settings (not applied by Merge)'}</h3>
          {settingsChanges.length > 0 ? (
            <ul>{settingsChanges.map((change, index) => <li key={`${change}-${index}`}>{change}</li>)}</ul>
          ) : (
            <p className="yb-dialog-help">No settings changes.</p>
          )}
        </section>

        {mode === 'replace' && (
          <label className="yb-import-acknowledgement" htmlFor={acknowledgementId}>
            <input
              id={acknowledgementId}
              type="checkbox"
              checked={acknowledged}
              disabled={pending}
              onChange={(event) => {
                if (!pending) onAcknowledgedChange(event.target.checked);
              }}
            />
            <span>I understand this replaces all current bookmarks and applies the backup settings.</span>
          </label>
        )}
        {error && <Notice variant="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}
