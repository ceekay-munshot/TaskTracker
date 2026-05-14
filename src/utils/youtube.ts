/** YouTube URL parsing / validation / preview helpers. */

const YT_PATTERN =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/|v\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/;

export function parseYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  const match = trimmed.match(YT_PATTERN);
  if (match) return match[1];
  // Bare 11-char id
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;
  return null;
}

export function isValidYouTubeUrl(url: string): boolean {
  return parseYouTubeId(url) !== null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = parseYouTubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function getYouTubeWatchUrl(url: string): string | null {
  const id = parseYouTubeId(url);
  return id ? `https://www.youtube.com/watch?v=${id}` : null;
}

export function getYouTubeThumbnail(
  url: string,
  quality: 'default' | 'hq' | 'mq' | 'max' = 'hq',
): string | null {
  const id = parseYouTubeId(url);
  if (!id) return null;
  const map = {
    default: 'default',
    mq: 'mqdefault',
    hq: 'hqdefault',
    max: 'maxresdefault',
  } as const;
  return `https://img.youtube.com/vi/${id}/${map[quality]}.jpg`;
}
