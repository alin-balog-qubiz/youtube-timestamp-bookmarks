import { defineContentScript } from 'wxt/utils/define-content-script';

import { createPlayerClient, initializeQuickAdd, getPlayerMessageHandlers } from '@/services/client';
import { registerMessageHandlers } from '@/services/messaging/register-handlers';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main(ctx) {
    const playerClient = createPlayerClient(ctx);

    const removeListener = registerMessageHandlers(getPlayerMessageHandlers(playerClient));

    ctx.onInvalidated(removeListener);
    initializeQuickAdd(ctx, playerClient);
  },
});
