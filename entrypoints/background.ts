import { defineBackground } from 'wxt/utils/define-background';

import { registerBookmarkHandlers } from '@/services/bookmark-background';
import { registerSettingsHandlers } from '@/services/settings-background';

export default defineBackground(() => {
  registerBookmarkHandlers();
  registerSettingsHandlers();
});
