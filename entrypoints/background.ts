import { defineBackground } from 'wxt/utils/define-background';

import { registerBookmarkHandlers, registerSettingsHandlers } from '@/services/background';

export default defineBackground(() => {
  registerBookmarkHandlers();
  registerSettingsHandlers();
});
