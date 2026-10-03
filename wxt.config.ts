import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'YouTube Bookmarks',
    description: 'Save and revisit moments in YouTube videos.',
    permissions: ['storage', 'activeTab', 'downloads'],
  },
});
