import { defineBackground } from 'wxt/utils/define-background';

import { registerBookmarkHandlers, registerPrivacyHandlers, registerSettingsHandlers } from '@/services/background';

export default defineBackground(() => {
  registerBookmarkHandlers();
  registerSettingsHandlers();
  registerPrivacyHandlers();
});
