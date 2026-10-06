/** Lossless, grapheme-safe chunks. Whitespace stays in its original chunk;
 * joining chunks reproduces the entire source, including paragraph breaks. */
export function splitShareText(text: string, limit: number): string[] {
  if (!Number.isInteger(limit) || limit < 24) throw new Error("Invalid share limit");
  const segments = [...new Intl.Segmenter("ru", { granularity: "grapheme" }).segment(text)].flatMap(s => s.segment.length > limit ? Array.from(s.segment) : [s.segment]);
  const parts: string[] = [];
  let offset = 0;
  while (offset < segments.length) {
    let end = offset, length = 0, boundary = offset;
    while (end < segments.length && length + segments[end].length <= limit) {
      length += segments[end].length;
      end++;
      if (/\s$/.test(segments[end - 1]) && length >= limit / 2) boundary = end;
    }
    if (end < segments.length && boundary > offset) end = boundary;
    if (end === offset) throw new Error("Grapheme exceeds share limit");
    parts.push(segments.slice(offset, end).join(""));
    offset = end;
  }
  return parts.length ? parts : [""];
}

export function shareTextParts(text: string, platform: "Threads" | "Pinterest", url = ""): string[] {
  // Reserve room for numbering and the optional public link in every part.
  const limit = platform === "Threads" ? 480 : 780;
  const link = url ? `\n\n${url}` : "";
  const chunks = splitShareText(text, limit - link.length - 24);
  return chunks.map((part, i) => `${i + 1}/${chunks.length}\n${part}${i === 0 ? link : ""}`);
}
