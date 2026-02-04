export const MAX_FILES = 100;
export const MAX_FILE_SIZE = 20 * 1024 * 1024;
export const MAX_WIDTH = 1920;
export const QUALITY_MIN = 60;
export const QUALITY_MAX = 85;
export const QUALITY_DEFAULT = 75;
export const PREVIEW_WIDTH = 640;
export const CLEANUP_TTL_MS = 30 * 60 * 1000;
export const PROCESS_CONCURRENCY = 6;

export const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
