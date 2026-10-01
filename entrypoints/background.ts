import { defineBackground } from 'wxt/utils/define-background';

import { registerBookmarkHandlers } from '@/services/bookmark-background';

export default defineBackground(() => {
  registerBookmarkHandlers();
});
