import { browser } from 'wxt/browser';
import { defineContentScript } from 'wxt/utils/define-content-script';

import {
  createPlayerClient,
  getPlayerMessageHandlers,
  initializePlayerMarkers,
  initializeQuickAdd,
} from '@/services/client';
import { registerMessageHandlers } from '@/services/messaging/register-handlers';
import { getPrivacyConsent, privacyConsentStorageKey } from '@/services/storage/privacy-consent';

const consentStorageKey = privacyConsentStorageKey.slice('local:'.length);

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main(ctx) {
    let isStarted = false;
    browser.storage.onChanged.addListener(handleConsentChanged);
    ctx.onInvalidated(() => browser.storage.onChanged.removeListener(handleConsentChanged));
    void startIfConsented();

    function handleConsentChanged(changes: Record<string, unknown>, areaName: string) {
      const change = changes[consentStorageKey];
      if (
        areaName !== 'local' ||
        typeof change !== 'object' ||
        change === null ||
        !('newValue' in change) ||
        change.newValue !== true
      )
        return;

      startIntegration();
    }

    async function startIfConsented() {
      try {
        if (await getPrivacyConsent()) startIntegration();
      } catch (failure) {
        console.error('Unable to read privacy consent. YouTube Bookmarks remains inactive.', failure);
      }
    }

    function startIntegration() {
      if (isStarted || ctx.isInvalid) return;

      isStarted = true;
      const playerClient = createPlayerClient(ctx);
      const removeListener = registerMessageHandlers(getPlayerMessageHandlers(playerClient));
      ctx.onInvalidated(removeListener);
      initializeQuickAdd(ctx, playerClient);
      initializePlayerMarkers(ctx, playerClient);
    }
  },
});
