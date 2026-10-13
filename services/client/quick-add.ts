import type { ContentScriptContext } from 'wxt/utils/content-script-context';

import { createBookmark } from '@/services/messaging/bookmark-requests';
import type { PlayerClient } from './player';

import { playerTooltipCss } from '@/ui/styles/player-tooltip';

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
    element.className = 'yt-bookmarks-quick-add ytp-button';

    const shadow = element.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = `
      /* Shadow-host !important keeps page button rules from clipping the pills. */
      :host { position: relative; overflow: visible !important; }
      button { box-sizing: border-box; display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; margin: 0; padding: 0; border: 0; border-radius: 50%; background: transparent; color: white; cursor: pointer; }
      button:focus-visible { outline: 2px solid white; outline-offset: -3px; }
      button:disabled { opacity: .6; cursor: wait; }
      svg { display: block; width: 24px; height: 24px; pointer-events: none; }
      .tooltip, .feedback { ${playerTooltipCss} position: absolute; bottom: calc(100% + 20px); left: 50%; transform: translateX(-50%); z-index: 1; }
      .tooltip, .feedback:empty { display: none; }
      button:hover ~ .tooltip, button:focus-visible ~ .tooltip { display: block; }
      .feedback:not(:empty) ~ .tooltip { display: none; }
    `;

    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', 'Save current moment');

    const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    icon.setAttribute('viewBox', '0 0 24 24');
    icon.setAttribute('fill', 'none');
    icon.setAttribute('stroke', 'currentColor');
    icon.setAttribute('stroke-width', '2');
    icon.setAttribute('stroke-linecap', 'round');
    icon.setAttribute('stroke-linejoin', 'round');
    icon.setAttribute('aria-hidden', 'true');
    icon.setAttribute('focusable', 'false');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 5v14M5 12h14');
    icon.append(path);
    button.append(icon);

    const tooltip = document.createElement('span');
    tooltip.className = 'tooltip';
    tooltip.textContent = 'Save current moment';
    tooltip.setAttribute('aria-hidden', 'true');

    const status = document.createElement('span');
    status.className = 'feedback';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    shadow.append(style, button, status, tooltip);

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
