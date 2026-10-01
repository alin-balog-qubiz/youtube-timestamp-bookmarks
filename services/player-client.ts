import type { ContentScriptContext } from 'wxt/utils/content-script-context';
import type { ActiveVideo } from '@/models/active-video';
import { getCurrentPage } from '@/utils/current-page';

type YoutubePlayer = HTMLElement & {
  getVideoData?: () => { video_id?: string };
};

export type PlayerContext =
  | { status: 'unavailable' }
  | { status: 'loading' }
  | {
    status: 'supported';
    videoId: string;
    title?: string;
    watch: Element;
    player: YoutubePlayer;
    controls: HTMLElement;
    video: HTMLVideoElement;
  };

export interface PlayerClient {
  getPlayerContext: () => PlayerContext;
  getActiveVideo: () => ActiveVideo | null;
  onChange: (listener: () => void) => () => void;
}

export function createPlayerClient(ctx: ContentScriptContext): PlayerClient {
  const changeListeners = new Set<() => void>();
  let navigating = false;
  let activeVideoId = getWatchVideoId();
  let departingVideo: HTMLVideoElement | undefined;
  let departingSource: string | undefined;
  let departingVideoId: string | undefined;
  let newMediaLoaded = false;

  ctx.addEventListener(window, 'wxt:locationchange', handleLocationChange);
  ctx.addEventListener(document, 'yt-navigate-start', handleNavigationStart);
  ctx.addEventListener(document, 'yt-navigate-finish', handleNavigationFinish);
  ctx.addEventListener(document, 'loadedmetadata', handleLoadedMetadata, true);
  ctx.onInvalidated(() => changeListeners.clear());

  return { getPlayerContext, getActiveVideo, onChange };

  function getPlayerContext(): PlayerContext {
    const videoId = getWatchVideoId();
    if (!videoId || navigating || ctx.isInvalid) return { status: 'unavailable' };

    const elements = getPlayerElements(videoId);
    if (!elements || !mediaMatches(videoId, elements.video)) return { status: 'loading' };

    const title = elements.watch
      .querySelector('ytd-watch-metadata h1 yt-formatted-string')
      ?.textContent?.trim() || undefined;
    return {
      status: 'supported',
      videoId,
      title,
      watch: elements.watch,
      player: elements.player,
      controls: elements.controls,
      video: elements.video,
    };
  }

  function getActiveVideo(): ActiveVideo | null {
    const playerContext = getPlayerContext();
    if (playerContext.status !== 'supported') return null;
    return { videoId: playerContext.videoId, title: playerContext.title };
  }

  function onChange(listener: () => void): () => void {
    changeListeners.add(listener);
    return () => changeListeners.delete(listener);
  }

  function handleLocationChange() {
    const videoId = getWatchVideoId();
    if (videoId !== activeVideoId) {
      rememberDepartingVideo();
      activeVideoId = videoId;
      navigating = !!videoId;
      notifyChange();
    } else if (!navigating) {
      notifyChange();
    }
  }

  function handleNavigationStart() {
    rememberDepartingVideo();
    navigating = true;
    notifyChange();
  }

  function handleNavigationFinish() {
    activeVideoId = getWatchVideoId();
    navigating = false;
    notifyChange();
  }

  function handleLoadedMetadata(event: Event) {
    if (event.target === departingVideo && departingVideoId !== getWatchVideoId()) {
      newMediaLoaded = true;
    }
    notifyChange();
  }

  function notifyChange() {
    for (const listener of changeListeners) listener();
  }

  function rememberDepartingVideo() {
    if (!activeVideoId) return;
    const video = document.querySelector<HTMLVideoElement>(
      'ytd-watch-flexy #movie_player video.html5-main-video',
    );
    if (!video || (departingVideoId === activeVideoId && departingVideo === video)) return;
    departingVideo = video;
    departingSource = video.currentSrc || video.src;
    departingVideoId = activeVideoId;
    newMediaLoaded = false;
  }

  function mediaMatches(videoId: string, video: HTMLVideoElement) {
    return !departingVideoId || departingVideoId === videoId ||
      video !== departingVideo ||
      (video.currentSrc || video.src) !== departingSource ||
      newMediaLoaded;
  }
}

function getWatchVideoId(): string | null {
  return getCurrentPage(location.href).videoId;
}

function getPlayerElements(videoId: string) {
  const watch = document.querySelector('ytd-watch-flexy');
  const player = watch?.querySelector<YoutubePlayer>('#movie_player');
  const controls = player?.querySelector<HTMLElement>('.ytp-right-controls');
  const video = player?.querySelector<HTMLVideoElement>('video.html5-main-video');
  const watchVideoId = watch?.getAttribute('video-id');

  if (
    !watch ||
    !player ||
    !controls ||
    !video ||
    (watchVideoId && watchVideoId !== videoId) ||
    watch.hasAttribute('is-live') ||
    watch.hasAttribute('is-live-now') ||
    player.classList.contains('ytp-live') ||
    video.duration === Infinity ||
    video.readyState < HTMLMediaElement.HAVE_METADATA
  ) {
    return undefined;
  }

  try {
    const playerVideoId = player.getVideoData?.()?.video_id;
    if (playerVideoId && playerVideoId !== videoId) return undefined;
  } catch {
    // This page-owned method is not always visible in an isolated world.
  }

  return { watch, player, controls, video };
}
