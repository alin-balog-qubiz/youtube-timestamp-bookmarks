import { browser } from 'wxt/browser';

import { getActiveTabContext } from '@/services/active-tab';

import type { GetPlayerDurationRequest, GetPlayerDurationResponse, SeekBookmarkRequest, SeekBookmarkResponse } from '@/models/messages';

export async function getPlayerDuration(tabId: number, videoId: string): Promise<number | null> {
  const request: GetPlayerDurationRequest = { type: 'player:get-duration', videoId };
  const response: GetPlayerDurationResponse | undefined = await browser.tabs.sendMessage(tabId, request);
  if (response?.ok) return response.value;

  throw new Error(response?.error ?? 'The player did not respond. Reload the YouTube tab.');
}

export async function seekBookmark(tabId: number, videoId: string, timestamp: number): Promise<void> {
  const activeTabContext = await getActiveTabContext();
  if (activeTabContext.status === 'error')
    throw new Error(activeTabContext.error);

  if (
    activeTabContext.status !== 'supported' ||
    activeTabContext.tabId !== tabId ||
    activeTabContext.video.videoId !== videoId
  )
    throw new Error('The active video changed. Reopen This video for the correct video.');

  const request: SeekBookmarkRequest = { type: 'player:seek', videoId, timestamp };
  const response: SeekBookmarkResponse | undefined = await browser.tabs.sendMessage(tabId, request);
  if (!response?.ok)
    throw new Error(response?.error ?? 'The player did not respond. Reload the YouTube tab.');
}

export async function openBookmark(videoId: string, timestamp: number): Promise<void> {
  const activeTabContext = await getActiveTabContext();
  if (activeTabContext.status === 'error')
    throw new Error(activeTabContext.error);

  if (activeTabContext.status === 'supported' && activeTabContext.video.videoId === videoId) {
    await seekBookmark(activeTabContext.tabId, videoId, timestamp);
  } else {
    await browser.tabs.create({ url: getBookmarkUrl(videoId, timestamp) });
  }
}

export function getBookmarkUrl(videoId: string, timestamp: number): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}&t=${timestamp}s`;
}
