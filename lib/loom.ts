const LOOM_REGEX = /https?:\/\/(www\.)?loom\.com\/share\/[a-zA-Z0-9]+/g;

export function extractLoomUrls(text: string): string[] {
  if (!text) return [];
  const matches = text.match(LOOM_REGEX);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Extract a clean description from the body text that contained a Loom URL.
 * Strips Loom URLs, markdown formatting, and trims to a reasonable length.
 */
export function extractDescription(body: string, maxLength = 300): string {
  if (!body) return "";
  let text = body
    // Remove Loom URLs
    .replace(LOOM_REGEX, "")
    // Remove markdown links but keep text: [text](url) -> text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    // Remove markdown bold/italic
    .replace(/\*{1,3}([^*]+)\*{1,3}/g, "$1")
    // Remove markdown headers
    .replace(/^#{1,6}\s+/gm, "")
    // Remove horizontal rules
    .replace(/^[-*_]{3,}$/gm, "")
    // Remove HTML-style comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Collapse multiple newlines
    .replace(/\n{3,}/g, "\n\n")
    // Collapse multiple spaces
    .replace(/  +/g, " ")
    .trim();

  if (text.length > maxLength) {
    text = text.substring(0, maxLength).replace(/\s\S*$/, "").trim();
    if (!text.endsWith("...")) text += "...";
  }
  return text;
}
