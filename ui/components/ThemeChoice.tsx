import { useTheme } from '../utils/theme';

import type { ThemePreference } from '../utils/types';

import { SegmentedChoice } from './SegmentedChoice';

const options = [
  { value: 'light', label: 'Light', icon: 'sun' },
  { value: 'dark', label: 'Dark', icon: 'moon' },
  { value: 'system', label: 'System', icon: 'system' },
] as const;

export function ThemeChoice({ labelHidden = false }: { labelHidden?: boolean }) {
  const { preference, setPreference } = useTheme();

  return (
    <div className="yb-theme-choice">
      <SegmentedChoice label="Color theme" labelHidden={labelHidden} value={preference} options={options} onChange={(value) => setPreference(value as ThemePreference)} />
    </div>
  );
}
