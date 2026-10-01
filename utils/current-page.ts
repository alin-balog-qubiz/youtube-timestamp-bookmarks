import type { CurrentPage } from '@/models/active-tab';

export function getCurrentPage(href: string): CurrentPage {
  const url = new URL(href);
  if (
    !['https:', 'http:'].includes(url.protocol) ||
    !(url.hostname === 'youtube.com' || url.hostname.endsWith('.youtube.com'))
  )
    return { isYoutube: false, videoId: null };

  const videoId = url.searchParams.get('v');
  if (
    ['youtube.com', 'www.youtube.com'].includes(url.hostname) &&
    url.pathname === '/watch' &&
    videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)
  )
    return { isYoutube: true, videoId };

  return { isYoutube: true, videoId: null };
}
