import { defineContentScript } from 'wxt/utils/define-content-script';
import { createBookmark } from '@/services/bookmark-client';

const feedbackDurationMs = 2500;

type YoutubePlayer = HTMLElement & {
  getVideoData?: () => { video_id?: string };
};

function watchVideoId(): string | undefined {
  const url = new URL(location.href);
  if (
    !['youtube.com', 'www.youtube.com'].includes(url.hostname) ||
    url.pathname !== '/watch'
  ) {
    return undefined;
  }

  const id = url.searchParams.get('v');
  return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : undefined;
}

function activePlayer(id: string) {
  const watch = document.querySelector('ytd-watch-flexy');
  const player = watch?.querySelector<YoutubePlayer>('#movie_player');
  const controls = player?.querySelector<HTMLElement>('.ytp-right-controls');
  const video = player?.querySelector<HTMLVideoElement>('video.html5-main-video');
  const watchId = watch?.getAttribute('video-id');
  if (
    !watch ||
    !player ||
    !controls ||
    !video ||
    (watchId && watchId !== id) ||
    watch.hasAttribute('is-live') ||
    watch.hasAttribute('is-live-now') ||
    player.classList.contains('ytp-live') ||
    video.duration === Infinity ||
    video.readyState < HTMLMediaElement.HAVE_METADATA
  ) {
    return undefined;
  }

  try {
    const playerId = player.getVideoData?.()?.video_id;
    if (playerId && playerId !== id) return undefined;
  } catch {
    // This page-owned method is not always visible in an isolated world.
  }

  return { watch, player, controls, video };
}

  export default defineContentScript({
    matches: ['*://*.youtube.com/*'],
    main(ctx) {
      let host: HTMLElement | undefined;
      let mountedId: string | undefined;
      let observedParent: Element | undefined;
      let observer: MutationObserver | undefined;
      let retry: number | undefined;
      let feedbackTimeout: number | undefined;
      let generation = 0;
      let navigating = false;
      let activeId = watchVideoId();
      let departingVideo: HTMLVideoElement | undefined;
      let departingSrc: string | undefined;
      let departingId: string | undefined;
      let newMediaLoaded = false;

    function rememberDepartingVideo() {
      if (!activeId) return;
      const video = document.querySelector<HTMLVideoElement>(
        'ytd-watch-flexy #movie_player video.html5-main-video',
      );
      if (!video || (departingId === activeId && departingVideo === video)) return;
      departingVideo = video;
      departingSrc = video.currentSrc || video.src;
      departingId = activeId;
      newMediaLoaded = false;
    }

    function mediaMatches(id: string, video: HTMLVideoElement) {
      return !departingId || departingId === id ||
        video !== departingVideo ||
        (video.currentSrc || video.src) !== departingSrc ||
        newMediaLoaded;
    }

    function clearFeedbackTimer() {
      clearTimeout(feedbackTimeout);
      feedbackTimeout = undefined;
    }

    function unmount() {
      generation++;
      clearFeedbackTimer();
      observer?.disconnect();
      observer = undefined;
      observedParent = undefined;
      host?.remove();
      host = undefined;
      mountedId = undefined;
    }

    function stopRetry() {
      clearTimeout(retry);
      retry = undefined;
    }

    function showFeedback(status: HTMLElement, message: string) {
      clearFeedbackTimer();
      status.textContent = message;
      feedbackTimeout = window.setTimeout(() => {
        status.textContent = '';
        feedbackTimeout = undefined;
      }, feedbackDurationMs);
    }

    function mount(id: string, controls: HTMLElement, parent: Element) {
      const element = document.createElement('span');
      element.className = 'yt-bookmarks-quick-add';
      const shadow = element.attachShadow({ mode: 'open' });
      const style = document.createElement('style');
      style.textContent = `
        :host { display: inline-flex; align-items: center; height: 100%; vertical-align: top; }
        button { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 100%; padding: 0; border: 0; background: transparent; color: white; font: 500 26px Arial, sans-serif; cursor: pointer; }
        button:hover, button:focus-visible { background: rgba(255, 255, 255, .2); }
        button:focus-visible { outline: 2px solid white; outline-offset: -3px; }
        button:disabled { opacity: .6; cursor: wait; }
        .feedback { color: white; font: 500 12px Arial, sans-serif; white-space: nowrap; padding-right: 8px; text-shadow: 0 1px 2px black; }
        .feedback:empty { display: none; }
      `;
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = '+';
      button.setAttribute('aria-label', 'Save current moment');
      button.title = 'Save current moment';
      const status = document.createElement('span');
      status.className = 'feedback';
      status.setAttribute('role', 'status');
      status.setAttribute('aria-live', 'polite');
      shadow.append(style, button, status);

      controls.prepend(element);
      host = element;
      mountedId = id;
      observedParent = parent;
      observer = new MutationObserver(() => {
        if (!element.isConnected || element.parentElement !== controls || !controls.isConnected) {
          reconcile();
        }
      });
      observer.observe(parent, { childList: true, subtree: true });

      button.addEventListener('click', async (event) => {
        event.stopPropagation();
        if (button.disabled) return;

        const currentId = watchVideoId();
        const current = currentId ? activePlayer(currentId) : undefined;
        if (
          navigating ||
          !currentId ||
          currentId !== mountedId ||
          !current ||
          !mediaMatches(currentId, current.video) ||
          current.controls !== controls ||
          !Number.isFinite(current.video.currentTime) ||
          current.video.currentTime < 0
        ) {
          showFeedback(status, 'Unable to save');
          return;
        }

        const timestamp = Math.floor(current.video.currentTime);
        const title = current.watch
          .querySelector('ytd-watch-metadata h1 yt-formatted-string')
          ?.textContent?.trim() || undefined;
        const startedIn = generation;
        button.disabled = true;
        try {
          const result = await createBookmark(currentId, timestamp, title);
          if (startedIn === generation && !ctx.isInvalid) {
            showFeedback(status, result === 'saved' ? 'Saved' : 'Already saved');
          }
        } catch {
          if (startedIn === generation && !ctx.isInvalid) {
            showFeedback(status, 'Unable to save');
          }
        } finally {
          button.disabled = false;
        }
      });
    }

    function reconcile() {
      stopRetry();
      const id = watchVideoId();
      if (!id || navigating || ctx.isInvalid) {
        unmount();
        return;
      }

      const current = activePlayer(id);
      if (
        !current ||
        !mediaMatches(id, current.video) ||
        !Number.isFinite(current.video.currentTime) ||
        current.video.currentTime < 0
      ) {
        unmount();
        retry = window.setTimeout(reconcile, 750);
        return;
      }

      const parent = current.controls.closest('#player')?.parentElement
        ?? current.controls.closest('ytd-player')?.parentElement
        ?? current.player.parentElement;
      if (!parent) {
        unmount();
        retry = window.setTimeout(reconcile, 750);
        return;
      }
      if (
        host?.isConnected &&
        host.parentElement === current.controls &&
        mountedId === id &&
        observedParent === parent
      ) {
        return;
      }
      unmount();
      mount(id, current.controls, parent);
    }

    ctx.addEventListener(window, 'wxt:locationchange', () => {
      const id = watchVideoId();
      if (id !== activeId) {
        rememberDepartingVideo();
        activeId = id;
        navigating = !!id;
        stopRetry();
        unmount();
        if (!id) return;
      } else if (!navigating) {
        reconcile();
      }
    });
    ctx.addEventListener(document, 'yt-navigate-start', () => {
      rememberDepartingVideo();
      navigating = true;
      stopRetry();
      unmount();
    });
    ctx.addEventListener(document, 'yt-navigate-finish', () => {
      activeId = watchVideoId();
      navigating = false;
      reconcile();
    });
    ctx.addEventListener(document, 'loadedmetadata', (event) => {
      if (event.target === departingVideo && departingId !== watchVideoId()) {
        newMediaLoaded = true;
      }
      reconcile();
    }, true);
    ctx.onInvalidated(() => {
      stopRetry();
      unmount();
    });
    reconcile();
  },
});
