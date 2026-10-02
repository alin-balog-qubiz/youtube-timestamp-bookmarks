import { type ReactNode } from 'react';

import { Button } from './Button';
import { Dialog } from './Dialog';
import { Notice } from './Notice';

export interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  pending?: boolean;
  error?: string;
  confirmLabel?: string;
}

export function ConfirmationDialog({
  open, onClose, onConfirm, title, description, children, pending = false, error, confirmLabel = 'Delete',
}: ConfirmationDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      pending={pending}
      footer={(
        <>
          <Button variant="quiet" disabled={pending} onClick={onClose}>Cancel</Button>
          <Button variant="danger" pending={pending} onClick={onConfirm}>{confirmLabel}</Button>
        </>
      )}
    >
      <div className="yb-dialog-fields">
        {children}
        {error && <Notice variant="error">{error}</Notice>}
      </div>
    </Dialog>
  );
}
