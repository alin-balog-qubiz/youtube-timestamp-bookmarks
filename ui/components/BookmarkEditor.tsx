import { useId, type FormEvent } from 'react';

import type { BookmarkDraft, ColorChoice } from '../utils/types';

import { Button } from './Button';
import { ColorPicker } from './ColorPicker';
import { Dialog } from './Dialog';
import { Notice } from './Notice';
import { TextInput } from './TextInput';
import { TimestampAdjuster } from './TimestampAdjuster';

export interface BookmarkEditorProps {
  open: boolean;
  onClose: () => void;
  draft: BookmarkDraft;
  onDraftChange: (draft: BookmarkDraft) => void;
  onSave: () => void;
  maxTimestamp: number | null;
  defaultChoice: ColorChoice;
  pending?: boolean;
  error?: string;
  contextError?: string;
}

export function BookmarkEditor({
  open, onClose, draft, onDraftChange, onSave, maxTimestamp, defaultChoice,
  pending = false, error, contextError,
}: BookmarkEditorProps) {
  const formId = useId();
  const blocked = pending || Boolean(contextError);
  const knownDuration = maxTimestamp !== null && Number.isFinite(maxTimestamp) && maxTimestamp >= 0;
  const timestampValid = Number.isSafeInteger(draft.timestamp) && draft.timestamp >= 0 &&
    (!knownDuration || draft.timestamp <= Math.floor(maxTimestamp));

  function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blocked || !timestampValid) return;
    onSave();
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Edit bookmark"
      pending={pending}
      footer={(
        <>
          <Button variant="quiet" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button
            variant="accent"
            type="submit"
            form={formId}
            disabled={blocked || !timestampValid}
            pending={pending}
          >
            Save changes
          </Button>
        </>
      )}
    >
      <form id={formId} className="yb-dialog-fields" onSubmit={saveDraft}>
        {contextError && <Notice variant="error">{contextError}</Notice>}
        <TextInput
          label="Name (optional)"
          value={draft.name}
          placeholder="Unnamed bookmark"
          disabled={blocked}
          onChange={(name) => {
            if (!blocked) onDraftChange({ ...draft, name });
          }}
        />
        <TimestampAdjuster
          timestamp={draft.timestamp}
          maxTimestamp={maxTimestamp}
          disabled={blocked}
          onChange={(timestamp) => {
            if (!blocked) onDraftChange({ ...draft, timestamp });
          }}
        />
        {!timestampValid && <Notice variant="error">The timestamp is outside the available video range. Adjust it before saving.</Notice>}
        <ColorPicker
          label="Marker color"
          value={draft.color}
          defaultChoice={defaultChoice}
          allowDefault
          disabled={blocked}
          onChange={(color) => {
            if (!blocked) onDraftChange({ ...draft, color });
          }}
        />
        {error && <Notice variant="error">{error}</Notice>}
      </form>
    </Dialog>
  );
}
