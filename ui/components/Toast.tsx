import { useEffect, useRef, useState } from 'react';

import { Icon } from './Icon';

export type ToastProps = { message: string | null; onDismiss?: () => void; duration?: number };

export function Toast({ message, onDismiss, duration = 3000 }: ToastProps) {
  const [dismissedMessage, setDismissedMessage] = useState<string | null>(null);

  const onDismissRef = useRef(onDismiss);

  useEffect(() => { onDismissRef.current = onDismiss; }, [onDismiss]);

  useEffect(() => {
    setDismissedMessage(null);
    if (!message || duration <= 0) return;

    const timeout = window.setTimeout(() => { setDismissedMessage(message); onDismissRef.current?.(); }, duration);
    return () => window.clearTimeout(timeout);
  }, [message, duration]);

  const visible = Boolean(message && dismissedMessage !== message);

  return (
    <div className="yb-toast-region" role="status" aria-live="polite" aria-atomic="true">
      {visible && <div className="yb-toast"><Icon name="check" /><span>{message}</span></div>}
    </div>
  );
}
