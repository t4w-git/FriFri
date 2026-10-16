/**
 * Utility for splitting poem text into 3 parts (quartines/stanzas)
 * Used for games like FortunaItaliana and GiocoPoesie
 */

/**
 * Split a poem text into 3 parts
 * Tries multiple strategies:
 * 1. Split by double newline (paragraph breaks)
 * 2. Split by single newline
 * 3. Split text into 3 equal chunks
 */
export function splitPoemIntoParts(text: string): [string, string, string] | null {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return null;
  }

  const trimmed = text.trim();

  // Strategy 1: Split by double newline (paragraph breaks)
  const paragraphs = trimmed.split('\n\n').filter(p => p.trim().length > 0);
  if (paragraphs.length >= 3) {
    return [
      paragraphs[0].trim(),
      paragraphs[1].trim(),
      paragraphs[2].trim()
    ];
  }

  // Strategy 2: Split by single newline and group into 3 parts
  const lines = trimmed.split('\n').filter(l => l.trim().length > 0);
  if (lines.length >= 6) {
    // Group lines into 3 equal parts
    const linesPerPart = Math.ceil(lines.length / 3);
    return [
      lines.slice(0, linesPerPart).join('\n').trim(),
      lines.slice(linesPerPart, linesPerPart * 2).join('\n').trim(),
      lines.slice(linesPerPart * 2).join('\n').trim()
    ];
  }

  // Strategy 3: Split text into 3 equal-ish chunks (fallback)
  if (text.length >= 20) {
    const chunkSize = Math.ceil(text.length / 3);
    return [
      text.substring(0, chunkSize).trim(),
      text.substring(chunkSize, chunkSize * 2).trim(),
      text.substring(chunkSize * 2).trim()
    ];
  }

  return null;
}

/**
 * Get a specific part of a poem (0-indexed)
 */
export function getPoemPart(text: string, partIndex: number): string | null {
  const parts = splitPoemIntoParts(text);
  if (!parts || partIndex < 0 || partIndex > 2) return null;
  return parts[partIndex];
}
