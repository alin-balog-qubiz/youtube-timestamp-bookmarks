import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  hooks: {
    'entrypoints:found'(wxt, entrypoints) {
      if (wxt.config.command === 'serve') return;

      const galleryIndex = entrypoints.findIndex((entrypoint) => entrypoint.name === 'components');
      if (galleryIndex !== -1) entrypoints.splice(galleryIndex, 1);
    },
  },
  manifest: {
    name: 'YouTube Timestamp Bookmarks',
    description: 'Save and revisit moments in YouTube videos.',
    permissions: ['storage', 'activeTab', 'downloads'],
  },
});
