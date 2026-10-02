import { useId } from 'react';

export type SwitchProps = {
  label: string;
  labelHidden?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  pending?: boolean;
};

export function Switch({ label, labelHidden = false, checked, onChange, disabled, pending = false }: SwitchProps) {
  const switchId = useId();

  return (
    <label className="yb-switch-label" htmlFor={switchId}>
      <span className={labelHidden ? 'yb-sr-only' : undefined}>{label}</span>
      <input
        id={switchId}
        className="yb-switch"
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.currentTarget.checked)}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
      />
    </label>
  );
}
