import { defineContentScript } from 'wxt/utils/define-content-script';

import { createPlayerClient } from '@/services/player-client';
import { initializeQuickAdd } from '@/services/quick-add-client';
import { registerMessageHandlers } from '@/services/messages';
import { getPlayerMessageHandlers } from '@/services/player-messages';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main(ctx) {
    const playerClient = createPlayerClient(ctx);

    const removeListener = registerMessageHandlers(getPlayerMessageHandlers(playerClient));

    ctx.onInvalidated(removeListener);
    initializeQuickAdd(ctx, playerClient);
  },
});
