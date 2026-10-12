import { browser } from 'wxt/browser';

import { getCurrentPage } from '@/utils/current-page';

import type { ActiveTabContext } from '@/models/active-tab';
import type { GetActiveVideoRequest, GetActiveVideoResponse } from '@/models/messages';

export async function getActiveTabContext(): Promise<ActiveTabContext> {
  try {
    const [activeTab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (activeTab?.id === undefined || !activeTab.url)
      return { status: 'error', error: 'Unable to read the active tab. Reopen the popup from the browser toolbar.' };

    const page = getCurrentPage(activeTab.url);
    if (!page.isYoutube)
      return { status: 'outside-youtube' };

    if (page.videoId === null)
      return { status: 'youtube' };

    if (activeTab.status === 'loading')
      return { status: 'loading' };

    const request: GetActiveVideoRequest = { type: 'player:get-active-video' };
    const response: GetActiveVideoResponse | undefined = await browser.tabs.sendMessage(activeTab.id, request);
    if (!response)
      return { status: 'error', error: 'Unable to read the active video. Reload the YouTube tab and reopen the popup.' };

    if (!response.ok)
      return { status: 'error', error: response.error };

    if (!response.value || response.value.videoId !== page.videoId)
      return { status: 'youtube' };

    return { status: 'supported', tabId: activeTab.id, video: response.value };
  } catch (error) {
    const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
    return {
      status: 'error',
      error: detail.trim() ? detail : 'Unable to read the active video. Reload the tab and reopen the popup.',
    };
  }
}
