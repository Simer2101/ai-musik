const COPYRIGHT_PATTERNS = [
  /\b(like|as|style of|sound like|cover of|remix of)\b.{0,40}\b(taylor swift|drake|weeknd|beatles|metallica|beyonce|adele|eminem|rihanna|bruno mars|billie eilish|suno)\b/i,
  /\b(copyright|official audio|spotify rip)\b/i,
];

const BLOCKED_TERMS = [
  "child porn",
  "csam",
  "rape",
  "nazi anthem",
];

export function moderatePrompt(prompt: string): string | null {
  const trimmed = prompt.trim();
  if (trimmed.length < 8) {
    return "Describe the music in a bit more detail (at least 8 characters).";
  }
  if (trimmed.length > 800) {
    return "Keep the prompt under 800 characters.";
  }

  const lower = trimmed.toLowerCase();
  if (BLOCKED_TERMS.some((term) => lower.includes(term))) {
    return "This prompt is not allowed.";
  }

  if (COPYRIGHT_PATTERNS.some((pattern) => pattern.test(trimmed))) {
    return "Do not ask for music in the style of a specific living artist or copyrighted track. Describe mood, genre, instruments, and tempo instead.";
  }

  return null;
}
