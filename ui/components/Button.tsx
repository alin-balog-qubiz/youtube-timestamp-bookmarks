import type { ButtonHTMLAttributes } from 'react';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'accent' | 'neutral' | 'danger' | 'quiet';
  pending?: boolean;
};

export function Button({ variant = 'neutral', pending = false, disabled, className = '', children, type = 'button', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      className={`yb-button yb-button--${variant} ${className}`.trim()}
      disabled={disabled || pending}
      aria-busy={pending || undefined}
    >
      {pending && <span className="yb-spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
