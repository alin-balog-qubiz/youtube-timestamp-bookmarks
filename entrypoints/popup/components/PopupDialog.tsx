import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface PopupDialogProps {
  labelledBy: string;
  children: ReactNode;
  busy: boolean;
  onDismiss: () => void;
}

export default function PopupDialog({ labelledBy, children, busy, onDismiss }: PopupDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) 
      return;

    dialog.showModal();

    return () => dialog.close();
  }, []);

  return createPortal(
    <dialog
      ref={dialogRef}
      className="popup-dialog"
      aria-labelledby={labelledBy}
      aria-busy={busy}
      onCancel={(event) => {
        event.preventDefault();

        if (!busy) onDismiss();
      }}
      onClick={(event) => {
        if (busy || event.target !== event.currentTarget) return;

        const bounds = event.currentTarget.getBoundingClientRect();
        if (
          event.clientX < bounds.left || event.clientX > bounds.right ||
          event.clientY < bounds.top || event.clientY > bounds.bottom
        ) onDismiss();
      }}
    >
      {children}
    </dialog>,
    document.body,
  );
}
