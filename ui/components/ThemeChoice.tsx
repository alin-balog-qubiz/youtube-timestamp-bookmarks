import { useTheme } from '../utils/theme';

import type { ThemePreference } from '../utils/types';

import { SegmentedChoice } from './SegmentedChoice';

export type ThemeChoiceProps = {
  labelHidden?: boolean;
  value?: ThemePreference;
  onChange?: (value: ThemePreference) => void;
  disabled?: boolean;
  pending?: boolean;
};

const options = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'system' },
] as const;

export function ThemeChoice({ labelHidden = false, value, onChange, disabled = false, pending = false }: ThemeChoiceProps) {
  const { preference, setPreference } = useTheme();

  function selectPreference(nextValue: string) {
    if (nextValue !== 'light' && nextValue !== 'dark' && nextValue !== 'system') return;

    if (onChange) onChange(nextValue);
    else setPreference(nextValue);
  }

  return (
    <div className="yb-theme-choice" aria-busy={pending || undefined}>
      <SegmentedChoice
        label="Color theme"
        labelHidden={labelHidden}
        value={value ?? preference}
        options={options}
        onChange={selectPreference}
        disabled={disabled || pending}
      />
    </div>
  );
}
