import { useId, useRef } from 'react';

import { Icon } from './Icon';
import { IconButton } from './IconButton';

export type SearchInputProps = {
  label: string;
  labelHidden?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function SearchInput({ label, labelHidden = false, value, onChange, placeholder, disabled }: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const inputId = useId();

  return (
    <div className="yb-field">
      <label className={`yb-field-label${labelHidden ? ' yb-sr-only' : ''}`} htmlFor={inputId}>{label}</label>
      <div className="yb-search">
        <Icon name="search" />
        <input
          ref={inputRef}
          id={inputId}
          className="yb-input"
          type="search"
          value={value}
          onChange={(event) => onChange(event.currentTarget.value)}
          disabled={disabled}
          placeholder={placeholder}
        />
        {value && <IconButton label={`Clear ${label.toLowerCase()}`} icon="close" disabled={disabled} onClick={() => { onChange(''); inputRef.current?.focus(); }} />}
      </div>
    </div>
  );
}
