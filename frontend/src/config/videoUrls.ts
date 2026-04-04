export const R2_VIDEO_BASE = 'https://pub-1fb07e0f1e554e5681d950fa1b7b6afa.r2.dev';

export function getVideoUrl(filename: string): string {
  return `${R2_VIDEO_BASE}/${encodeURIComponent(filename)}`;
}
