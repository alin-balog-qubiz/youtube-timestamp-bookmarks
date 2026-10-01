import type { ActiveVideo } from '@/models/active-video';

interface ThisVideoPageProps {
  video: ActiveVideo;
}

export default function ThisVideoPage({ video }: ThisVideoPageProps) {
  return (
    <>
      <h1 id="page-heading" aria-live="polite">This video</h1>
      <p className="video-title">{video.title || video.videoId}</p>
    </>
  );
}
