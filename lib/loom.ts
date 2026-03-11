const LOOM_REGEX = /https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/g;

export function extractLoomUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(LOOM_REGEX);
  return matches ? [...new Set(matches)] : [];
}
