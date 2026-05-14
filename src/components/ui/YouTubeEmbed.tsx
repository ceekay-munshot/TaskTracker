import { useState } from 'react';
import { PlayCircle, Youtube } from 'lucide-react';
import { cn } from '@/utils/cn';
import { getYouTubeEmbedUrl, getYouTubeThumbnail } from '@/utils/youtube';

export function YouTubeEmbed({
  url,
  title,
  className,
}: {
  url: string;
  title?: string;
  className?: string;
}) {
  const embed = getYouTubeEmbedUrl(url);
  if (!embed) {
    return (
      <div
        className={cn(
          'flex aspect-video items-center justify-center rounded-xl border border-dashed border-ink-300 bg-ink-50 text-sm font-medium text-ink-400',
          className,
        )}
      >
        Invalid YouTube URL
      </div>
    );
  }
  return (
    <div
      className={cn(
        'aspect-video overflow-hidden rounded-xl bg-ink-900 shadow-soft',
        className,
      )}
    >
      <iframe
        src={embed}
        title={title ?? 'YouTube recording'}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="h-full w-full border-0"
      />
    </div>
  );
}

export function YouTubeThumb({
  url,
  title,
  onClick,
  className,
}: {
  url: string;
  title?: string;
  onClick?: () => void;
  className?: string;
}) {
  const thumb = getYouTubeThumbnail(url, 'hq');
  const [failed, setFailed] = useState(false);
  const showThumb = thumb && !failed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative block aspect-video w-full overflow-hidden rounded-xl bg-gradient-to-br from-ink-700 to-ink-900',
        className,
      )}
    >
      {showThumb ? (
        <img
          src={thumb}
          alt={title ?? 'Recording thumbnail'}
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <Youtube className="h-10 w-10 text-white/30" />
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center bg-ink-900/15 transition group-hover:bg-ink-900/35">
        <PlayCircle className="h-12 w-12 text-white/95 drop-shadow-lg transition group-hover:scale-110" />
      </div>
      <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-md bg-ink-900/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
        <Youtube className="h-3 w-3 text-red-400" />
        YouTube
      </span>
    </button>
  );
}
