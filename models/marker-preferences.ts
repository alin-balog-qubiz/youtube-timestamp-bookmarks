import type { ColorChoice, ThemePreference } from '@/models/appearance';

export interface MarkerPreferences {
  showMarkers: boolean;
  defaultColor: ColorChoice;
  theme: ThemePreference;
}
