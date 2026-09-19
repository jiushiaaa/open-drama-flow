export function formatBytes(bytes: number) {
  return bytes > 0 ? `${(bytes / 1024).toFixed(1)} KB` : '';
}
