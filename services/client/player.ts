import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { getCurrentPage } from '@/utils/current-page';

import type { ActiveVideo } from '@/models/active-video';

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
    progressBar: HTMLElement | null;
    video: HTMLVideoElement;
  };

export interface PlayerClient {
  getPlayerContext: () => PlayerContext;
  getActiveVideo: () => ActiveVideo | null;
  getPlayerDuration: (videoId: string) => number | null;
  seekBookmark: (videoId: string, timestamp: number) => void;
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

  let observedContext = getPlayerContext();
  let reconcileFrame: number | undefined;
  const observer = new MutationObserver(handlePlayerMutations);
  observer.observe(document, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['video-id', 'is-live', 'is-live-now', 'class'],
  });
  ctx.addEventListener(window, 'wxt:locationchange', handleLocationChange);
  ctx.addEventListener(document, 'yt-navigate-start', handleNavigationStart);
  ctx.addEventListener(document, 'yt-navigate-finish', handleNavigationFinish);
  ctx.addEventListener(document, 'loadedmetadata', handleLoadedMetadata, true);
  ctx.addEventListener(document, 'durationchange', notifyChange, true);
  ctx.addEventListener(document, 'emptied', notifyChange, true);
  ctx.onInvalidated(() => {
    observer.disconnect();
    if (reconcileFrame !== undefined) cancelAnimationFrame(reconcileFrame);
    changeListeners.clear();
  });

  return { getPlayerContext, getActiveVideo, getPlayerDuration, seekBookmark, onChange };

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
      progressBar: elements.player.querySelector<HTMLElement>('.ytp-progress-bar'),
      video: elements.video,
    };
  }

  function getActiveVideo(): ActiveVideo | null {
    const playerContext = getPlayerContext();
    if (playerContext.status !== 'supported') return null;

    return { videoId: playerContext.videoId, title: playerContext.title };
  }

  function getPlayerDuration(videoId: string): number | null {
    const { video } = requireVideoContext(videoId);
    return Number.isFinite(video.duration) && video.duration >= 0 ? video.duration : null;
  }

  function seekBookmark(videoId: string, timestamp: number): void {
    const { video } = requireVideoContext(videoId);

    if (!Number.isSafeInteger(timestamp) || timestamp < 0)
      throw new Error('Timestamp must be a nonnegative whole second');

    if (Number.isFinite(video.duration) && timestamp > Math.floor(video.duration))
      throw new Error('Timestamp is outside the active player duration');

    video.currentTime = timestamp;
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

  function handlePlayerMutations(records: MutationRecord[]) {
    if (!records.some((record) =>
      record.type === 'childList' ||
      (record.target instanceof Element &&
        record.target.matches('ytd-watch-flexy, #movie_player')),
    ) || reconcileFrame !== undefined) return;

    reconcileFrame = requestAnimationFrame(() => {
      reconcileFrame = undefined;
      const currentContext = getPlayerContext();
      if (!samePlayerContext(observedContext, currentContext))
        notifyChange();
    });
  }

  function notifyChange() {
    observedContext = getPlayerContext();
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

  function requireVideoContext(videoId: string) {
    const playerContext = getPlayerContext();
    if (playerContext.status !== 'supported' || playerContext.videoId !== videoId)
      throw new Error('The active video changed or is unavailable. Reopen This video for the correct video.');

    return playerContext;
  }
}

function samePlayerContext(previous: PlayerContext, current: PlayerContext): boolean {
  if (previous.status !== 'supported' || current.status !== 'supported')
    return previous.status === current.status;

  return previous.videoId === current.videoId &&
    previous.title === current.title &&
    previous.watch === current.watch &&
    previous.player === current.player &&
    previous.controls === current.controls &&
    previous.progressBar === current.progressBar &&
    previous.video === current.video;
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
    player.classList.contains('ad-showing') ||
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
