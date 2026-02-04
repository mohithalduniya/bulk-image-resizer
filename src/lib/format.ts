export function formatBytes(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  }
  return `${Math.max(bytes / 1024, 0.01).toFixed(2)} KB`;
}

export function formatKB(bytes: number) {
  return `${Math.max(bytes / 1024, 0.01).toFixed(1)} KB`;
}

export function percentSaved(original: number, compressed: number) {
  if (!original || original <= 0) return 0;
  const saved = ((original - compressed) / original) * 100;
  return Math.max(0, Math.min(100, Math.round(saved)));
}
