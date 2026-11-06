/** Images are loaded by the browser, never fetched by the budget server. */
export function normalizeIconUrl(value: string): string | null {
  const input = value.trim();
  if (!input || input.length > 2048 || /[\u0000-\u0020\u007f]/.test(input)) return null;
  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || url.username || url.password || !url.hostname) return null;
    return url.href.length <= 2048 ? url.href : null;
  } catch { return null; }
}
