import type { PlayerClient } from '@/services/player-client';

import type { GetActiveVideoResponse, GetPlayerDurationResponse, SeekBookmarkResponse } from '@/models/messages';

export function getPlayerMessageHandlers(playerClient: PlayerClient) {
  return {
    'player:get-active-video': handleGetActiveVideo,
    'player:get-duration': handleGetPlayerDuration,
    'player:seek': handleSeekBookmark,
  };

  function handleGetActiveVideo(): GetActiveVideoResponse {
    return { ok: true, value: playerClient.getActiveVideo() };
  }

  function handleGetPlayerDuration(message: unknown): GetPlayerDurationResponse {
    try {
      validateVideoRequest(message);

      return { ok: true, value: playerClient.getPlayerDuration(message.videoId) };
    } catch (error) {
      return { ok: false, error: getFailureDetail(error, 'Unable to read player duration') };
    }
  }

  function handleSeekBookmark(message: unknown): SeekBookmarkResponse {
    try {
      validateVideoRequest(message);
      if (
        typeof message.timestamp !== 'number' ||
        !Number.isSafeInteger(message.timestamp) ||
        message.timestamp < 0
      )
        return { ok: false, error: 'Timestamp must be a nonnegative whole second' };

      playerClient.seekBookmark(message.videoId, message.timestamp);

      return { ok: true, value: null };
    } catch (error) {
      return { ok: false, error: getFailureDetail(error, 'Unable to seek in the active video') };
    }
  }
}

function validateVideoRequest(message: unknown): asserts message is { videoId: string; timestamp?: unknown } {
  if (typeof message !== 'object' || message === null)
    throw new Error('Player request must be an object');

  if (!('videoId' in message) || typeof message.videoId !== 'string' || !message.videoId.trim())
    throw new Error('Video ID is required');
}

function getFailureDetail(error: unknown, fallback: string): string {
  const detail = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  return detail.trim() ? detail : fallback;
}
