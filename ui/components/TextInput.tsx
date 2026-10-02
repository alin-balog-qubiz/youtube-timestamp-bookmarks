import { useId } from 'react';

export type TextInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  help?: string;
  error?: string;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
};

export function TextInput({ label, value, onChange, help, error, disabled, placeholder, id }: TextInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = [help ? `${inputId}-help` : undefined, error ? `${inputId}-error` : undefined].filter(Boolean).join(' ') || undefined;

  return (
    <div className="yb-field">
      <label className="yb-field-label" htmlFor={inputId}>{label}</label>
      <input
        id={inputId}
        className="yb-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
      />
      {help && <p id={`${inputId}-help`} className="yb-field-help">{help}</p>}
      {error && <p id={`${inputId}-error`} className="yb-field-error" role="alert">{error}</p>}
    </div>
  );
}
