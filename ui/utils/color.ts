import type { ColorChoice, ResolvedTheme } from './types';

const presetColors = {
  light: { accent: '#c83f4f', gray: '#6b7280', ink: '#111111' },
  dark: { accent: '#ff7a86', gray: '#d9dee7', ink: '#f5f5f5' },
} as const;

export function resolveColorChoice(
  choice: ColorChoice | undefined,
  defaultChoice: ColorChoice,
  theme: ResolvedTheme,
): string {
  const effectiveChoice = choice ?? defaultChoice;
  if (effectiveChoice.type === 'custom') return effectiveChoice.value;

  return presetColors[theme][effectiveChoice.preset];
}
