import { browser } from 'wxt/browser';
import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { getVideo, getVideoStorageKey } from '@/services/storage/bookmarks';
import { getMarkerPreferences, markerPreferencesStorageKey } from '@/services/storage/marker-preferences';
import { formatTimestamp } from '@/utils/bookmark-time';
import { resolveColorChoice } from '@/ui/utils/color';
import type { PlayerClient, PlayerContext } from './player';

import type { Bookmark, Video } from '@/models/bookmark';
import type { MarkerPreferences } from '@/models/marker-preferences';

type SupportedPlayer = Extract<PlayerContext, { status: 'supported' }>;
type MarkerMount = {
  context: SupportedPlayer;
  parent: HTMLElement;
  host: HTMLElement;
  markers: HTMLElement;
  buttons: Map<number, HTMLButtonElement>;
  resizeObserver: ResizeObserver;
  observer: MutationObserver;
};

export function initializePlayerMarkers(ctx: ContentScriptContext, playerClient: PlayerClient): void {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const preferencesKey = markerPreferencesStorageKey.slice('local:'.length);
  let activeVideoId: string | undefined;
  let videoKey: string | undefined;
  let savedVideo: Video | null = null;
  let preferences: MarkerPreferences | undefined;
  let mount: MarkerMount | undefined;
  let readRevision = 0;
  let disposed = false;

  const unsubscribe = playerClient.onChange(reconcile);
  ctx.addEventListener(systemTheme, 'change', renderMarkers);
  ctx.addEventListener(window, 'resize', positionMarkers);
  ctx.addEventListener(document, 'fullscreenchange', positionMarkers);
  ctx.onInvalidated(() => {
    disposed = true;
    unsubscribe();
    stopWatchingVideo();
    unmount();
  });
  reconcile();

  function reconcile() {
    if (disposed || ctx.isInvalid) return;

    const context = playerClient.getPlayerContext();
    if (context.status !== 'supported') {
      stopWatchingVideo();
      unmount();
      return;
    }

    if (activeVideoId !== context.videoId) {
      stopWatchingVideo();
      unmount();
      activeVideoId = context.videoId;
      videoKey = getVideoStorageKey(context.videoId).slice('local:'.length);
      browser.storage.onChanged.addListener(handleStorageChanged);
      void refreshBookmarks(context.videoId);
    }

    if (!context.progressBar || !preferences?.showMarkers || !hasUsableDuration(context)) {
      unmount();
      return;
    }

    const parent = context.progressBar.closest<HTMLElement>('.ytp-chrome-bottom') ?? context.player;
    if (!mount?.host.isConnected ||
      mount.context.player !== context.player ||
      mount.context.progressBar !== context.progressBar ||
      mount.context.video !== context.video ||
      mount.parent !== parent ||
      mount.host.parentElement !== parent
    ) {
      unmount();
      mountMarkers(context, parent);
    }

    renderMarkers();
  }

  function handleStorageChanged(changes: Record<string, unknown>, areaName: string) {
    if (areaName !== 'local' || !activeVideoId || !videoKey) return;
    if (videoKey in changes || preferencesKey in changes)
      void refreshBookmarks(activeVideoId);
  }

  async function refreshBookmarks(videoId: string) {
    const revision = ++readRevision;
    try {
      const [video, settings] = await Promise.all([getVideo(videoId), getMarkerPreferences()]);
      if (disposed || ctx.isInvalid || revision !== readRevision || activeVideoId !== videoId) return;

      savedVideo = video;
      preferences = settings;
      reconcile();
    } catch (error) {
      if (disposed || ctx.isInvalid || revision !== readRevision || activeVideoId !== videoId) return;

      savedVideo = null;
      preferences = undefined;
      unmount();
      console.warn('Unable to load player bookmarks or marker preferences.', error);
    }
  }

  function stopWatchingVideo() {
    readRevision++;
    browser.storage.onChanged.removeListener(handleStorageChanged);
    activeVideoId = undefined;
    videoKey = undefined;
    savedVideo = null;
    preferences = undefined;
  }

  function mountMarkers(context: SupportedPlayer, parent: HTMLElement) {
    const host = document.createElement('span');
    host.className = 'yt-bookmarks-player-markers';
    const shadow = host.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; position: absolute; display: block; pointer-events: none; z-index: 100; }
      .markers { position: absolute; inset: 0; pointer-events: none; }
      button { box-sizing: border-box; position: absolute; top: 50%; transform: translate(-50%, -50%); width: 8px; height: 12px; padding: 0; border: 1px solid rgba(40, 40, 40, 0.6); border-radius: 5px; background: var(--marker-color); box-shadow: 0 1px 3px #000; cursor: pointer; pointer-events: auto; }
      button:hover { z-index: 1; }
      button:focus-visible { outline: 2px solid white; outline-offset: 3px; z-index: 2; }
      .tooltip { display: none; position: absolute; bottom: calc(100% + 8px); left: 50%; transform: translateX(-50%); max-width: 240px; width: max-content; padding: 8px 14px; border-radius: 28px; background: rgba(0, 0, 0, 0.3); color: white; font: 500 12px/1.4 Roboto, Arial, sans-serif; overflow-wrap: anywhere; pointer-events: none; }
      button:hover .tooltip, button:focus-visible .tooltip { display: block; }
      button[data-edge="start"] .tooltip { left: 0; transform: none; }
      button[data-edge="end"] .tooltip { left: auto; right: 0; transform: none; }
    `;
    const markers = document.createElement('span');
    markers.className = 'markers';
    shadow.append(style, markers);

    // Only marker controls receive input; the rest of the timeline stays YouTube-owned.
    for (const type of ['pointerdown', 'pointerup', 'mousedown', 'mouseup', 'touchstart', 'touchend', 'dblclick', 'keydown', 'keyup'])
      shadow.addEventListener(type, (event) => event.stopPropagation());
    shadow.addEventListener('dragstart', (event) => event.preventDefault());

    const resizeObserver = new ResizeObserver(positionMarkers);
    resizeObserver.observe(parent);
    if (context.progressBar) resizeObserver.observe(context.progressBar);
    const observer = new MutationObserver(() => {
      if (!host.isConnected || host.parentElement !== parent) reconcile();
    });
    observer.observe(parent, { childList: true });
    mount = { context, parent, host, markers, buttons: new Map(), resizeObserver, observer };
    parent.append(host);
    positionMarkers();
  }

  function positionMarkers() {
    if (!mount?.context.progressBar) return;

    const { parent } = mount;
    const parentRect = parent.getBoundingClientRect();
    const barRect = mount.context.progressBar.getBoundingClientRect();
    if (parentRect.width <= 0 || parentRect.height <= 0) return;

    // The controls own visibility; convert viewport coordinates to their padding box.
    const scaleX = parent.offsetWidth / parentRect.width;
    const scaleY = parent.offsetHeight / parentRect.height;
    mount.host.style.left = `${(barRect.left - parentRect.left) * scaleX - parent.clientLeft + parent.scrollLeft}px`;
    mount.host.style.top = `${(barRect.top - parentRect.top) * scaleY - parent.clientTop + parent.scrollTop}px`;
    mount.host.style.width = `${barRect.width * scaleX}px`;
    mount.host.style.height = `${barRect.height * scaleY}px`;
  }

  function renderMarkers() {
    if (!mount || !preferences || !savedVideo || savedVideo.id !== activeVideoId) {
      mount?.markers.replaceChildren();
      mount?.buttons.clear();
      return;
    }

    const context = playerClient.getPlayerContext();
    if (context.status !== 'supported' || context.videoId !== activeVideoId ||
      context.player !== mount.context.player || context.video !== mount.context.video ||
      context.progressBar !== mount.context.progressBar || !hasUsableDuration(context)
    ) {
      reconcile();
      return;
    }

    const theme = preferences.theme === 'system'
      ? systemTheme.matches ? 'dark' : 'light'
      : preferences.theme;
    const duration = context.video.duration;
    const remaining = new Set<number>();
    for (const bookmark of Object.values(savedVideo.bookmarks)) {
      if (!Number.isSafeInteger(bookmark.timestamp) || bookmark.timestamp < 0 || bookmark.timestamp > duration)
        continue;

      remaining.add(bookmark.timestamp);
      let button = mount.buttons.get(bookmark.timestamp);
      if (!button) {
        button = createMarker(context.videoId, bookmark.timestamp);
        mount.markers.append(button);
        mount.buttons.set(bookmark.timestamp, button);
      }

      updateMarker(button, bookmark, duration, resolveColorChoice(bookmark.color, preferences.defaultColor, theme));
    }

    for (const [timestamp, button] of mount.buttons) {
      if (remaining.has(timestamp)) continue;

      button.remove();
      mount.buttons.delete(timestamp);
    }
    positionMarkers();
  }

  function createMarker(videoId: string, timestamp: number): HTMLButtonElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.timestamp = String(timestamp);
    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.setAttribute('aria-hidden', 'true');
    button.append(tooltip);
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      const context = playerClient.getPlayerContext();
      if (disposed || ctx.isInvalid || activeVideoId !== videoId || !preferences?.showMarkers ||
        !savedVideo?.bookmarks[timestamp] || context.status !== 'supported' ||
        context.videoId !== videoId || !hasUsableDuration(context) || timestamp > context.video.duration
      ) {
        reconcile();
        return;
      }

      try {
        playerClient.seekBookmark(videoId, timestamp);
      } catch (error) {
        console.warn('Unable to seek to player bookmark.', error);
      }
    });
    return button;
  }

  function unmount() {
    mount?.resizeObserver.disconnect();
    mount?.observer.disconnect();
    mount?.host.remove();
    mount = undefined;
  }
}

function hasUsableDuration(context: SupportedPlayer): boolean {
  return Number.isFinite(context.video.duration) && context.video.duration > 0;
}

function updateMarker(button: HTMLButtonElement, bookmark: Bookmark, duration: number, color: string) {
  const time = formatTimestamp(bookmark.timestamp);
  const label = bookmark.name ? `${time} - ${bookmark.name}` : time;
  const percentage = bookmark.timestamp / duration * 100;
  button.setAttribute('aria-label', `Seek to ${label}`);
  button.style.left = `${percentage}%`;
  button.style.setProperty('--marker-color', color);
  button.dataset.edge = percentage < 10 ? 'start' : percentage > 90 ? 'end' : '';
  if (button.firstChild) button.firstChild.textContent = label;
}
