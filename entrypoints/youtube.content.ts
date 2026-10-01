import { defineContentScript } from 'wxt/utils/define-content-script';
import type { GetActiveVideoResponse } from '@/models/messages';
import { createPlayerClient } from '@/services/player-client';
import { initializeQuickAdd } from '@/services/quick-add-client';
import { registerMessageHandlers } from '@/services/messages';

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  main(ctx) {
    const playerClient = createPlayerClient(ctx);

    const removeListener = registerMessageHandlers({
      'player:get-active-video': handleGetActiveVideo,
    });

    ctx.onInvalidated(removeListener);
    initializeQuickAdd(ctx, playerClient);

    function handleGetActiveVideo(): GetActiveVideoResponse {
      return { ok: true, value: playerClient.getActiveVideo() };
    }
  },
});
