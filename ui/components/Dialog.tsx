import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';

import { IconButton } from './IconButton';

import '../styles/overlays.css';

export interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  pending?: boolean;
}

export function Dialog({ open, onClose, title, description, children, footer, pending = false }: DialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const backdropPointerRef = useRef(false);

  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;

    returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    dialog.showModal();

    return () => {
      dialog.close();
      if (returnFocusRef.current?.isConnected) returnFocusRef.current.focus({ preventScroll: true });
      returnFocusRef.current = null;
    };
  }, [open]);

  function trapFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== 'Tab') return;

    const dialog = event.currentTarget;
    const controls = Array.from(dialog.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]',
    )).filter((control) => control.tabIndex >= 0 && !control.matches(':disabled') &&
      !control.closest('[inert]') && control.getClientRects().length > 0);
    const first = controls[0];
    const last = controls.at(-1);

    if (!first || !last) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog)) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      className="yb-dialog"
      tabIndex={-1}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      aria-busy={pending}
      onKeyDown={trapFocus}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onClose();
      }}
      onPointerDown={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        backdropPointerRef.current = event.target === event.currentTarget && (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        );
      }}
      onClick={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        const outside = event.target === event.currentTarget && (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        );
        if (backdropPointerRef.current && outside && !pending) onClose();
        backdropPointerRef.current = false;
      }}
    >
      <div className="yb-dialog-layout">
        <header className="yb-dialog-header">
          <h2 id={titleId} tabIndex={-1} autoFocus>{title}</h2>
          <IconButton label={`Close ${title}`} icon="close" disabled={pending} onClick={onClose} />
        </header>

        <div className="yb-dialog-body">
          {description && <p className="yb-dialog-description" id={descriptionId}>{description}</p>}
          {children}
        </div>

        {footer && <footer className="yb-dialog-footer">{footer}</footer>}
      </div>
    </dialog>
  );
}
