import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { createBookmark } from '@/services/bookmark-client';
import type { PlayerClient } from '@/services/player-client';

const feedbackDurationMs = 2500;

export function initializeQuickAdd(ctx: ContentScriptContext, playerClient: PlayerClient): void {
  let host: HTMLElement | undefined;
  let mountedVideoId: string | undefined;
  let observedParent: Element | undefined;
  let observer: MutationObserver | undefined;
  let retryTimeout: number | undefined;
  let feedbackTimeout: number | undefined;
  let mountRevision = 0;

  const unsubscribe = playerClient.onChange(reconcile);
  ctx.onInvalidated(() => {
    unsubscribe();
    stopRetry();
    unmount();
  });
  reconcile();

  function reconcile() {
    stopRetry();

    const playerContext = playerClient.getPlayerContext();
    if (playerContext.status === 'unavailable') {
      unmount();

      return;
    }

    if (
      playerContext.status === 'loading' ||
      !Number.isFinite(playerContext.video.currentTime) ||
      playerContext.video.currentTime < 0
    ) {
      unmount();
      retryTimeout = window.setTimeout(reconcile, 750);

      return;
    }

    const parent = playerContext.controls.closest('#player')?.parentElement
      ?? playerContext.controls.closest('ytd-player')?.parentElement
      ?? playerContext.player.parentElement;
    if (!parent) {
      unmount();
      retryTimeout = window.setTimeout(reconcile, 750);

      return;
    }

    if (
      host?.isConnected &&
      host.parentElement === playerContext.controls &&
      mountedVideoId === playerContext.videoId &&
      observedParent === parent
    ) {
      return;
    }

    unmount();
    mount(playerContext.videoId, playerContext.controls, parent);
  }

  function mount(videoId: string, controls: HTMLElement, parent: Element) {
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
    mountedVideoId = videoId;
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

      const playerContext = playerClient.getPlayerContext();
      if (
        playerContext.status !== 'supported' ||
        playerContext.videoId !== mountedVideoId ||
        playerContext.controls !== controls ||
        !Number.isFinite(playerContext.video.currentTime) ||
        playerContext.video.currentTime < 0
      ) {
        showFeedback(status, 'Unable to save');
        return;
      }

      const timestamp = Math.floor(playerContext.video.currentTime);
      const saveRevision = mountRevision;

      button.disabled = true;

      try {
        const result = await createBookmark(playerContext.videoId, timestamp, playerContext.title);
        if (saveRevision === mountRevision && !ctx.isInvalid) {
          showFeedback(status, result === 'saved' ? 'Saved' : 'Already saved');
        }
      } catch (error) {
        if (saveRevision === mountRevision && !ctx.isInvalid) {
          const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
          showFeedback(status, detail.trim() ? detail : 'Unable to save');
        }
      } finally {
        button.disabled = false;
      }
    });
  }

  function unmount() {
    mountRevision++;
    clearFeedbackTimer();
    observer?.disconnect();
    observer = undefined;
    observedParent = undefined;
    host?.remove();
    host = undefined;
    mountedVideoId = undefined;
  }

  function clearFeedbackTimer() {
    clearTimeout(feedbackTimeout);
    feedbackTimeout = undefined;
  }

  function stopRetry() {
    clearTimeout(retryTimeout);
    retryTimeout = undefined;
  }

  function showFeedback(status: HTMLElement, message: string) {
    clearFeedbackTimer();
    status.textContent = message;
    feedbackTimeout = window.setTimeout(() => {
      status.textContent = '';
      feedbackTimeout = undefined;
    }, feedbackDurationMs);
  }
}
