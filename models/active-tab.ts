import type { ActiveVideo } from './active-video';

export type CurrentPage = {
  isYoutube: boolean;
  videoId: string | null;
};

export type ActiveTabContext =
  | { status: 'loading' }
  | { status: 'error'; error: string }
  | { status: 'outside-youtube' }
  | { status: 'youtube' }
  | { status: 'supported'; tabId: number; video: ActiveVideo };
